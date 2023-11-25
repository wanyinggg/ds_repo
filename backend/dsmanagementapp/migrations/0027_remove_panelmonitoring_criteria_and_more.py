# Generated by Django 4.2.1 on 2023-10-31 04:12

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('dsmanagementapp', '0026_alter_supervisorevaluation_unique_together_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='panelmonitoring',
            name='criteria',
        ),
        migrations.RemoveField(
            model_name='panelmonitoring',
            name='panel',
        ),
        migrations.RemoveField(
            model_name='panelmonitoring',
            name='project',
        ),
        migrations.RemoveField(
            model_name='panelmonitoring',
            name='student',
        ),
        migrations.AlterField(
            model_name='notification',
            name='type',
            field=models.CharField(choices=[('student_application', 'Student Applications'), ('supervisor_evaluation_proposal', 'Proposal Evaluations'), ('supervisor_evaluation_report', 'Report Evaluations'), ('supervisor_evaluation_presentation', 'Presentation Evaluations'), ('supervisor_evaluation_demo', 'Demo Evaluations'), ('supervisor_evaluation_data_product', 'Data Product Evaluations'), ('semester_changed', 'Change Semester'), ('panel_project', 'Get Panel Project'), ('panel_presentation', 'Panel Presentation Slot'), ('panel_evaluation_score', 'Panel Evaluation'), ('panel_evaluation_presentation', 'Panel Evaluation'), ('panel_evaluation_demo', 'Panel Evaluation'), ('panel_evaluation_data_product', 'Panel Evaluation'), ('panel_score_difference', 'Panel Evaluation'), ('student_project', 'Student Project'), ('student_presentation', 'Student Presentation Slot')], max_length=255),
        ),
        migrations.AlterField(
            model_name='passwordresettoken',
            name='expires_at',
            field=models.DateTimeField(default=datetime.datetime(2023, 10, 31, 5, 12, 35, 8938, tzinfo=datetime.timezone.utc)),
        ),
        migrations.DeleteModel(
            name='Criteria',
        ),
        migrations.DeleteModel(
            name='PanelMonitoring',
        ),
    ]
