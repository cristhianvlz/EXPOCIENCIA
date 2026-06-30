from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class TipoEvento(models.Model):
    id_tipo_evento = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100, unique=True)
    estado = models.BooleanField(default=True)

    class Meta:
        db_table = 'tipo_evento'

    def __str__(self):
        return self.nombre


class NivelEvento(models.Model):
    id_nivel_evento = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100, unique=True)
    estado = models.BooleanField(default=True)

    class Meta:
        db_table = 'nivel_evento'

    def __str__(self):
        return self.nombre


class Membrete(models.Model):
    id_membrete = models.AutoField(primary_key=True)
    titulo = models.CharField(max_length=255)
    subtitulo = models.CharField(max_length=255, blank=True)
    logo_unidad = models.ImageField(upload_to='membretes/', null=True, blank=True)
    logo_institucion = models.ImageField(upload_to='membretes/', null=True, blank=True)
    firma = models.ImageField(upload_to='membretes/', null=True, blank=True)
    sello_autoridad = models.ImageField(upload_to='membretes/', null=True, blank=True)
    direccion = models.CharField(max_length=255, blank=True)
    pie_pagina1 = models.CharField(max_length=255, blank=True)
    pie_pagina2 = models.CharField(max_length=255, blank=True)
    pie_pagina3 = models.CharField(max_length=255, blank=True)
    estado = models.BooleanField(default=True)

    class Meta:
        db_table = 'membrete'

    def __str__(self):
        return self.titulo


class Firmante(models.Model):
    id_firmante = models.AutoField(primary_key=True)
    membrete = models.ForeignKey(
        Membrete,
        on_delete=models.CASCADE,
        related_name='firmantes',
    )
    nombre = models.CharField(max_length=255)
    cargo = models.CharField(max_length=255)
    firma_imagen = models.ImageField(upload_to='firmantes/', null=True, blank=True)
    orden = models.PositiveSmallIntegerField(default=1)
    estado = models.BooleanField(default=True)

    class Meta:
        db_table = 'firmante'
        ordering = ['orden']

    def __str__(self):
        return f"{self.nombre} — {self.cargo}"


class Evento(models.Model):
    id_evento = models.AutoField(primary_key=True)
    tipo_evento = models.ForeignKey(
        TipoEvento,
        on_delete=models.PROTECT,
        related_name='eventos',
    )
    nivel_evento = models.ForeignKey(
        NivelEvento,
        on_delete=models.PROTECT,
        related_name='eventos',
    )
    membretes = models.ManyToManyField(
        Membrete,
        related_name='eventos',
        blank=True,
    )
    nombre = models.CharField(max_length=200)
    # versión numérica de la edición del evento (ej. 1, 2, 3...)
    version = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1)],
    )
    # año de gestión (ej. 2024, 2025)
    gestion = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(2000), MaxValueValidator(2100)],
    )
    max_participantes = models.PositiveSmallIntegerField(default=0)
    max_tribunal = models.PositiveSmallIntegerField(default=0)
    max_tutores = models.PositiveSmallIntegerField(default=0)
    estado = models.BooleanField(default=True)

    class Meta:
        db_table = 'evento'
        # un evento es único por nombre, versión y gestión
        unique_together = ('nombre', 'version', 'gestion')

    def __str__(self):
        return f"{self.nombre} v{self.version} — {self.gestion}"


class Grupo(models.Model):
    id_grupo = models.AutoField(primary_key=True)
    descripcion = models.CharField(max_length=255)
    estado = models.BooleanField(default=True)

    class Meta:
        db_table = 'grupo'

    def __str__(self):
        return self.descripcion


class Actividad(models.Model):
    id_actividad = models.AutoField(primary_key=True)
    grupo = models.ForeignKey(
        Grupo,
        on_delete=models.PROTECT,
        related_name='actividades',
    )
    nombre_actividad = models.CharField(max_length=200)
    estado = models.BooleanField(default=True)

    class Meta:
        db_table = 'actividad'

    def __str__(self):
        return f"{self.nombre_actividad} [{self.grupo}]"


class Cronograma(models.Model):
    id_cronograma = models.AutoField(primary_key=True)
    evento = models.ForeignKey(
        Evento,
        on_delete=models.PROTECT,
        related_name='cronogramas',
    )
    actividad = models.ForeignKey(
        Actividad,
        on_delete=models.PROTECT,
        related_name='cronogramas',
    )
    fecha_inicio = models.DateTimeField()
    fecha_fin = models.DateTimeField()
    estado = models.BooleanField(default=True)

    class Meta:
        db_table = 'cronograma'
        # una actividad no puede estar programada dos veces en el mismo evento
        unique_together = ('evento', 'actividad')

    def __str__(self):
        return (
            f"{self.actividad.nombre_actividad} @ {self.evento.nombre}"
            f" ({self.fecha_inicio:%d/%m/%Y %H:%M} → {self.fecha_fin:%d/%m/%Y %H:%M})"
        )
