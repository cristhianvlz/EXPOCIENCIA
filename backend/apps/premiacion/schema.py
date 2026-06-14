import graphene
from graphene_django import DjangoObjectType
from apps.premiacion.models import (
    TipoDescriptor, Descriptor, Premio, PremioDescriptor,
    CandidatoPremio, GanadorPremio, Plantilla, Certificado, AsignacionPremio
)
from apps.eventos.models import Evento
from apps.academico.models import Area, Oferta
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

# Definido antes de GanadorPremioType para evitar referencia hacia adelante
class AsignacionPremioType(DjangoObjectType):
    metodo_pago = graphene.String()
    estado_pago = graphene.String()

    class Meta:
        model = AsignacionPremio
        fields = (
            'id_asignacion_premio', 'participante',
            'monto_asignado', 'porcentaje',
            'observacion', 'impresa', 'estado', 'fecha_registro',
            'metodo_pago', 'qr_imagen', 'estado_pago', 'fecha_pago', 'comprobante_pago_imagen',
        )

    def resolve_metodo_pago(self, info):
        return self.metodo_pago

    def resolve_estado_pago(self, info):
        return self.estado_pago

class GanadorPremioType(DjangoObjectType):
    asignaciones = graphene.List(AsignacionPremioType)

    class Meta:
        model = GanadorPremio
        fields = '__all__'

    @staticmethod
    def resolve_asignaciones(root, info):
        return root.asignaciones.filter(estado=True).select_related('participante')

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

    asignaciones_por_ganador = graphene.List(
        AsignacionPremioType,
        id_ganador_premio=graphene.ID(required=True),
    )

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

    def resolve_asignaciones_por_ganador(root, info, id_ganador_premio):
        return AsignacionPremio.objects.filter(
            ganador_premio_id=id_ganador_premio, estado=True
        ).select_related('participante')


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
        id_oferta = graphene.ID(required=True)
        monto = graphene.Decimal()
        numero_ganadores = graphene.Int(required=True)
        id_descriptores = graphene.List(graphene.ID)

    premio = graphene.Field(PremioType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_oferta, numero_ganadores, monto=None, id_descriptores=None):
        try:
            oferta = Oferta.objects.select_related(
                'categoria_evento__evento',
                'modalidad_area__area'
            ).get(pk=id_oferta)
        except Oferta.DoesNotExist:
            return CrearPremio(premio=None, ok=False, error="La oferta no existe.") # type: ignore

        try:
            evento = oferta.categoria_evento.evento
            area = oferta.modalidad_area.area
        except Exception:
            return CrearPremio(premio=None, ok=False, error="No se pudo obtener el evento o área de la oferta.") # type: ignore

        premio = Premio.objects.create(
            evento=evento, area=area, monto=monto, numero_ganadores=numero_ganadores
        )

        if id_descriptores:
            for id_desc in id_descriptores:
                try:
                    desc = Descriptor.objects.get(pk=id_desc)
                    PremioDescriptor.objects.create(premio=premio, descriptor=desc)
                except Exception:
                    pass

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
        except Premio.DoesNotExist:
            return EliminarPremio(ok=False, error="El premio no existe.") # type: ignore

        try:
            # Los PremioDescriptor se eliminan en cascada automáticamente
            premio.delete()
            return EliminarPremio(ok=True, error=None) # type: ignore
        except Exception:
            return EliminarPremio(ok=False, error="No se puede eliminar: el premio tiene candidatos o ganadores asignados. Elimínalos primero.") # type: ignore


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
        orientacion = graphene.String()

    plantilla = graphene.Field(PlantillaType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, descripcion, contenido, orientacion='horizontal'):
        plantilla = Plantilla.objects.create(
            descripcion=descripcion, contenido=contenido, orientacion=orientacion
        )
        return CrearPlantilla(plantilla=plantilla, ok=True, error=None) # type: ignore

