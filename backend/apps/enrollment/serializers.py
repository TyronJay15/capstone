from rest_framework import serializers

from .models import AcademicYear, Enrollment, Section, Strand
from .services import derive_overall_status, map_roster_status


class AcademicYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicYear
        fields = ('id', 'label', 'is_current', 'starts_on', 'ends_on')


class StrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Strand
        fields = ('id', 'code', 'name')


class SectionSerializer(serializers.ModelSerializer):
    academic_year_label = serializers.CharField(source='academic_year.label', read_only=True)

    class Meta:
        model = Section
        fields = ('id', 'name', 'grade_level', 'academic_year', 'academic_year_label')


class EnrollmentSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    status = serializers.SerializerMethodField()
    academic_year_label = serializers.CharField(source='academic_year.label', read_only=True)
    section_name = serializers.CharField(source='section.name', read_only=True, default='Unassigned')
    strand_name = serializers.CharField(source='strand.name', read_only=True, allow_null=True)

    class Meta:
        model = Enrollment
        fields = (
            'id',
            'lrn',
            'first_name',
            'middle_name',
            'last_name',
            'full_name',
            'academic_year',
            'academic_year_label',
            'section',
            'section_name',
            'strand',
            'strand_name',
            'previous_school',
            'grade_level_enrollment',
            'grade_level_current',
            'registrar_status',
            'admin_status',
            'status',
            'submitted_info',
            'submitted_at',
            'parent_consent',
            'parent_consent_by',
            'parent_consent_at',
            'birthdate',
            'age',
            'gender',
            'address',
            'contact_number',
            'school_name',
            'created_at',
            'updated_at',
        )
        read_only_fields = (
            'id',
            'submitted_at',
            'created_at',
            'updated_at',
            'registrar_status',
            'admin_status',
        )

    def get_status(self, obj):
        return derive_overall_status(obj)


class EnrollmentCreateSerializer(serializers.ModelSerializer):
    academic_year_label = serializers.CharField(
        source='academic_year.label', read_only=True, required=False
    )

    class Meta:
        model = Enrollment
        fields = (
            'lrn',
            'first_name',
            'middle_name',
            'last_name',
            'academic_year',
            'academic_year_label',
            'strand',
            'previous_school',
            'grade_level_enrollment',
            'grade_level_current',
            'birthdate',
            'age',
            'gender',
            'address',
            'contact_number',
            'school_name',
            'submitted_info',
        )

    def validate_lrn(self, value):
        return value.strip()


class EnrollmentStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Enrollment.Status.choices)


class SectionAssignmentItemSerializer(serializers.Serializer):
    id = serializers.UUIDField(required=False)
    lrn = serializers.CharField(required=False)
    section = serializers.CharField()


class BulkSectionAssignmentSerializer(serializers.Serializer):
    academic_year = serializers.PrimaryKeyRelatedField(
        queryset=AcademicYear.objects.all(), required=False
    )
    academic_year_label = serializers.CharField(required=False)
    assignments = SectionAssignmentItemSerializer(many=True)


class RegistrarRequestSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='full_name', read_only=True)
    grade_level = serializers.CharField(source='grade_level_enrollment', read_only=True)
    status = serializers.CharField(source='registrar_status', read_only=True)
    overall_status = serializers.SerializerMethodField()
    section = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment
        fields = (
            'id',
            'lrn',
            'name',
            'previous_school',
            'grade_level',
            'status',
            'admin_status',
            'overall_status',
            'academic_year',
            'section',
            'submitted_info',
            'submitted_at',
        )

    def get_overall_status(self, obj):
        return derive_overall_status(obj)

    def get_section(self, obj):
        return obj.section.name if obj.section else 'Unassigned'


class AdminIncomingSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='full_name', read_only=True)
    grade_level = serializers.CharField(source='grade_level_enrollment', read_only=True)
    status = serializers.CharField(source='admin_status', read_only=True)
    section = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment
        fields = (
            'id',
            'lrn',
            'name',
            'grade_level',
            'submitted_info',
            'status',
            'registrar_status',
            'academic_year',
            'section',
        )

    def get_section(self, obj):
        return obj.section.name if obj.section else 'Unassigned'


class AdminRosterSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='full_name', read_only=True)
    grade_level = serializers.CharField(source='grade_level_enrollment', read_only=True)
    status = serializers.SerializerMethodField()
    date_registered = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment
        fields = (
            'id',
            'lrn',
            'name',
            'grade_level',
            'status',
            'date_registered',
            'parent_consent',
        )

    def get_status(self, obj):
        return map_roster_status(obj)

    def get_date_registered(self, obj):
        return obj.submitted_at.date().isoformat() if obj.submitted_at else ''


class SectionAssignmentSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='full_name', read_only=True)
    grade_level = serializers.CharField(source='grade_level_enrollment', read_only=True)
    section = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment
        fields = ('id', 'lrn', 'name', 'grade_level', 'section')

    def get_section(self, obj):
        return obj.section.name if obj.section else 'Unassigned'


class ParentConsentSerializer(serializers.Serializer):
    lrn = serializers.CharField()
    granted = serializers.BooleanField()
    parent_name = serializers.CharField(required=False, allow_blank=True, default='')
