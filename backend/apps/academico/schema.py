import graphene
from graphene_django import DjangoObjectType

from apps.academico.models import (
    EntidadAcademica, Categoria, Area, Modalidad,
    ModalidadArea, CategoriaEvento, Oferta, OfertaEaCarrera,
    Carrera, EaCarrera,
)
from apps.eventos.models import Evento


class EntidadAcademicaType(DjangoObjectType):
    class Meta:
        model = EntidadAcademica
        fields = '__all__'


class CategoriaType(DjangoObjectType):
    class Meta:
        model = Categoria
        fields = '__all__'


class AreaType(DjangoObjectType):
    class Meta:
        model = Area
        fields = '__all__'


class ModalidadType(DjangoObjectType):
    class Meta:
        model = Modalidad
        fields = '__all__'


class ModalidadAreaType(DjangoObjectType):
    class Meta:
        model = ModalidadArea
        fields = '__all__'


class CategoriaEventoType(DjangoObjectType):
    class Meta:
        model = CategoriaEvento
        fields = '__all__'


class CarreraType(DjangoObjectType):
    class Meta:
        model = Carrera
        fields = '__all__'


class EaCarreraType(DjangoObjectType):
    class Meta:
        model = EaCarrera
        fields = '__all__'


class OfertaType(DjangoObjectType):
    class Meta:
        model = Oferta
        fields = '__all__'


class OfertaEaCarreraType(DjangoObjectType):
    class Meta:
        model = OfertaEaCarrera
        fields = '__all__'


class Query(graphene.ObjectType):
    todas_las_entidades_academicas = graphene.List(EntidadAcademicaType)
    entidad_academica = graphene.Field(EntidadAcademicaType, id=graphene.ID(required=True))

    todas_las_categorias = graphene.List(CategoriaType)
    categoria = graphene.Field(CategoriaType, id=graphene.ID(required=True))

    todas_las_areas = graphene.List(AreaType)
    area = graphene.Field(AreaType, id=graphene.ID(required=True))

    todas_las_modalidades = graphene.List(ModalidadType)
    modalidad = graphene.Field(ModalidadType, id=graphene.ID(required=True))

    todos_los_modalidad_areas = graphene.List(ModalidadAreaType)
    modalidad_area = graphene.Field(ModalidadAreaType, id=graphene.ID(required=True))

    todos_los_categoria_eventos = graphene.List(CategoriaEventoType)
    categoria_evento = graphene.Field(CategoriaEventoType, id=graphene.ID(required=True))

    todas_las_carreras = graphene.List(CarreraType)
    carrera = graphene.Field(CarreraType, id=graphene.ID(required=True))

    todos_los_ea_carreras = graphene.List(EaCarreraType)
    ea_carrera = graphene.Field(EaCarreraType, id=graphene.ID(required=True))
    ea_carreras_por_entidad = graphene.List(EaCarreraType, id_entidad_academica=graphene.ID(required=True))

    todas_las_ofertas = graphene.List(OfertaType)
    oferta = graphene.Field(OfertaType, id=graphene.ID(required=True))

    todos_los_oferta_ea_carreras = graphene.List(OfertaEaCarreraType)
    oferta_ea_carrera = graphene.Field(OfertaEaCarreraType, id=graphene.ID(required=True))

    def resolve_todas_las_entidades_academicas(root, info):
        return EntidadAcademica.objects.all()

    def resolve_entidad_academica(root, info, id):
        try:
            return EntidadAcademica.objects.get(pk=id)
        except EntidadAcademica.DoesNotExist:
            return None

    def resolve_todas_las_categorias(root, info):
        return Categoria.objects.all()

    def resolve_categoria(root, info, id):
        try:
            return Categoria.objects.get(pk=id)
        except Categoria.DoesNotExist:
            return None

    def resolve_todas_las_areas(root, info):
        return Area.objects.all()

    def resolve_area(root, info, id):
        try:
            return Area.objects.get(pk=id)
        except Area.DoesNotExist:
            return None

    def resolve_todas_las_modalidades(root, info):
        return Modalidad.objects.all()

    def resolve_modalidad(root, info, id):
        try:
            return Modalidad.objects.get(pk=id)
        except Modalidad.DoesNotExist:
            return None

    def resolve_todos_los_modalidad_areas(root, info):
        return ModalidadArea.objects.select_related('modalidad', 'area').all()

    def resolve_modalidad_area(root, info, id):
        try:
            return ModalidadArea.objects.get(pk=id)
        except ModalidadArea.DoesNotExist:
            return None

    def resolve_todos_los_categoria_eventos(root, info):
        return CategoriaEvento.objects.select_related('categoria', 'evento').all()

    def resolve_categoria_evento(root, info, id):
        try:
            return CategoriaEvento.objects.get(pk=id)
        except CategoriaEvento.DoesNotExist:
            return None

    def resolve_todas_las_carreras(root, info):
        return Carrera.objects.all()

    def resolve_carrera(root, info, id):
        try:
            return Carrera.objects.get(pk=id)
        except Carrera.DoesNotExist:
            return None

    def resolve_todos_los_ea_carreras(root, info):
        return EaCarrera.objects.select_related('entidad_academica', 'carrera').all()

    def resolve_ea_carrera(root, info, id):
        try:
            return EaCarrera.objects.get(pk=id)
        except EaCarrera.DoesNotExist:
            return None

    def resolve_ea_carreras_por_entidad(root, info, id_entidad_academica):
        return EaCarrera.objects.filter(
            entidad_academica_id=id_entidad_academica
        ).select_related('carrera')

    def resolve_todas_las_ofertas(root, info):
        return Oferta.objects.select_related('categoria_evento', 'modalidad_area').all()

    def resolve_oferta(root, info, id):
        try:
            return Oferta.objects.get(pk=id)
        except Oferta.DoesNotExist:
            return None

    def resolve_todos_los_oferta_ea_carreras(root, info):
        return OfertaEaCarrera.objects.select_related(
            'oferta__categoria_evento__evento',
            'ea_carrera__entidad_academica',
            'ea_carrera__carrera',
        ).all()

    def resolve_oferta_ea_carrera(root, info, id):
        try:
            return OfertaEaCarrera.objects.get(pk=id)
        except OfertaEaCarrera.DoesNotExist:
            return None


