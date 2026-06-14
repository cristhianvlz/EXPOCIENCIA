from django.core.management.base import BaseCommand
from apps.usuarios.models import Usuario, Rol, Permiso, RolesPermiso, RolesPermisoUsuario

class Command(BaseCommand):
    help = 'Inicializa la base de datos de producción con roles base y un usuario administrador.'

    def handle(self, *args, **options):
        username = 'admin'
        password = 'admin123'
        email = 'admin@admin.com'

        self.stdout.write(self.style.NOTICE("=== Iniciando configuración de producción ==="))

        # 1. Crear Roles Base
        roles_base = ['Administrador', 'Participante', 'Tutor', 'Tribunal']
        roles_creados = {}
        for nombre_rol in roles_base:
            rol, created = Rol.objects.get_or_create(nombre=nombre_rol)
            roles_creados[nombre_rol] = rol
            if created:
                self.stdout.write(self.style.SUCCESS(f"  [+] Rol creado: {nombre_rol}"))
            else:
                self.stdout.write(self.style.WARNING(f"  [*] Rol ya existía: {nombre_rol}"))

        rol_admin = roles_creados['Administrador']

        # 2. Asignar todos los permisos al rol Administrador
        permisos = Permiso.objects.all()
        if not permisos.exists():
            self.stdout.write(self.style.ERROR("  [!] No se encontraron permisos en la BD. Por favor, asegúrate de correr las migraciones primero."))
            return

        permisos_asignados = 0
        for perm in permisos:
            rp, created = RolesPermiso.objects.get_or_create(rol=rol_admin, permiso=perm)
            if created:
                permisos_asignados += 1
        
        if permisos_asignados > 0:
            self.stdout.write(self.style.SUCCESS(f"  [+] Se asignaron {permisos_asignados} permisos al rol Administrador."))

        # 3. Crear el superusuario y asignarle el rol
        if not Usuario.objects.filter(username=username).exists():
            u_admin = Usuario.objects.create_superuser(
                username=username,
                email=email,
                password=password,
                rol=rol_admin
            )
            
            # Asignar los permisos directamente al usuario (por el modelo RolesPermisoUsuario)
            for rp in RolesPermiso.objects.filter(rol=rol_admin):
                RolesPermisoUsuario.objects.get_or_create(usuario=u_admin, roles_permiso=rp)
                
            self.stdout.write(self.style.SUCCESS(f"\n[OK] ¡Superusuario '{username}' creado exitosamente!"))
            self.stdout.write(self.style.SUCCESS(f"[OK] Contraseña: {password} (RECUERDA CAMBIARLA AL INICIAR SESIÓN)"))
        else:
            self.stdout.write(self.style.WARNING(f"\n[!] El usuario '{username}' ya existe en el sistema. No se creó de nuevo."))

        self.stdout.write(self.style.NOTICE("=== Configuración de producción finalizada ==="))
