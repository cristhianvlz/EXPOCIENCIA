import graphene
from graphene_django import DjangoObjectType

from apps.premiacion.models import (
    TipoDescriptor, Descriptor, Premio, PremioDescriptor,
    CandidatoPremio, GanadorPremio, Plantilla, Certificado
)
from apps.eventos.models import Evento
from apps.academico.models import Area
from apps.proyectos.models import Proyecto
from apps.evaluaciones.models import ActaEvaluacion

class TipoDescriptorType(DjangoObjectType):
    class Meta:
        model = TipoDescriptor
        fields = '__all__'

class DescriptorType(DjangoObjectType):
    class Meta:
        model = Descriptor
        fields = '__all__'

class PremioType(DjangoObjectType):
    class Meta:
        model = Premio
        fields = '__all__'

class PremioDescriptorType(DjangoObjectType):
    class Meta:
        model = PremioDescriptor
        fields = '__all__'

class CandidatoPremioType(DjangoObjectType):
    class Meta:
        model = CandidatoPremio
        fields = '__all__'

class GanadorPremioType(DjangoObjectType):
    class Meta:
        model = GanadorPremio
        fields = '__all__'

class PlantillaType(DjangoObjectType):
    class Meta:
        model = Plantilla
        fields = '__all__'

class CertificadoType(DjangoObjectType):
    class Meta:
        model = Certificado
        fields = '__all__'

class Query(graphene.ObjectType):
    todos_los_tipos_descriptores = graphene.List(TipoDescriptorType)
    tipo_descriptor = graphene.Field(TipoDescriptorType, id=graphene.ID(required=True))

    todos_los_descriptores = graphene.List(DescriptorType)
    descriptor = graphene.Field(DescriptorType, id=graphene.ID(required=True))

    todos_los_premios = graphene.List(PremioType)
    premio = graphene.Field(PremioType, id=graphene.ID(required=True))

    todos_los_premio_descriptores = graphene.List(PremioDescriptorType)
    premio_descriptor = graphene.Field(PremioDescriptorType, id=graphene.ID(required=True))

    todos_los_candidatos_premios = graphene.List(CandidatoPremioType)
    candidato_premio = graphene.Field(CandidatoPremioType, id=graphene.ID(required=True))

    todos_los_ganadores_premios = graphene.List(GanadorPremioType)
    ganador_premio = graphene.Field(GanadorPremioType, id=graphene.ID(required=True))

    todas_las_plantillas = graphene.List(PlantillaType)
    plantilla = graphene.Field(PlantillaType, id=graphene.ID(required=True))

    todos_los_certificados = graphene.List(CertificadoType)
    certificado = graphene.Field(CertificadoType, id=graphene.ID(required=True))

    def resolve_todos_los_tipos_descriptores(root, info):
        return TipoDescriptor.objects.all()

    def resolve_tipo_descriptor(root, info, id):
        try:
            return TipoDescriptor.objects.get(pk=id)
        except TipoDescriptor.DoesNotExist:
            return None

    def resolve_todos_los_descriptores(root, info):
        return Descriptor.objects.select_related('tipo_descriptor').all()

    def resolve_descriptor(root, info, id):
        try:
            return Descriptor.objects.get(pk=id)
        except Descriptor.DoesNotExist:
            return None

    def resolve_todos_los_premios(root, info):
        return Premio.objects.select_related('evento', 'area').all()

    def resolve_premio(root, info, id):
        try:
            return Premio.objects.get(pk=id)
        except Premio.DoesNotExist:
            return None

    def resolve_todos_los_premio_descriptores(root, info):
        return PremioDescriptor.objects.select_related('premio', 'descriptor').all()

    def resolve_premio_descriptor(root, info, id):
        try:
            return PremioDescriptor.objects.get(pk=id)
        except PremioDescriptor.DoesNotExist:
            return None

    def resolve_todos_los_candidatos_premios(root, info):
        return CandidatoPremio.objects.select_related('premio', 'proyecto', 'acta_evaluacion').all()

    def resolve_candidato_premio(root, info, id):
        try:
            return CandidatoPremio.objects.get(pk=id)
        except CandidatoPremio.DoesNotExist:
            return None

    def resolve_todos_los_ganadores_premios(root, info):
        return GanadorPremio.objects.select_related('candidato_premio').all()

    def resolve_ganador_premio(root, info, id):
        try:
            return GanadorPremio.objects.get(pk=id)
        except GanadorPremio.DoesNotExist:
            return None

    def resolve_todas_las_plantillas(root, info):
        return Plantilla.objects.all()

    def resolve_plantilla(root, info, id):
        try:
            return Plantilla.objects.get(pk=id)
        except Plantilla.DoesNotExist:
            return None

    def resolve_todos_los_certificados(root, info):
        return Certificado.objects.select_related('ganador_premio', 'plantilla').all()

    def resolve_certificado(root, info, id):
        try:
            return Certificado.objects.get(pk=id)
        except Certificado.DoesNotExist:
            return None


