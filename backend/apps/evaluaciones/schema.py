import graphene
from graphene_django import DjangoObjectType
from apps.evaluaciones.models import (
    PlanillaEvaluativa, Seccion, Criterio, ActaEvaluacion,
    DetalleEvaluacion, PuntuacionCriterio
)
from apps.proyectos.models import Proyecto
from apps.usuarios.models import Tribunal
from config.fcm import send_push

class PlanillaEvaluativaType(DjangoObjectType):
    class Meta:
        model = PlanillaEvaluativa
        fields = '__all__'

    secciones = graphene.List(lambda: SeccionType)

    def resolve_secciones(root, info):
        return root.secciones.all()


class SeccionType(DjangoObjectType):
    class Meta:
        model = Seccion
        fields = '__all__'

    criterios = graphene.List(lambda: CriterioType)

    def resolve_criterios(root, info):
        return root.criterios.all()


class CriterioType(DjangoObjectType):
    class Meta:
        model = Criterio
        fields = '__all__'


class ActaEvaluacionType(DjangoObjectType):
    class Meta:
        model = ActaEvaluacion
        fields = '__all__'

    detalles_evaluacion = graphene.List(lambda: DetalleEvaluacionType)

    def resolve_detalles_evaluacion(root, info):
        return root.detalles_evaluacion.all()


class DetalleEvaluacionType(DjangoObjectType):
    ya_evaluo = graphene.Boolean()

    class Meta:
        model = DetalleEvaluacion
        fields = '__all__'

    puntuaciones_criterio = graphene.List(lambda: PuntuacionCriterioType)

    def resolve_puntuaciones_criterio(root, info):
        return root.puntuaciones_criterio.all()

    def resolve_ya_evaluo(root, info):
        return root.puntuacion is not None and root.puntuacion > 0


class PuntuacionCriterioType(DjangoObjectType):
    class Meta:
        model = PuntuacionCriterio
        fields = '__all__'

class Query(graphene.ObjectType):
    todas_las_planillas = graphene.List(PlanillaEvaluativaType)
    planilla = graphene.Field(PlanillaEvaluativaType, id=graphene.ID(required=True))

    todas_las_secciones = graphene.List(SeccionType)
    seccion = graphene.Field(SeccionType, id=graphene.ID(required=True))

    todos_los_criterios = graphene.List(CriterioType)
    criterio = graphene.Field(CriterioType, id=graphene.ID(required=True))

    todas_las_actas = graphene.List(ActaEvaluacionType)
    acta = graphene.Field(ActaEvaluacionType, id=graphene.ID(required=True))

    todos_los_detalles_evaluacion = graphene.List(DetalleEvaluacionType)
    detalle_evaluacion = graphene.Field(DetalleEvaluacionType, id=graphene.ID(required=True))

    todas_las_puntuaciones_criterios = graphene.List(PuntuacionCriterioType)
    puntuacion_criterio = graphene.Field(PuntuacionCriterioType, id=graphene.ID(required=True))

    mis_proyectos_asignados = graphene.List(DetalleEvaluacionType)

    def resolve_mis_proyectos_asignados(root, info):
        user = info.context.user
        if not user.is_authenticated:
            return []
        try:
            tribunal = user.tribunal
        except Exception:
            return []
        return DetalleEvaluacion.objects.filter(
            tribunal=tribunal,
            estado=True
        ).select_related(
            'acta_evaluacion__proyecto__oferta_ea_carrera',
            'acta_evaluacion__planilla_evaluativa',
        )

    def resolve_todas_las_planillas(root, info):
        return PlanillaEvaluativa.objects.all()

    def resolve_planilla(root, info, id):
        try:
            return PlanillaEvaluativa.objects.get(pk=id)
        except PlanillaEvaluativa.DoesNotExist:
            return None

    def resolve_todas_las_secciones(root, info):
        return Seccion.objects.select_related('planilla_evaluativa').all()

    def resolve_seccion(root, info, id):
        try:
            return Seccion.objects.get(pk=id)
        except Seccion.DoesNotExist:
            return None

    def resolve_todos_los_criterios(root, info):
        return Criterio.objects.select_related('seccion').all()

    def resolve_criterio(root, info, id):
        try:
            return Criterio.objects.get(pk=id)
        except Criterio.DoesNotExist:
            return None

    def resolve_todas_las_actas(root, info):
        return ActaEvaluacion.objects.select_related('planilla_evaluativa', 'proyecto').all()

    def resolve_acta(root, info, id):
        try:
            return ActaEvaluacion.objects.get(pk=id)
        except ActaEvaluacion.DoesNotExist:
            return None

    def resolve_todos_los_detalles_evaluacion(root, info):
        return DetalleEvaluacion.objects.select_related('acta_evaluacion', 'tribunal').all()

    def resolve_detalle_evaluacion(root, info, id):
        try:
            return DetalleEvaluacion.objects.get(pk=id)
        except DetalleEvaluacion.DoesNotExist:
            return None

    def resolve_todas_las_puntuaciones_criterios(root, info):
        return PuntuacionCriterio.objects.select_related('detalle_evaluacion', 'criterio').all()

    def resolve_puntuacion_criterio(root, info, id):
        try:
            return PuntuacionCriterio.objects.get(pk=id)
        except PuntuacionCriterio.DoesNotExist:
            return None


