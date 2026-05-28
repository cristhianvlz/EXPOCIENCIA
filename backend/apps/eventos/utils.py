from django.utils import timezone
from apps.eventos.models import Cronograma


def get_cronograma_activo(evento, nombre_parcial):
    """
    Devuelve el primer Cronograma activo cuya actividad contenga
    nombre_parcial (case-insensitive) y cuya ventana de fechas incluya
    el momento actual. Retorna None si no existe ninguno.
    """
    now = timezone.now()
    return Cronograma.objects.filter(
        evento=evento,
        actividad__nombre_actividad__icontains=nombre_parcial,
        estado=True,
        fecha_inicio__lte=now,
        fecha_fin__gte=now,
    ).first()
