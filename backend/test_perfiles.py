import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.usuarios.models import Usuario, Participante, Tutor, Tribunal, Personal
from django.db import transaction

def run_tests():
    try:
        with transaction.atomic():
            # 1. Crear Usuarios base
            u_participante = Usuario.objects.create_user(username='part_test', email='part@test.com', password='pwd')
            u_tutor = Usuario.objects.create_user(username='tutor_test', email='tutor@test.com', password='pwd')
            u_tribunal = Usuario.objects.create_user(username='trib_test', email='trib@test.com', password='pwd')
            u_personal = Usuario.objects.create_user(username='pers_test', email='pers@test.com', password='pwd')
            
            # 2. Crear perfiles vinculados
            tutor = Tutor.objects.create(
                usuario=u_tutor,
                cod_empleado='TUT-001',
                nombre='Juan',
                apellido='Perez',
                celular='77711122',
                direccion='Av. Siempre Viva 123',
                ci='1234567',
                expedicion='SC'
            )
            print(f"> Tutor creado: {tutor}")

            participante = Participante.objects.create(
                usuario=u_participante,
                codigo_especifico='PART-001',
                nombre='Maria',
                apellido='Gomez',
                celular='77733344',
                ci='9876543',
                expedicion='LP',
                tutor=tutor # Vinculamos con el tutor creado
            )
            print(f"> Participante creado: {participante}")

            tribunal = Tribunal.objects.create(
                usuario=u_tribunal,
                especialidad='Ingeniería de Software',
                nombre='Roberto',
                apellido='Sánchez',
                celular='77755566',
                ci='4561237',
                expedicion='CB',
                direccion='Calle Falsa 456'
            )
            print(f"> Tribunal creado: {tribunal}")

            personal = Personal.objects.create(
                usuario=u_personal,
                nombre='Ana',
                apellido='López',
                ci='3216549',
                expedicion='TJ',
                cargo='SECRETARIA',
                direccion='Av. Central 789',
                celular='77799900'
            )
            print(f"> Personal creado: {personal}")
            
            print("\n--- PRUEBA EXITOSA ---")
            print("Se han creado correctamente las instancias de todos los perfiles vinculados a la tabla Usuario.")

    except Exception as e:
        print(f"ERROR durante la prueba: {str(e)}")

if __name__ == '__main__':
    run_tests()
