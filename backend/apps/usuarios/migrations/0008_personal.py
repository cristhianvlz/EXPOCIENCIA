from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0007_alter_usuario_totp_secret'),
    ]

    operations = [
        migrations.CreateModel(
            name='Personal',
            fields=[
                ('id_personal', models.AutoField(primary_key=True, serialize=False)),
                ('nombre', models.CharField(max_length=100)),
                ('apellido', models.CharField(max_length=100)),
                ('ci', models.CharField(max_length=20, unique=True)),
                ('expedicion', models.CharField(
                    choices=[
                        ('LP', 'La Paz'),
                        ('CB', 'Cochabamba'),
                        ('SC', 'Santa Cruz'),
                        ('OR', 'Oruro'),
                        ('PT', 'Potosí'),
                        ('CH', 'Chuquisaca'),
                        ('TJ', 'Tarija'),
                        ('BN', 'Beni'),
                        ('PD', 'Pando'),
                    ],
                    max_length=2,
                )),
                ('cargo', models.CharField(max_length=150)),
                ('direccion', models.CharField(max_length=255)),
                ('celular', models.CharField(max_length=20)),
                ('estado', models.BooleanField(default=True)),
                ('usuario', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='personal',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'db_table': 'personal',
            },
        ),
    ]
