from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import *
from django.contrib.auth.models import Group
from django.core.exceptions import ObjectDoesNotExist

class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            User.objects.get(email=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("User with this email does not exist.")
        return value

class PasswordResetConfirmSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)


    def validate(self, data):
        password = data.get('password')
        password_confirm = data.get('password_confirm')

        if password != password_confirm:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})

        return data

    def validate_password(self, value):
        validate_password(value)
        return value

class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ['id', 'name']

class UserSerializer(serializers.ModelSerializer):
    groups = serializers.SlugRelatedField(
        many=True,
        slug_field='id',
        queryset=Group.objects.all()
    )

    password = serializers.CharField(write_only=True, required=False)  # Password field is no longer required

    class Meta:
        model = User
        fields = ['id', 'username', 'full_name', 'email', 'password', 'groups','is_active']  # define the fields you want to include in the API
        extra_kwargs = {'password': {'write_only': True}}

    def validate_password(self, value: str) -> str:
        return value  # just return the password as is

    def create(self, validated_data):
        groups_data = validated_data.pop('groups', [])  # Get the groups from the validated data
        password = validated_data.pop('password', None)
        user = User.objects.create(
            username=validated_data['username'],
            full_name=validated_data['full_name'],
            email=validated_data['email'],
        )

        if password is not None:
            user.set_password(password)
        user.save()

        # Add the user to the groups
        user.groups.set(groups_data)

        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password is not None:
            instance.set_password(password)
        instance = super().update(instance, validated_data)
        return instance
    
    
class SemesterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Semester
        fields = ['id', 'semester', 'academic_year', 'start_date', 'end_date']  

class ProjectSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    created_by_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), source='created_by')
    assigned_to = UserSerializer(many=True, read_only=True,allow_null=True)
    assigned_to_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), source='assigned_to', many=True, allow_null=True)
    semester_info = SemesterSerializer(read_only=True,allow_null=True)
    class Meta:
        model = Project
        fields = ['id', 'title', 'description', 'num_of_student','collaborator','tool','state',
                  'created_by_id' ,'created_by','assigned_to_id','assigned_to','semester_info']
        read_only_fields = ['created_by','assigned_to','semester_info']
    

    def create(self, validated_data):
        return super().create(validated_data)
    
    def delete(self, instance):
        instance.delete()
        projects = Project.objects.all().order_by('id')
        for index, project in enumerate(projects, start=1):
            project.id = index
            project.save()

class ArchivedProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArchivedProject 
        fields = '__all__'
    
class ApplicationSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    project = ProjectSerializer(read_only=True)
    project_id = serializers.IntegerField(write_only=True)  
 
    class Meta:
        model = Application
        fields = ['id', 'project','project_id','status','student','visible_to_lecturer']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        status_display = instance.get_status_display()
        representation['status'] = status_display
        return representation 

    def create(self, validated_data):
        # Set 'student' to the currently logged-in user
        # validated_data['student'] = self.context['request'].user
        # Set 'status' to 'P'
        validated_data['status'] = 'Pending'
        return super().create(validated_data)
    
    def validate(self, attrs):
        # student = self.context['request'].user
        # existing_application = Application.objects.filter(student=student)
        
        # # students can only apply for one project.
        # if existing_application.exists():
        #     raise serializers.ValidationError('You have already applied for a project.')
        
        # project cannot be in two applications.
        # if 'project' in attrs:
        #     project = attrs['project']
        #     # if project.status:
        #     #     raise serializers.ValidationError('Project has already been approved.')
        #     existing_application = Application.objects.filter(project=project)
        #     if existing_application.exists():
        #         raise serializers.ValidationError('Application for this project has been applied.')

        return attrs
    
    def update(self, instance, validated_data):
        status = validated_data.get('status', instance.status)

        if status == 'approved':
            student = instance.student
            project = instance.project
            project.assigned_to.add(student)
            project.save()
            instance.status = status
            instance.visible_to_lecturer = False
            return super().update(instance, validated_data)

        else:
            instance.status = status
            return super().update(instance, validated_data)
    
    def destroy(self, instance):
        instance.delete()