# ================= MUTACIONES EntidadAcademica =================
class CrearEntidadAcademica(graphene.Mutation):
    class Arguments:
        nombre = graphene.String(required=True)

    entidad_academica = graphene.Field(EntidadAcademicaType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, nombre):
        if EntidadAcademica.objects.filter(nombre=nombre).exists():
            return CrearEntidadAcademica(entidad_academica=None, ok=False, error="La entidad ya existe.")  # type: ignore
        entidad_academica = EntidadAcademica.objects.create(nombre=nombre)
        return CrearEntidadAcademica(entidad_academica=entidad_academica, ok=True, error=None)  # type: ignore


class EditarEntidadAcademica(graphene.Mutation):
    class Arguments:
        id_entidad_academica = graphene.ID(required=True)
        nombre = graphene.String()
        estado = graphene.Boolean()

    entidad_academica = graphene.Field(EntidadAcademicaType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_entidad_academica, nombre=None, estado=None):
        try:
            entidad_academica = EntidadAcademica.objects.get(pk=id_entidad_academica)
        except EntidadAcademica.DoesNotExist:
            return EditarEntidadAcademica(entidad_academica=None, ok=False, error="La entidad no existe.")  # type: ignore

        if nombre is not None and nombre != entidad_academica.nombre:
            if EntidadAcademica.objects.filter(nombre=nombre).exists():
                return EditarEntidadAcademica(entidad_academica=None, ok=False, error="El nombre ya está registrado en otra entidad.")  # type: ignore
            entidad_academica.nombre = nombre

        if estado is not None:
            entidad_academica.estado = estado

        entidad_academica.save()
        return EditarEntidadAcademica(entidad_academica=entidad_academica, ok=True, error=None)  # type: ignore


