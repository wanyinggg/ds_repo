# Generated by Django 4.2.1 on 2024-01-15 10:18

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('dsmanagementapp', '0050_announcement_semester_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='passwordresettoken',
            name='expires_at',
            field=models.DateTimeField(default=datetime.datetime(2024, 1, 15, 11, 18, 42, 102520, tzinfo=datetime.timezone.utc)),
        ),
    ]