# ================= MUTACIONES TipoDescriptor =================
class CrearTipoDescriptor(graphene.Mutation):
    class Arguments:
        nombre = graphene.String(required=True)

    tipo_descriptor = graphene.Field(TipoDescriptorType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, nombre):
        if TipoDescriptor.objects.filter(nombre=nombre).exists():
            return CrearTipoDescriptor(tipo_descriptor=None, ok=False, error="El tipo ya existe.") # type: ignore
        tipo = TipoDescriptor.objects.create(nombre=nombre)
        return CrearTipoDescriptor(tipo_descriptor=tipo, ok=True, error=None) # type: ignore

class EditarTipoDescriptor(graphene.Mutation):
    class Arguments:
        id_tipo_descriptor = graphene.ID(required=True)
        nombre = graphene.String()
        estado = graphene.Boolean()

    tipo_descriptor = graphene.Field(TipoDescriptorType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_tipo_descriptor, **kwargs):
        try:
            tipo = TipoDescriptor.objects.get(pk=id_tipo_descriptor)
        except TipoDescriptor.DoesNotExist:
            return EditarTipoDescriptor(tipo_descriptor=None, ok=False, error="El tipo no existe.") # type: ignore

        if 'nombre' in kwargs and kwargs['nombre'] != tipo.nombre:
            if TipoDescriptor.objects.filter(nombre=kwargs['nombre']).exists():
                return EditarTipoDescriptor(tipo_descriptor=None, ok=False, error="El nombre ya existe.") # type: ignore
            tipo.nombre = kwargs['nombre']
            
        if 'estado' in kwargs and kwargs['estado'] is not None:
            tipo.estado = kwargs['estado']

        tipo.save()
        return EditarTipoDescriptor(tipo_descriptor=tipo, ok=True, error=None) # type: ignore

class EliminarTipoDescriptor(graphene.Mutation):
    class Arguments:
        id_tipo_descriptor = graphene.ID(required=True)

    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_tipo_descriptor):
        try:
            tipo = TipoDescriptor.objects.get(pk=id_tipo_descriptor)
            tipo.estado = False
            tipo.save()
            return EliminarTipoDescriptor(ok=True, error=None) # type: ignore
        except TipoDescriptor.DoesNotExist:
            return EliminarTipoDescriptor(ok=False, error="El tipo no existe.") # type: ignore


# ================= MUTACIONES Descriptor =================
class CrearDescriptor(graphene.Mutation):
    class Arguments:
        id_tipo_descriptor = graphene.ID(required=True)
        descripcion = graphene.String(required=True)

    descriptor = graphene.Field(DescriptorType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_tipo_descriptor, descripcion):
        try:
            tipo = TipoDescriptor.objects.get(pk=id_tipo_descriptor)
        except TipoDescriptor.DoesNotExist:
            return CrearDescriptor(descriptor=None, ok=False, error="El tipo no existe.") # type: ignore

        descriptor = Descriptor.objects.create(tipo_descriptor=tipo, descripcion=descripcion)
        return CrearDescriptor(descriptor=descriptor, ok=True, error=None) # type: ignore