class EliminarEntidadAcademica(graphene.Mutation):
    class Arguments:
        id_entidad_academica = graphene.ID(required=True)

    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_entidad_academica):
        try:
            entidad_academica = EntidadAcademica.objects.get(pk=id_entidad_academica)
            entidad_academica.estado = False
            entidad_academica.save()
            return EliminarEntidadAcademica(ok=True, error=None)  # type: ignore
        except EntidadAcademica.DoesNotExist:
            return EliminarEntidadAcademica(ok=False, error="La entidad no existe.")  # type: ignore


# ================= MUTACIONES Categoria =================
class CrearCategoria(graphene.Mutation):
    class Arguments:
        nombre = graphene.String(required=True)

    categoria = graphene.Field(CategoriaType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, nombre):
        if Categoria.objects.filter(nombre=nombre).exists():
            return CrearCategoria(categoria=None, ok=False, error="La categoría ya existe.")  # type: ignore
        categoria = Categoria.objects.create(nombre=nombre)
        return CrearCategoria(categoria=categoria, ok=True, error=None)  # type: ignore


class EditarCategoria(graphene.Mutation):
    class Arguments:
        id_categoria = graphene.ID(required=True)
        nombre = graphene.String()
        estado = graphene.Boolean()

    categoria = graphene.Field(CategoriaType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_categoria, nombre=None, estado=None):
        try:
            categoria = Categoria.objects.get(pk=id_categoria)
        except Categoria.DoesNotExist:
            return EditarCategoria(categoria=None, ok=False, error="La categoría no existe.")  # type: ignore

        if nombre is not None and nombre != categoria.nombre:
            if Categoria.objects.filter(nombre=nombre).exists():
                return EditarCategoria(categoria=None, ok=False, error="El nombre ya está registrado en otra categoría.")  # type: ignore
            categoria.nombre = nombre

        if estado is not None:
            categoria.estado = estado

        categoria.save()
        return EditarCategoria(categoria=categoria, ok=True, error=None)  # type: ignore


class EliminarCategoria(graphene.Mutation):
    class Arguments:
        id_categoria = graphene.ID(required=True)

    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_categoria):
        try:
            categoria = Categoria.objects.get(pk=id_categoria)
            categoria.estado = False
            categoria.save()
            return EliminarCategoria(ok=True, error=None)  # type: ignore
        except Categoria.DoesNotExist:
            return EliminarCategoria(ok=False, error="La categoría no existe.")  # type: ignore


# ================= MUTACIONES Area =================
class CrearArea(graphene.Mutation):
    class Arguments:
        nombre = graphene.String(required=True)

    area = graphene.Field(AreaType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, nombre):
        if Area.objects.filter(nombre=nombre).exists():
            return CrearArea(area=None, ok=False, error="El área ya existe.")  # type: ignore
        area = Area.objects.create(nombre=nombre)
        return CrearArea(area=area, ok=True, error=None)  # type: ignore


class EditarArea(graphene.Mutation):
    class Arguments:
        id_area = graphene.ID(required=True)
        nombre = graphene.String()
        estado = graphene.Boolean()

    area = graphene.Field(AreaType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_area, nombre=None, estado=None):
        try:
            area = Area.objects.get(pk=id_area)
        except Area.DoesNotExist:
            return EditarArea(area=None, ok=False, error="El área no existe.")  # type: ignore

        if nombre is not None and nombre != area.nombre:
            if Area.objects.filter(nombre=nombre).exists():
                return EditarArea(area=None, ok=False, error="El nombre ya está registrado en otra área.")  # type: ignore
            area.nombre = nombre

        if estado is not None:
            area.estado = estado

        area.save()
        return EditarArea(area=area, ok=True, error=None)  # type: ignore


class EliminarArea(graphene.Mutation):
    class Arguments:
        id_area = graphene.ID(required=True)

    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_area):
        try:
            area = Area.objects.get(pk=id_area)
            area.estado = False
            area.save()
            return EliminarArea(ok=True, error=None)  # type: ignore
        except Area.DoesNotExist:
            return EliminarArea(ok=False, error="El área no existe.")  # type: ignore