# ================= MUTACIONES PlanillaEvaluativa =================
class CrearPlanillaEvaluativa(graphene.Mutation):
    class Arguments:
        nombre = graphene.String(required=True)
        nota_maxima = graphene.Decimal(required=True)

    planilla = graphene.Field(PlanillaEvaluativaType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, nombre, nota_maxima):
        planilla = PlanillaEvaluativa.objects.create(nombre=nombre, nota_maxima=nota_maxima)
        return CrearPlanillaEvaluativa(planilla=planilla, ok=True, error=None) # type: ignore

class EditarPlanillaEvaluativa(graphene.Mutation):
    class Arguments:
        id_planilla_evaluativa = graphene.ID(required=True)
        nombre = graphene.String()
        nota_maxima = graphene.Decimal()
        estado = graphene.Boolean()

    planilla = graphene.Field(PlanillaEvaluativaType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_planilla_evaluativa, **kwargs):
        try:
            planilla = PlanillaEvaluativa.objects.get(pk=id_planilla_evaluativa)
        except PlanillaEvaluativa.DoesNotExist:
            return EditarPlanillaEvaluativa(planilla=None, ok=False, error="La planilla no existe.") # type: ignore

        for field in ['nombre', 'nota_maxima', 'estado']:
            if field in kwargs and kwargs[field] is not None:
                setattr(planilla, field, kwargs[field])

        planilla.save()
        return EditarPlanillaEvaluativa(planilla=planilla, ok=True, error=None) # type: ignore

class EliminarPlanillaEvaluativa(graphene.Mutation):
    class Arguments:
        id_planilla_evaluativa = graphene.ID(required=True)

    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_planilla_evaluativa):
        try:
            planilla = PlanillaEvaluativa.objects.get(pk=id_planilla_evaluativa)
        except PlanillaEvaluativa.DoesNotExist:
            return EliminarPlanillaEvaluativa(ok=False, error="La planilla no existe.") # type: ignore

        try:
            from django.db import transaction
            with transaction.atomic():
                # 1. Eliminar actas (cascadea a DetalleEvaluacion y PuntuacionCriterio)
                ActaEvaluacion.objects.filter(planilla_evaluativa=planilla).delete()
                # 2. Eliminar criterios de cada sección (ya sin puntuaciones)
                for seccion in Seccion.objects.filter(planilla_evaluativa=planilla):
                    Criterio.objects.filter(seccion=seccion).delete()
                # 3. Eliminar secciones
                Seccion.objects.filter(planilla_evaluativa=planilla).delete()
                # 4. Eliminar la planilla
                planilla.delete()
            return EliminarPlanillaEvaluativa(ok=True, error=None) # type: ignore
        except Exception as e:
            return EliminarPlanillaEvaluativa(ok=False, error=f"Error al eliminar: {str(e)}") # type: ignore


