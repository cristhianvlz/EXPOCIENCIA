from django.db import migrations


def add_permiso_mis_proyectos(apps, schema_editor):
    Permiso = apps.get_model('usuarios', 'Permiso')
    Permiso.objects.get_or_create(
        code='proyectos.mis_proyectos',
        defaults={'nombre': 'Mis Proyectos', 'modulo': 'proyectos'},
    )


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0013_remove_participante_proyecto_remove_tutor_proyecto'),
    ]

    operations = [
        migrations.RunPython(add_permiso_mis_proyectos, noop),
    ]