# ================= MUTACIONES Modalidad =================
class CrearModalidad(graphene.Mutation):
    class Arguments:
        nombre = graphene.String(required=True)

    modalidad = graphene.Field(ModalidadType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, nombre):
        if Modalidad.objects.filter(nombre=nombre).exists():
            return CrearModalidad(modalidad=None, ok=False, error="La modalidad ya existe.")  # type: ignore
        modalidad = Modalidad.objects.create(nombre=nombre)
        return CrearModalidad(modalidad=modalidad, ok=True, error=None)  # type: ignore


class EditarModalidad(graphene.Mutation):
    class Arguments:
        id_modalidad = graphene.ID(required=True)
        nombre = graphene.String()
        estado = graphene.Boolean()

    modalidad = graphene.Field(ModalidadType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_modalidad, nombre=None, estado=None):
        try:
            modalidad = Modalidad.objects.get(pk=id_modalidad)
        except Modalidad.DoesNotExist:
            return EditarModalidad(modalidad=None, ok=False, error="La modalidad no existe.")  # type: ignore

        if nombre is not None and nombre != modalidad.nombre:
            if Modalidad.objects.filter(nombre=nombre).exists():
                return EditarModalidad(modalidad=None, ok=False, error="El nombre ya está registrado en otra modalidad.")  # type: ignore
            modalidad.nombre = nombre

        if estado is not None:
            modalidad.estado = estado

        modalidad.save()
        return EditarModalidad(modalidad=modalidad, ok=True, error=None)  # type: ignore


class EliminarModalidad(graphene.Mutation):
    class Arguments:
        id_modalidad = graphene.ID(required=True)

    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_modalidad):
        try:
            modalidad = Modalidad.objects.get(pk=id_modalidad)
            modalidad.estado = False
            modalidad.save()
            return EliminarModalidad(ok=True, error=None)  # type: ignore
        except Modalidad.DoesNotExist:
            return EliminarModalidad(ok=False, error="La modalidad no existe.")  # type: ignore


# ================= MUTACIONES ModalidadArea =================
class CrearModalidadArea(graphene.Mutation):
    class Arguments:
        id_modalidad = graphene.ID(required=True)
        id_area = graphene.ID(required=True)

    modalidad_area = graphene.Field(ModalidadAreaType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_modalidad, id_area):
        try:
            modalidad = Modalidad.objects.get(pk=id_modalidad)
        except Modalidad.DoesNotExist:
            return CrearModalidadArea(modalidad_area=None, ok=False, error="La modalidad no existe.")  # type: ignore

        try:
            area = Area.objects.get(pk=id_area)
        except Area.DoesNotExist:
            return CrearModalidadArea(modalidad_area=None, ok=False, error="El área no existe.")  # type: ignore

        if ModalidadArea.objects.filter(modalidad=modalidad, area=area).exists():
            return CrearModalidadArea(modalidad_area=None, ok=False, error="Este vínculo modalidad-área ya existe.")  # type: ignore

        modalidad_area = ModalidadArea.objects.create(modalidad=modalidad, area=area)
        return CrearModalidadArea(modalidad_area=modalidad_area, ok=True, error=None)  # type: ignore


class EliminarModalidadArea(graphene.Mutation):
    class Arguments:
        id_modalidad_area = graphene.ID(required=True)

    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_modalidad_area):
        try:
            modalidad_area = ModalidadArea.objects.get(pk=id_modalidad_area)
            modalidad_area.delete()
            return EliminarModalidadArea(ok=True, error=None)  # type: ignore
        except ModalidadArea.DoesNotExist:
            return EliminarModalidadArea(ok=False, error="El vínculo no existe.")  # type: ignore


# ================= MUTACIONES CategoriaEvento =================
class CrearCategoriaEvento(graphene.Mutation):
    class Arguments:
        id_categoria = graphene.ID(required=True)
        id_evento = graphene.ID(required=True)

    categoria_evento = graphene.Field(CategoriaEventoType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_categoria, id_evento):
        try:
            categoria = Categoria.objects.get(pk=id_categoria)
        except Categoria.DoesNotExist:
            return CrearCategoriaEvento(categoria_evento=None, ok=False, error="La categoría no existe.")  # type: ignore

        try:
            evento = Evento.objects.get(pk=id_evento)
        except Evento.DoesNotExist:
            return CrearCategoriaEvento(categoria_evento=None, ok=False, error="El evento no existe.")  # type: ignore

        if CategoriaEvento.objects.filter(categoria=categoria, evento=evento).exists():
            return CrearCategoriaEvento(categoria_evento=None, ok=False, error="Esta categoría ya está vinculada a este evento.")  # type: ignore

        categoria_evento = CategoriaEvento.objects.create(categoria=categoria, evento=evento)
        return CrearCategoriaEvento(categoria_evento=categoria_evento, ok=True, error=None)  # type: ignore