# ================= MUTACIONES Seccion =================
class CrearSeccion(graphene.Mutation):
    class Arguments:
        id_planilla_evaluativa = graphene.ID(required=True)
        nombre = graphene.String(required=True)
        ponderacion = graphene.Decimal(required=True)

    seccion = graphene.Field(SeccionType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_planilla_evaluativa, nombre, ponderacion):
        try:
            planilla = PlanillaEvaluativa.objects.get(pk=id_planilla_evaluativa)
        except PlanillaEvaluativa.DoesNotExist:
            return CrearSeccion(seccion=None, ok=False, error="La planilla no existe.") # type: ignore

        from decimal import Decimal
        usado = Seccion.objects.filter(planilla_evaluativa=planilla).aggregate(
            total=__import__('django.db.models', fromlist=['Sum']).Sum('ponderacion')
        )['total'] or Decimal('0')
        if usado + Decimal(str(ponderacion)) > Decimal('100'):
            disponible = Decimal('100') - usado
            return CrearSeccion(seccion=None, ok=False, error=f"Supera el 100%. Porcentaje disponible: {disponible:.2f}%") # type: ignore

        seccion = Seccion.objects.create(planilla_evaluativa=planilla, nombre=nombre, ponderacion=ponderacion)
        return CrearSeccion(seccion=seccion, ok=True, error=None) # type: ignore

class EditarSeccion(graphene.Mutation):
    class Arguments:
        id_seccion = graphene.ID(required=True)
        id_planilla_evaluativa = graphene.ID()
        nombre = graphene.String()
        ponderacion = graphene.Decimal()
        estado = graphene.Boolean()

    seccion = graphene.Field(SeccionType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_seccion, **kwargs):
        try:
            seccion = Seccion.objects.get(pk=id_seccion)
        except Seccion.DoesNotExist:
            return EditarSeccion(seccion=None, ok=False, error="La sección no existe.") # type: ignore

        if 'id_planilla_evaluativa' in kwargs and kwargs['id_planilla_evaluativa'] is not None:
            try:
                seccion.planilla_evaluativa = PlanillaEvaluativa.objects.get(pk=kwargs['id_planilla_evaluativa'])
            except PlanillaEvaluativa.DoesNotExist:
                return EditarSeccion(seccion=None, ok=False, error="La planilla no existe.") # type: ignore

        if 'ponderacion' in kwargs and kwargs['ponderacion'] is not None:
            from decimal import Decimal
            nueva = Decimal(str(kwargs['ponderacion']))
            usado = Seccion.objects.filter(
                planilla_evaluativa=seccion.planilla_evaluativa
            ).exclude(pk=seccion.pk).aggregate(
                total=__import__('django.db.models', fromlist=['Sum']).Sum('ponderacion')
            )['total'] or Decimal('0')
            if usado + nueva > Decimal('100'):
                disponible = Decimal('100') - usado
                return EditarSeccion(seccion=None, ok=False, error=f"Supera el 100%. Porcentaje disponible: {disponible:.2f}%") # type: ignore

        for field in ['nombre', 'ponderacion', 'estado']:
            if field in kwargs and kwargs[field] is not None:
                setattr(seccion, field, kwargs[field])

        seccion.save()
        return EditarSeccion(seccion=seccion, ok=True, error=None) # type: ignore

class EliminarSeccion(graphene.Mutation):
    class Arguments:
        id_seccion = graphene.ID(required=True)

    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_seccion):
        try:
            seccion = Seccion.objects.get(pk=id_seccion)
            seccion.estado = False
            seccion.save()
            return EliminarSeccion(ok=True, error=None) # type: ignore
        except Seccion.DoesNotExist:
            return EliminarSeccion(ok=False, error="La sección no existe.") # type: ignore

class BorrarSeccion(graphene.Mutation):
    """Eliminación permanente de la sección, sus criterios y sus puntuaciones."""
    class Arguments:
        id_seccion = graphene.ID(required=True)

    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_seccion):
        try:
            seccion = Seccion.objects.get(pk=id_seccion)
            # PROTECT en Criterio.seccion y PuntuacionCriterio.criterio obliga
            # a eliminar en orden: puntuaciones → criterios → sección
            PuntuacionCriterio.objects.filter(criterio__in=seccion.criterios.all()).delete()
            seccion.criterios.all().delete()
            seccion.delete()
            return BorrarSeccion(ok=True, error=None) # type: ignore
        except Seccion.DoesNotExist:
            return BorrarSeccion(ok=False, error="La sección no existe.") # type: ignore


