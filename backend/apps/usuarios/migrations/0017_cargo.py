import django.db.models.deletion
from django.db import migrations, models

CARGOS_INICIALES = ['Secretaria', 'Decano', 'Vicedecano', 'Rector', 'Vicerector']


def seed_cargos(apps, schema_editor):
    Cargo = apps.get_model('usuarios', 'Cargo')
    for nombre in CARGOS_INICIALES:
        Cargo.objects.get_or_create(nombre=nombre)


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0016_usuario_failed_login_attempts_usuario_locked_until'),
    ]

    operations = [
        migrations.CreateModel(
            name='Cargo',
            fields=[
                ('id_cargo', models.AutoField(primary_key=True, serialize=False)),
                ('nombre', models.CharField(max_length=100, unique=True)),
                ('descripcion', models.CharField(blank=True, max_length=255)),
                ('estado', models.BooleanField(default=True)),
            ],
            options={
                'db_table': 'cargo',
            },
        ),
        migrations.RunPython(seed_cargos, noop),
    ]
