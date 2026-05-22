import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0009_alter_personal_cargo'),
    ]

    operations = [
        migrations.AddField(
            model_name='permiso',
            name='code',
            field=models.CharField(default='', max_length=100, unique=True),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='permiso',
            name='modulo',
            field=models.CharField(default='', max_length=50),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='permiso',
            name='nombre',
            field=models.CharField(max_length=150),
        ),
        migrations.AddField(
            model_name='usuario',
            name='rol',
            field=models.ForeignKey(
                blank=True,
                db_column='id_rol_fk',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='usuarios',
                to='usuarios.rol',
            ),
        ),
    ]
