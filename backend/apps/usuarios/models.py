from django.contrib.auth.models import AbstractUser
from django.db import models


EXPEDICION_CHOICES = [
    ('LP', 'La Paz'),
    ('CB', 'Cochabamba'),
    ('SC', 'Santa Cruz'),
    ('OR', 'Oruro'),
    ('PT', 'Potosí'),
    ('CH', 'Chuquisaca'),
    ('TJ', 'Tarija'),
    ('BN', 'Beni'),
    ('PD', 'Pando'),
]

class Cargo(models.Model):
    id_cargo = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.CharField(max_length=255, blank=True)
    estado = models.BooleanField(default=True)

    class Meta:
        db_table = 'cargo'

    def __str__(self):
        return self.nombre


class Rol(models.Model):
    id_rol = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = 'roles'

    def __str__(self):
        return self.nombre


class Permiso(models.Model):
    id_permiso = models.AutoField(primary_key=True)
    code = models.CharField(max_length=100, unique=True)
    nombre = models.CharField(max_length=150)
    modulo = models.CharField(max_length=50)

    class Meta:
        db_table = 'permiso'

    def __str__(self):
        return f"{self.code} — {self.nombre}"


class RolesPermiso(models.Model):
    rol = models.ForeignKey(Rol, on_delete=models.CASCADE, related_name='roles_permisos')
    permiso = models.ForeignKey(Permiso, on_delete=models.CASCADE, related_name='roles_permisos')

    class Meta:
        db_table = 'roles_permiso'
        unique_together = ('rol', 'permiso')

    def __str__(self):
        return f"{self.rol.nombre} → {self.permiso.nombre}"


class Usuario(AbstractUser):
    """
    Modelo central de autenticación. AbstractUser aporta:
      - username  → equivale a user_name del diseño
      - email     → campo email del diseño
      - password  → campo password del diseño (hasheado)
      - is_active → expuesto como propiedad 'estado'
    """
    id_usuario = models.AutoField(primary_key=True)

    # Campos heredados de AbstractUser que no usamos en este perfil
    first_name = None  # type: ignore[assignment]
    last_name = None   # type: ignore[assignment]

    # Campos para autenticación de dos factores (TOTP)
    totp_secret = models.CharField(max_length=64, blank=True, null=True)
    is_2fa_enabled = models.BooleanField(default=False)

    # Bloqueo por intentos fallidos
    failed_login_attempts = models.IntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)

    rol = models.ForeignKey(
        Rol,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='usuarios',
        db_column='id_rol_fk',
    )

    class Meta:
        db_table = 'usuario'

    @property
    def estado(self) -> bool:
        return self.is_active

    @estado.setter
    def estado(self, value: bool) -> None:
        self.is_active = value

    def __str__(self):
        return f"{self.username} — {self.email}"


class RolesPermisoUsuario(models.Model):
    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        related_name='roles_permisos_usuario',
    )
    roles_permiso = models.ForeignKey(
        RolesPermiso,
        on_delete=models.CASCADE,
        related_name='usuarios',
    )

    class Meta:
        db_table = 'roles_permiso_usuario'
        unique_together = ('usuario', 'roles_permiso')

    def __str__(self):
        return f"{self.usuario.username} → {self.roles_permiso}"


class Participante(models.Model):
    id_participante = models.AutoField(primary_key=True)
    usuario = models.OneToOneField(
        Usuario,
        on_delete=models.CASCADE,
        related_name='participante',
    )
    # proyecto = models.ForeignKey(
    #     'proyectos.Proyecto',
    #     on_delete=models.PROTECT,
    #     related_name='participantes',
    #     null=True,
    #     blank=True,
    # )
    tutor = models.ForeignKey(
        'Tutor',
        on_delete=models.SET_NULL,
        related_name='participantes',
        null=True,
        blank=True,
    )
    codigo_especifico = models.CharField(max_length=50, unique=True)
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    celular = models.CharField(max_length=20)
    ci = models.CharField(max_length=20, unique=True)
    expedicion = models.CharField(max_length=2, choices=EXPEDICION_CHOICES)
    estado = models.BooleanField(default=True)

    class Meta:
        db_table = 'participante'

    def __str__(self):
        return f"{self.nombre} {self.apellido} (CI: {self.ci})"


class Tutor(models.Model):
    id_tutor = models.AutoField(primary_key=True)
    usuario = models.OneToOneField(
        Usuario,
        on_delete=models.CASCADE,
        related_name='tutor',
    )
    # proyecto = models.ForeignKey(
    #     'proyectos.Proyecto',
    #     on_delete=models.PROTECT,
    #     related_name='tutores',
    #     null=True,
    #     blank=True,
    # )
    cod_empleado = models.CharField(max_length=50, unique=True)
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    celular = models.CharField(max_length=20)
    direccion = models.CharField(max_length=255)
    ci = models.CharField(max_length=20, unique=True)
    expedicion = models.CharField(max_length=2, choices=EXPEDICION_CHOICES)
    estado = models.BooleanField(default=True)

    class Meta:
        db_table = 'tutor'

    def __str__(self):
        return f"{self.nombre} {self.apellido} (Cod: {self.cod_empleado})"


class Tribunal(models.Model):
    id_tribunal = models.AutoField(primary_key=True)
    usuario = models.OneToOneField(
        Usuario,
        on_delete=models.CASCADE,
        related_name='tribunal',
    )
    especialidad = models.CharField(max_length=150)
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    celular = models.CharField(max_length=20)
    ci = models.CharField(max_length=20, unique=True)
    expedicion = models.CharField(max_length=2, choices=EXPEDICION_CHOICES)
    direccion = models.CharField(max_length=255)
    estado = models.BooleanField(default=True)
    fcm_token = models.TextField(blank=True, null=True)
    
    areas = models.ManyToManyField(
        'academico.Area',
        related_name='tribunales',
        blank=True
    )

    class Meta:
        db_table = 'tribunal'

    def __str__(self):
        return f"{self.nombre} {self.apellido} — {self.especialidad}"


class TribunalExt(models.Model):
    id_tribunal_ext = models.AutoField(primary_key=True)
    tribunal = models.OneToOneField(
        Tribunal,
        on_delete=models.CASCADE,
        related_name='tribunal_ext',
    )
    institucion = models.CharField(max_length=200)
    estado = models.BooleanField(default=True)

    class Meta:
        db_table = 'tribunal_ext'

    def __str__(self):
        return f"{self.tribunal} — {self.institucion}"


class Personal(models.Model):
    id_personal = models.AutoField(primary_key=True)
    usuario = models.OneToOneField(
        Usuario,
        on_delete=models.CASCADE,
        related_name='personal',
    )
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    ci = models.CharField(max_length=20, unique=True)
    expedicion = models.CharField(max_length=2, choices=EXPEDICION_CHOICES)
    cargo = models.ForeignKey(
        Cargo,
        on_delete=models.PROTECT,
        related_name='personal',
    )
    direccion = models.CharField(max_length=255)
    celular = models.CharField(max_length=20)
    firma_img = models.ImageField(upload_to='personal/', null=True, blank=True)
    estado = models.BooleanField(default=True)

    class Meta:
        db_table = 'personal'

    def __str__(self):
        return f"{self.nombre} {self.apellido} — {self.cargo}"