# ================= MUTACIONES Criterio =================
class CrearCriterio(graphene.Mutation):
    class Arguments:
        id_seccion = graphene.ID(required=True)
        nombre = graphene.String(required=True)
        puntaje = graphene.Decimal(required=True)

    criterio = graphene.Field(CriterioType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_seccion, nombre, puntaje):
        try:
            seccion = Seccion.objects.get(pk=id_seccion)
        except Seccion.DoesNotExist:
            return CrearCriterio(criterio=None, ok=False, error="La sección no existe.") # type: ignore

        from decimal import Decimal
        from django.db.models import Sum
        seccion_max = seccion.planilla_evaluativa.nota_maxima * seccion.ponderacion / Decimal('100')
        usado = Criterio.objects.filter(seccion=seccion).aggregate(total=Sum('puntaje'))['total'] or Decimal('0')
        if usado + Decimal(str(puntaje)) > seccion_max:
            disponible = seccion_max - usado
            return CrearCriterio(criterio=None, ok=False, error=f"Supera el límite de la sección ({seccion_max:.2f} pts). Disponible: {disponible:.2f} pts") # type: ignore

        criterio = Criterio.objects.create(seccion=seccion, nombre=nombre, puntaje=puntaje)
        return CrearCriterio(criterio=criterio, ok=True, error=None) # type: ignore

class EditarCriterio(graphene.Mutation):
    class Arguments:
        id_criterio = graphene.ID(required=True)
        id_seccion = graphene.ID()
        nombre = graphene.String()
        puntaje = graphene.Decimal()
        estado = graphene.Boolean()

    criterio = graphene.Field(CriterioType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_criterio, **kwargs):
        try:
            criterio = Criterio.objects.get(pk=id_criterio)
        except Criterio.DoesNotExist:
            return EditarCriterio(criterio=None, ok=False, error="El criterio no existe.") # type: ignore

        if 'id_seccion' in kwargs and kwargs['id_seccion'] is not None:
            try:
                criterio.seccion = Seccion.objects.get(pk=kwargs['id_seccion'])
            except Seccion.DoesNotExist:
                return EditarCriterio(criterio=None, ok=False, error="La sección no existe.") # type: ignore

        if 'puntaje' in kwargs and kwargs['puntaje'] is not None:
            from decimal import Decimal
            from django.db.models import Sum
            nuevo = Decimal(str(kwargs['puntaje']))
            seccion = criterio.seccion
            seccion_max = seccion.planilla_evaluativa.nota_maxima * seccion.ponderacion / Decimal('100')
            usado = Criterio.objects.filter(seccion=seccion).exclude(pk=criterio.pk).aggregate(total=Sum('puntaje'))['total'] or Decimal('0')
            if usado + nuevo > seccion_max:
                disponible = seccion_max - usado
                return EditarCriterio(criterio=None, ok=False, error=f"Supera el límite de la sección ({seccion_max:.2f} pts). Disponible: {disponible:.2f} pts") # type: ignore

        for field in ['nombre', 'puntaje', 'estado']:
            if field in kwargs and kwargs[field] is not None:
                setattr(criterio, field, kwargs[field])

        criterio.save()
        return EditarCriterio(criterio=criterio, ok=True, error=None) # type: ignore

class EliminarCriterio(graphene.Mutation):
    class Arguments:
        id_criterio = graphene.ID(required=True)

    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_criterio):
        try:
            criterio = Criterio.objects.get(pk=id_criterio)
            criterio.estado = False
            criterio.save()
            return EliminarCriterio(ok=True, error=None) # type: ignore
        except Criterio.DoesNotExist:
            return EliminarCriterio(ok=False, error="El criterio no existe.") # type: ignore

