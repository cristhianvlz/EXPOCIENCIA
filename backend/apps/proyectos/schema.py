import graphene
from graphene_django import DjangoObjectType
from graphene_file_upload.scalars import Upload
from django.utils import timezone

from apps.proyectos.models import Proyecto
from apps.academico.models import OfertaEaCarrera

class ProyectoType(DjangoObjectType):
    participantes = graphene.List('apps.usuarios.schema.ParticipanteType')
    tutores = graphene.List('apps.usuarios.schema.TutorType')

    class Meta:
        model = Proyecto
        fields = '__all__'
        convert_choices_to_enum = False

    def resolve_participantes(root, info):
        return root.participantes.filter(estado=True)

    def resolve_tutores(root, info):
        return root.tutores.filter(estado=True)

class Query(graphene.ObjectType):
    todos_los_proyectos = graphene.List(ProyectoType)
    proyecto = graphene.Field(ProyectoType, id=graphene.ID(required=True))

    def resolve_todos_los_proyectos(root, info):
        return Proyecto.objects.select_related('oferta_ea_carrera').all()

    def resolve_proyecto(root, info, id):
        try:
            return Proyecto.objects.get(pk=id)
        except Proyecto.DoesNotExist:
            return None

class CrearProyecto(graphene.Mutation):
    class Arguments:
        id_oferta_ea_carrera = graphene.ID(required=True)
        titulo = graphene.String(required=True)
        resumen = graphene.String()
        observacion = graphene.String()
        estado = graphene.String()
        archivo = Upload(required=True)

    proyecto = graphene.Field(ProyectoType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_oferta_ea_carrera, titulo, resumen="", observacion="", estado="revision", archivo=None):
        try:
            oferta_ea_carrera = OfertaEaCarrera.objects.get(pk=id_oferta_ea_carrera)
        except OfertaEaCarrera.DoesNotExist:
            return CrearProyecto(proyecto=None, ok=False, error="El registro de oferta-EA-carrera no existe.") # type: ignore

        if Proyecto.objects.filter(titulo=titulo).exists():
            return CrearProyecto(proyecto=None, ok=False, error="Un proyecto con este título ya existe.") # type: ignore

        proyecto = Proyecto.objects.create(
            oferta_ea_carrera=oferta_ea_carrera,
            titulo=titulo,
            resumen=resumen,
            observacion=observacion,
            estado=estado
        )
        if archivo:
            proyecto.archivo = archivo
            proyecto.save()
        return CrearProyecto(proyecto=proyecto, ok=True, error=None) # type: ignore

class EditarProyecto(graphene.Mutation):
    class Arguments:
        id_proyecto = graphene.ID(required=True)
        id_oferta_ea_carrera = graphene.ID()
        titulo = graphene.String()
        resumen = graphene.String()
        observacion = graphene.String()
        estado = graphene.String()
        activo = graphene.Boolean()
        archivo = Upload()

    proyecto = graphene.Field(ProyectoType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_proyecto, **kwargs):
        try:
            proyecto = Proyecto.objects.get(pk=id_proyecto)
        except Proyecto.DoesNotExist:
            return EditarProyecto(proyecto=None, ok=False, error="El proyecto no existe.") # type: ignore

        if 'id_oferta_ea_carrera' in kwargs and kwargs['id_oferta_ea_carrera'] is not None:
            try:
                proyecto.oferta_ea_carrera = OfertaEaCarrera.objects.get(pk=kwargs['id_oferta_ea_carrera'])
            except OfertaEaCarrera.DoesNotExist:
                return EditarProyecto(proyecto=None, ok=False, error="El registro de oferta-EA-carrera no existe.") # type: ignore

        new_titulo = kwargs.get('titulo', proyecto.titulo)
        if 'titulo' in kwargs and new_titulo != proyecto.titulo:
            if Proyecto.objects.filter(titulo=new_titulo).exists():
                return EditarProyecto(proyecto=None, ok=False, error="Un proyecto con este título ya existe.") # type: ignore

        if 'archivo' in kwargs and kwargs['archivo'] is not None:
            proyecto.archivo = kwargs['archivo']

        for field in ['titulo', 'resumen', 'observacion', 'estado', 'activo']:
            if field in kwargs and kwargs[field] is not None:
                setattr(proyecto, field, kwargs[field])

        if kwargs.get('estado') == 'aprobado' and proyecto.fecha_confirmacion is None:
            proyecto.fecha_confirmacion = timezone.now()

        proyecto.save()
        return EditarProyecto(proyecto=proyecto, ok=True, error=None) # type: ignore

class EliminarProyecto(graphene.Mutation):
    class Arguments:
        id_proyecto = graphene.ID(required=True)

    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_proyecto):
        try:
            proyecto = Proyecto.objects.get(pk=id_proyecto)
            proyecto.activo = False
            proyecto.save()
            return EliminarProyecto(ok=True, error=None) # type: ignore
        except Proyecto.DoesNotExist:
            return EliminarProyecto(ok=False, error="El proyecto no existe.") # type: ignore

class Mutation(graphene.ObjectType):
    crear_proyecto = CrearProyecto.Field()
    editar_proyecto = EditarProyecto.Field()
    eliminar_proyecto = EliminarProyecto.Field()
