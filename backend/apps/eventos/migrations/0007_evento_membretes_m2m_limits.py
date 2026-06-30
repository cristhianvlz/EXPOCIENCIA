from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('eventos', '0006_firmante'),
    ]

    operations = [
        # 1. Add max_* fields
        migrations.AddField(
            model_name='evento',
            name='max_participantes',
            field=models.PositiveSmallIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='evento',
            name='max_tribunal',
            field=models.PositiveSmallIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='evento',
            name='max_tutores',
            field=models.PositiveSmallIntegerField(default=0),
        ),
        # 2. Add M2M membretes (copies existing membrete FK via RunPython below)
        migrations.AddField(
            model_name='evento',
            name='membretes',
            field=models.ManyToManyField(blank=True, related_name='eventos', to='eventos.membrete'),
        ),
        # 3. Migrate existing FK data to the new M2M
        migrations.RunSQL(
            sql="""
                INSERT INTO evento_membretes (evento_id, membrete_id)
                SELECT id_evento, membrete_id
                FROM evento
                WHERE membrete_id IS NOT NULL
                ON CONFLICT DO NOTHING;
            """,
            reverse_sql="DELETE FROM evento_membretes;",
        ),
        # 4. Remove the old FK column
        migrations.RemoveField(
            model_name='evento',
            name='membrete',
        ),
    ]
