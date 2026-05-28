from rest_framework import serializers

from .models import ParentStudentLink, StudentProfile


class StudentProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    section_name = serializers.CharField(source='section.name', read_only=True, default='')
    academic_year_label = serializers.CharField(source='academic_year.label', read_only=True)

    class Meta:
        model = StudentProfile
        fields = (
            'id',
            'lrn',
            'first_name',
            'middle_name',
            'last_name',
            'full_name',
            'email',
            'contact_number',
            'address',
            'profile_picture',
            'guardian_name',
            'guardian_contact',
            'grade_level',
            'section',
            'section_name',
            'academic_year',
            'academic_year_label',
            'is_active',
        )


class StudentProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating student profile (PATCH /api/v1/students/me/)."""
    
    full_name = serializers.CharField(read_only=True)
    lrn = serializers.CharField(read_only=True)
    grade_level = serializers.CharField(read_only=True)
    section_name = serializers.CharField(source='section.name', read_only=True, default='')
    academic_year_label = serializers.CharField(source='academic_year.label', read_only=True)

    class Meta:
        model = StudentProfile
        fields = (
            'id',
            'lrn',
            'first_name',
            'middle_name',
            'last_name',
            'full_name',
            'email',
            'contact_number',
            'address',
            'profile_picture',
            'guardian_name',
            'guardian_contact',
            'grade_level',
            'section_name',
            'academic_year_label',
        )
        read_only_fields = (
            'id',
            'lrn',
            'grade_level',
            'section_name',
            'academic_year_label',
            'full_name',
        )

    def validate_email(self, value):
        """Validate email uniqueness if provided."""
        if not value:
            return value
        
        instance = self.instance
        if StudentProfile.objects.exclude(pk=instance.pk).filter(email=value).exists():
            raise serializers.ValidationError(
                'A student profile with this email already exists.'
            )
        return value

    def validate_contact_number(self, value):
        """Validate contact number format."""
        if not value:
            return value
        
        # Remove any non-digit characters
        digits_only = ''.join(c for c in value if c.isdigit())
        if len(digits_only) < 7:
            raise serializers.ValidationError(
                'Contact number must be at least 7 digits.'
            )
        return value

    def validate_first_name(self, value):
        """Validate first name."""
        if not value or not value.strip():
            raise serializers.ValidationError('First name is required.')
        return value.strip()

    def validate_last_name(self, value):
        """Validate last name."""
        if not value or not value.strip():
            raise serializers.ValidationError('Last name is required.')
        return value.strip()


class ParentStudentLinkSerializer(serializers.ModelSerializer):
    student = StudentProfileSerializer(read_only=True)

    class Meta:
        model = ParentStudentLink
        fields = ('id', 'student', 'relationship', 'created_at')