class EditarDescriptor(graphene.Mutation):
    class Arguments:
        id_descriptor = graphene.ID(required=True)
        id_tipo_descriptor = graphene.ID()
        descripcion = graphene.String()
        estado = graphene.Boolean()

    descriptor = graphene.Field(DescriptorType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_descriptor, **kwargs):
        try:
            descriptor = Descriptor.objects.get(pk=id_descriptor)
        except Descriptor.DoesNotExist:
            return EditarDescriptor(descriptor=None, ok=False, error="El descriptor no existe.") # type: ignore

        if 'id_tipo_descriptor' in kwargs and kwargs['id_tipo_descriptor'] is not None:
            try:
                descriptor.tipo_descriptor = TipoDescriptor.objects.get(pk=kwargs['id_tipo_descriptor'])
            except TipoDescriptor.DoesNotExist:
                return EditarDescriptor(descriptor=None, ok=False, error="El tipo no existe.") # type: ignore

        for field in ['descripcion', 'estado']:
            if field in kwargs and kwargs[field] is not None:
                setattr(descriptor, field, kwargs[field])

        descriptor.save()
        return EditarDescriptor(descriptor=descriptor, ok=True, error=None) # type: ignore

class EliminarDescriptor(graphene.Mutation):
    class Arguments:
        id_descriptor = graphene.ID(required=True)

    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_descriptor):
        try:
            descriptor = Descriptor.objects.get(pk=id_descriptor)
            descriptor.estado = False
            descriptor.save()
            return EliminarDescriptor(ok=True, error=None) # type: ignore
        except Descriptor.DoesNotExist:
            return EliminarDescriptor(ok=False, error="El descriptor no existe.") # type: ignore


# ================= MUTACIONES Premio =================
class CrearPremio(graphene.Mutation):
    class Arguments:
        id_evento = graphene.ID(required=True)
        id_area = graphene.ID(required=True)
        monto = graphene.Decimal(required=True)
        numero_ganadores = graphene.Int(required=True)

    premio = graphene.Field(PremioType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_evento, id_area, monto, numero_ganadores):
        try:
            evento = Evento.objects.get(pk=id_evento)
        except Evento.DoesNotExist:
            return CrearPremio(premio=None, ok=False, error="El evento no existe.") # type: ignore
        try:
            area = Area.objects.get(pk=id_area)
        except Area.DoesNotExist:
            return CrearPremio(premio=None, ok=False, error="El área no existe.") # type: ignore

        premio = Premio.objects.create(
            evento=evento, area=area, monto=monto, numero_ganadores=numero_ganadores
        )
        return CrearPremio(premio=premio, ok=True, error=None) # type: ignore

class EditarPremio(graphene.Mutation):
    class Arguments:
        id_premio = graphene.ID(required=True)
        id_evento = graphene.ID()
        id_area = graphene.ID()
        monto = graphene.Decimal()
        numero_ganadores = graphene.Int()
        estado = graphene.Boolean()

    premio = graphene.Field(PremioType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_premio, **kwargs):
        try:
            premio = Premio.objects.get(pk=id_premio)
        except Premio.DoesNotExist:
            return EditarPremio(premio=None, ok=False, error="El premio no existe.") # type: ignore

        if 'id_evento' in kwargs and kwargs['id_evento'] is not None:
            try:
                premio.evento = Evento.objects.get(pk=kwargs['id_evento'])
            except Evento.DoesNotExist:
                return EditarPremio(premio=None, ok=False, error="El evento no existe.") # type: ignore

        if 'id_area' in kwargs and kwargs['id_area'] is not None:
            try:
                premio.area = Area.objects.get(pk=kwargs['id_area'])
            except Area.DoesNotExist:
                return EditarPremio(premio=None, ok=False, error="El área no existe.") # type: ignore

        for field in ['monto', 'numero_ganadores', 'estado']:
            if field in kwargs and kwargs[field] is not None:
                setattr(premio, field, kwargs[field])

        premio.save()
        return EditarPremio(premio=premio, ok=True, error=None) # type: ignore

