# Generated by Django 4.2.1 on 2023-10-17 15:21

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('dsmanagementapp', '0008_notification_item_id_notification_type_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='passwordresettoken',
            name='expires_at',
            field=models.DateTimeField(default=datetime.datetime(2023, 10, 17, 16, 21, 45, 836461, tzinfo=datetime.timezone.utc)),
        ),
    ]
