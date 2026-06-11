import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.academico.models import Categoria, CategoriaEvento
from django.db.models import Count

print("Categorias actuales:")
for c in Categoria.objects.all():
    print(f"{c.id_categoria}: {c.nombre}")

print("\nCategoriaEvento counts per evento:")
eventos_with_multiple_cats = CategoriaEvento.objects.values('evento').annotate(count=Count('categoria')).filter(count__gt=1)
print(list(eventos_with_multiple_cats))