class BorrarCriterio(graphene.Mutation):
    """Eliminación permanente del criterio y sus puntuaciones."""
    class Arguments:
        id_criterio = graphene.ID(required=True)

    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_criterio):
        try:
            criterio = Criterio.objects.get(pk=id_criterio)
            # PROTECT en PuntuacionCriterio.criterio obliga a eliminar
            # las puntuaciones antes de poder borrar el criterio
            criterio.puntuaciones_criterio.all().delete()
            criterio.delete()
            return BorrarCriterio(ok=True, error=None) # type: ignore
        except Criterio.DoesNotExist:
            return BorrarCriterio(ok=False, error="El criterio no existe.") # type: ignore


# ================= MUTACIONES ActaEvaluacion =================
class CrearActaEvaluacion(graphene.Mutation):
    class Arguments:
        id_planilla_evaluativa = graphene.ID(required=True)
        id_proyecto = graphene.ID(required=True)
        nota_final = graphene.Decimal(required=True)
        fecha = graphene.Date(required=True)
        hora_inicio = graphene.Time(required=True)
        hora_fin = graphene.Time(required=True)

    acta = graphene.Field(ActaEvaluacionType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_planilla_evaluativa, id_proyecto, nota_final, fecha, hora_inicio, hora_fin):
        if hora_inicio >= hora_fin:
            return CrearActaEvaluacion(acta=None, ok=False, error="La hora de inicio debe ser anterior a la hora de fin.") # type: ignore

        try:
            planilla = PlanillaEvaluativa.objects.get(pk=id_planilla_evaluativa)
        except PlanillaEvaluativa.DoesNotExist:
            return CrearActaEvaluacion(acta=None, ok=False, error="La planilla no existe.") # type: ignore

        try:
            proyecto = Proyecto.objects.get(pk=id_proyecto)
        except Proyecto.DoesNotExist:
            return CrearActaEvaluacion(acta=None, ok=False, error="El proyecto no existe.") # type: ignore

        if proyecto.estado.lower() != 'aprobado':
            return CrearActaEvaluacion(acta=None, ok=False, error="El proyecto debe estar aprobado para crear un acta de evaluación.") # type: ignore

        if ActaEvaluacion.objects.filter(proyecto=proyecto, planilla_evaluativa=planilla).exists():
            return CrearActaEvaluacion(acta=None, ok=False, error="El proyecto ya fue evaluado con esta planilla.") # type: ignore

        acta = ActaEvaluacion.objects.create(
            planilla_evaluativa=planilla, 
            proyecto=proyecto, 
            nota_final=nota_final, 
            fecha=fecha, 
            hora_inicio=hora_inicio, 
            hora_fin=hora_fin
        )
        return CrearActaEvaluacion(acta=acta, ok=True, error=None) # type: ignore

class EditarActaEvaluacion(graphene.Mutation):
    class Arguments:
        id_acta_evaluacion = graphene.ID(required=True)
        id_planilla_evaluativa = graphene.ID()
        id_proyecto = graphene.ID()
        nota_final = graphene.Decimal()
        fecha = graphene.Date()
        hora_inicio = graphene.Time()
        hora_fin = graphene.Time()
        estado = graphene.Boolean()

    acta = graphene.Field(ActaEvaluacionType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_acta_evaluacion, **kwargs):
        try:
            acta = ActaEvaluacion.objects.get(pk=id_acta_evaluacion)
        except ActaEvaluacion.DoesNotExist:
            return EditarActaEvaluacion(acta=None, ok=False, error="El acta no existe.") # type: ignore

        new_inicio = kwargs.get('hora_inicio', acta.hora_inicio)
        new_fin = kwargs.get('hora_fin', acta.hora_fin)
        if new_inicio >= new_fin:
            return EditarActaEvaluacion(acta=None, ok=False, error="La hora de inicio debe ser anterior a la hora de fin.") # type: ignore

        new_planilla_id = kwargs.get('id_planilla_evaluativa', acta.planilla_evaluativa_id)
        new_proyecto_id = kwargs.get('id_proyecto', acta.proyecto_id)
        if 'id_planilla_evaluativa' in kwargs or 'id_proyecto' in kwargs:
            if ActaEvaluacion.objects.filter(proyecto_id=new_proyecto_id, planilla_evaluativa_id=new_planilla_id).exclude(pk=id_acta_evaluacion).exists():
                return EditarActaEvaluacion(acta=None, ok=False, error="El proyecto ya fue evaluado con esta planilla.") # type: ignore

        if 'id_planilla_evaluativa' in kwargs and kwargs['id_planilla_evaluativa'] is not None:
            try:
                acta.planilla_evaluativa = PlanillaEvaluativa.objects.get(pk=kwargs['id_planilla_evaluativa'])
            except PlanillaEvaluativa.DoesNotExist:
                return EditarActaEvaluacion(acta=None, ok=False, error="La planilla no existe.") # type: ignore

        if 'id_proyecto' in kwargs and kwargs['id_proyecto'] is not None:
            try:
                acta.proyecto = Proyecto.objects.get(pk=kwargs['id_proyecto'])
            except Proyecto.DoesNotExist:
                return EditarActaEvaluacion(acta=None, ok=False, error="El proyecto no existe.") # type: ignore

        for field in ['nota_final', 'fecha', 'hora_inicio', 'hora_fin', 'estado']:
            if field in kwargs and kwargs[field] is not None:
                setattr(acta, field, kwargs[field])

        acta.save()
        return EditarActaEvaluacion(acta=acta, ok=True, error=None) # type: ignore