class EditarPlantilla(graphene.Mutation):
    class Arguments:
        id_plantilla = graphene.ID(required=True)
        descripcion = graphene.String()
        contenido = graphene.String()
        orientacion = graphene.String()
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

        for field in ['descripcion', 'contenido', 'orientacion', 'estado']:
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
        id_oferta = graphene.ID(required=True)

    ok = graphene.Boolean()
    error = graphene.String()
    ganadores = graphene.List(CandidatoPremioType)
    empates = graphene.List(CandidatoPremioType)

    @staticmethod
    def mutate(root, info, id_oferta):
        try:
            oferta = Oferta.objects.select_related(
                'categoria_evento__evento',
                'modalidad_area__area'
            ).get(pk=id_oferta)
        except Oferta.DoesNotExist:
            return CerrarActaResultados(ok=False, error="La oferta no existe.", ganadores=[], empates=[]) # type: ignore

        evento = oferta.categoria_evento.evento
        area = oferta.modalidad_area.area

        # Premios de esta oferta ordenados por lugar (numero_ganadores = posición)
        premios_list = list(Premio.objects.filter(
            evento=evento, area=area, estado=True
        ).order_by('numero_ganadores'))

        if not premios_list:
            return CerrarActaResultados(ok=False, error="No hay premios configurados para esta oferta.", ganadores=[], empates=[]) # type: ignore

        # Actas de proyectos de esta oferta, ordenadas por nota descendente
        actas_list = list(ActaEvaluacion.objects.filter(
            proyecto__oferta_ea_carrera__oferta=oferta,
            estado=True,
        ).order_by('-nota_final').select_related('proyecto'))

        if not actas_list:
            return CerrarActaResultados(ok=False, error="No hay proyectos evaluados para esta oferta.", ganadores=[], empates=[]) # type: ignore

        # Agrupar actas por nota (misma nota = empate en ese lugar)
        rank_groups = []
        current_nota = None
        for acta in actas_list:
            if acta.nota_final != current_nota:
                rank_groups.append([])
                current_nota = acta.nota_final
            rank_groups[-1].append(acta)

        ganadores_resultado = []
        empates_resultado = []

        # Premios que ya tienen ganador confirmado → excluir del procesamiento
        premios_ya_cerrados = set(
            GanadorPremio.objects.filter(
                candidato_premio__premio__in=premios_list,
                estado=True
            ).values_list('candidato_premio__premio_id', flat=True)
        )

        # Premios pendientes (sin ganador) ordenados por posición
        premios_pendientes = [p for p in premios_list if p.pk not in premios_ya_cerrados]

        # Devolver ganadores existentes sin reasignar
        for gp in GanadorPremio.objects.filter(
            candidato_premio__premio__in=premios_list, estado=True
        ).select_related('candidato_premio'):
            ganadores_resultado.append(gp.candidato_premio)

        if not premios_pendientes:
            return CerrarActaResultados(ok=True, error=None, ganadores=ganadores_resultado, empates=[]) # type: ignore

        # Proyectos ya asignados como ganadores en esta oferta (no reasignar)
        proyectos_ya_ganadores = set(
            cp.proyecto_id for cp in CandidatoPremio.objects.filter(
                premio__in=premios_list, estado='ganador'
            )
        )

        # Rank groups excluyendo proyectos ya ganadores
        actas_disponibles = [a for a in actas_list if a.proyecto_id not in proyectos_ya_ganadores]

        rank_groups_disponibles = []
        current_nota = None
        for acta in actas_disponibles:
            if acta.nota_final != current_nota:
                rank_groups_disponibles.append([])
                current_nota = acta.nota_final
            rank_groups_disponibles[-1].append(acta)

        for i, premio in enumerate(premios_pendientes):
            if i >= len(rank_groups_disponibles):
                break

            group = rank_groups_disponibles[i]

            if len(group) == 1:
                # Sin empate — asignar automáticamente como ganador
                acta = group[0]
                candidato, created = CandidatoPremio.objects.get_or_create(
                    premio=premio, proyecto=acta.proyecto,
                    defaults={
                        'acta_evaluacion': acta,
                        'nota': acta.nota_final,
                        'observacion': acta.observacion or '',
                        'estado': 'ganador',
                        'activo': True,
                    }
                )
                if not created:
                    candidato.estado = 'ganador'
                    candidato.activo = True
                    candidato.save()
                GanadorPremio.objects.get_or_create(candidato_premio=candidato)
                ganadores_resultado.append(candidato)
            else:
                # Empate — crear candidatos para resolución manual
                for acta in group:
                    candidato, created = CandidatoPremio.objects.get_or_create(
                        premio=premio, proyecto=acta.proyecto,
                        defaults={
                            'acta_evaluacion': acta,
                            'nota': acta.nota_final,
                            'observacion': acta.observacion or '',
                            'estado': 'candidato',
                            'activo': True,
                        }
                    )
                    if not created and candidato.estado == 'descartado':
                        candidato.estado = 'candidato'
                        candidato.activo = True
                        candidato.save()
                    empates_resultado.append(candidato)

        return CerrarActaResultados(ok=True, error=None, ganadores=ganadores_resultado, empates=empates_resultado) # type: ignore


# ================= MUTACIONES División de Premio =================

class AsignacionInput(graphene.InputObjectType):
    id_participante = graphene.ID(required=True)
    monto_asignado  = graphene.Float(required=True)
    porcentaje      = graphene.Float(required=True)
    observacion     = graphene.String()


