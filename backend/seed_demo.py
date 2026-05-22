import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.usuarios.models import Usuario, Tribunal, Rol, Permiso, RolesPermiso, RolesPermisoUsuario

def run():
    print("Iniciando la creación de usuarios demo...")
    
    # 1. Crear el rol Administrador y Tribunal si no existen
    rol_admin, _ = Rol.objects.get_or_create(nombre='Administrador')
    rol_tribunal, _ = Rol.objects.get_or_create(nombre='Tribunal')
    
    # 2. Crear superusuario admin
    if not Usuario.objects.filter(username='admin').exists():
        u_admin = Usuario.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='12345',
            rol=rol_admin
        )
        print("Superusuario 'admin' creado exitosamente con contraseña '12345'.")
    else:
        print("El superusuario 'admin' ya existe.")
        
    # 3. Crear usuario tribunal '12345'
    if not Usuario.objects.filter(username='12345').exists():
        u_trib = Usuario.objects.create_user(
            username='12345',
            email='tribunal@example.com',
            password='12345',
            rol=rol_tribunal
        )
        
        # Crear instancia de Tribunal vinculada
        trib = Tribunal.objects.create(
            usuario=u_trib,
            nombre='Juan',
            apellido='Pérez (Tribunal)',
            celular='77788899',
            ci='12345',
            expedicion='LP',
            direccion='Calacoto, Calle 15',
            especialidad='Ingeniería de Sistemas'
        )
        
        # Opcional: Asociar todos los permisos del módulo de evaluaciones a este rol o usuario
        permisos_eval = Permiso.objects.filter(modulo='evaluaciones')
        for perm in permisos_eval:
            rp, _ = RolesPermiso.objects.get_or_create(rol=rol_tribunal, permiso=perm)
            RolesPermisoUsuario.objects.get_or_create(usuario=u_trib, roles_permiso=rp)
            
        print("Usuario tribunal '12345' y su perfil creado exitosamente.")
    else:
        print("El usuario tribunal '12345' ya existe.")

if __name__ == '__main__':
    run()
