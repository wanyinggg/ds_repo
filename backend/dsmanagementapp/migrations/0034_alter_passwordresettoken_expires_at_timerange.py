# Generated by Django 4.2.1 on 2023-11-10 14:26

import datetime
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('dsmanagementapp', '0033_remove_supervisorevaluation_presentation_score_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='passwordresettoken',
            name='expires_at',
            field=models.DateTimeField(default=datetime.datetime(2023, 11, 10, 15, 26, 18, 68907, tzinfo=datetime.timezone.utc)),
        ),
        migrations.CreateModel(
            name='TimeRange',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField()),
                ('start_time', models.TimeField()),
                ('end_time', models.TimeField()),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='time_ranges', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