class GuardarDivisionPremio(graphene.Mutation):
    """Crea o reemplaza la división del monto entre los participantes de un ganador."""
    class Arguments:
        id_ganador_premio = graphene.ID(required=True)
        asignaciones      = graphene.List(graphene.NonNull(AsignacionInput), required=True)

    ok    = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_ganador_premio, asignaciones):
        from decimal import Decimal
        from apps.usuarios.models import Participante

        try:
            ganador = GanadorPremio.objects.select_related(
                'candidato_premio__premio'
            ).get(pk=id_ganador_premio)
        except GanadorPremio.DoesNotExist:
            return GuardarDivisionPremio(ok=False, error="El ganador no existe.") # type: ignore

        # Bloquear si ya fue impresa
        if AsignacionPremio.objects.filter(ganador_premio=ganador, impresa=True).exists():
            return GuardarDivisionPremio(ok=False, error="La división ya fue impresa y no puede modificarse.") # type: ignore

        monto_total = ganador.candidato_premio.premio.monto
        if monto_total is None:
            return GuardarDivisionPremio(ok=False, error="El premio no tiene monto monetario.") # type: ignore

        if not asignaciones:
            return GuardarDivisionPremio(ok=False, error="Debe incluir al menos una asignación.") # type: ignore

        # Validar suma
        suma = sum(Decimal(str(a.monto_asignado)) for a in asignaciones)
        if abs(suma - monto_total) > Decimal('0.02'):
            return GuardarDivisionPremio( # type: ignore
                ok=False,
                error=f"La suma de asignaciones (Bs. {suma}) no coincide con el monto total (Bs. {monto_total}).",
            )

        # Actualización de asignaciones sin borrar para no perder estado de pago
        actuales = AsignacionPremio.objects.filter(ganador_premio=ganador, impresa=False)
        actuales_dict = {a.participante_id: a for a in actuales}
        nuevos_participantes = set(int(a.id_participante) for a in asignaciones)

        # Eliminar solo las asignaciones de participantes que ya no están en la lista
        for a in actuales:
            if a.participante_id not in nuevos_participantes:
                a.delete()

        # Actualizar o crear las nuevas asignaciones
        for a in asignaciones:
            pid = int(a.id_participante)
            if pid in actuales_dict:
                asig = actuales_dict[pid]
                asig.monto_asignado = Decimal(str(a.monto_asignado))
                asig.porcentaje = Decimal(str(a.porcentaje))
                asig.observacion = a.observacion or ''
                asig.save()
            else:
                try:
                    participante = Participante.objects.get(pk=pid)
                except Participante.DoesNotExist:
                    return GuardarDivisionPremio(ok=False, error=f"Participante {pid} no existe.") # type: ignore

            AsignacionPremio.objects.create(
                ganador_premio=ganador,
                participante=participante,
                monto_asignado=Decimal(str(a.monto_asignado)),
                porcentaje=Decimal(str(a.porcentaje)),
                observacion=a.observacion or '',
            )

        return GuardarDivisionPremio(ok=True, error=None) # type: ignore


class MarcarDivisionImpresa(graphene.Mutation):
    """Bloquea la división marcando todas las asignaciones como impresas."""
    class Arguments:
        id_ganador_premio = graphene.ID(required=True)

    ok    = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_ganador_premio):
        try:
            ganador = GanadorPremio.objects.get(pk=id_ganador_premio)
        except GanadorPremio.DoesNotExist:
            return MarcarDivisionImpresa(ok=False, error="El ganador no existe.") # type: ignore

        updated = AsignacionPremio.objects.filter(
            ganador_premio=ganador, estado=True
        ).update(impresa=True)

        if updated == 0:
            return MarcarDivisionImpresa(ok=False, error="No hay asignaciones para marcar.") # type: ignore

        return MarcarDivisionImpresa(ok=True, error=None) # type: ignore


class SubirQrAsignacion(graphene.Mutation):
    """El participante sube su imagen de QR (base64) para recibir el pago."""
    class Arguments:
        id_asignacion_premio = graphene.ID(required=True)
        qr_base64 = graphene.String(required=True)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_asignacion_premio, qr_base64):
        print(f"[MUTATION] SubirQrAsignacion iniciada para asignación ID={id_asignacion_premio}")
        try:
            asig = AsignacionPremio.objects.get(pk=id_asignacion_premio, estado=True)
            asig.qr_imagen = qr_base64
            print(f"[MUTATION] SubirQrAsignacion antes del save() - QR length: {len(qr_base64)}")
            asig.save()
            print(f"[MUTATION] SubirQrAsignacion después del save() exitoso")
            return SubirQrAsignacion(ok=True, error=None)  # type: ignore
        except AsignacionPremio.DoesNotExist:
            print("[MUTATION] SubirQrAsignacion FALLO: Asignación no encontrada")
            return SubirQrAsignacion(ok=False, error="Asignación no encontrada.")  # type: ignore
        except Exception as e:
            print(f"[MUTATION] SubirQrAsignacion FALLO: Excepción {str(e)}")
            return SubirQrAsignacion(ok=False, error=str(e))  # type: ignore


