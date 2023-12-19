from rest_framework import viewsets, status
from django.contrib.auth import authenticate, login
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view
from django.contrib.auth import logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib.auth import update_session_auth_hash
from django.utils.timezone import now
from datetime import timedelta
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.views import status
from rest_framework.generics import GenericAPIView
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from .models import *
from .serializers import *
from .permissions import *
import datetime
from django.core.exceptions import ObjectDoesNotExist
from rest_framework.decorators import action
from rest_framework import generics
import os
from rest_framework.exceptions import APIException
from django.core.files.base import ContentFile
from django.shortcuts import get_list_or_404
from django.utils.dateparse import parse_date

class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        login_user = self.request.query_params.get('login_user', None)

        if login_user == 'true':
            queryset = queryset.filter(pk=self.request.user.pk)
        return queryset


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Find the latest semester
        try:
            latest_semester = Semester.objects.latest('id')
        except ObjectDoesNotExist:
            latest_semester = None

        # If we have a latest_semester, add it to the project
        if latest_semester:
            serializer.save(semester_info=latest_semester)
        else:
            serializer.save()

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        queryset = super().get_queryset()

        # Retrieve a specific semester based on query params or get the latest semester
        semester_id = self.request.query_params.get('semester', None)
        if semester_id:
            try:
                specific_semester = Semester.objects.get(id=semester_id)
                queryset = queryset.filter(semester_info=specific_semester)
            except ObjectDoesNotExist:
                specific_semester = None
        else:
            try:
                latest_semester = Semester.objects.latest('id')
                if latest_semester:
                    queryset = queryset.filter(semester_info=latest_semester)
            except ObjectDoesNotExist:
                latest_semester = None

        user_projects = self.request.query_params.get('user_projects', None)
        if user_projects == 'true':
            user = self.request.user
            if user.groups.filter(id=2).exists():  # If the user is a supervisor
                queryset = queryset.filter(created_by=user)
            elif user.groups.filter(id=1).exists():  # If the user is a student
                queryset = queryset.filter(assigned_to__in=[user])

        return queryset

    @action(detail=False, methods=['post'], url_path='archive')
    def archive_all_projects(self, request, *args, **kwargs):
        projects = self.queryset.all()

        for project in projects:
            try:
                archived_project_data = {
                    'title': project.title,
                    'num_of_student': project.num_of_student,
                    'description': project.description,
                    'collaborator': project.collaborator,
                    'tool': project.tool,
                    'state': project.state,
                    'created_at': project.created_at,
                    'original_creator_name': project.created_by.full_name if project.created_by else None,
                    'original_assigned_to_names': [user.full_name for user in project.assigned_to.all()]
                }

                if project.semester_info:
                    archived_project_data['semester_info_str'] = f"{project.semester_info.semester} - {project.semester_info.academic_year}"

                serializer = ArchivedProjectSerializer(
                    data=archived_project_data)

                if serializer.is_valid():
                    serializer.save()
                else:
                    print("Error archiving project id:", project.id)
                    print(serializer.errors)
                    return Response({
                        'status': 'error',
                        'message': f"Error archiving project with id {project.id}.",
                        'errors': serializer.errors,
                    }, status=status.HTTP_400_BAD_REQUEST)

                project.delete()

            except Exception as e:
                print(
                    f"Exception during archiving project {project.id}: {str(e)}")
                return Response({
                    'status': 'error',
                    'message': f"Exception during archiving project {project.id}.",
                    'errors': str(e),
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        User.objects.filter(groups__name='Student').update(is_active=False)

        return Response({'status': 'projects archived'}, status=status.HTTP_200_OK)

class StudentsPerLecturer(APIView):
    def get(self, request, *args, **kwargs):
        # Retrieve all projects with lecturer and student details
        projects = Project.objects.select_related('created_by').prefetch_related('assigned_to').all()

        # Fetch all lecturers. Assuming lecturers are in a group named "Lecturers".
        lecturers_group = Group.objects.get(name="Supervisor")
        all_lecturers = lecturers_group.dsmanagementapp_users.all()

        # Initialize data_dict with all lecturers
        data_dict = {
            lecturer.full_name: {
                'student_count': 0,
                'student_names': set(),
                'student_matric_numbers': set()
            }
            for lecturer in all_lecturers
        }

        # Process data
        for project in projects:
            lecturer_name = project.created_by.full_name
            for student in project.assigned_to.all():
                data_dict[lecturer_name]['student_names'].add(student.full_name)
                data_dict[lecturer_name]['student_matric_numbers'].add(student.username)

        # Convert sets to lists and count them
        data = []
        for lecturer, details in data_dict.items():
            student_names = list(details['student_names'])
            student_matric_numbers = list(details['student_matric_numbers'])
            data.append({
                'created_by__full_name': lecturer,
                'student_count': len(student_names),
                'student_names': student_names,
                'student_matric_numbers': student_matric_numbers
            })

        # Return the data
        return Response(data)


class ArchivedProjectViewSet(viewsets.ModelViewSet):
    queryset = ArchivedProject.objects.all()
    serializer_class = ArchivedProjectSerializer

    def get_queryset(self):
        queryset = ArchivedProject.objects.all()
        semester_id = self.request.query_params.get('semester', None)

        if semester_id is not None:
            try:
                semester = Semester.objects.get(id=semester_id)
                semester_info_str = f"{semester.semester} - {semester.academic_year}"

                queryset = queryset.filter(semester_info_str=semester_info_str)
            except Semester.DoesNotExist:
                queryset = ArchivedProject.objects.none()

        return queryset


class LoginView(APIView):
    authentication_classes = []  # Disable authentication for this view
    permission_classes = []  # Disable authentication for this view

    def post(self, request, *args, **kwargs):
        username = request.data.get("username")
        password = request.data.get("password")
        remember_me = request.data.get("remember_me")

        user = authenticate(username=username, password=password)

        if user is not None:
           # Authentication was successful
            token, created = Token.objects.get_or_create(user=user)

            # If "Remember Me" is checked, set an expiration time for the token (e.g., 30 days)
            if remember_me:
                if created:  # Only set a longer expiration if the token was just created
                    token.expires = now() + timedelta(days=30)
                    token.save()

            user_data = UserSerializer(user)
            return Response({"token": token.key, 'user': user_data.data}, status=status.HTTP_200_OK)
        else:
            # Authentication failed.
            return Response({"status": "error", "message": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@login_required(login_url='/login')
def logout_view(request):
    request.user.auth_token.delete()

    # Clear user data from local storage
    response = Response({'detail': 'Logged out successfully.'}, status=200)
    response.delete_cookie('token')  # Remove the token cookie
    response.delete_cookie('user')   # Remove the user data cookie

    return response


@api_view(['POST'])
@login_required
def reset_current_password(request):
    current_password = request.data.get('current_password')
    new_password1 = request.data.get('new_password1')
    new_password2 = request.data.get('new_password2')

    user = request.user

    # Check if the current password matches the user's actual password
    if not user.check_password(current_password):
        return Response({'success': False, 'error': 'Current password is incorrect.'})

    # Check if the new passwords match
    if new_password1 != new_password2:
        return Response({'success': False, 'error': 'New passwords do not match.'})

    try:
        validate_password(new_password1, user=user)
    except ValidationError as e:
        return Response({'success': False, 'error': e.messages})

    # Set the new password
    user.set_password(new_password1)
    user.save()

    # Update the user's session authentication hash
    update_session_auth_hash(request, user)

    return Response({'success': True})


class PasswordResetView(GenericAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        # If token is provided in the URL, handle the reset
        if 'token' in kwargs:
            return self.reset_password(request, kwargs['token'])

        # Otherwise, handle the reset request
        return self.reset_password_request(request)

    def reset_password_request(self, request):
        email = request.data.get('email')
        # Check if email exists in your user model
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return JsonResponse({'error': 'Email not registered.'}, status=400)

         # Delete any existing tokens for the user
        PasswordResetToken.objects.filter(email=email).delete()

        # Create a token
        token = PasswordResetToken(email=email)
        token.save()

        # Send email
        reset_link = f"{settings.FRONTEND_URL}/reset-password/{token.token}"
        subject = "[Data Science FYP] Password Reset Request"
        message = f"""Dear {user.full_name},

        We have received a password reset request for your account. Click the link to reset your password: 

        {reset_link}

        This password reset link will expire in 1 hour.

        Thank you.
            """

        from_email = settings.DEFAULT_FROM_EMAIL
        to_email = [email]

        send_mail(subject, message, from_email, to_email)

        return JsonResponse({'message': 'Password reset email sent.'})

    def reset_password(self, request, token):
        print("Received Token:", token)
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if not serializer.is_valid():
            return JsonResponse({'error': serializer.errors}, status=400)
        new_password = request.data.get('password')

        try:
            token_obj = PasswordResetToken.objects.get(token=token)

            if token_obj.is_expired():
                return JsonResponse({'error': 'Token expired.'}, status=400)

            user = User.objects.get(email=token_obj.email)
            user.set_password(new_password)
            user.save()

            # Delete the token after use
            token_obj.delete()

            return JsonResponse({'message': 'Password reset successful.'})
        except PasswordResetToken.DoesNotExist:
            return JsonResponse({'error': 'Invalid token.'}, status=400)


class GetUsernameView(GenericAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, token):
        # Get email associated with token
        password_reset_token = get_object_or_404(
            PasswordResetToken, token=token)
        email = password_reset_token.email

        # Get the user associated with the email
        user = get_object_or_404(User, email=email)

        return JsonResponse({'username': user.username})


class ApplicationViewSet(viewsets.ModelViewSet):
    queryset = Application.objects.all()
    serializer_class = ApplicationSerializer

    def perform_create(self, serializer):
        if self.request.user.groups.filter(name='Student').exists():
            serializer.save(student=self.request.user)

            # Send email notification to the lecturer
            project = serializer.instance.project
            student = serializer.instance.student

            lecturer_email = project.created_by.email
            if lecturer_email:
                send_mail(
                    f'[Data Science FYP] Project Application: {project.title}',
                    '',
                    settings.DEFAULT_FROM_EMAIL,
                    [lecturer_email],  # To email
                    fail_silently=False,
                    html_message=(
                        f'<p>Dear Supervisor, Dr. {project.created_by.full_name},</p>'
                        f'<p>We would like to inform you that {student.full_name} ({student.username}) has submitted an application for your project titled "{project.title}".</p>'
                        '<p>Details of the Application:</p>'
                        f'<ul>'
                        f'  <li>Student Name: {student.full_name}</li>'
                        f'  <li>Matric Number: {student.username}</li>'
                        f'  <li>Student Email: {student.email}</li>'
                        f'  <li>Project Title: {project.title}</li>'
                        f'</ul>'
                        f'<p>Please login to the system to review the application and manage it accordingly. You can do so by visiting the following URL: <a href="{settings.FRONTEND_URL}" target="_blank">{settings.FRONTEND_URL}</a></p>'
                        '<p>Thank you for your attention and cooperation.</p>'
                    ),
                )

                Notification.objects.create(
                    recipient=project.created_by,
                    message=f"[Supervisor] You have a new application from {student.full_name} ({student.username}) for the project '{project.title}'.",
                    type='student_application',
                )
    

        else:
            raise serializers.ValidationError(
                'Only students can create applications')

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=kwargs.pop('partial', False))
        serializer.is_valid(raise_exception=True)
        
        # Print the current status and the updated status.
        print(f"Current status: {instance.status}")
        print(f"Updated status: {serializer.validated_data.get('status')}")
        
        # Check if the user is a supervisor.
        if request.user.groups.filter(name='Supervisor').exists():
            # Check if the status is being updated to "approved".
            if serializer.validated_data.get('status') == 'approved':
                instance.visible_to_lecturer = False
                student_email = instance.student.email
                
                # Print the student email.
                print(f"Student email: {student_email}")
                
                if student_email:
                    send_mail(
                        f'[Data Science FYP] Your Project Application Has Been Approved',
                        '',
                        settings.DEFAULT_FROM_EMAIL,
                        [student_email],
                        fail_silently=False,
                        html_message=(
                            f'<p>Dear {instance.student.full_name},</p>'
                            f'<p>Your application for the project "{instance.project.title}" has been approved.</p>'
                            '<p>Please login to the system for more details and further actions:</p>'
                            f'<p><a href="{settings.FRONTEND_URL}" target="_blank">{settings.FRONTEND_URL}</a></p>'
                            '<p>Thank you.</p>'
                        ),
                    )
                Notification.objects.create(
                    recipient=instance.student,
                    message=f"Your application for the project '{instance.project.title}' has been approved.",
                    type='student_project',
                )

            serializer.save()
            return Response(serializer.data)
        else:
            raise serializers.ValidationError('Invalid operation')


    def perform_destroy(self, instance):
        student_email = instance.student.email

        if student_email:
            send_mail(
                f'[Data Science FYP] Your Project Application Has Been Rejected',
                '',
                settings.DEFAULT_FROM_EMAIL,
                [student_email],
                fail_silently=False,
                html_message=(
                    f'<p>Dear {instance.student.full_name},</p>'
                    f'<p>We regret to inform you that your application for the project "{instance.project.title}" has been rejected.</p>'
                    '<p>You might consider the following steps:</p>'
                    '<ul>'
                    f'  <li>Contact the lecturer, <a href="mailto:{instance.project.created_by.email}">{instance.project.created_by.full_name}</a>, directly for more insights on the decision.</li>'
                    '  <li>Explore other available projects to apply for.</li>'
                    '  <li>Consider proposing your own project title.</li>'
                    '</ul>'
                    f'<p>Please login to the system for more details: <a href="{settings.FRONTEND_URL}" target="_blank">{settings.FRONTEND_URL}</a></p>'                    '<p>Thank you .</p>'
                ),
            )

        Notification.objects.create(
            recipient=instance.student,
            message=f"Your application for the project '{instance.project.title}' has been rejected.",
            type='student_project',
        )

        instance.delete()

    def get_queryset(self):
        if self.request.user.groups.filter(name='Supervisor').exists():
            return Application.objects.filter(visible_to_lecturer=True, project__created_by=self.request.user)
        else:
            return Application.objects.filter(student=self.request.user)



class ProposalViewSet(viewsets.ModelViewSet):
    queryset = Proposal.objects.all()
    serializer_class = ProposalSerializer

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)

        proposal = serializer.instance

        if proposal.supervisor and proposal.supervisor.email:
            send_mail(
                f'[Data Science FYP] New Project Proposal: {proposal.title}',
                '',
                settings.DEFAULT_FROM_EMAIL,
                [proposal.supervisor.email],  # To email
                fail_silently=False,
                html_message=(
                    f'<p>Dear Supervisor, Dr. {proposal.supervisor.full_name},</p>'
                    f'<p>We would like to inform you that {proposal.student.full_name} ({proposal.student.username}) has submitted a new project proposal titled "{proposal.title}" and has identified you as the preferred supervisor.</p>'
                    '<p>Details of the Proposal:</p>'
                    f'<ul>'
                    f'  <li>Student Name: {proposal.student.full_name}</li>'
                    f'  <li>Matric Number: {proposal.student.username}</li>'
                    f'  <li>Student Email: {proposal.student.email}</li>'
                    f'  <li>Proposed Project Title: {proposal.title}</li>'
                    f'</ul>'
                    f'<p>Please login to the system to review the proposal and manage it accordingly. You can do so by visiting the following URL: <a href="{settings.FRONTEND_URL}" target="_blank">{settings.FRONTEND_URL}</a></p>'
                    '<p>Thank you for your attention and cooperation.</p>'
                ),
            )
        
        Notification.objects.create(
            recipient=proposal.supervisor,
            message=f"[Supervisor] {proposal.student.full_name} has submitted a new project proposal titled '{proposal.title}'.",            
            type='student_application',
        )

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=kwargs.pop('partial', False))
        serializer.is_valid(raise_exception=True)
        
        # Print the current status and the updated status.
        print(f"Current status: {instance.status}")
        print(f"Updated status: {serializer.validated_data.get('status')}")
        
        # Check if the user is a supervisor.
        if request.user.groups.filter(name='Supervisor').exists():
            # Check if the status is being updated to "approved".
            if serializer.validated_data.get('status') == 'approved':
                instance.visible_to_lecturer = False
                student_email = instance.student.email
                
                # Print the student email.
                print(f"Student email: {student_email}")
                
                if student_email:
                    send_mail(
                        f'[Data Science FYP] Your Proposal Application Has Been Approved',
                        '',
                        settings.DEFAULT_FROM_EMAIL,
                        [student_email],
                        fail_silently=False,
                        html_message=(
                            f'<p>Dear {instance.student.full_name},</p>'
                            f'<p>Your proposal "{instance.title}" has been approved.</p>'
                            '<p>Please login to the system for more details and further actions:</p>'
                            f'<p><a href="{settings.FRONTEND_URL}" target="_blank">{settings.FRONTEND_URL}</a></p>'
                            '<p>Thank you.</p>'
                        ),
                    )

                Notification.objects.create(
                    recipient=instance.student,
                    message=f"Your proposal '{instance.title}' has been approved.",            
                    type='student_project',
                )
                
            serializer.save()
            return Response(serializer.data)
         # Check if the user is a student and owns the proposal
        elif request.user.groups.filter(name='Student').exists() and instance.student == request.user:
            # Save the updated proposal
            serializer.save()
            return Response(serializer.data)

        else:
            raise serializers.ValidationError('Invalid operation')

    def perform_destroy(self, instance):
        # Check if the current user is the student who owns the proposal
        if instance.student != self.request.user:
            student_email = instance.student.email

            if student_email:
                send_mail(
                    f'[Data Science FYP] Your Project Proposal Has Been Rejected',
                    '',
                    settings.DEFAULT_FROM_EMAIL,
                    [student_email],
                    fail_silently=False,
                    html_message=(
                        f'<p>Dear {instance.student.full_name},</p>'
                        f'<p>We regret to inform you that your application for the proposal "{instance.title}" has been rejected.</p>'
                        '<p>You might consider the following steps:</p>'
                        '<ul>'
                        f'  <li>Contact the lecturer, <a href="mailto:{instance.supervisor.email}">{instance.supervisor.full_name}</a>, directly for more insights on the decision.</li>'
                        '  <li>Explore the available projects to apply for.</li>'
                        '  <li>Consider proposing other project title.</li>'
                        '</ul>'
                        f'<p>Please login to the system for more details: <a href="{settings.FRONTEND_URL}" target="_blank">{settings.FRONTEND_URL}</a></p>'
                        '<p>Thank you.</p>'
                    ),
                )

            Notification.objects.create(
                recipient=instance.student,
                message=f"Your application for the proposal '{instance.title}' has been rejected.",       
                type='student_project',
            )

        # Delete the proposal after the checks
        instance.delete()


    def get_queryset(self):
        queryset = None
        if self.request.user.groups.filter(name='Supervisor').exists():
            queryset = Proposal.objects.filter(supervisor=self.request.user)
        else:
            queryset = Proposal.objects.filter(student=self.request.user)

        # Get the status from the query parameters (if present)
        status = self.request.query_params.get('status', None)

        # If a status was provided, filter the queryset based on this status
        if status is not None:
            queryset = queryset.filter(status=status)

        return queryset

class BaseFileSubmissionViewSet(viewsets.ModelViewSet):
    model = None
    serializer_class = None

    def get_queryset(self):
        if self.request.user.groups.filter(name='Student').exists():
            return self.model.objects.filter(student=self.request.user)
        student_username = self.request.query_params.get('student', None)
        if student_username:
            return self.model.objects.filter(student__username=student_username)
        return self.model.objects.filter(project__created_by=self.request.user)

    def _handle_file_delete(self, instance):
        """Helper method to handle file deletion from the server."""
        if instance.uploaded_file:
            try:
                base_dir = str(settings.BASE_DIR).replace("\\", "/")
                file_url = instance.uploaded_file.url
                file_path = base_dir + file_url
                if os.path.exists(file_path):
                    os.remove(file_path)
            except Exception as e:
                raise APIException(detail=str(e))
            
    def _save_(self, serializer, action):
        try:
            title = self.request.data.get('title')
            uploaded_file = self.request.data.get('uploaded_file')
            
            if not uploaded_file:
                raise ValueError("File not found in request.")
            print("Uploaded file found.")

            # Handle the file and get a reference to the saved file
            new_file_name = f"{title}"
            uploaded_file_content = uploaded_file.read()
            saved_file = ContentFile(uploaded_file_content)
            saved_file.name = new_file_name

            # Save the instance with the saved file
            submission_instance = serializer.save(uploaded_file=saved_file)
            print(f"{self.model.__name__} instance {action}.")

        except Exception as e:
            print(f"Exception encountered: {e}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def perform_create(self, serializer):
        serializer.validated_data['student'] = self.request.user

        # Linking to the project 
        try:
            serializer.validated_data['project'] = Project.objects.get(assigned_to=self.request.user)
        except Project.DoesNotExist:
            serializer.validated_data['project'] = None
        print("Linked project.")

        self._save_(serializer, 'submitted')

    def perform_update(self, serializer):
        print("Starting perform_update...")

        submission_instance = self.get_object()
        print(f"Got {self.model.__name__} with ID {submission_instance.id}.")

        self._handle_file_delete(submission_instance)
        print("Previous file deleted (if existed).")

        self._save_(serializer, 'updated')

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self._handle_file_delete(instance)
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class ProposalSubmissionViewSet(BaseFileSubmissionViewSet):
    model = ProposalSubmission
    serializer_class = ProposalSubmissionSerializer
    
class ReportSubmissionViewSet(BaseFileSubmissionViewSet):
    model = ReportSubmission
    serializer_class = ReportSubmissionSerializer
    
class BaseLinkSubmissionViewSet(viewsets.ModelViewSet):
    model = None
    serializer_class = None
    notify_supervisor = True 

    def get_queryset(self):
        if self.request.user.groups.filter(name='Student').exists():
            return self.model.objects.filter(student=self.request.user)
        student_username = self.request.query_params.get('student', None)
        if student_username:
            return self.model.objects.filter(student__username=student_username)
        return self.model.objects.filter(project__created_by=self.request.user)

    def _save_link(self, serializer, action, instance=None):
        """Helper method to save link-based submissions."""
        uploaded_link = self.request.data.get('uploaded_link')
        
        # Check if it's an update operation
        if instance:
            instance.uploaded_link = uploaded_link
            instance.save()
        else:  # Otherwise, it's a create operation
            serializer.validated_data['uploaded_link'] = uploaded_link
            instance = serializer.save()

        return instance

    def perform_create(self, serializer):
        # Set the 'student' field to the current user object before saving
        serializer.validated_data['student'] = self.request.user

        # Find the project associated with the current user (if any)
        try:
            serializer.validated_data['project'] = Project.objects.get(assigned_to=self.request.user)
        except Project.DoesNotExist:
            serializer.validated_data['project'] = None

        self._save_link(serializer, 'submitted')

    def perform_update(self, serializer):
        submission_instance = self.get_object()

        # Ensuring that the serializer updates the provided instance
        serializer.instance = submission_instance
        self._save_link(serializer, 'updated', instance=submission_instance)
        
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class GoogleDriveSubmissionViewSet(BaseLinkSubmissionViewSet):
    model = GoogleDriveSubmission
    serializer_class = GoogleDriveSubmissionSerializer

class SupervisorEvaluationViewSet(viewsets.ModelViewSet):
    queryset = SupervisorEvaluation.objects.all()
    serializer_class = SupervisorEvaluationSerializer

    def get_queryset(self):
        role = self.request.query_params.get('role', None)
        #Program Coordinator
        if role == 'coordinator':
            return SupervisorEvaluation.objects.all()

        # For Students:
        if self.request.user.groups.filter(name='Student').exists():
            queryset = SupervisorEvaluation.objects.filter(
                student=self.request.user)

        # Supervisors:
        elif self.request.user.groups.filter(name='Supervisor').exists():
            student_username = self.request.query_params.get('student', None)
            if student_username:
                queryset = SupervisorEvaluation.objects.filter(student__username=student_username)
            else:
                queryset = SupervisorEvaluation.objects.filter(project__created_by=self.request.user)

        else:
            # Handle other cases or raise an exception if no valid group found
            queryset = SupervisorEvaluation.objects.none()

        # Filter by score type if provided:
        score_type = self.request.query_params.get('score_type', None)
        if score_type and score_type in ['proposal_score', 'report_score', 'conduct_score']:
            queryset = queryset.exclude(**{score_type: None})

        return queryset

    def perform_create(self, serializer):
        student_data = self.request.data.get('student')
        project_data = self.request.data.get('project')

        if not student_data:
            raise serializers.ValidationError("Student data is required.")
        if not project_data:
            raise serializers.ValidationError("Project data is required.")

        try:
            student_instance = User.objects.get(id=student_data['id'])
        except User.DoesNotExist:
            raise serializers.ValidationError(
                "Provided student does not exist.")

        project_dict = project_data[0]
        try:
            project_instance = Project.objects.get(id=project_dict['id'])
        except Project.DoesNotExist:
            raise serializers.ValidationError(
                "Provided project does not exist.")

        serializer.validated_data['student'] = student_instance
        serializer.validated_data['project'] = project_instance

        score_type = self.request.data.get('score_type', 'proposal_score')
        score_value = self.request.data.get('score_value')

        if score_value is not None:
            if score_type in ['proposal_score', 'report_score', 'conduct_score']:
                serializer.validated_data[score_type] = score_value
            else:
                raise serializers.ValidationError(
                    "Invalid score type provided.")

        serializer.save()

    def perform_update(self, serializer):
        student_data = self.request.data.get('student')
        project_data = self.request.data.get('project')

        if not student_data:
            raise serializers.ValidationError("Student data is required.")
        if not project_data:
            raise serializers.ValidationError("Project data is required.")

        try:
            student_instance = User.objects.get(id=student_data['id'])
        except User.DoesNotExist:
            raise serializers.ValidationError(
                "Provided student does not exist.")

        project_dict = project_data[0]
        try:
            project_instance = Project.objects.get(id=project_dict['id'])
        except Project.DoesNotExist:
            raise serializers.ValidationError(
                "Provided project does not exist.")

        serializer.validated_data['student'] = student_instance
        serializer.validated_data['project'] = project_instance

        score_type = self.request.data.get('score_type', 'proposal_score')
        score_value = self.request.data.get('score_value')

        if score_value is not None:
            if score_type in ['proposal_score', 'report_score', 'conduct_score']:
                serializer.validated_data[score_type] = score_value
            else:
                raise serializers.ValidationError(
                    "Invalid score type provided.")

        serializer.save()


class PanelEvaluationViewSet(viewsets.ModelViewSet):
    queryset = PanelEvaluation.objects.all()
    serializer_class = PanelEvaluationSerializer

    def get_queryset(self):
        # Student:
        if self.request.user.groups.filter(name='Student').exists():
            queryset = PanelEvaluation.objects.filter(
                student=self.request.user)
        # Program Coordinator:
        elif self.request.user.groups.filter(name='Program Coordinator').exists():
            queryset = PanelEvaluation.objects.all()
        # Panels:
        else:
            student_username = self.request.query_params.get('student', None)
            if student_username:
                queryset = PanelEvaluation.objects.filter(
                    student__username=student_username)
            else:
                # Get all project IDs where the user is a panel member
                panel_project_ids = StudentProjectPanel.objects.filter(
                    panels=self.request.user).values_list('project__id', flat=True)

                # Get all panel evaluations for those projects
                queryset = PanelEvaluation.objects.filter(
                    project__id__in=panel_project_ids)

        return queryset

    def perform_create(self, serializer):
        student_data = self.request.data.get('student')
        project_data = self.request.data.get('project')

        if not student_data:
            raise serializers.ValidationError("Student data is required.")
        if not project_data or not isinstance(project_data, list) or not project_data[0]:
            raise serializers.ValidationError(
                "Project data is required and should be a non-empty list.")
        if 'id' not in project_data[0]:
            raise serializers.ValidationError(
                "Project ID is missing in the data.")

        project_id = project_data[0]['id']

        try:
            student_instance = User.objects.get(id=student_data[0]['id'])
        except User.DoesNotExist:
            raise serializers.ValidationError(
                "Provided student does not exist.")

        try:
            project_instance = Project.objects.get(id=project_data[0]['id'])
        except Project.DoesNotExist:
            raise serializers.ValidationError(
                "Provided project does not exist.")

        serializer.validated_data['student'] = student_instance
        serializer.validated_data['project'] = project_instance
        serializer.validated_data['panel'] = self.request.user

        pitching_score = self.request.data.get('pitching_score')

        if pitching_score is not None:
            try:
                pitching_score = float(pitching_score)
                serializer.validated_data['pitching_score'] = pitching_score
            except ValueError:
                raise serializers.ValidationError(
                    "Invalid pitching score value provided.")
        else:
            raise serializers.ValidationError("Pitching score is required.")

        serializer.save()

        self.check_score_difference_and_send_email(
            project_id, student_instance.full_name)

    def perform_update(self, serializer):
        student_data = self.request.data.get('student')
        project_data = self.request.data.get('project')

        if not student_data:
            raise serializers.ValidationError("Student data is required.")
        if not project_data or not isinstance(project_data, list) or not project_data[0]:
            raise serializers.ValidationError(
                "Project data is required and should be a non-empty list.")
        if 'id' not in project_data[0]:
            raise serializers.ValidationError(
                "Project ID is missing in the data.")
        project_id = project_data[0]['id']

        try:
            student_instance = User.objects.get(id=student_data[0]['id'])
        except User.DoesNotExist:
            raise serializers.ValidationError(
                "Provided student does not exist.")

        try:
            project_instance = Project.objects.get(id=project_data[0]['id'])
        except Project.DoesNotExist:
            raise serializers.ValidationError(
                "Provided project does not exist.")

        serializer.validated_data['student'] = student_instance
        serializer.validated_data['project'] = project_instance
        serializer.validated_data['panel'] = self.request.user

        pitching_score = self.request.data.get('pitching_score')

        if pitching_score is not None:
            try:
                pitching_score = float(pitching_score)
                serializer.validated_data['pitching_score'] = pitching_score
            except ValueError:
                raise serializers.ValidationError(
                    "Invalid pitching score value provided.")
        else:
            raise serializers.ValidationError("Pitching score is required.")

        instance = self.get_object()
        serializer.save(instance=instance)

        self.check_score_difference_and_send_email(
            project_id, student_instance.full_name)
        
    def _create_panel_notification(self, panel_member, message):
            """Helper method to create notifications for panel members."""
            Notification.objects.create(
                recipient=panel_member,
                message=message,
                type='panel_score_difference',
                # Add any other required fields for the Notification model
            )

    def check_score_difference_and_send_email(self, project_id, student_name):
        # Fetch all scores for the project
        scores = PanelEvaluation.objects.filter(
            project_id=project_id).values_list('pitching_score', flat=True)

        # If there are at least two scores, find the difference
        if len(scores) >= 2:
            max_score = max(scores)
            min_score = min(scores)

            # If the difference is more than 10, send an email to both lecturers
            if max_score - min_score > 10:
                # Get the email addresses of the panels
                panel_emails = PanelEvaluation.objects.filter(
                    project_id=project_id
                ).values_list('panel__email', flat=True).distinct()

                # Ensure we have at least two distinct panel emails
                if len(panel_emails) < 2:
                    return

                # Get project details
                project = Project.objects.get(id=project_id)

                 # Get the StudentProjectPanel instance for the project
                student_project_panel_record = StudentProjectPanel.objects.filter(project=project).first()

                # Ensure there's a record and it has associated panels
                if student_project_panel_record:
                    # Iterate over the panel members
                    for panel_member in student_project_panel_record.panels.all():
                        email_subject = "[Data Science FYP] Request for Re-evaluation"
                        email_content = (
                            f'<p>Dear Panel, Dr. {panel_member.full_name},</p>'
                            f'<p>There has been a significant difference (more than 10) in the scores for project "{project.title}" (Student: {student_name}).</p>'
                            f'<p>The highest score was {max_score} and the lowest score was {min_score}. We kindly request you to re-evaluate the project.</p>'
                            f'<p>You can login to the system using the following URL: <a href="{settings.FRONTEND_URL}" target="_blank">{settings.FRONTEND_URL}</a></p>'
                            '<p>Thank you for your attention and cooperation.</p>'
                        )
                        send_mail(
                            email_subject,
                            '',  # Empty plain text message
                            settings.DEFAULT_FROM_EMAIL,
                            [panel_member.email],  # Send to individual panel member
                            fail_silently=False,
                            html_message=email_content
                        )

                    # Create a notification for the panel members
                    notification_message = (
                        f'[Panel] There has been a significant score difference for project "{project.title}" (Student: {student_name}). '
                        f'Please re-evaluate.'
                    )

                    for panel_member in student_project_panel_record.panels.all():
                        self._create_panel_notification(panel_member, notification_message)

class EvaluationTotalScoreViewSet(viewsets.ModelViewSet):
    queryset = EvaluationTotalScore.objects.all()
    serializer_class = EvaluationTotalScoreSerializer

    def get_queryset(self):
        queryset = EvaluationTotalScore.objects.all()
        return queryset

    def create(self, request, *args, **kwargs):
        student_id = request.data.get('student')
        project_id = request.data.get('project')

        # Check if an entry with the same student and project already exists
        existing_entry = EvaluationTotalScore.objects.filter(
            student_id=student_id, project_id=project_id).first()

        if existing_entry:
            # Update the existing entry
            serializer = self.get_serializer(existing_entry, data=request.data)
        else:
            # Create a new entry
            serializer = self.get_serializer(data=request.data)

        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class StudentProjectPanelViewSet(viewsets.ModelViewSet):
    queryset = StudentProjectPanel.objects.all()
    serializer_class = StudentProjectPanelSerializer

    def get_queryset(self):
        user = self.request.user
        context = self.request.query_params.get('context', '')
        role = self.request.query_params.get('role', None)
        #Program Coordinator
        if role == 'coordinator':
            return StudentProjectPanel.objects.all()

        elif role == 'supervisor':
            if context == 'review-project':
                project_id = self.request.query_params.get('project_id')
                return StudentProjectPanel.objects.filter(
                    project__id=project_id, project__created_by=user)
            else:
                return StudentProjectPanel.objects.filter(panels=user)

        elif user.groups.filter(name='Student').exists():
            return StudentProjectPanel.objects.filter(student=user)

        return StudentProjectPanel.objects.none()

    def send_notification_and_email(self, recipient, message, email_subject, email_content):
        if recipient.groups.filter(name='Student').exists():
            notification_type = 'student_project'
        else:
            notification_type = 'panel_project'
    
        send_mail(
            email_subject,
            '',
            settings.DEFAULT_FROM_EMAIL,
            [recipient.email], 
            fail_silently=False,
            html_message=email_content
        )
        Notification.objects.create(
            recipient=recipient,
            message=message,
            type=notification_type,
        )

    def _notify_students_and_panels(self, instance, created, new_panel_ids=None, removed_panel_ids=None):
        panels_names = [panel.full_name for panel in instance.panels.all()]
        panels_list = ', '.join(panels_names)
        assignment_type = "assigned" if created else "updated"

        # Notify the student if there's any change to the panel
        student_email_content = f"<p>Dear {instance.student.full_name},</p>" \
                                f"<p>We would like to inform you that the following panels have been {assignment_type}: {panels_list}.</p>" \
                                f"<p>You can log in to the system using the following URL: <a href=\"{settings.FRONTEND_URL}\" target=\"_blank\">{settings.FRONTEND_URL}</a></p>" \
                                "<p>Thank you for your attention and cooperation.</p>"
        student_message = f"You have been {assignment_type} the following panels: {panels_list}."
        self.send_notification_and_email(instance.student, student_message, f"[Data Science FYP] Panel {assignment_type.capitalize()}", student_email_content)

        # Notify all panel members when created
        if created:
            for panel_member in instance.panels.all():
                panel_email_content = f"<p>Dear Panel, Dr. {panel_member.full_name},</p>" \
                                      f"<p>We would like to inform you that you have been assigned as a panel for the project \"{instance.project.title}\" which is undertaken by the student {instance.student.full_name}.</p>" \
                                      f"<p>You can log in to the system using the following URL: <a href=\"{settings.FRONTEND_URL}\" target=\"_blank\">{settings.FRONTEND_URL}</a></p>" \
                                      "<p>Thank you for your attention and cooperation.</p>"
                panel_message = f"[Panel] You have been assigned to the project '{instance.project.title}' and the student is {instance.student.full_name}."
                self.send_notification_and_email(panel_member, panel_message, "[Data Science FYP] Panel Assignment", panel_email_content)

        # Notify new panel members when updated
        elif new_panel_ids:
            for panel_member_id in new_panel_ids:
                panel_member = User.objects.get(id=panel_member_id)
                panel_email_content = f"<p>Dear Panel, Dr. {panel_member.full_name},</p>" \
                                      f"<p>We would like to inform you that you have been assigned as a panel for the project \"{instance.project.title}\" which is undertaken by the student {instance.student.full_name}.</p>" \
                                      f"<p>You can log in to the system using the following URL: <a href=\"{settings.FRONTEND_URL}\" target=\"_blank\">{settings.FRONTEND_URL}</a></p>" \
                                      "<p>Thank you for your attention and cooperation.</p>"
                panel_message = f"[Panel] You have been assigned to the project '{instance.project.title}' and the student is {instance.student.full_name}."
                self.send_notification_and_email(panel_member, panel_message, "[Data Science FYP] Panel Assignment", panel_email_content)

        # Notify removed panel members
        if removed_panel_ids:
            for panel_member_id in removed_panel_ids:
                panel_member = User.objects.get(id=panel_member_id)
                panel_removed_email_content = f"<p>Dear Panel, Dr. {panel_member.full_name},</p>" \
                                              f"<p>We would like to inform you that you have been removed from the panel for the project \"{instance.project.title}\".</p>" \
                                              f"<p>If you have any questions, please contact the program coordinator.</p>"
                panel_removed_message = f"[Panel] You have been removed from the project '{instance.project.title}'."
                self.send_notification_and_email(panel_member, panel_removed_message, "[Data Science FYP] Panel Removal", panel_removed_email_content)
   
    def perform_create(self, serializer):
        student_instance = serializer.validated_data.pop('student')
        student_id = student_instance.id

        project_instance = serializer.validated_data.pop('project')
        project_id = project_instance.id

        panels_instances = serializer.validated_data.pop('panels')
        panels_ids = [panel.id for panel in panels_instances]

        instance = serializer.save(
            student_id=student_id, project_id=project_id)
        instance.panels.set(panels_ids)

        # self._notify_students_and_panels(instance, created=True)

    def perform_update(self, serializer):
            original_panel_ids = set(serializer.instance.panels.values_list('id', flat=True))
            instance = serializer.save()
            updated_panel_ids = set(instance.panels.values_list('id', flat=True))

            new_panel_ids = updated_panel_ids - original_panel_ids
            removed_panel_ids = original_panel_ids - updated_panel_ids

            # # If there are new or removed panel members, we pass created=False to indicate an update
            # if new_panel_ids or removed_panel_ids:
            #     self._notify_students_and_panels(instance, created=False, new_panel_ids=new_panel_ids, removed_panel_ids=removed_panel_ids)
            # else:
            #     # If there are no changes in the panel members, you can choose not to send any notifications
            #     pass

class PresentationScheduleViewSet(viewsets.ModelViewSet):
    queryset = PresentationSchedule.objects.all()
    serializer_class = PresentationScheduleSerializer

    def get_queryset(self):
        user = self.request.user

        # For Program Coordinator: Return all schedules
        if user.groups.filter(name='Program Coordinator').exists():
            return PresentationSchedule.objects.all()

        # For Supervisor (Lecturer): Return schedules where they are a panel
        elif user.groups.filter(name='Supervisor').exists():
            # Filter schedules where the lecturer is in the list of panels
            return PresentationSchedule.objects.filter(panels=user)

        # For Student: Return schedules for their assigned projects
        elif user.groups.filter(name='Student').exists():
            return PresentationSchedule.objects.filter(student=user)

        # Default: Return an empty queryset for users with other roles or no roles
        else:
            return PresentationSchedule.objects.none()

    def duration_string_to_timedelta(duration_str):
        hours, minutes, seconds = map(int, duration_str.split(':'))
        return datetime.timedelta(hours=hours, minutes=minutes, seconds=seconds)
    
    def send_presentation_notification(self, recipient, message):
        if recipient.groups.filter(name='Student').exists():
            notification_type = 'student_presentation'
        else:  # For panel members
            notification_type = 'panel_presentation'

        Notification.objects.create(
            recipient=recipient,
            message=message,
            type=notification_type,
        )

    def _notify_students_and_panels_about_presentation(self, instance):
        # Notify the student
        student_message = f"You have a presentation scheduled on {instance.date} starting at {instance.start_time.strftime('%H:%M')}."
        self.send_presentation_notification(instance.student, student_message)

        # Notify the panel members
        for panel_member in instance.panels.all():
            panel_message = f"[Panel] You are scheduled for a presentation on {instance.date} starting at {instance.start_time.strftime('%H:%M')} for student {instance.student.full_name} and project '{instance.project.title}'."
            self.send_presentation_notification(panel_member, panel_message)

    def create(self, request, *args, **kwargs):
        # Get the student, project from the request data first
        student = User.objects.get(id=request.data['student_id'])
        project = Project.objects.get(id=request.data['project_id'])
        coordinator = User.objects.get(id=request.data['programCoordinator_id'])

        # Now check if the schedule already exists
        existing_schedule = PresentationSchedule.objects.filter(
            project=project, student=student).first()
        if existing_schedule:
            return Response({"detail": "Schedule for the given student and project already exists."}, status=status.HTTP_400_BAD_REQUEST)

        date_str = request.data['date']
        date_obj = datetime.datetime.strptime(date_str, '%Y-%m-%d').date()
        start_time_str = request.data['start_time']
        start_time_obj = datetime.datetime.strptime(
            start_time_str, '%H:%M').time()
        duration_str = request.data['duration']
        duration_obj = PresentationScheduleViewSet.duration_string_to_timedelta(
            duration_str)

        # Create the schedule object
        schedule = PresentationSchedule(
            student=student,
            project=project,
            coordinator=coordinator,
            date=date_obj,
            start_time=start_time_obj,
            duration=duration_obj
        )

        # Save the schedule instance before adding panels, without generating the Google Meet link
        schedule.save(generate_meet_link=False)

        # Add panels to the schedule
        panels = User.objects.filter(id__in=request.data['panels_id'])
        for panel in panels:
            schedule.panels.add(panel)

        # Save the schedule instance again after adding panels, this time generating the Google Meet link
        schedule.save(generate_meet_link=True)

        # Now, notifications should be sent to all, including panels
        self._notify_students_and_panels_about_presentation(schedule)

        # Return a response with the created presentation schedule
        serializer = self.get_serializer(schedule)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_update(self, serializer):
        # Extract the relevant data from the request
        student = User.objects.get(id=self.request.data['student_id'])
        project = Project.objects.get(id=self.request.data['project_id'])
        coordinator = User.objects.get(id=self.request.data['programCoordinator_id'])
        date_str = self.request.data['date']
        date_obj = datetime.datetime.strptime(date_str, '%Y-%m-%d').date()
        start_time_str = self.request.data['start_time']
        start_time_obj = datetime.datetime.strptime(
            start_time_str, '%H:%M').time()
        duration_str = self.request.data['duration']
        duration_obj = PresentationScheduleViewSet.duration_string_to_timedelta(
            duration_str)

        # Update the fields in the instance
        instance = self.get_object()
        instance.student = student
        instance.coordinator = coordinator
        instance.project = project
        instance.date = date_obj
        instance.start_time = start_time_obj
        instance.duration = duration_obj

        # Update the panels
        panels = User.objects.filter(id__in=self.request.data['panels_id'])
        instance.panels.clear()  # Clear existing panels
        for panel in panels:
            instance.panels.add(panel)

        # Save the instance
        # instance.save()

        instance.save(generate_meet_link=True)

        self._notify_students_and_panels_about_presentation(instance)

        # # Continue with the default update flow
        # serializer.save()


class SemesterViewSet(viewsets.ModelViewSet):
    queryset = Semester.objects.all()
    serializer_class = SemesterSerializer

    def get_permissions(self):
        if self.action == 'list':
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def list(self, request):
        all_semesters = Semester.objects.all()
        recent_semester_id = Semester.objects.latest('id').id
        serialized_data = SemesterSerializer(all_semesters, many=True).data
        for semester in serialized_data:
            semester['is_latest'] = (semester['id'] == recent_semester_id)
        return Response(serialized_data, status=status.HTTP_200_OK)

    def create(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
             # Delete all notifications
            Notification.objects.all().delete()
            TimeRange.objects.all().delete()
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, pk=None):
        instance = self.get_object()
        serializer = self.get_serializer(
            instance, data=request.data, partial=True)
        if serializer.is_valid():
            Notification.objects.all().delete()
            TimeRange.objects.all().delete()
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    
    def get_queryset(self):
        # Return only unread notifications for the logged-in user
        return Notification.objects.filter(recipient=self.request.user)
    
    def delete(self, request, *args, **kwargs):
        try:
            notifications = Notification.objects.filter(recipient=request.user)
            notifications.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response(str(e), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def mark_notification_read(request, notification_id):
    try:
        notification = Notification.objects.get(id=notification_id, recipient=request.user)
    except Notification.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'POST':
        notification.read = True
        notification.save()
        return Response(status=status.HTTP_200_OK)

class TimeRangeViewSet(viewsets.ModelViewSet):
    queryset = TimeRange.objects.all()
    serializer_class = TimeRangeSerializer

    def get_queryset(self):
        user = self.request.user
        role = self.request.query_params.get('role', None)
        date = self.request.query_params.get('date', None)

        queryset = TimeRange.objects

        if date:
            queryset = queryset.filter(date=date)

        #Program Coordinator
        if role == 'coordinator':
            return queryset.all()

        # For Supervisor: Return only their time ranges
        elif user.groups.filter(name='Supervisor').exists():
            return queryset.filter(panel=user)

        else:
            return TimeRange.objects.none()

    def create(self, request, *args, **kwargs):
            panel_id = request.data.get('panel_id')
            panel = get_object_or_404(User, id=panel_id)
            date = request.data.get('date')

            time_range, created = TimeRange.objects.get_or_create(panel=panel, date=date)
            time_slots_data = request.data.get("time_slots")

            # Debug: Log the received time slot IDs
            print(f"Received time slot IDs: {time_slots_data}")

            time_range.time_slots.clear()
            for slot_id in time_slots_data:
                try:
                    time_slot = SingleTimeSlot.objects.get(id=slot_id)
                    time_range.time_slots.add(time_slot)
                except SingleTimeSlot.DoesNotExist:
                    # Improved error message
                    return Response(
                        {"error": f"Time slot with ID {slot_id} does not exist in the database."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            time_range.save()
            serializer = self.get_serializer(time_range)
            return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.time_slots.clear()
        time_slots_data = request.data.get("time_slots")

        for slot_id in time_slots_data:
            time_slot = SingleTimeSlot.objects.get(id=slot_id)
            instance.time_slots.add(time_slot)

        instance.save()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def delete(self, request, *args, **kwargs):
        date = request.query_params.get('date', None)
        user = request.user

        if date:
            # Filter TimeRange instances for the given date and user
            time_ranges = TimeRange.objects.filter(date=date, panel=user)

            if time_ranges.exists():
                time_ranges.delete()
                return Response(status=status.HTTP_204_NO_CONTENT)
            else:
                return Response({"error": "No time ranges found for the specified date."}, status=status.HTTP_404_NOT_FOUND)
        else:
            # If no date is provided, fallback to default behavior
            return super(TimeRangeViewSet, self).destroy(request, *args, **kwargs)

class LecturerStudentLimitViewSet(viewsets.ModelViewSet):
    queryset = LecturerStudentLimit.objects.all()
    serializer_class = LecturerStudentLimitSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
            queryset = LecturerStudentLimit.objects.all()
            semester_id = self.request.query_params.get('semester_id', None)

            if semester_id is not None:
                queryset = queryset.filter(semester_id=semester_id)
            else:
                # Default to the latest semester if no semester_id is provided
                latest_semester = Semester.objects.latest('id')
                queryset = queryset.filter(semester_id=latest_semester.id)
            
            return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=kwargs.get('partial', False))
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