class EliminarPremio(graphene.Mutation):
    class Arguments:
        id_premio = graphene.ID(required=True)

    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_premio):
        try:
            premio = Premio.objects.get(pk=id_premio)
            premio.estado = False
            premio.save()
            return EliminarPremio(ok=True, error=None) # type: ignore
        except Premio.DoesNotExist:
            return EliminarPremio(ok=False, error="El premio no existe.") # type: ignore


# ================= MUTACIONES PremioDescriptor =================
class CrearPremioDescriptor(graphene.Mutation):
    class Arguments:
        id_premio = graphene.ID(required=True)
        id_descriptor = graphene.ID(required=True)

    premio_descriptor = graphene.Field(PremioDescriptorType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_premio, id_descriptor):
        try:
            premio = Premio.objects.get(pk=id_premio)
        except Premio.DoesNotExist:
            return CrearPremioDescriptor(premio_descriptor=None, ok=False, error="El premio no existe.") # type: ignore
        try:
            descriptor = Descriptor.objects.get(pk=id_descriptor)
        except Descriptor.DoesNotExist:
            return CrearPremioDescriptor(premio_descriptor=None, ok=False, error="El descriptor no existe.") # type: ignore

        if PremioDescriptor.objects.filter(premio=premio, descriptor=descriptor).exists():
            return CrearPremioDescriptor(premio_descriptor=None, ok=False, error="El vínculo ya existe.") # type: ignore

        pd = PremioDescriptor.objects.create(premio=premio, descriptor=descriptor)
        return CrearPremioDescriptor(premio_descriptor=pd, ok=True, error=None) # type: ignore

class EliminarPremioDescriptor(graphene.Mutation):
    class Arguments:
        id_premio_descriptor = graphene.ID(required=True)

    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_premio_descriptor):
        try:
            pd = PremioDescriptor.objects.get(pk=id_premio_descriptor)
            pd.delete()
            return EliminarPremioDescriptor(ok=True, error=None) # type: ignore
        except PremioDescriptor.DoesNotExist:
            return EliminarPremioDescriptor(ok=False, error="El vínculo no existe.") # type: ignore


# ================= MUTACIONES CandidatoPremio =================
class CrearCandidatoPremio(graphene.Mutation):
    class Arguments:
        id_premio = graphene.ID(required=True)
        id_proyecto = graphene.ID(required=True)
        id_acta_evaluacion = graphene.ID(required=True)
        nota = graphene.Decimal(required=True)
        observacion = graphene.String()
        estado = graphene.String()

    candidato_premio = graphene.Field(CandidatoPremioType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_premio, id_proyecto, id_acta_evaluacion, nota, observacion="", estado="candidato"):
        try:
            premio = Premio.objects.get(pk=id_premio)
        except Premio.DoesNotExist:
            return CrearCandidatoPremio(candidato_premio=None, ok=False, error="El premio no existe.") # type: ignore
        try:
            proyecto = Proyecto.objects.get(pk=id_proyecto)
        except Proyecto.DoesNotExist:
            return CrearCandidatoPremio(candidato_premio=None, ok=False, error="El proyecto no existe.") # type: ignore
        try:
            acta = ActaEvaluacion.objects.get(pk=id_acta_evaluacion)
        except ActaEvaluacion.DoesNotExist:
            return CrearCandidatoPremio(candidato_premio=None, ok=False, error="El acta no existe.") # type: ignore

        if CandidatoPremio.objects.filter(premio=premio, proyecto=proyecto).exists():
            return CrearCandidatoPremio(candidato_premio=None, ok=False, error="El proyecto ya es candidato a este premio.") # type: ignore

        candidato = CandidatoPremio.objects.create(
            premio=premio, proyecto=proyecto, acta_evaluacion=acta,
            nota=nota, observacion=observacion, estado=estado
        )
        return CrearCandidatoPremio(candidato_premio=candidato, ok=True, error=None) # type: ignore

