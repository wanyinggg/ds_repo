# Generated by Django 4.2.1 on 2023-11-08 09:25

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('dsmanagementapp', '0032_alter_passwordresettoken_expires_at'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='supervisorevaluation',
            name='presentation_score',
        ),
        migrations.AlterField(
            model_name='passwordresettoken',
            name='expires_at',
            field=models.DateTimeField(default=datetime.datetime(2023, 11, 8, 10, 25, 0, 226516, tzinfo=datetime.timezone.utc)),
        ),
    ]