class EliminarCategoriaEvento(graphene.Mutation):
    class Arguments:
        id_categoria_evento = graphene.ID(required=True)

    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_categoria_evento):
        try:
            categoria_evento = CategoriaEvento.objects.get(pk=id_categoria_evento)
            categoria_evento.delete()
            return EliminarCategoriaEvento(ok=True, error=None)  # type: ignore
        except CategoriaEvento.DoesNotExist:
            return EliminarCategoriaEvento(ok=False, error="El vínculo no existe.")  # type: ignore


# ================= MUTACIONES Carrera =================
class CrearCarrera(graphene.Mutation):
    class Arguments:
        nombre = graphene.String(required=True)
        plan = graphene.String()
        codigo = graphene.String()

    carrera = graphene.Field(CarreraType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, nombre, plan="", codigo=""):
        carrera = Carrera.objects.create(nombre=nombre, plan=plan, codigo=codigo)
        return CrearCarrera(carrera=carrera, ok=True, error=None)  # type: ignore


class EditarCarrera(graphene.Mutation):
    class Arguments:
        id_carrera = graphene.ID(required=True)
        nombre = graphene.String()
        plan = graphene.String()
        codigo = graphene.String()
        estado = graphene.Boolean()

    carrera = graphene.Field(CarreraType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_carrera, nombre=None, plan=None, codigo=None, estado=None):
        try:
            carrera = Carrera.objects.get(pk=id_carrera)
        except Carrera.DoesNotExist:
            return EditarCarrera(carrera=None, ok=False, error="La carrera no existe.")  # type: ignore

        if nombre is not None:
            carrera.nombre = nombre
        if plan is not None:
            carrera.plan = plan
        if codigo is not None:
            carrera.codigo = codigo
        if estado is not None:
            carrera.estado = estado

        carrera.save()
        return EditarCarrera(carrera=carrera, ok=True, error=None)  # type: ignore


class EliminarCarrera(graphene.Mutation):
    class Arguments:
        id_carrera = graphene.ID(required=True)

    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_carrera):
        try:
            carrera = Carrera.objects.get(pk=id_carrera)
            carrera.estado = False
            carrera.save()
            return EliminarCarrera(ok=True, error=None)  # type: ignore
        except Carrera.DoesNotExist:
            return EliminarCarrera(ok=False, error="La carrera no existe.")  # type: ignore


# ================= MUTACIONES EaCarrera =================
class CrearEaCarrera(graphene.Mutation):
    class Arguments:
        id_entidad_academica = graphene.ID(required=True)
        id_carrera = graphene.ID(required=True)

    ea_carrera = graphene.Field(EaCarreraType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_entidad_academica, id_carrera):
        try:
            entidad_academica = EntidadAcademica.objects.get(pk=id_entidad_academica)
        except EntidadAcademica.DoesNotExist:
            return CrearEaCarrera(ea_carrera=None, ok=False, error="La facultad no existe.")  # type: ignore

        try:
            carrera = Carrera.objects.get(pk=id_carrera)
        except Carrera.DoesNotExist:
            return CrearEaCarrera(ea_carrera=None, ok=False, error="La carrera no existe.")  # type: ignore

        if EaCarrera.objects.filter(entidad_academica=entidad_academica, carrera=carrera).exists():
            return CrearEaCarrera(ea_carrera=None, ok=False, error="Esta carrera ya está asignada a esta facultad.")  # type: ignore

        ea_carrera = EaCarrera.objects.create(entidad_academica=entidad_academica, carrera=carrera)
        return CrearEaCarrera(ea_carrera=ea_carrera, ok=True, error=None)  # type: ignore


