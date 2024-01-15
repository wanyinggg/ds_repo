from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from datetime import datetime, time, timedelta
import uuid
from google_auth_oauthlib.flow import InstalledAppFlow
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from django.db.models import Avg
from decimal import Decimal

class PasswordResetToken(models.Model):
    email = models.EmailField()
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(default=timezone.now() + timezone.timedelta(hours=1))
    
    def is_expired(self):
        return timezone.now() > self.expires_at
    
class User(AbstractUser):
    full_name = models.CharField(max_length=255)
    groups = models.ManyToManyField(
        'auth.Group',
        related_name="dsmanagementapp_users",  
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name="dsmanagementapp_users",  
    )

class Semester(models.Model):
    semester_choices = [
        (1, '1'),
        (2, '2'),
    ]

    semester = models.PositiveSmallIntegerField(choices=semester_choices, default=1)
    academic_year = models.CharField(max_length=50)
    start_date = models.DateField(null=True, blank=True)  
    end_date = models.DateField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if self.start_date and not self.end_date:
            self.end_date = self.calculate_end_date()
        super().save(*args, **kwargs)
        self.save_week15_dates()

    def calculate_end_date(self):
        # semester duration is 15 weeks (include mid sem break) and ends on a Friday
        start = self.start_date
        end = start + timedelta(weeks=14)
        while end.weekday() != 4:  # 0 = Monday, 4 = Friday
            end += timedelta(days=1)
        return end
    
    def save_week15_dates(self):
        if self.end_date:
            # Calculate Week 15 dates
            week15_dates = self.calculate_week15_dates()

            # Save Week 15 dates to AvailableDate model
            for date in week15_dates:
                AvailableDate.objects.get_or_create(date=date)

    def calculate_week15_dates(self):
        # Calculate dates of the last week (Week 15)
        end = self.end_date
        week15_dates = []

        for i in range(5):  # Assuming a 5-day week
            day = end - timedelta(days=i)
            week15_dates.append(day)

        return week15_dates

    def __str__(self):
        return f"Semester {self.semester} - {self.academic_year}"


class Project(models.Model):
    title = models.CharField(max_length=255)
    num_of_student = models.IntegerField()
    description = models.TextField()
    collaborator = models.CharField(max_length=255,blank=True)
    tool = models.TextField(blank=True)
    state = models.CharField(max_length=255, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    assigned_to = models.ManyToManyField(User, related_name='assigned_projects', blank=True)
    created_by = models.ForeignKey(User,related_name='created_projects', on_delete=models.CASCADE)
    semester_info = models.ForeignKey(Semester, on_delete=models.CASCADE, null=True, blank=True)

class ArchivedProject(models.Model):
    title = models.CharField(max_length=255)
    num_of_student = models.IntegerField()
    description = models.TextField()
    collaborator = models.CharField(max_length=255, blank=True)
    tool = models.TextField(blank=True)
    state = models.CharField(max_length=255, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    original_creator_name = models.CharField(max_length=255, null=True, blank=True)
    original_assigned_to_names = models.JSONField(blank=True, null=True)
    semester_info_str = models.CharField(max_length=255, null=True, blank=True)

class Application(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('declined', 'Declined'),
    ]
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    status = models.CharField(max_length=100, choices=STATUS_CHOICES, default='pending')
    visible_to_lecturer = models.BooleanField(default=True)

class Proposal(models.Model):
    title = models.CharField(max_length=255)
    num_of_student = models.IntegerField()
    description = models.TextField()
    collaborator = models.CharField(max_length=255,blank=True)
    tool = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    student = models.ForeignKey(User, related_name="proposals_created", on_delete=models.CASCADE)
    supervisor = models.ForeignKey(User, on_delete=models.CASCADE)
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('declined', 'Declined'),
    ]
    status = models.CharField(max_length=100, choices=STATUS_CHOICES, default='pending')
    project = models.ForeignKey(Project, on_delete=models.CASCADE, null=True, blank=True, default=None)

class ProposalSubmission(models.Model):
    title = models.CharField(max_length=100)
    uploaded_file = models.FileField(upload_to='proposal_submissions/')
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, null=True, blank=True, default=None)

class ReportSubmission(models.Model):
    title = models.CharField(max_length=100)
    uploaded_file = models.FileField(upload_to='report_submissions/')
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, null=True, blank=True, default=None)
    
class GoogleDriveSubmission(models.Model):
    title = models.CharField(max_length=100)
    uploaded_link = models.URLField()
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, null=True, blank=True, default=None)

