from django.db import models


class PlanillaEvaluativa(models.Model):
    id_planilla_evaluativa = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=200)
    nota_maxima = models.DecimalField(max_digits=5, decimal_places=2)
    estado = models.BooleanField(default=True)

    class Meta:
        db_table = 'planilla_evaluativa'

    def __str__(self):
        return f"{self.nombre} (máx. {self.nota_maxima})"


class Seccion(models.Model):
    id_seccion = models.AutoField(primary_key=True)
    planilla_evaluativa = models.ForeignKey(
        PlanillaEvaluativa,
        on_delete=models.PROTECT,
        related_name='secciones',
    )
    nombre = models.CharField(max_length=200)
    ponderacion = models.DecimalField(max_digits=5, decimal_places=2)
    estado = models.BooleanField(default=True)

    class Meta:
        db_table = 'seccion'

    def __str__(self):
        return f"{self.nombre} ({self.ponderacion}%) — {self.planilla_evaluativa.nombre}"


class Criterio(models.Model):
    id_criterio = models.AutoField(primary_key=True)
    seccion = models.ForeignKey(
        Seccion,
        on_delete=models.PROTECT,
        related_name='criterios',
    )
    nombre = models.CharField(max_length=200)
    puntaje = models.DecimalField(max_digits=5, decimal_places=2)
    estado = models.BooleanField(default=True)

    class Meta:
        db_table = 'criterio'

    def __str__(self):
        return f"{self.nombre} (pts. {self.puntaje}) — {self.seccion.nombre}"


class ActaEvaluacion(models.Model):
    id_acta_evaluacion = models.AutoField(primary_key=True)
    planilla_evaluativa = models.ForeignKey(
        PlanillaEvaluativa,
        on_delete=models.PROTECT,
        related_name='actas_evaluacion',
    )
    # referencia en cadena para evitar importación circular con la app proyectos
    proyecto = models.ForeignKey(
        'proyectos.Proyecto',
        on_delete=models.PROTECT,
        related_name='actas_evaluacion',
    )
    nota_final = models.DecimalField(max_digits=5, decimal_places=2)
    observacion = models.TextField(blank=True, null=True)
    fecha = models.DateField()
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    estado = models.BooleanField(default=True)
    # Cuando True, la nota ya fue consolidada: nadie puede modificar calificaciones
    # salvo jurados con permiso_calificacion_tardia activo.
    consolidada = models.BooleanField(default=False)
    desempate_prioridad = models.PositiveSmallIntegerField(null=True, blank=True)

    class Meta:
        db_table = 'acta_evaluacion'
        # un proyecto se evalúa una sola vez por planilla
        unique_together = ('proyecto', 'planilla_evaluativa')

    def __str__(self):
        return (
            f"Acta #{self.id_acta_evaluacion} — {self.proyecto}"
            f" | {self.fecha} {self.hora_inicio}–{self.hora_fin}"
        )


class DetalleEvaluacion(models.Model):
    acta_evaluacion = models.ForeignKey(
        ActaEvaluacion,
        on_delete=models.CASCADE,
        related_name='detalles_evaluacion',
    )
    # referencia en cadena para evitar importación circular con la app usuarios
    tribunal = models.ForeignKey(
        'usuarios.Tribunal',
        on_delete=models.PROTECT,
        related_name='detalles_evaluacion',
    )
    puntuacion = models.DecimalField(max_digits=5, decimal_places=2)
    permiso_calificacion_tardia = models.BooleanField(default=False)
    estado = models.BooleanField(default=True)

    class Meta:
        db_table = 'detalle_evaluacion'
        # un jurado solo puede evaluar una vez por acta
        unique_together = ('acta_evaluacion', 'tribunal')

    def __str__(self):
        return (
            f"Jurado: {self.tribunal} | Acta #{self.acta_evaluacion_id}"
            f" | Puntuación: {self.puntuacion}"
        )


class PuntuacionCriterio(models.Model):
    detalle_evaluacion = models.ForeignKey(
        DetalleEvaluacion,
        on_delete=models.CASCADE,
        related_name='puntuaciones_criterio',
    )
    criterio = models.ForeignKey(
        Criterio,
        on_delete=models.PROTECT,
        related_name='puntuaciones_criterio',
    )
    puntuacion_criterio = models.DecimalField(max_digits=5, decimal_places=2)
    estado = models.BooleanField(default=True)

    class Meta:
        db_table = 'puntuacion_criterio'
        # un jurado solo puede puntuar una vez por criterio dentro del mismo detalle
        unique_together = ('detalle_evaluacion', 'criterio')

    def __str__(self):
        return (
            f"Criterio: {self.criterio.nombre}"
            f" | Pts: {self.puntuacion_criterio}"
            f" | {self.detalle_evaluacion}"
        )