class EditarCandidatoPremio(graphene.Mutation):
    class Arguments:
        id_candidato_premio = graphene.ID(required=True)
        id_premio = graphene.ID()
        id_proyecto = graphene.ID()
        id_acta_evaluacion = graphene.ID()
        nota = graphene.Decimal()
        observacion = graphene.String()
        estado = graphene.String()
        activo = graphene.Boolean()

    candidato_premio = graphene.Field(CandidatoPremioType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_candidato_premio, **kwargs):
        try:
            candidato = CandidatoPremio.objects.get(pk=id_candidato_premio)
        except CandidatoPremio.DoesNotExist:
            return EditarCandidatoPremio(candidato_premio=None, ok=False, error="El candidato no existe.") # type: ignore

        new_premio_id = kwargs.get('id_premio', candidato.premio_id)
        new_proyecto_id = kwargs.get('id_proyecto', candidato.proyecto_id)
        if 'id_premio' in kwargs or 'id_proyecto' in kwargs:
            if CandidatoPremio.objects.filter(premio_id=new_premio_id, proyecto_id=new_proyecto_id).exclude(pk=id_candidato_premio).exists():
                return EditarCandidatoPremio(candidato_premio=None, ok=False, error="El proyecto ya es candidato a este premio.") # type: ignore

        if 'id_premio' in kwargs and kwargs['id_premio'] is not None:
            try:
                candidato.premio = Premio.objects.get(pk=kwargs['id_premio'])
            except Premio.DoesNotExist:
                return EditarCandidatoPremio(candidato_premio=None, ok=False, error="El premio no existe.") # type: ignore
        if 'id_proyecto' in kwargs and kwargs['id_proyecto'] is not None:
            try:
                candidato.proyecto = Proyecto.objects.get(pk=kwargs['id_proyecto'])
            except Proyecto.DoesNotExist:
                return EditarCandidatoPremio(candidato_premio=None, ok=False, error="El proyecto no existe.") # type: ignore
        if 'id_acta_evaluacion' in kwargs and kwargs['id_acta_evaluacion'] is not None:
            try:
                candidato.acta_evaluacion = ActaEvaluacion.objects.get(pk=kwargs['id_acta_evaluacion'])
            except ActaEvaluacion.DoesNotExist:
                return EditarCandidatoPremio(candidato_premio=None, ok=False, error="El acta no existe.") # type: ignore

        for field in ['nota', 'observacion', 'estado', 'activo']:
            if field in kwargs and kwargs[field] is not None:
                setattr(candidato, field, kwargs[field])

        candidato.save()
        return EditarCandidatoPremio(candidato_premio=candidato, ok=True, error=None) # type: ignore

class EliminarCandidatoPremio(graphene.Mutation):
    class Arguments:
        id_candidato_premio = graphene.ID(required=True)

    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_candidato_premio):
        try:
            candidato = CandidatoPremio.objects.get(pk=id_candidato_premio)
            candidato.activo = False
            candidato.save()
            return EliminarCandidatoPremio(ok=True, error=None) # type: ignore
        except CandidatoPremio.DoesNotExist:
            return EliminarCandidatoPremio(ok=False, error="El candidato no existe.") # type: ignore


