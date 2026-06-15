import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.premiacion.models import (
    Certificado, AsignacionPremio, GanadorPremio, CandidatoPremio,
    Plantilla, PremioDescriptor, Descriptor, TipoDescriptor, Premio
)
from apps.evaluaciones.models import (
    PuntuacionCriterio, DetalleEvaluacion, ActaEvaluacion,
    Criterio, Seccion, PlanillaEvaluativa
)
from apps.proyectos.models import Proyecto
from apps.academico.models import OfertaEaCarrera, Oferta

def wipe_data():
    print("--- EMPEZANDO LIMPIEZA DE BASE DE DATOS ---")
    
    # 1. Premiacion
    print("Borrando Premiacion...")
    Certificado.objects.all().delete()
    AsignacionPremio.objects.all().delete()
    GanadorPremio.objects.all().delete()
    CandidatoPremio.objects.all().delete()
    Plantilla.objects.all().delete()
    PremioDescriptor.objects.all().delete()
    Descriptor.objects.all().delete()
    TipoDescriptor.objects.all().delete()
    Premio.objects.all().delete()

    # 2. Evaluaciones
    print("Borrando Evaluaciones...")
    PuntuacionCriterio.objects.all().delete()
    DetalleEvaluacion.objects.all().delete()
    ActaEvaluacion.objects.all().delete()
    Criterio.objects.all().delete()
    Seccion.objects.all().delete()
    PlanillaEvaluativa.objects.all().delete()

    # 3. Proyectos
    print("Borrando Proyectos...")
    Proyecto.objects.all().delete()

    # 4. Academico (Ofertas)
    print("Borrando Ofertas Academicas...")
    OfertaEaCarrera.objects.all().delete()
    Oferta.objects.all().delete()

    print("--- LIMPIEZA COMPLETADA ---")

if __name__ == '__main__':
    wipe_data()