class EliminarActaEvaluacion(graphene.Mutation):
    class Arguments:
        id_acta_evaluacion = graphene.ID(required=True)

    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_acta_evaluacion):
        try:
            acta = ActaEvaluacion.objects.get(pk=id_acta_evaluacion)
            acta.estado = False
            acta.save()
            return EliminarActaEvaluacion(ok=True, error=None) # type: ignore
        except ActaEvaluacion.DoesNotExist:
            return EliminarActaEvaluacion(ok=False, error="El acta no existe.") # type: ignore


# ================= MUTACIONES DetalleEvaluacion =================
class CrearDetalleEvaluacion(graphene.Mutation):
    class Arguments:
        id_acta_evaluacion = graphene.ID(required=True)
        id_tribunal = graphene.ID(required=True)
        puntuacion = graphene.Decimal(required=True)

    detalle_evaluacion = graphene.Field(DetalleEvaluacionType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_acta_evaluacion, id_tribunal, puntuacion):
        try:
            acta = ActaEvaluacion.objects.get(pk=id_acta_evaluacion)
        except ActaEvaluacion.DoesNotExist:
            return CrearDetalleEvaluacion(detalle_evaluacion=None, ok=False, error="El acta no existe.") # type: ignore

        try:
            tribunal = Tribunal.objects.get(pk=id_tribunal)
        except Tribunal.DoesNotExist:
            return CrearDetalleEvaluacion(detalle_evaluacion=None, ok=False, error="El tribunal no existe.") # type: ignore

        if DetalleEvaluacion.objects.filter(acta_evaluacion=acta, tribunal=tribunal).exists():
            return CrearDetalleEvaluacion(detalle_evaluacion=None, ok=False, error="Este jurado ya ha evaluado esta acta.") # type: ignore

        detalle = DetalleEvaluacion.objects.create(
            acta_evaluacion=acta,
            tribunal=tribunal,
            puntuacion=puntuacion
        )

        if tribunal.fcm_token:
            send_push(
                token=tribunal.fcm_token,
                title='Nuevo proyecto asignado',
                body=(
                    f'Fuiste asignado al proyecto "{acta.proyecto.titulo}". '
                    'Por favor envía tus notas antes de la fecha indicada.'
                ),
            )

        return CrearDetalleEvaluacion(detalle_evaluacion=detalle, ok=True, error=None) # type: ignore

