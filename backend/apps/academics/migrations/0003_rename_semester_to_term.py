from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('academics', '0002_graderecord_encoded_by'),
    ]

    operations = [
        # Drop old constraints/index that reference the soon-to-be-renamed field.
        migrations.RemoveConstraint(
            model_name='graderecord',
            name='unique_grade_per_student_subject_semester',
        ),
        migrations.RemoveIndex(
            model_name='graderecord',
            name='academics_g_student_1f7589_idx',
        ),
        migrations.RemoveConstraint(
            model_name='semester',
            name='unique_semester_per_year',
        ),
        # Rename the model (Semester -> Term) and its table.
        migrations.RenameModel(old_name='Semester', new_name='Term'),
        migrations.AlterModelTable(name='term', table='academics_terms'),
        migrations.AlterField(
            model_name='term',
            name='academic_year',
            field=models.ForeignKey(
                on_delete=models.deletion.CASCADE,
                related_name='terms',
                to='enrollment.academicyear',
            ),
        ),
        # Update the period choices to the 3-term structure.
        migrations.AlterField(
            model_name='term',
            name='code',
            field=models.CharField(
                choices=[
                    ('1st_term', '1st Term'),
                    ('2nd_term', '2nd Term'),
                    ('3rd_term', '3rd Term'),
                ],
                max_length=16,
            ),
        ),
        # Rename the FK on GradeRecord (semester -> term).
        migrations.RenameField(
            model_name='graderecord',
            old_name='semester',
            new_name='term',
        ),
        # Re-add constraints/index under the new names.
        migrations.AddConstraint(
            model_name='term',
            constraint=models.UniqueConstraint(
                fields=('academic_year', 'code'), name='unique_term_per_year'
            ),
        ),
        migrations.AddIndex(
            model_name='graderecord',
            index=models.Index(
                fields=['student', 'term'], name='academics_g_student_term_idx'
            ),
        ),
        migrations.AddConstraint(
            model_name='graderecord',
            constraint=models.UniqueConstraint(
                fields=('student', 'subject', 'term'),
                name='unique_grade_per_student_subject_term',
            ),
        ),
    ]