# ================= MUTACIONES GanadorPremio =================
class CrearGanadorPremio(graphene.Mutation):
    class Arguments:
        id_candidato_premio = graphene.ID(required=True)

    ganador_premio = graphene.Field(GanadorPremioType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_candidato_premio):
        try:
            candidato = CandidatoPremio.objects.get(pk=id_candidato_premio)
        except CandidatoPremio.DoesNotExist:
            return CrearGanadorPremio(ganador_premio=None, ok=False, error="El candidato no existe.") # type: ignore

        if GanadorPremio.objects.filter(candidato_premio=candidato).exists():
            return CrearGanadorPremio(ganador_premio=None, ok=False, error="Este candidato ya fue marcado como ganador.") # type: ignore

        ganador = GanadorPremio.objects.create(candidato_premio=candidato)
        return CrearGanadorPremio(ganador_premio=ganador, ok=True, error=None) # type: ignore

class EliminarGanadorPremio(graphene.Mutation):
    class Arguments:
        id_ganador_premio = graphene.ID(required=True)

    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_ganador_premio):
        try:
            ganador = GanadorPremio.objects.get(pk=id_ganador_premio)
            ganador.estado = False
            ganador.save()
            return EliminarGanadorPremio(ok=True, error=None) # type: ignore
        except GanadorPremio.DoesNotExist:
            return EliminarGanadorPremio(ok=False, error="El ganador no existe.") # type: ignore


# ================= MUTACIONES Plantilla =================
class CrearPlantilla(graphene.Mutation):
    class Arguments:
        descripcion = graphene.String(required=True)
        contenido = graphene.String(required=True)

    plantilla = graphene.Field(PlantillaType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, descripcion, contenido):
        plantilla = Plantilla.objects.create(descripcion=descripcion, contenido=contenido)
        return CrearPlantilla(plantilla=plantilla, ok=True, error=None) # type: ignore

class EditarPlantilla(graphene.Mutation):
    class Arguments:
        id_plantilla = graphene.ID(required=True)
        descripcion = graphene.String()
        contenido = graphene.String()
        estado = graphene.Boolean()

    plantilla = graphene.Field(PlantillaType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_plantilla, **kwargs):
        try:
            plantilla = Plantilla.objects.get(pk=id_plantilla)
        except Plantilla.DoesNotExist:
            return EditarPlantilla(plantilla=None, ok=False, error="La plantilla no existe.") # type: ignore

        for field in ['descripcion', 'contenido', 'estado']:
            if field in kwargs and kwargs[field] is not None:
                setattr(plantilla, field, kwargs[field])

        plantilla.save()
        return EditarPlantilla(plantilla=plantilla, ok=True, error=None) # type: ignore

class EliminarPlantilla(graphene.Mutation):
    class Arguments:
        id_plantilla = graphene.ID(required=True)

    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_plantilla):
        try:
            plantilla = Plantilla.objects.get(pk=id_plantilla)
            plantilla.estado = False
            plantilla.save()
            return EliminarPlantilla(ok=True, error=None) # type: ignore
        except Plantilla.DoesNotExist:
            return EliminarPlantilla(ok=False, error="La plantilla no existe.") # type: ignore


# ================= MUTACIONES Certificado =================
class CrearCertificado(graphene.Mutation):
    class Arguments:
        id_ganador_premio = graphene.ID(required=True)
        id_plantilla = graphene.ID(required=True)

    certificado = graphene.Field(CertificadoType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_ganador_premio, id_plantilla):
        try:
            ganador = GanadorPremio.objects.get(pk=id_ganador_premio)
        except GanadorPremio.DoesNotExist:
            return CrearCertificado(certificado=None, ok=False, error="El ganador no existe.") # type: ignore
        try:
            plantilla = Plantilla.objects.get(pk=id_plantilla)
        except Plantilla.DoesNotExist:
            return CrearCertificado(certificado=None, ok=False, error="La plantilla no existe.") # type: ignore

        certificado = Certificado.objects.create(ganador_premio=ganador, plantilla=plantilla)
        return CrearCertificado(certificado=certificado, ok=True, error=None) # type: ignore

class EliminarCertificado(graphene.Mutation):
    class Arguments:
        id_certificado = graphene.ID(required=True)

    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_certificado):
        try:
            certificado = Certificado.objects.get(pk=id_certificado)
            certificado.estado = False
            certificado.save()
            return EliminarCertificado(ok=True, error=None) # type: ignore
        except Certificado.DoesNotExist:
            return EliminarCertificado(ok=False, error="El certificado no existe.") # type: ignore


