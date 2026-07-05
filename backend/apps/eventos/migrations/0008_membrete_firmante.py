import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0018_personal_cargo_fk_firma_img'),
        ('eventos', '0007_evento_membretes_m2m_limits'),
    ]

    operations = [
        migrations.DeleteModel(
            name='Firmante',
        ),
        migrations.CreateModel(
            name='MembreteFirmante',
            fields=[
                ('id_membrete_firmante', models.AutoField(primary_key=True, serialize=False)),
                ('orden', models.PositiveSmallIntegerField(default=1)),
                ('estado', models.BooleanField(default=True)),
                ('membrete', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='membrete_firmantes',
                    to='eventos.membrete',
                )),
                ('personal', models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='membretes_firmante',
                    to='usuarios.personal',
                )),
            ],
            options={
                'db_table': 'membrete_firmante',
                'ordering': ['orden'],
                'unique_together': {('membrete', 'personal')},
            },
        ),
    ]