class ProposalSerializer(serializers.ModelSerializer):      
    student = UserSerializer(read_only=True)
    student_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), source='student')
    supervisor = UserSerializer(read_only=True)
    supervisor_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), source='supervisor')
    class Meta:
        model = Proposal
        fields = ['id', 'title', 'description', 'num_of_student','collaborator','tool','status',
                  'student_id' ,'student','supervisor_id','supervisor','project_id']
        read_only_fields = ['student','supervisor']
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        status_display = instance.get_status_display()
        representation['status'] = status_display
        return representation 

    def create(self, validated_data):
        validated_data['status'] = 'Pending'
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        status = validated_data.get('status', instance.status)

        if status == 'approved':
            # Get the latest semester
            try:
                latest_semester = Semester.objects.latest('id')
            except ObjectDoesNotExist:
                latest_semester = None  # Handle case where no semester exists

            project = Project.objects.create(
                title=instance.title,
                num_of_student=instance.num_of_student,
                description=instance.description,
                collaborator=instance.collaborator,
                tool=instance.tool,
                created_by=instance.supervisor,
                semester_info=latest_semester,
            )
            project.assigned_to.add(instance.student)
            project.save()
            instance.project = project
            instance.status = status
            return super().update(instance, validated_data)

        else:
            instance.status = status
            return super().update(instance, validated_data)
        
class ProposalSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProposalSubmission
        fields = ['id','title', 'uploaded_file', 'student','project_id']
        read_only_fields = ['student']

class ReportSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportSubmission
        fields = ['id','title', 'uploaded_file', 'student','project_id']
        read_only_fields = ['student']

class GoogleDriveSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = GoogleDriveSubmission
        fields = ['id','title', 'uploaded_link', 'student','project_id']
        read_only_fields = ['student']

class SupervisorEvaluationSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupervisorEvaluation
        fields = ['id','proposal_score', 'report_score', 'conduct_score', 'total_supervisor_score', 'student','project_id']
        read_only_fields = ['student']

class PanelEvaluationSerializer(serializers.ModelSerializer):
    panel = UserSerializer(read_only=True)
    class Meta:
        model = PanelEvaluation
        fields = ['id','pitching_score', 'student','project_id','panel','average_score']
        read_only_fields = ['student','average_score','panel']

class EvaluationTotalScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvaluationTotalScore
        fields = ['student', 'project', 'total_score', 'grade']

class StudentProjectPanelSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    student_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), write_only=True, source='student')
    project = ProjectSerializer(read_only=True)
    project_id = serializers.PrimaryKeyRelatedField(queryset=Project.objects.all(), write_only=True, source='project')
    panels = UserSerializer(many=True, read_only=True)
    panels_id = serializers.PrimaryKeyRelatedField(many=True, queryset=User.objects.all(), write_only=True, source='panels')

    class Meta:
        model = StudentProjectPanel
        fields = ['id', 'student', 'student_id', 'project', 'project_id', 'panels', 'panels_id']
        read_only_fields = ['student','project','panels']

class PresentationScheduleSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    student_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), write_only=True, source='student')
    project = ProjectSerializer(read_only=True)
    project_id = serializers.PrimaryKeyRelatedField(queryset=Project.objects.all(), write_only=True, source='project')
    panels = UserSerializer(many=True, read_only=True)
    panels_id = serializers.PrimaryKeyRelatedField(many=True, queryset=User.objects.all(), write_only=True, source='panels')
    coordinator = UserSerializer(read_only=True)
    coordinator_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), write_only=True, source='coordinator')
    class Meta:
        model = PresentationSchedule
        fields = ['id', 'student', 'student_id', 'project', 'project_id', 'date', 'start_time', 'duration', 'end_time','google_meet_link', 'panels', 'panels_id','event_id','coordinator','coordinator_id']
        read_only_fields = ['student','project','panels','coordinator']

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'message', 'read', 'timestamp', 'type']

class TimeRangeSerializer(serializers.ModelSerializer):
    panel = UserSerializer(read_only=True)
    panel_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), write_only=True, source='panel')
    time_slots = serializers.SlugRelatedField(
        many=True,
        slug_field='slot',
        queryset=SingleTimeSlot.objects.all()
    )

    class Meta:
        model = TimeRange
        fields = ['id', 'panel', 'panel_id', 'date', 'time_slots']
        read_only_fields = ['panel']


class LecturerStudentLimitSerializer(serializers.ModelSerializer):
    class Meta:
        model = LecturerStudentLimit
        fields = ['id', 'num_of_students', 'semester']
