# Generated by Django 4.2.1 on 2023-10-24 14:13

import datetime
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('dsmanagementapp', '0018_alter_passwordresettoken_expires_at_panelmonitoring'),
    ]

    operations = [
        migrations.AlterField(
            model_name='panelmonitoring',
            name='project',
            field=models.ForeignKey(blank=True, default=None, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='project_monitoring', to='dsmanagementapp.project'),
        ),
        migrations.AlterField(
            model_name='passwordresettoken',
            name='expires_at',
            field=models.DateTimeField(default=datetime.datetime(2023, 10, 24, 15, 13, 37, 270786, tzinfo=datetime.timezone.utc)),
        ),
    ]