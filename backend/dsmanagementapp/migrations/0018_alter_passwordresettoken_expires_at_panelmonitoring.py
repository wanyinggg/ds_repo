# Generated by Django 4.2.1 on 2023-10-24 12:22

import datetime
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('dsmanagementapp', '0017_alter_passwordresettoken_expires_at'),
    ]

    operations = [
        migrations.AlterField(
            model_name='passwordresettoken',
            name='expires_at',
            field=models.DateTimeField(default=datetime.datetime(2023, 10, 24, 13, 22, 1, 822745, tzinfo=datetime.timezone.utc)),
        ),
        migrations.CreateModel(
            name='PanelMonitoring',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('comments', models.TextField(blank=True, null=True)),
                ('criteria', models.ManyToManyField(to='dsmanagementapp.criteria')),
                ('panel', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='panel_monitorings', to=settings.AUTH_USER_MODEL)),
                ('project', models.ForeignKey(blank=True, default=None, null=True, on_delete=django.db.models.deletion.CASCADE, to='dsmanagementapp.project')),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='student_monitorings', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
