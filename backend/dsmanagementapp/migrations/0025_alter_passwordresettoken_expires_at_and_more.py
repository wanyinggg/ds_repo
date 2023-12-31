# Generated by Django 4.2.1 on 2023-10-29 06:47

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('dsmanagementapp', '0024_alter_passwordresettoken_expires_at'),
    ]

    operations = [
        migrations.AlterField(
            model_name='passwordresettoken',
            name='expires_at',
            field=models.DateTimeField(default=datetime.datetime(2023, 10, 29, 7, 47, 9, 365395, tzinfo=datetime.timezone.utc)),
        ),
        migrations.AlterUniqueTogether(
            name='supervisorevaluation',
            unique_together={('student', 'project')},
        ),
    ]
