from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0008_personal'),
    ]

    operations = [
        migrations.AlterField(
            model_name='personal',
            name='cargo',
            field=models.CharField(
                choices=[
                    ('SECRETARIA', 'Secretaria'),
                    ('DECANO', 'Decano'),
                    ('VICEDECANO', 'Vicedecano'),
                    ('RECTOR', 'Rector'),
                    ('VICERECTOR', 'Vicerector'),
                ],
                max_length=10,
            ),
        ),
    ]
