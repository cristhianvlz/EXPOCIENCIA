from django.db import models


class TipoDescriptor(models.Model):
    id_tipo_descriptor = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100, unique=True)
    estado = models.BooleanField(default=True)

    class Meta:
        db_table = 'tipo_descriptor'

    def __str__(self):
        return self.nombre


class Descriptor(models.Model):
    id_descriptor = models.AutoField(primary_key=True)
    tipo_descriptor = models.ForeignKey(
        TipoDescriptor,
        on_delete=models.PROTECT,
        related_name='descriptores',
    )
    descripcion = models.CharField(max_length=255)
    estado = models.BooleanField(default=True)

    class Meta:
        db_table = 'descriptor'

    def __str__(self):
        return f"{self.descripcion} [{self.tipo_descriptor.nombre}]"


class Premio(models.Model):
    id_premio = models.AutoField(primary_key=True)
    # referencias en cadena para evitar importaciones circulares
    evento = models.ForeignKey(
        'eventos.Evento',
        on_delete=models.PROTECT,
        related_name='premios',
    )
    area = models.ForeignKey(
        'academico.Area',
        on_delete=models.PROTECT,
        related_name='premios',
    )
    # M2M con tabla intermedia explícita (declarada abajo); string para evitar
    # referencia hacia adelante que Python no puede resolver en tiempo de clase
    descriptores = models.ManyToManyField(
        Descriptor,
        through='PremioDescriptor',
        related_name='premios',
    )
    monto = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    numero_ganadores = models.PositiveSmallIntegerField()
    estado = models.BooleanField(default=True)

    class Meta:
        db_table = 'premio'

    def __str__(self):
        monto_str = f"Bs. {self.monto}" if self.monto is not None else "Sin monto"
        return f"Premio — {self.area} | {self.evento} ({monto_str})"


class PremioDescriptor(models.Model):
    premio = models.ForeignKey(
        Premio,
        on_delete=models.CASCADE,
        related_name='premio_descriptores',
    )
    descriptor = models.ForeignKey(
        Descriptor,
        on_delete=models.PROTECT,
        related_name='premio_descriptores',
    )

    class Meta:
        db_table = 'premio_descriptor'
        unique_together = ('premio', 'descriptor')

    def __str__(self):
        return f"{self.premio} → {self.descriptor.descripcion}"


class CandidatoPremio(models.Model):

    ESTADO_CHOICES = [
        ('candidato', 'Candidato'),
        ('ganador', 'Ganador'),
        ('descartado', 'Descartado'),
    ]

    id_candidato_premio = models.AutoField(primary_key=True)
    premio = models.ForeignKey(
        Premio,
        on_delete=models.PROTECT,
        related_name='candidatos',
    )
    # referencias en cadena para evitar importaciones circulares
    proyecto = models.ForeignKey(
        'proyectos.Proyecto',
        on_delete=models.PROTECT,
        related_name='candidatos_premio',
    )
    acta_evaluacion = models.ForeignKey(
        'evaluaciones.ActaEvaluacion',
        on_delete=models.PROTECT,
        related_name='candidatos_premio',
    )
    nota = models.DecimalField(max_digits=8, decimal_places=2)
    observacion = models.TextField(blank=True)
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='candidato',
    )
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'candidato_premio'
        # un proyecto solo puede ser candidato una vez por premio
        unique_together = ('premio', 'proyecto')

    def __str__(self):
        return f"{self.proyecto} → {self.premio} ({self.get_estado_display()})"


class GanadorPremio(models.Model):
    id_ganador_premio = models.AutoField(primary_key=True)
    # PROTECT: no se puede eliminar un candidato que ya tiene registro de ganador
    candidato_premio = models.OneToOneField(
        CandidatoPremio,
        on_delete=models.PROTECT,
        related_name='ganador',
    )
    estado = models.BooleanField(default=True)

    class Meta:
        db_table = 'ganador_premio'

    def __str__(self):
        return f"Ganador: {self.candidato_premio.proyecto}"


class Plantilla(models.Model):
    ORIENTACION_CHOICES = [
        ('horizontal', 'Horizontal'),
        ('vertical', 'Vertical'),
    ]

    id_plantilla = models.AutoField(primary_key=True)
    descripcion = models.CharField(max_length=255)
    contenido = models.TextField()
    orientacion = models.CharField(
        max_length=20,
        choices=ORIENTACION_CHOICES,
        default='horizontal',
    )
    estado = models.BooleanField(default=True)

    class Meta:
        db_table = 'plantilla'

    def __str__(self):
        return self.descripcion


class Certificado(models.Model):
    id_certificado = models.AutoField(primary_key=True)
    ganador_premio = models.ForeignKey(
        GanadorPremio,
        on_delete=models.PROTECT,
        related_name='certificados',
    )
    plantilla = models.ForeignKey(
        Plantilla,
        on_delete=models.PROTECT,
        related_name='certificados',
    )
    fecha_emision = models.DateTimeField(auto_now_add=True)
    estado = models.BooleanField(default=True)

    class Meta:
        db_table = 'certificado'

    def __str__(self):
        return (
            f"Certificado #{self.id_certificado}"
            f" — {self.ganador_premio}"
            f" | {self.fecha_emision:%d/%m/%Y %H:%M}"
        )


class AsignacionPremio(models.Model):
    id_asignacion_premio = models.AutoField(primary_key=True)
    ganador_premio = models.ForeignKey(
        GanadorPremio,
        on_delete=models.PROTECT,
        related_name='asignaciones',
    )
    participante = models.ForeignKey(
        'usuarios.Participante',
        on_delete=models.PROTECT,
        related_name='asignaciones_premio',
    )
    METODO_PAGO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('qr', 'QR'),
        ('efectivo', 'Efectivo'),
    ]
    ESTADO_PAGO_CHOICES = [
        ('sin_configurar', 'Sin Configurar'),
        ('configurado', 'Configurado'),
        ('pagado', 'Pagado'),
    ]

    monto_asignado = models.DecimalField(max_digits=10, decimal_places=2)
    porcentaje = models.DecimalField(max_digits=5, decimal_places=2)
    observacion = models.TextField(blank=True)
    impresa = models.BooleanField(default=False)
    estado = models.BooleanField(default=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)

    # ── Gestión de pago ──────────────────────────────────────────────────────────
    metodo_pago = models.CharField(max_length=20, choices=METODO_PAGO_CHOICES, default='pendiente')
    qr_imagen = models.TextField(blank=True, default='')
    estado_pago = models.CharField(max_length=20, choices=ESTADO_PAGO_CHOICES, default='sin_configurar')
    fecha_pago = models.DateTimeField(null=True, blank=True)
    comprobante_pago_imagen = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'asignacion_premio'
        unique_together = ('ganador_premio', 'participante')

    def __str__(self):
        return f"{self.participante} → {self.ganador_premio} (Bs. {self.monto_asignado})"
