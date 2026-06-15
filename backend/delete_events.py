import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.eventos.models import Evento, Cronograma
from apps.academico.models import CategoriaEvento

def delete_other_events():
    # Encuentra los eventos a mantener
    keep_events = Evento.objects.filter(nombre__icontains='cient')
    keep_ids = list(keep_events.values_list('id_evento', flat=True))
    
    print(f"Eventos a mantener: {keep_ids} - {[e.nombre for e in keep_events]}")

    # Selecciona los eventos a eliminar
    events_to_delete = Evento.objects.exclude(id_evento__in=keep_ids)
    delete_ids = list(events_to_delete.values_list('id_evento', flat=True))
    
    print(f"Eventos a eliminar: {delete_ids} - {[e.nombre for e in events_to_delete]}")

    if delete_ids:
        # Eliminar relaciones protegidas de los eventos a borrar
        deleted_cronogramas = Cronograma.objects.filter(evento_id__in=delete_ids).delete()
        print(f"Cronogramas eliminados: {deleted_cronogramas}")

        deleted_categorias = CategoriaEvento.objects.filter(evento_id__in=delete_ids).delete()
        print(f"Categorias-Evento eliminadas: {deleted_categorias}")

        # Finalmente, eliminar los eventos
        deleted_events = events_to_delete.delete()
        print(f"Eventos eliminados: {deleted_events}")
    else:
        print("No hay eventos para eliminar.")

if __name__ == '__main__':
    delete_other_events()
