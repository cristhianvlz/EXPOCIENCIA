import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('academico', '0002_entidadacademica_estado_oferta_estado'),
    ]

    operations = [
        migrations.CreateModel(
            name='Carrera',
            fields=[
                ('id_carrera', models.AutoField(primary_key=True, serialize=False)),
                ('nombre', models.CharField(max_length=200)),
                ('plan', models.CharField(blank=True, max_length=100)),
                ('codigo', models.CharField(blank=True, max_length=50)),
                ('estado', models.BooleanField(default=True)),
            ],
            options={
                'db_table': 'carrera',
            },
        ),
        migrations.CreateModel(
            name='EaCarrera',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('entidad_academica', models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='ea_carreras',
                    to='academico.entidadacademica',
                )),
                ('carrera', models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='ea_carreras',
                    to='academico.carrera',
                )),
            ],
            options={
                'db_table': 'ea_carrera',
                'unique_together': {('entidad_academica', 'carrera')},
            },
        ),
    ]
