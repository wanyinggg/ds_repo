# Generated by Django 4.2.1 on 2023-10-08 07:58

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('dsmanagementapp', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='passwordresettoken',
            name='expires_at',
            field=models.DateTimeField(default=datetime.datetime(2023, 10, 8, 8, 58, 20, 86570, tzinfo=datetime.timezone.utc)),
        ),
    ]