class EliminarEaCarrera(graphene.Mutation):
    class Arguments:
        id_ea_carrera = graphene.ID(required=True)

    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_ea_carrera):
        try:
            ea_carrera = EaCarrera.objects.get(pk=id_ea_carrera)
            ea_carrera.delete()
            return EliminarEaCarrera(ok=True, error=None)  # type: ignore
        except EaCarrera.DoesNotExist:
            return EliminarEaCarrera(ok=False, error="El vínculo no existe.")  # type: ignore


# ================= MUTACIONES Oferta =================
class CrearOferta(graphene.Mutation):
    class Arguments:
        id_categoria_evento = graphene.ID(required=True)
        id_modalidad_area = graphene.ID(required=True)
        descripcion = graphene.String()

    oferta = graphene.Field(OfertaType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_categoria_evento, id_modalidad_area, descripcion=""):
        try:
            categoria_evento = CategoriaEvento.objects.get(pk=id_categoria_evento)
        except CategoriaEvento.DoesNotExist:
            return CrearOferta(oferta=None, ok=False, error="El vínculo categoría-evento no existe.")  # type: ignore

        try:
            modalidad_area = ModalidadArea.objects.get(pk=id_modalidad_area)
        except ModalidadArea.DoesNotExist:
            return CrearOferta(oferta=None, ok=False, error="El vínculo modalidad-área no existe.")  # type: ignore

        oferta = Oferta.objects.create(
            categoria_evento=categoria_evento,
            modalidad_area=modalidad_area,
            descripcion=descripcion,
        )
        return CrearOferta(oferta=oferta, ok=True, error=None)  # type: ignore


class EditarOferta(graphene.Mutation):
    class Arguments:
        id_oferta = graphene.ID(required=True)
        id_categoria_evento = graphene.ID()
        id_modalidad_area = graphene.ID()
        descripcion = graphene.String()
        estado = graphene.Boolean()

    oferta = graphene.Field(OfertaType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_oferta, **kwargs):
        try:
            oferta = Oferta.objects.get(pk=id_oferta)
        except Oferta.DoesNotExist:
            return EditarOferta(oferta=None, ok=False, error="La oferta no existe.")  # type: ignore

        if 'id_categoria_evento' in kwargs and kwargs['id_categoria_evento'] is not None:
            try:
                oferta.categoria_evento = CategoriaEvento.objects.get(pk=kwargs['id_categoria_evento'])
            except CategoriaEvento.DoesNotExist:
                return EditarOferta(oferta=None, ok=False, error="El vínculo categoría-evento no existe.")  # type: ignore

        if 'id_modalidad_area' in kwargs and kwargs['id_modalidad_area'] is not None:
            try:
                oferta.modalidad_area = ModalidadArea.objects.get(pk=kwargs['id_modalidad_area'])
            except ModalidadArea.DoesNotExist:
                return EditarOferta(oferta=None, ok=False, error="El vínculo modalidad-área no existe.")  # type: ignore

        for field in ['descripcion', 'estado']:
            if field in kwargs and kwargs[field] is not None:
                setattr(oferta, field, kwargs[field])

        oferta.save()
        return EditarOferta(oferta=oferta, ok=True, error=None)  # type: ignore


class EliminarOferta(graphene.Mutation):
    class Arguments:
        id_oferta = graphene.ID(required=True)

    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_oferta):
        try:
            oferta = Oferta.objects.get(pk=id_oferta)
            oferta.estado = False
            oferta.save()
            return EliminarOferta(ok=True, error=None)  # type: ignore
        except Oferta.DoesNotExist:
            return EliminarOferta(ok=False, error="La oferta no existe.")  # type: ignore