class SupervisorEvaluation(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, null=True, blank=True, default=None)
    proposal_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True) 
    report_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True) 
    conduct_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True) 
    total_supervisor_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    def save(self, *args, **kwargs):
        self.total_supervisor_score = Decimal(0)
        
        if self.proposal_score is not None:
            self.total_supervisor_score += Decimal(self.proposal_score)
        
        if self.report_score is not None:
            self.total_supervisor_score += Decimal(self.report_score)
            
        if self.conduct_score is not None:
            self.total_supervisor_score += Decimal(self.conduct_score)
            
        super(SupervisorEvaluation, self).save(*args, **kwargs)

class PanelEvaluation(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='student_evaluations')
    project = models.ForeignKey(Project, on_delete=models.CASCADE, null=True, blank=True, default=None, related_name='project_evaluations')
    panel = models.ForeignKey(User, on_delete=models.CASCADE, related_name='panel_evaluations')
    pitching_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    average_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs) # Save the current instance first

        # Fetch all evaluations related to the current project and student
        evaluations = PanelEvaluation.objects.filter(project=self.project, student=self.student)

        # Calculate the average score
        avg_score = evaluations.aggregate(average_score=Avg('pitching_score'))['average_score']

        # Update the average score for all related evaluations
        evaluations.update(average_score=avg_score)
        

class EvaluationTotalScore(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    total_score = models.DecimalField(max_digits=5, decimal_places=2)
    grade = models.CharField(max_length=2)

    class Meta:
        unique_together = ['student', 'project']

class StudentProjectPanel(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='panel_assignments')
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='student_panels')
    panels = models.ManyToManyField(User, related_name='panelled_projects')

class PresentationSchedule(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='presentation_schedules')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='student_presentation_schedules')
    panels = models.ManyToManyField(User, related_name='panel_presentation_schedules')
    coordinator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='coordinator_presentation_schedules')
    date = models.DateField()
    start_time = models.TimeField()
    duration = models.DurationField(default=timezone.timedelta(minutes=10))
    end_time = models.TimeField()
    google_meet_link = models.URLField(blank=True, null=True)
    event_id = models.CharField(max_length=255, blank=True, null=True)

    def generate_google_meet_link(self,  panels):
        credentials = None
    
        # Check if the user has a stored refresh token
        try:
            token_entry = GoogleRefreshToken.objects.get(user=self.student)
            stored_refresh_token = token_entry.refresh_token
            credentials = Credentials(
                token=None, 
                refresh_token=stored_refresh_token, 
                client_id="177124701842-1602eo9eh84i1gpb974thberb9mdl404.apps.googleusercontent.com", 
                client_secret="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",
                token_uri="https://oauth2.googleapis.com/token" 
                )
        except GoogleRefreshToken.DoesNotExist:
            # If there's no stored token, go through the OAuth flow
            flow = InstalledAppFlow.from_client_secrets_file(
                'dsmanagementapp/client_secret_177124701842-1602eo9eh84i1gpb974thberb9mdl404.apps.googleusercontent.com.json',
                ['https://www.googleapis.com/auth/calendar']
            )
            credentials = flow.run_local_server(port=8080)
            
            # Save the refresh token for future use
            GoogleRefreshToken.objects.create(user=self.student, refresh_token=credentials.refresh_token)
    
        # Build the Calendar API service object
        service = build('calendar', 'v3', credentials=credentials)
        student_email = self.student.email
        panels_emails = [panel.email for panel in panels]
        coordinator_email = self.coordinator.email
        attendees_emails = set(panels_emails + [student_email, coordinator_email])
        start_time = datetime.combine(self.date, self.start_time).isoformat()
        end_time = (datetime.combine(self.date, self.start_time) + self.duration).isoformat()
        presentation_date_str = self.date.strftime('%A, %d %B %Y') 

        event_data = {
        'summary': f'[Data Science FYP] {self.project.title}', 
        'location': '',
        'description': f'Project Title: \n{self.project.title}\n\n'
                f'Project Description: \n{self.project.description}\n\n'
               f'Student: \n{self.student.full_name}\n\n'
               f'Project Supervisor: \n{self.project.created_by.full_name}\n\n'
               f'Project Panels: \n{", ".join([panel.full_name for panel in panels])}\n\n',
        'start': {
            'dateTime': start_time,
            'timeZone': 'Asia/Kuala_Lumpur',
        },
            'end': {
                'dateTime': end_time,
                'timeZone': 'Asia/Kuala_Lumpur',
            },
            'attendees': [{'email': email} for email in attendees_emails],
            'conferenceData': {
                'createRequest': {
                    'requestId': str(uuid.uuid4()),
                    'conferenceSolutionKey': {
                        'type': 'hangoutsMeet'
                    }
                }
            },
            'visibility': 'public',
            'guestsCanInviteOthers': True,
            'guestsCanSeeOtherGuests': True 
        }

        try:
            if self.event_id:
                # Try to retrieve the existing event
                try:
                    event = service.events().get(calendarId='primary', eventId=self.event_id).execute()
                    # Update the existing event
                    event = service.events().update(calendarId='primary', eventId=self.event_id, body=event_data, sendUpdates='all', conferenceDataVersion=1).execute()
                except HttpError:
                    # If retrieval fails, it means the event might not exist, so create a new one
                    event = service.events().insert(calendarId='primary', body=event_data, sendUpdates='all', conferenceDataVersion=1).execute()
            else:
                # If self.event_id is not set, create a new event
                event = service.events().insert(calendarId='primary', body=event_data, sendUpdates='all', conferenceDataVersion=1).execute()

            self.event_id = event['id']
            return event['hangoutLink']
        except Exception as e:
            # Handle any exceptions that might occur
            print(f"Error while creating/updating the Google Calendar event: {e}")
            return None
    
    def save(self, *args, **kwargs):
        generate_meet_link = kwargs.pop('generate_meet_link', False)

        # Automatically set end_time based on start_time and duration
        start_datetime = datetime.combine(self.date, self.start_time)
        end_datetime = start_datetime + self.duration
        self.end_time = end_datetime.time()

        # Only save the instance first if it's a new instance (not yet in the database)
        if not self.pk:
            super(PresentationSchedule, self).save(*args, **kwargs) # Save the instance first

        if generate_meet_link:
            # Get the panels from the current instance
            panels = list(self.panels.all())

            # Generate the Google Meet link after saving
            self.google_meet_link = self.generate_google_meet_link(panels)

        # Now save again to store the Google Meet link
        super(PresentationSchedule, self).save(*args, **kwargs)

    class Meta:
        unique_together = ('project', 'student')


