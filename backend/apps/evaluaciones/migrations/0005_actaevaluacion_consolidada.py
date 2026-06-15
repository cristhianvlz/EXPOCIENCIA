from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('evaluaciones', '0004_actaevaluacion_observacion'),
    ]

    operations = [
        migrations.AddField(
            model_name='actaevaluacion',
            name='consolidada',
            field=models.BooleanField(default=False),
        ),
    ]
