from django.db import migrations

PERMISOS = [
    ('usuarios.gestion',        'Gestión de Usuarios',        'usuarios'),
    ('usuarios.roles',          'Roles y Permisos',            'usuarios'),
    ('usuarios.perfiles',       'Perfiles',                    'usuarios'),
    ('academico.facultades',    'Catálogos Base',              'academico'),
    ('academico.areas',         'Estructuras y Relaciones',    'academico'),
    ('academico.ofertas',       'Ofertas Académicas',          'academico'),
    ('eventos.gestion',         'Gestión de Eventos',          'eventos'),
    ('eventos.cronograma',      'Cronograma y Actividades',    'eventos'),
    ('eventos.membretes',       'Membretes y Firmas',          'eventos'),
    ('proyectos.inscripcion',   'Inscripción de Proyectos',    'proyectos'),
    ('proyectos.revision',      'Revisión y Aprobación',       'proyectos'),
    ('evaluaciones.planillas',  'Planillas y Rúbricas',        'evaluaciones'),
    ('evaluaciones.actas',      'Actas de Evaluación',         'evaluaciones'),
    ('evaluaciones.calificar',  'Panel de Calificación',       'evaluaciones'),
    ('evaluaciones.resultados', 'Resultados y Notas',          'evaluaciones'),
    ('premiacion.cuadro_honor', 'Cuadro de Honor',             'premiacion'),
    ('premiacion.certificados', 'Emisión de Certificados',     'premiacion'),
]


def seed_permisos(apps, schema_editor):
    Permiso = apps.get_model('usuarios', 'Permiso')
    for code, nombre, modulo in PERMISOS:
        Permiso.objects.get_or_create(
            code=code,
            defaults={'nombre': nombre, 'modulo': modulo},
        )


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0010_permiso_code_permiso_modulo_usuario_rol'),
    ]

    operations = [
        migrations.RunPython(seed_permisos, noop),
    ]
