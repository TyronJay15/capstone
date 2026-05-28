"""Migration to add profile persistence fields to StudentProfile model."""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('students', '0001_initial'),  # Update this with actual last migration
    ]

    operations = [
        migrations.AddField(
            model_name='studentprofile',
            name='contact_number',
            field=models.CharField(blank=True, max_length=20),
        ),
        migrations.AddField(
            model_name='studentprofile',
            name='address',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='studentprofile',
            name='profile_picture',
            field=models.ImageField(blank=True, null=True, upload_to='profiles/'),
        ),
        migrations.AddField(
            model_name='studentprofile',
            name='guardian_name',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='studentprofile',
            name='guardian_contact',
            field=models.CharField(blank=True, max_length=20),
        ),
    ]
