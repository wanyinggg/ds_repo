# Generated by Django 4.2.1 on 2023-10-08 10:55

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('dsmanagementapp', '0004_archivedproject_alter_passwordresettoken_expires_at'),
    ]

    operations = [
        migrations.RenameField(
            model_name='archivedproject',
            old_name='original_assigned_to_ids',
            new_name='original_assigned_to_names',
        ),
        migrations.RemoveField(
            model_name='archivedproject',
            name='original_creator_id',
        ),
        migrations.AddField(
            model_name='archivedproject',
            name='original_creator_name',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AlterField(
            model_name='passwordresettoken',
            name='expires_at',
            field=models.DateTimeField(default=datetime.datetime(2023, 10, 8, 11, 55, 31, 555873, tzinfo=datetime.timezone.utc)),
        ),
    ]