class ConfigurarMetodoPago(graphene.Mutation):
    """El administrador establece el método de pago (qr/efectivo) para una asignación."""
    class Arguments:
        id_asignacion_premio = graphene.ID(required=True)
        metodo_pago = graphene.String(required=True)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_asignacion_premio, metodo_pago):
        print(f"[MUTATION] ConfigurarMetodoPago iniciada: asignación ID={id_asignacion_premio}, método={metodo_pago}")
        if metodo_pago not in ('qr', 'efectivo', 'pendiente'):
            return ConfigurarMetodoPago(ok=False, error="Método de pago inválido.")  # type: ignore
        try:
            asig = AsignacionPremio.objects.get(pk=id_asignacion_premio, estado=True)
            asig.metodo_pago = metodo_pago
            if asig.estado_pago == 'sin_configurar':
                asig.estado_pago = 'configurado'
            print(f"[MUTATION] ConfigurarMetodoPago antes del save() - Estado a guardar: {asig.estado_pago}")
            asig.save()
            print(f"[MUTATION] ConfigurarMetodoPago después del save() exitoso")
            return ConfigurarMetodoPago(ok=True, error=None)  # type: ignore
        except AsignacionPremio.DoesNotExist:
            print("[MUTATION] ConfigurarMetodoPago FALLO: Asignación no encontrada")
            return ConfigurarMetodoPago(ok=False, error="Asignación no encontrada.")  # type: ignore
        except Exception as e:
            print(f"[MUTATION] ConfigurarMetodoPago FALLO: Excepción {str(e)}")
            return ConfigurarMetodoPago(ok=False, error=str(e))  # type: ignore


class MarcarAsignacionPagada(graphene.Mutation):
    """El administrador marca una asignación como pagada."""
    class Arguments:
        id_asignacion_premio = graphene.ID(required=True)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_asignacion_premio):
        from django.utils import timezone
        print(f"[MUTATION] MarcarAsignacionPagada iniciada para asignación ID={id_asignacion_premio}")
        try:
            asig = AsignacionPremio.objects.get(pk=id_asignacion_premio, estado=True)
            asig.estado_pago = 'pagado'
            asig.fecha_pago = timezone.now()
            print(f"[MUTATION] MarcarAsignacionPagada antes del save()")
            asig.save()
            print(f"[MUTATION] MarcarAsignacionPagada después del save() exitoso")
            return MarcarAsignacionPagada(ok=True, error=None)  # type: ignore
        except AsignacionPremio.DoesNotExist:
            print("[MUTATION] MarcarAsignacionPagada FALLO: Asignación no encontrada")
            return MarcarAsignacionPagada(ok=False, error="Asignación no encontrada.")  # type: ignore
        except Exception as e:
            print(f"[MUTATION] MarcarAsignacionPagada FALLO: Excepción {str(e)}")
            return MarcarAsignacionPagada(ok=False, error=str(e))  # type: ignore


class SubirComprobantePago(graphene.Mutation):
    """El administrador sube la foto/captura del comprobante de pago (base64)."""
    class Arguments:
        id_asignacion_premio = graphene.ID(required=True)
        comprobante_base64   = graphene.String(required=True)
    ok    = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_asignacion_premio, comprobante_base64):
        print(f"[MUTATION] SubirComprobantePago iniciada para asignación ID={id_asignacion_premio}")
        try:
            asig = AsignacionPremio.objects.get(pk=id_asignacion_premio, estado=True)
            asig.comprobante_pago_imagen = comprobante_base64
            print(f"[MUTATION] SubirComprobantePago antes del save() - Base64 length: {len(comprobante_base64)}")
            asig.save()
            print(f"[MUTATION] SubirComprobantePago después del save() exitoso")
            return SubirComprobantePago(ok=True, error=None)  # type: ignore
        except AsignacionPremio.DoesNotExist:
            print("[MUTATION] SubirComprobantePago FALLO: Asignación no encontrada")
            return SubirComprobantePago(ok=False, error="Asignación no encontrada.")  # type: ignore
        except Exception as e:
            print(f"[MUTATION] SubirComprobantePago FALLO: Excepción {str(e)}")
            return SubirComprobantePago(ok=False, error=str(e))  # type: ignore


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

    guardar_division_premio  = GuardarDivisionPremio.Field()
    marcar_division_impresa  = MarcarDivisionImpresa.Field()

    subir_qr_asignacion      = SubirQrAsignacion.Field()
    configurar_metodo_pago   = ConfigurarMetodoPago.Field()
    marcar_asignacion_pagada = MarcarAsignacionPagada.Field()
    subir_comprobante_pago   = SubirComprobantePago.Field()
