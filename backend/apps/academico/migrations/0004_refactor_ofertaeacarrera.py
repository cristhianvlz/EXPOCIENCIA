import django.db.models.deletion
from django.db import migrations, models


def delete_dependent_data(apps, schema_editor):
    """
    Limpia todos los datos que dependen de OfertaEaCarrera, en el orden
    correcto para respetar las restricciones PROTECT de la base de datos.
    """
    Certificado      = apps.get_model('premiacion', 'Certificado')
    AsignacionPremio = apps.get_model('premiacion', 'AsignacionPremio')
    GanadorPremio    = apps.get_model('premiacion', 'GanadorPremio')
    CandidatoPremio  = apps.get_model('premiacion', 'CandidatoPremio')
    ActaEvaluacion   = apps.get_model('evaluaciones', 'ActaEvaluacion')
    Proyecto         = apps.get_model('proyectos', 'Proyecto')
    OfertaEaCarrera  = apps.get_model('academico', 'OfertaEaCarrera')

    # 1. Certificado → GanadorPremio (PROTECT)
    Certificado.objects.all().delete()
    # 2. AsignacionPremio → GanadorPremio (PROTECT)
    AsignacionPremio.objects.all().delete()
    # 3. GanadorPremio → CandidatoPremio (OneToOne PROTECT)
    GanadorPremio.objects.all().delete()
    # 4. CandidatoPremio → ActaEvaluacion y Proyecto (PROTECT)
    CandidatoPremio.objects.all().delete()
    # 5. ActaEvaluacion → Proyecto (PROTECT); CASCADE a DetalleEvaluacion y PuntuacionCriterio
    ActaEvaluacion.objects.all().delete()
    # 6. Proyecto → OfertaEaCarrera (PROTECT); Django limpia M2M automáticamente
    Proyecto.objects.all().delete()
    # 7. Ahora podemos limpiar OfertaEaCarrera de forma segura
    OfertaEaCarrera.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('academico', '0003_carrera_eacarrera'),
        ('premiacion', '0007_asignacionpremio_comprobante_pago_imagen'),
        ('evaluaciones', '0002_actaevaluacion_estado_criterio_estado_and_more'),
        ('proyectos', '0002_proyecto_activo'),
    ]

    operations = [
        # Paso 1: limpiar datos dependientes
        migrations.RunPython(delete_dependent_data, migrations.RunPython.noop),

        # Paso 1.5: ejecutar triggers diferidos pendientes para que ALTER TABLE
        # no falle por "pending trigger events" en PostgreSQL
        migrations.RunSQL("SET CONSTRAINTS ALL IMMEDIATE;", migrations.RunSQL.noop),

        # Paso 2: quitar la restricción unique_together antigua
        migrations.AlterUniqueTogether(
            name='ofertaeacarrera',
            unique_together=set(),
        ),

        # Paso 3: eliminar las columnas antiguas
        migrations.RemoveField(
            model_name='ofertaeacarrera',
            name='entidad_academica',
        ),
        migrations.RemoveField(
            model_name='ofertaeacarrera',
            name='carrera',
        ),
        migrations.RemoveField(
            model_name='ofertaeacarrera',
            name='plan',
        ),

        # Paso 4: agregar la nueva FK (nullable temporalmente, tabla vacía)
        migrations.AddField(
            model_name='ofertaeacarrera',
            name='ea_carrera',
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='oferta_ea_carreras',
                to='academico.eacarrera',
            ),
        ),

        # Paso 5: hacer la FK NOT NULL (seguro porque la tabla está vacía)
        migrations.AlterField(
            model_name='ofertaeacarrera',
            name='ea_carrera',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name='oferta_ea_carreras',
                to='academico.eacarrera',
            ),
        ),

        # Paso 6: nueva restricción unique_together
        migrations.AlterUniqueTogether(
            name='ofertaeacarrera',
            unique_together={('oferta', 'ea_carrera')},
        ),
    ]
