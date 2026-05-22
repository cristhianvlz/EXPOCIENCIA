from django.db import models


class Proyecto(models.Model):

    ESTADO_CHOICES = [
        ('inscrito', 'Inscrito'),
        ('revision', 'Revisión'),
        ('aprobado', 'Aprobado'),
        ('rechazado', 'Rechazado'),
    ]

    id_proyecto = models.AutoField(primary_key=True)
    # referencia en cadena para evitar importación circular con la app academico
    oferta_ea_carrera = models.ForeignKey(
        'academico.OfertaEaCarrera',
        on_delete=models.PROTECT,
        related_name='proyectos',
    )
    titulo = models.CharField(max_length=300)
    resumen = models.TextField(blank=True)
    fecha_inscripcion = models.DateTimeField(auto_now_add=True)
    observacion = models.TextField(blank=True)
    archivo = models.FileField(
        upload_to='proyectos/documentos/',
        null=True,
        blank=True,
    )
    estado = models.CharField(
        max_length=50,
        choices=ESTADO_CHOICES,
        default='inscrito',
    )
    fecha_confirmacion = models.DateTimeField(null=True, blank=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'proyecto'

    def __str__(self):
        return self.titulo
