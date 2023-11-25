# Generated by Django 4.2.1 on 2023-10-08 10:11

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('dsmanagementapp', '0003_alter_passwordresettoken_expires_at'),
    ]

    operations = [
        migrations.CreateModel(
            name='ArchivedProject',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255)),
                ('num_of_student', models.IntegerField()),
                ('description', models.TextField()),
                ('collaborator', models.CharField(blank=True, max_length=255)),
                ('tool', models.TextField(blank=True)),
                ('state', models.CharField(max_length=255, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('original_creator_id', models.IntegerField(blank=True, null=True)),
                ('original_assigned_to_ids', models.JSONField(blank=True, null=True)),
                ('semester_info_str', models.CharField(blank=True, max_length=255, null=True)),
            ],
        ),
        migrations.AlterField(
            model_name='passwordresettoken',
            name='expires_at',
            field=models.DateTimeField(default=datetime.datetime(2023, 10, 8, 11, 11, 7, 799657, tzinfo=datetime.timezone.utc)),
        ),
    ]