class CerrarActaResultados(graphene.Mutation):
    class Arguments:
        id_evento = graphene.ID(required=True)
        id_premio = graphene.ID(required=True)

    candidatos = graphene.List(CandidatoPremioType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_evento, id_premio):
        from django.utils import timezone
        from apps.eventos.models import Cronograma, Evento
        now = timezone.now()

        try:
            evento = Evento.objects.get(pk=id_evento)
        except Evento.DoesNotExist:
            return CerrarActaResultados(candidatos=None, ok=False, error="El evento no existe.") # type: ignore

        cronograma = Cronograma.objects.filter(
            evento=evento,
            actividad__nombre_actividad__icontains='resultado',
            estado=True,
        ).first()

        if not cronograma:
            return CerrarActaResultados(candidatos=None, ok=False, error="No existe cronograma de Publicación de Resultados para este evento.") # type: ignore

        if now <= cronograma.fecha_fin:
            return CerrarActaResultados(candidatos=None, ok=False, error="El período de Publicación de Resultados aún no ha finalizado.") # type: ignore

        try:
            premio = Premio.objects.get(pk=id_premio)
        except Premio.DoesNotExist:
            return CerrarActaResultados(candidatos=None, ok=False, error="El premio no existe.") # type: ignore

        actas = ActaEvaluacion.objects.filter(
            proyecto__oferta_ea_carrera__oferta__categoria_evento__evento=evento,
            estado=True,
        ).order_by('-nota_final')

        if not actas.exists():
            return CerrarActaResultados(candidatos=None, ok=False, error="No hay proyectos evaluados para este evento.") # type: ignore

        max_nota = actas.first().nota_final
        top_actas = actas.filter(nota_final=max_nota)

        candidatos_resultado = []
        for acta in top_actas:
            existing = CandidatoPremio.objects.filter(premio=premio, proyecto=acta.proyecto).first()
            if existing:
                candidatos_resultado.append(existing)
            else:
                candidato = CandidatoPremio.objects.create(
                    premio=premio,
                    proyecto=acta.proyecto,
                    acta_evaluacion=acta,
                    nota=acta.nota_final,
                    estado='candidato',
                )
                candidatos_resultado.append(candidato)

        return CerrarActaResultados(candidatos=candidatos_resultado, ok=True, error=None) # type: ignore


class Mutation(graphene.ObjectType):
    crear_tipo_descriptor = CrearTipoDescriptor.Field()
    editar_tipo_descriptor = EditarTipoDescriptor.Field()
    eliminar_tipo_descriptor = EliminarTipoDescriptor.Field()

    crear_descriptor = CrearDescriptor.Field()
    editar_descriptor = EditarDescriptor.Field()
    eliminar_descriptor = EliminarDescriptor.Field()

    crear_premio = CrearPremio.Field()
    editar_premio = EditarPremio.Field()
    eliminar_premio = EliminarPremio.Field()

    crear_premio_descriptor = CrearPremioDescriptor.Field()
    eliminar_premio_descriptor = EliminarPremioDescriptor.Field()

    crear_candidato_premio = CrearCandidatoPremio.Field()
    editar_candidato_premio = EditarCandidatoPremio.Field()
    eliminar_candidato_premio = EliminarCandidatoPremio.Field()

    crear_ganador_premio = CrearGanadorPremio.Field()
    eliminar_ganador_premio = EliminarGanadorPremio.Field()

    crear_plantilla = CrearPlantilla.Field()
    editar_plantilla = EditarPlantilla.Field()
    eliminar_plantilla = EliminarPlantilla.Field()

    crear_certificado = CrearCertificado.Field()
    eliminar_certificado = EliminarCertificado.Field()

    cerrar_acta_resultados = CerrarActaResultados.Field()