# ================= MUTACIONES OfertaEaCarrera =================
class CrearOfertaEaCarrera(graphene.Mutation):
    class Arguments:
        id_oferta = graphene.ID(required=True)
        id_ea_carrera = graphene.ID(required=True)

    oferta_ea_carrera = graphene.Field(OfertaEaCarreraType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_oferta, id_ea_carrera):
        try:
            oferta = Oferta.objects.get(pk=id_oferta)
        except Oferta.DoesNotExist:
            return CrearOfertaEaCarrera(oferta_ea_carrera=None, ok=False, error="La oferta no existe.")  # type: ignore

        try:
            ea_carrera = EaCarrera.objects.get(pk=id_ea_carrera)
        except EaCarrera.DoesNotExist:
            return CrearOfertaEaCarrera(oferta_ea_carrera=None, ok=False, error="El vínculo facultad-carrera no existe.")  # type: ignore

        if OfertaEaCarrera.objects.filter(oferta=oferta, ea_carrera=ea_carrera).exists():
            return CrearOfertaEaCarrera(oferta_ea_carrera=None, ok=False, error="Esta carrera ya está asignada a esta oferta.")  # type: ignore

        oferta_ea_carrera = OfertaEaCarrera.objects.create(oferta=oferta, ea_carrera=ea_carrera)
        return CrearOfertaEaCarrera(oferta_ea_carrera=oferta_ea_carrera, ok=True, error=None)  # type: ignore


class EditarOfertaEaCarrera(graphene.Mutation):
    class Arguments:
        id_oferta_ea_carrera = graphene.ID(required=True)
        estado = graphene.Boolean()

    oferta_ea_carrera = graphene.Field(OfertaEaCarreraType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_oferta_ea_carrera, estado=None):
        try:
            oferta_ea_carrera = OfertaEaCarrera.objects.get(pk=id_oferta_ea_carrera)
        except OfertaEaCarrera.DoesNotExist:
            return EditarOfertaEaCarrera(oferta_ea_carrera=None, ok=False, error="El registro no existe.")  # type: ignore

        if estado is not None:
            oferta_ea_carrera.estado = estado

        oferta_ea_carrera.save()
        return EditarOfertaEaCarrera(oferta_ea_carrera=oferta_ea_carrera, ok=True, error=None)  # type: ignore


class EliminarOfertaEaCarrera(graphene.Mutation):
    class Arguments:
        id_oferta_ea_carrera = graphene.ID(required=True)

    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_oferta_ea_carrera):
        try:
            oferta_ea_carrera = OfertaEaCarrera.objects.get(pk=id_oferta_ea_carrera)
            oferta_ea_carrera.estado = False
            oferta_ea_carrera.save()
            return EliminarOfertaEaCarrera(ok=True, error=None)  # type: ignore
        except OfertaEaCarrera.DoesNotExist:
            return EliminarOfertaEaCarrera(ok=False, error="El registro no existe.")  # type: ignore


class Mutation(graphene.ObjectType):
    crear_entidad_academica = CrearEntidadAcademica.Field()
    editar_entidad_academica = EditarEntidadAcademica.Field()
    eliminar_entidad_academica = EliminarEntidadAcademica.Field()

    crear_categoria = CrearCategoria.Field()
    editar_categoria = EditarCategoria.Field()
    eliminar_categoria = EliminarCategoria.Field()

    crear_area = CrearArea.Field()
    editar_area = EditarArea.Field()
    eliminar_area = EliminarArea.Field()

    crear_modalidad = CrearModalidad.Field()
    editar_modalidad = EditarModalidad.Field()
    eliminar_modalidad = EliminarModalidad.Field()

    crear_modalidad_area = CrearModalidadArea.Field()
    eliminar_modalidad_area = EliminarModalidadArea.Field()

    crear_categoria_evento = CrearCategoriaEvento.Field()
    eliminar_categoria_evento = EliminarCategoriaEvento.Field()

    crear_carrera = CrearCarrera.Field()
    editar_carrera = EditarCarrera.Field()
    eliminar_carrera = EliminarCarrera.Field()

    crear_ea_carrera = CrearEaCarrera.Field()
    eliminar_ea_carrera = EliminarEaCarrera.Field()

    crear_oferta = CrearOferta.Field()
    editar_oferta = EditarOferta.Field()
    eliminar_oferta = EliminarOferta.Field()

    crear_oferta_ea_carrera = CrearOfertaEaCarrera.Field()
    editar_oferta_ea_carrera = EditarOfertaEaCarrera.Field()
    eliminar_oferta_ea_carrera = EliminarOfertaEaCarrera.Field()