# GoogleRefreshToken is to store refresh tokens for users. 
# Each user can have only one refresh token associated with them, which is handled by the OneToOneField relationship.
class GoogleRefreshToken(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='google_token')
    refresh_token = models.CharField(max_length=255)


class Notification(models.Model):
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    message = models.CharField(max_length=255)
    read = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)
    TYPE_CHOICES = [
        #lecturer
        ('student_application', 'Student Applications'),
        ('supervisor_evaluation_proposal', 'Proposal Evaluations'),
        ('supervisor_evaluation_report', 'Report Evaluations'),
        ('supervisor_evaluation_presentation', 'Presentation Evaluations'),
        ('supervisor_evaluation_demo', 'Demo Evaluations'),
        ('supervisor_evaluation_data_product', 'Data Product Evaluations'),
        #admin
        ('semester_changed', 'Change Semester'),
        #panel
        ('panel_project', 'Get Panel Project'),
        ('panel_presentation', 'Panel Presentation Slot'),
        ('panel_evaluation_score', 'Panel Evaluation'),
        ('panel_evaluation_presentation', 'Panel Evaluation'),
        ('panel_evaluation_demo', 'Panel Evaluation'),
        ('panel_evaluation_data_product', 'Panel Evaluation'),
        ('panel_score_difference', 'Panel Evaluation'),
        #student
        ('student_project', 'Student Project'),
        ('student_presentation', 'Student Presentation Slot'),
    ]
    type = models.CharField(max_length=255, choices=TYPE_CHOICES)

class SingleTimeSlot(models.Model):
    TIME_SLOTS = [
        (time(9, 0), '9-11am'),
        (time(11, 0), '11-1pm'),
        (time(14, 0), '2-4pm'),
        (time(16, 0), '4-6pm'),
    ]
    slot = models.TimeField(choices=TIME_SLOTS, unique=True, default=None)

    def __str__(self):
        return self.get_slot_display()
    
class TimeRange(models.Model):
    panel = models.ForeignKey(User, on_delete=models.CASCADE, related_name='time_ranges')
    date = models.DateField()
    time_slots = models.ManyToManyField(SingleTimeSlot)

    def __str__(self):
        slots = ', '.join([str(slot) for slot in self.time_slots.all()])
        return f"{self.panel} - {self.date} [{slots}]"

class LecturerStudentLimit(models.Model):
    num_of_students = models.IntegerField()
    semester = models.ForeignKey(Semester, on_delete=models.CASCADE, related_name='lecturer_limits')

class AvailableDate(models.Model):
    date = models.DateField(unique=True)

    def __str__(self):
        return str(self.date)
    
class Announcement(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_announcements')
    semester = models.ForeignKey(Semester, on_delete=models.CASCADE, related_name='semester_announcements')

    def __str__(self):
        return self.title