class EditarDetalleEvaluacion(graphene.Mutation):
    class Arguments:
        id_detalle_evaluacion = graphene.ID(required=True)
        id_acta_evaluacion = graphene.ID()
        id_tribunal = graphene.ID()
        puntuacion = graphene.Decimal()
        estado = graphene.Boolean()

    detalle_evaluacion = graphene.Field(DetalleEvaluacionType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_detalle_evaluacion, **kwargs):
        try:
            detalle = DetalleEvaluacion.objects.get(pk=id_detalle_evaluacion)
        except DetalleEvaluacion.DoesNotExist:
            return EditarDetalleEvaluacion(detalle_evaluacion=None, ok=False, error="El detalle no existe.") # type: ignore

        new_acta_id = kwargs.get('id_acta_evaluacion', detalle.acta_evaluacion_id)
        new_tribunal_id = kwargs.get('id_tribunal', detalle.tribunal_id)
        if 'id_acta_evaluacion' in kwargs or 'id_tribunal' in kwargs:
            if DetalleEvaluacion.objects.filter(acta_evaluacion_id=new_acta_id, tribunal_id=new_tribunal_id).exclude(pk=id_detalle_evaluacion).exists():
                return EditarDetalleEvaluacion(detalle_evaluacion=None, ok=False, error="Este jurado ya ha evaluado esta acta.") # type: ignore

        if 'id_acta_evaluacion' in kwargs and kwargs['id_acta_evaluacion'] is not None:
            try:
                detalle.acta_evaluacion = ActaEvaluacion.objects.get(pk=kwargs['id_acta_evaluacion'])
            except ActaEvaluacion.DoesNotExist:
                return EditarDetalleEvaluacion(detalle_evaluacion=None, ok=False, error="El acta no existe.") # type: ignore

        if 'id_tribunal' in kwargs and kwargs['id_tribunal'] is not None:
            try:
                detalle.tribunal = Tribunal.objects.get(pk=kwargs['id_tribunal'])
            except Tribunal.DoesNotExist:
                return EditarDetalleEvaluacion(detalle_evaluacion=None, ok=False, error="El tribunal no existe.") # type: ignore

        for field in ['puntuacion', 'estado']:
            if field in kwargs and kwargs[field] is not None:
                setattr(detalle, field, kwargs[field])

        detalle.save()
        return EditarDetalleEvaluacion(detalle_evaluacion=detalle, ok=True, error=None) # type: ignore

class EliminarDetalleEvaluacion(graphene.Mutation):
    class Arguments:
        id_detalle_evaluacion = graphene.ID(required=True)

    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_detalle_evaluacion):
        try:
            detalle = DetalleEvaluacion.objects.get(pk=id_detalle_evaluacion)
            detalle.estado = False
            detalle.save()
            return EliminarDetalleEvaluacion(ok=True, error=None) # type: ignore
        except DetalleEvaluacion.DoesNotExist:
            return EliminarDetalleEvaluacion(ok=False, error="El detalle no existe.") # type: ignore


# ================= MUTACIONES PuntuacionCriterio =================
class CrearPuntuacionCriterio(graphene.Mutation):
    class Arguments:
        id_detalle_evaluacion = graphene.ID(required=True)
        id_criterio = graphene.ID(required=True)
        puntuacion_criterio = graphene.Decimal(required=True)

    puntuacion = graphene.Field(PuntuacionCriterioType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_detalle_evaluacion, id_criterio, puntuacion_criterio):
        try:
            detalle = DetalleEvaluacion.objects.get(pk=id_detalle_evaluacion)
        except DetalleEvaluacion.DoesNotExist:
            return CrearPuntuacionCriterio(puntuacion=None, ok=False, error="El detalle de evaluación no existe.") # type: ignore

        try:
            criterio = Criterio.objects.get(pk=id_criterio)
        except Criterio.DoesNotExist:
            return CrearPuntuacionCriterio(puntuacion=None, ok=False, error="El criterio no existe.") # type: ignore

        if PuntuacionCriterio.objects.filter(detalle_evaluacion=detalle, criterio=criterio).exists():
            return CrearPuntuacionCriterio(puntuacion=None, ok=False, error="Ya existe puntuación para este criterio en este detalle.") # type: ignore

        puntuacion = PuntuacionCriterio.objects.create(
            detalle_evaluacion=detalle,
            criterio=criterio,
            puntuacion_criterio=puntuacion_criterio
        )
        return CrearPuntuacionCriterio(puntuacion=puntuacion, ok=True, error=None) # type: ignore

