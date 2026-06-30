from django.db import models


class EntidadAcademica(models.Model):
    id_entidad_academica = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=200, unique=True)
    estado = models.BooleanField(default=True)

    class Meta:
        db_table = 'entidad_academica'

    def __str__(self):
        return self.nombre


class Carrera(models.Model):
    id_carrera = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=200)
    plan = models.CharField(max_length=100, blank=True)
    codigo = models.CharField(max_length=50, blank=True)
    estado = models.BooleanField(default=True)

    class Meta:
        db_table = 'carrera'

    def __str__(self):
        return f"{self.codigo} - {self.nombre}" if self.codigo else self.nombre


class EaCarrera(models.Model):
    entidad_academica = models.ForeignKey(
        EntidadAcademica,
        on_delete=models.PROTECT,
        related_name='ea_carreras',
    )
    carrera = models.ForeignKey(
        Carrera,
        on_delete=models.PROTECT,
        related_name='ea_carreras',
    )

    class Meta:
        db_table = 'ea_carrera'
        unique_together = ('entidad_academica', 'carrera')

    def __str__(self):
        return f"{self.entidad_academica.nombre} — {self.carrera.nombre}"


class Categoria(models.Model):
    id_categoria = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=150, unique=True)
    estado = models.BooleanField(default=True)

    class Meta:
        db_table = 'categoria'

    def __str__(self):
        return self.nombre


class Area(models.Model):
    id_area = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=150, unique=True)
    estado = models.BooleanField(default=True)

    class Meta:
        db_table = 'area'

    def __str__(self):
        return self.nombre


class Modalidad(models.Model):
    id_modalidad = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=150, unique=True)
    estado = models.BooleanField(default=True)

    class Meta:
        db_table = 'modalidad'

    def __str__(self):
        return self.nombre


class ModalidadArea(models.Model):
    modalidad = models.ForeignKey(
        Modalidad,
        on_delete=models.PROTECT,
        related_name='modalidad_areas',
    )
    area = models.ForeignKey(
        Area,
        on_delete=models.PROTECT,
        related_name='modalidad_areas',
    )

    class Meta:
        db_table = 'modalidad_area'
        unique_together = ('modalidad', 'area')

    def __str__(self):
        return f"{self.modalidad.nombre} — {self.area.nombre}"


class CategoriaEvento(models.Model):
    categoria = models.ForeignKey(
        Categoria,
        on_delete=models.PROTECT,
        related_name='categoria_eventos',
    )
    # referencia en cadena para evitar importación circular con la app eventos
    evento = models.ForeignKey(
        'eventos.Evento',
        on_delete=models.PROTECT,
        related_name='categoria_eventos',
    )

    class Meta:
        db_table = 'categoria_evento'
        unique_together = ('categoria', 'evento')

    def __str__(self):
        return f"{self.categoria.nombre} @ {self.evento}"


class Oferta(models.Model):
    id_oferta = models.AutoField(primary_key=True)
    categoria_evento = models.ForeignKey(
        CategoriaEvento,
        on_delete=models.PROTECT,
        related_name='ofertas',
    )
    modalidad_area = models.ForeignKey(
        ModalidadArea,
        on_delete=models.PROTECT,
        related_name='ofertas',
    )
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True)
    estado = models.BooleanField(default=True)

    class Meta:
        db_table = 'oferta'

    def __str__(self):
        return f"{self.nombre} [{self.modalidad_area}]"


class OfertaEaCarrera(models.Model):
    oferta = models.ForeignKey(
        Oferta,
        on_delete=models.CASCADE,
        related_name='oferta_ea_carreras',
    )
    ea_carrera = models.ForeignKey(
        EaCarrera,
        on_delete=models.PROTECT,
        related_name='oferta_ea_carreras',
    )
    estado = models.BooleanField(default=True)

    class Meta:
        db_table = 'oferta_ea_carrera'
        unique_together = ('oferta', 'ea_carrera')

    def __str__(self):
        return f"{self.oferta.nombre} — {self.ea_carrera}"
