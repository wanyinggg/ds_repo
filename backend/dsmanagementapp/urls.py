from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import *
from rest_framework.authtoken.views import obtain_auth_token
from django.contrib.auth import views as auth_views
from . import views

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'projects', ProjectViewSet)
router.register(r'applications', ApplicationViewSet)
router.register(r'groups', GroupViewSet)
router.register(r'proposals', ProposalViewSet)
router.register(r'proposal_submissions', ProposalSubmissionViewSet, basename='proposalsubmission')
router.register(r'report_submissions', ReportSubmissionViewSet, basename='reportsubmission')
router.register(r'drive_submissions', GoogleDriveSubmissionViewSet, basename='dataprodsubmission')
router.register(r'supervisor_evaluation', SupervisorEvaluationViewSet)
router.register(r'panel_evaluation', PanelEvaluationViewSet)
router.register(r'student_project_panel', StudentProjectPanelViewSet)
router.register(r'presentation-schedule', PresentationScheduleViewSet)
router.register(r'time_range', TimeRangeViewSet)
router.register(r'total_scores', EvaluationTotalScoreViewSet)
router.register(r'semester', SemesterViewSet)
router.register(r'archived_projects', ArchivedProjectViewSet)


urlpatterns = [
    path('', include(router.urls)),
    path('login/', LoginView.as_view(), name='login'),
    path('api-token-auth/', obtain_auth_token),
    path('logout/', logout_view, name='logout'),
    path('reset-current-password/', views.reset_current_password, name='reset_current_password'),
    path('reset-password-request/', PasswordResetView.as_view(), name='reset-password-request'),
    path('reset-password/<uuid:token>/', PasswordResetView.as_view(), name='reset-password'),
    path('get-username/<uuid:token>/', GetUsernameView.as_view(), name='get-username'),
    path('notifications/', views.NotificationListView.as_view(), name='notification-list'),
    path('notifications/<int:notification_id>/read/', views.mark_notification_read, name='mark-notification-read'),
    path('students-per-lecturer/', StudentsPerLecturer.as_view(), name='students-per-lecturer'),

]
    
