from rest_framework import serializers

from apps.students.models import StudentProfile

from .models import GradeRecord, Semester, Subject
from .services.grades import GradeServiceError, validate_score


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ('id', 'code', 'name')


class SemesterSerializer(serializers.ModelSerializer):
    academic_year_label = serializers.CharField(source='academic_year.label', read_only=True)

    class Meta:
        model = Semester
        fields = ('id', 'code', 'label', 'academic_year', 'academic_year_label', 'is_current')


class GradeRecordSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    semester_label = serializers.CharField(source='semester.label', read_only=True)
    student_lrn = serializers.CharField(source='student.lrn', read_only=True)
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    section_name = serializers.CharField(
        source='student.section.name', read_only=True, default=''
    )
    grade_level = serializers.CharField(source='student.grade_level', read_only=True)
    semester_short = serializers.SerializerMethodField()

    class Meta:
        model = GradeRecord
        fields = (
            'id',
            'student',
            'student_lrn',
            'student_name',
            'grade_level',
            'section_name',
            'subject',
            'subject_name',
            'semester',
            'semester_label',
            'semester_short',
            'score',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_semester_short(self, obj):
        label = obj.semester.label
        if '1st' in label:
            return '1st Sem'
        if '2nd' in label:
            return '2nd Sem'
        return label


class GradeRecordWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = GradeRecord
        fields = ('id', 'student', 'subject', 'semester', 'score')

    def validate_score(self, value):
        try:
            return validate_score(value)
        except GradeServiceError as exc:
            raise serializers.ValidationError(exc.message) from exc


class BulkGradeEntrySerializer(serializers.Serializer):
    student = serializers.PrimaryKeyRelatedField(queryset=StudentProfile.objects.filter(is_active=True))
    subject = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.filter(is_active=True))
    score = serializers.DecimalField(max_digits=5, decimal_places=2)


class BulkGradeSerializer(serializers.Serializer):
    semester = serializers.PrimaryKeyRelatedField(queryset=Semester.objects.all())
    entries = BulkGradeEntrySerializer(many=True)

    def validate_entries(self, value):
        if not value:
            raise serializers.ValidationError('At least one grade entry is required.')
        return value


class StudentGradesForTeacherSerializer(serializers.Serializer):
    """Dashboard-compatible grade list for teacher grade viewer."""

    id = serializers.CharField()
    name = serializers.CharField()
    email = serializers.EmailField()
    grade = serializers.CharField()
    section = serializers.CharField()
    semester = serializers.CharField()
    grades = serializers.ListField()
