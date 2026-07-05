import django.db.models.deletion
from django.db import migrations, models

CARGO_LABELS = {
    'SECRETARIA': 'Secretaria',
    'DECANO': 'Decano',
    'VICEDECANO': 'Vicedecano',
    'RECTOR': 'Rector',
    'VICERECTOR': 'Vicerector',
}


def migrar_cargo(apps, schema_editor):
    Personal = apps.get_model('usuarios', 'Personal')
    Cargo = apps.get_model('usuarios', 'Cargo')
    for personal in Personal.objects.all():
        nombre_cargo = CARGO_LABELS.get(personal.cargo, personal.cargo)
        cargo, _ = Cargo.objects.get_or_create(nombre=nombre_cargo)
        personal.cargo_nuevo = cargo
        personal.save(update_fields=['cargo_nuevo'])


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0017_cargo'),
    ]

    operations = [
        migrations.AddField(
            model_name='personal',
            name='firma_img',
            field=models.ImageField(blank=True, null=True, upload_to='personal/'),
        ),
        migrations.AddField(
            model_name='personal',
            name='cargo_nuevo',
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='personal',
                to='usuarios.cargo',
            ),
        ),
        migrations.RunPython(migrar_cargo, noop),
        migrations.RemoveField(
            model_name='personal',
            name='cargo',
        ),
        migrations.RenameField(
            model_name='personal',
            old_name='cargo_nuevo',
            new_name='cargo',
        ),
        migrations.AlterField(
            model_name='personal',
            name='cargo',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name='personal',
                to='usuarios.cargo',
            ),
        ),
    ]