class EditarPuntuacionCriterio(graphene.Mutation):
    class Arguments:
        id_puntuacion_criterio = graphene.ID(required=True)
        id_detalle_evaluacion = graphene.ID()
        id_criterio = graphene.ID()
        puntuacion_criterio = graphene.Decimal()
        estado = graphene.Boolean()

    puntuacion = graphene.Field(PuntuacionCriterioType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_puntuacion_criterio, **kwargs):
        try:
            puntuacion = PuntuacionCriterio.objects.get(pk=id_puntuacion_criterio)
        except PuntuacionCriterio.DoesNotExist:
            return EditarPuntuacionCriterio(puntuacion=None, ok=False, error="El registro de puntuación no existe.") # type: ignore

        new_detalle_id = kwargs.get('id_detalle_evaluacion', puntuacion.detalle_evaluacion_id)
        new_criterio_id = kwargs.get('id_criterio', puntuacion.criterio_id)
        if 'id_detalle_evaluacion' in kwargs or 'id_criterio' in kwargs:
            if PuntuacionCriterio.objects.filter(detalle_evaluacion_id=new_detalle_id, criterio_id=new_criterio_id).exclude(pk=id_puntuacion_criterio).exists():
                return EditarPuntuacionCriterio(puntuacion=None, ok=False, error="Ya existe puntuación para este criterio en este detalle.") # type: ignore

        if 'id_detalle_evaluacion' in kwargs and kwargs['id_detalle_evaluacion'] is not None:
            try:
                puntuacion.detalle_evaluacion = DetalleEvaluacion.objects.get(pk=kwargs['id_detalle_evaluacion'])
            except DetalleEvaluacion.DoesNotExist:
                return EditarPuntuacionCriterio(puntuacion=None, ok=False, error="El detalle de evaluación no existe.") # type: ignore

        if 'id_criterio' in kwargs and kwargs['id_criterio'] is not None:
            try:
                puntuacion.criterio = Criterio.objects.get(pk=kwargs['id_criterio'])
            except Criterio.DoesNotExist:
                return EditarPuntuacionCriterio(puntuacion=None, ok=False, error="El criterio no existe.") # type: ignore

        for field in ['puntuacion_criterio', 'estado']:
            if field in kwargs and kwargs[field] is not None:
                setattr(puntuacion, field, kwargs[field])

        puntuacion.save()
        return EditarPuntuacionCriterio(puntuacion=puntuacion, ok=True, error=None) # type: ignore

class EliminarPuntuacionCriterio(graphene.Mutation):
    class Arguments:
        id_puntuacion_criterio = graphene.ID(required=True)

    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_puntuacion_criterio):
        try:
            puntuacion = PuntuacionCriterio.objects.get(pk=id_puntuacion_criterio)
            puntuacion.estado = False
            puntuacion.save()
            return EliminarPuntuacionCriterio(ok=True, error=None) # type: ignore
        except PuntuacionCriterio.DoesNotExist:
            return EliminarPuntuacionCriterio(ok=False, error="El registro de puntuación no existe.") # type: ignore


class Mutation(graphene.ObjectType):
    crear_planilla_evaluativa = CrearPlanillaEvaluativa.Field()
    editar_planilla_evaluativa = EditarPlanillaEvaluativa.Field()
    eliminar_planilla_evaluativa = EliminarPlanillaEvaluativa.Field()

    crear_seccion = CrearSeccion.Field()
    editar_seccion = EditarSeccion.Field()
    eliminar_seccion = EliminarSeccion.Field()
    borrar_seccion = BorrarSeccion.Field()

    crear_criterio = CrearCriterio.Field()
    editar_criterio = EditarCriterio.Field()
    eliminar_criterio = EliminarCriterio.Field()
    borrar_criterio = BorrarCriterio.Field()

    crear_acta_evaluacion = CrearActaEvaluacion.Field()
    editar_acta_evaluacion = EditarActaEvaluacion.Field()
    eliminar_acta_evaluacion = EliminarActaEvaluacion.Field()

    crear_detalle_evaluacion = CrearDetalleEvaluacion.Field()
    editar_detalle_evaluacion = EditarDetalleEvaluacion.Field()
    eliminar_detalle_evaluacion = EliminarDetalleEvaluacion.Field()

    crear_puntuacion_criterio = CrearPuntuacionCriterio.Field()
    editar_puntuacion_criterio = EditarPuntuacionCriterio.Field()
    eliminar_puntuacion_criterio = EliminarPuntuacionCriterio.Field()
