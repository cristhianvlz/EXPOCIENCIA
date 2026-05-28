import graphene
from graphene_django import DjangoObjectType
from graphene_file_upload.scalars import Upload

from apps.eventos.models import TipoEvento, NivelEvento, Membrete, Evento, Grupo, Actividad, Cronograma

class TipoEventoType(DjangoObjectType):
    class Meta:
        model = TipoEvento
        fields = '__all__'

class NivelEventoType(DjangoObjectType):
    class Meta:
        model = NivelEvento
        fields = '__all__'

class MembreteType(DjangoObjectType):
    class Meta:
        model = Membrete
        fields = '__all__'

class EventoType(DjangoObjectType):
    class Meta:
        model = Evento
        fields = '__all__'

class GrupoType(DjangoObjectType):
    class Meta:
        model = Grupo
        fields = '__all__'

class ActividadType(DjangoObjectType):
    class Meta:
        model = Actividad
        fields = '__all__'

class CronogramaType(DjangoObjectType):
    class Meta:
        model = Cronograma
        fields = '__all__'

    def resolve_estado(root, info):
        from django.utils import timezone
        if not root.estado:
            return False
        # Solo marcar inactivo automáticamente cuando la fecha_fin ya expiró.
        # Antes de fecha_inicio el cronograma sigue activo (planificado).
        return timezone.now() <= root.fecha_fin

class Query(graphene.ObjectType):
    todos_los_tipos_eventos = graphene.List(TipoEventoType)
    tipo_evento = graphene.Field(TipoEventoType, id=graphene.ID(required=True))

    todos_los_niveles_eventos = graphene.List(NivelEventoType)
    nivel_evento = graphene.Field(NivelEventoType, id=graphene.ID(required=True))

    todos_los_membretes = graphene.List(MembreteType)
    membrete = graphene.Field(MembreteType, id=graphene.ID(required=True))

    todos_los_eventos = graphene.List(EventoType)
    evento = graphene.Field(EventoType, id=graphene.ID(required=True))

    todos_los_grupos = graphene.List(GrupoType)
    grupo = graphene.Field(GrupoType, id=graphene.ID(required=True))

    todas_las_actividades = graphene.List(ActividadType)
    actividad = graphene.Field(ActividadType, id=graphene.ID(required=True))

    todos_los_cronogramas = graphene.List(CronogramaType)
    cronograma = graphene.Field(CronogramaType, id=graphene.ID(required=True))

    def resolve_todos_los_tipos_eventos(root, info):
        return TipoEvento.objects.all()

    def resolve_tipo_evento(root, info, id):
        try:
            return TipoEvento.objects.get(pk=id)
        except TipoEvento.DoesNotExist:
            return None

    def resolve_todos_los_niveles_eventos(root, info):
        return NivelEvento.objects.all()

    def resolve_nivel_evento(root, info, id):
        try:
            return NivelEvento.objects.get(pk=id)
        except NivelEvento.DoesNotExist:
            return None

    def resolve_todos_los_membretes(root, info):
        return Membrete.objects.all()

    def resolve_membrete(root, info, id):
        try:
            return Membrete.objects.get(pk=id)
        except Membrete.DoesNotExist:
            return None

    def resolve_todos_los_eventos(root, info):
        return Evento.objects.select_related('tipo_evento', 'nivel_evento', 'membrete').all()

    def resolve_evento(root, info, id):
        try:
            return Evento.objects.get(pk=id)
        except Evento.DoesNotExist:
            return None

    def resolve_todos_los_grupos(root, info):
        return Grupo.objects.all()

    def resolve_grupo(root, info, id):
        try:
            return Grupo.objects.get(pk=id)
        except Grupo.DoesNotExist:
            return None

    def resolve_todas_las_actividades(root, info):
        return Actividad.objects.select_related('grupo').all()

    def resolve_actividad(root, info, id):
        try:
            return Actividad.objects.get(pk=id)
        except Actividad.DoesNotExist:
            return None

    def resolve_todos_los_cronogramas(root, info):
        return Cronograma.objects.select_related('evento', 'actividad').all()

    def resolve_cronograma(root, info, id):
        try:
            return Cronograma.objects.get(pk=id)
        except Cronograma.DoesNotExist:
            return None

class CrearTipoEvento(graphene.Mutation):
    class Arguments:
        nombre = graphene.String(required=True)

    tipo_evento = graphene.Field(TipoEventoType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, nombre):
        if TipoEvento.objects.filter(nombre=nombre).exists():
            return CrearTipoEvento(tipo_evento=None, ok=False, error="El tipo de evento ya existe.") # type: ignore

        tipo_evento = TipoEvento.objects.create(nombre=nombre)
        return CrearTipoEvento(tipo_evento=tipo_evento, ok=True, error=None) # type: ignore

class EditarTipoEvento(graphene.Mutation):
    class Arguments:
        id_tipo_evento = graphene.ID(required=True)
        nombre = graphene.String()
        estado = graphene.Boolean()

    tipo_evento = graphene.Field(TipoEventoType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_tipo_evento, nombre=None, estado=None):
        try:
            tipo_evento = TipoEvento.objects.get(pk=id_tipo_evento)
        except TipoEvento.DoesNotExist:
            return EditarTipoEvento(tipo_evento=None, ok=False, error="El tipo de evento no existe.") # type: ignore

        if nombre is not None and nombre != tipo_evento.nombre:
            if TipoEvento.objects.filter(nombre=nombre).exists():
                return EditarTipoEvento(tipo_evento=None, ok=False, error="El nombre ya está registrado en otro tipo de evento.") # type: ignore
            tipo_evento.nombre = nombre
            
        if estado is not None:
            tipo_evento.estado = estado

        tipo_evento.save()
        return EditarTipoEvento(tipo_evento=tipo_evento, ok=True, error=None) # type: ignore

class EliminarTipoEvento(graphene.Mutation):
    class Arguments:
        id_tipo_evento = graphene.ID(required=True)

    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_tipo_evento):
        try:
            tipo_evento = TipoEvento.objects.get(pk=id_tipo_evento)
            tipo_evento.estado = False
            tipo_evento.save()
            return EliminarTipoEvento(ok=True, error=None) # type: ignore
        except TipoEvento.DoesNotExist:
            return EliminarTipoEvento(ok=False, error="El tipo de evento no existe.") # type: ignore


class CrearNivelEvento(graphene.Mutation):
    class Arguments:
        nombre = graphene.String(required=True)

    nivel_evento = graphene.Field(NivelEventoType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, nombre):
        if NivelEvento.objects.filter(nombre=nombre).exists():
            return CrearNivelEvento(nivel_evento=None, ok=False, error="El nivel de evento ya existe.") # type: ignore

        nivel_evento = NivelEvento.objects.create(nombre=nombre)
        return CrearNivelEvento(nivel_evento=nivel_evento, ok=True, error=None) # type: ignore

class EditarNivelEvento(graphene.Mutation):
    class Arguments:
        id_nivel_evento = graphene.ID(required=True)
        nombre = graphene.String()
        estado = graphene.Boolean()

    nivel_evento = graphene.Field(NivelEventoType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_nivel_evento, nombre=None, estado=None):
        try:
            nivel_evento = NivelEvento.objects.get(pk=id_nivel_evento)
        except NivelEvento.DoesNotExist:
            return EditarNivelEvento(nivel_evento=None, ok=False, error="El nivel de evento no existe.") # type: ignore

        if nombre is not None and nombre != nivel_evento.nombre:
            if NivelEvento.objects.filter(nombre=nombre).exists():
                return EditarNivelEvento(nivel_evento=None, ok=False, error="El nombre ya está registrado en otro nivel de evento.") # type: ignore
            nivel_evento.nombre = nombre

        if estado is not None:
            nivel_evento.estado = estado

        nivel_evento.save()
        return EditarNivelEvento(nivel_evento=nivel_evento, ok=True, error=None) # type: ignore

class EliminarNivelEvento(graphene.Mutation):
    class Arguments:
        id_nivel_evento = graphene.ID(required=True)

    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_nivel_evento):
        try:
            nivel_evento = NivelEvento.objects.get(pk=id_nivel_evento)
            nivel_evento.estado = False
            nivel_evento.save()
            return EliminarNivelEvento(ok=True, error=None) # type: ignore
        except NivelEvento.DoesNotExist:
            return EliminarNivelEvento(ok=False, error="El nivel de evento no existe.") # type: ignore


class CrearMembrete(graphene.Mutation):
    class Arguments:
        titulo = graphene.String(required=True)
        subtitulo = graphene.String()
        direccion = graphene.String()
        pie_pagina1 = graphene.String()
        pie_pagina2 = graphene.String()
        pie_pagina3 = graphene.String()
        logo_unidad = Upload()
        logo_institucion = Upload()
        firma = Upload()
        sello_autoridad = Upload()

    membrete = graphene.Field(MembreteType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, titulo, subtitulo="", direccion="", pie_pagina1="", pie_pagina2="", pie_pagina3="",
               logo_unidad=None, logo_institucion=None, firma=None, sello_autoridad=None):
        membrete = Membrete(
            titulo=titulo,
            subtitulo=subtitulo,
            direccion=direccion,
            pie_pagina1=pie_pagina1,
            pie_pagina2=pie_pagina2,
            pie_pagina3=pie_pagina3
        )
        if logo_unidad:
            membrete.logo_unidad = logo_unidad
        if logo_institucion:
            membrete.logo_institucion = logo_institucion
        if firma:
            membrete.firma = firma
        if sello_autoridad:
            membrete.sello_autoridad = sello_autoridad
        membrete.save()
        return CrearMembrete(membrete=membrete, ok=True, error=None) # type: ignore

class EditarMembrete(graphene.Mutation):
    class Arguments:
        id_membrete = graphene.ID(required=True)
        titulo = graphene.String()
        subtitulo = graphene.String()
        direccion = graphene.String()
        pie_pagina1 = graphene.String()
        pie_pagina2 = graphene.String()
        pie_pagina3 = graphene.String()
        estado = graphene.Boolean()
        logo_unidad = Upload()
        logo_institucion = Upload()
        firma = Upload()
        sello_autoridad = Upload()

    membrete = graphene.Field(MembreteType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_membrete, **kwargs):
        try:
            membrete = Membrete.objects.get(pk=id_membrete)
        except Membrete.DoesNotExist:
            return EditarMembrete(membrete=None, ok=False, error="El membrete no existe.") # type: ignore

        for field in ['titulo', 'subtitulo', 'direccion', 'pie_pagina1', 'pie_pagina2', 'pie_pagina3', 'estado']:
            if field in kwargs and kwargs[field] is not None:
                setattr(membrete, field, kwargs[field])

        for img_field in ['logo_unidad', 'logo_institucion', 'firma', 'sello_autoridad']:
            if img_field in kwargs and kwargs[img_field] is not None:
                setattr(membrete, img_field, kwargs[img_field])

        membrete.save()
        return EditarMembrete(membrete=membrete, ok=True, error=None) # type: ignore

class EliminarMembrete(graphene.Mutation):
    class Arguments:
        id_membrete = graphene.ID(required=True)

    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_membrete):
        try:
            membrete = Membrete.objects.get(pk=id_membrete)
            membrete.estado = False
            membrete.save()
            return EliminarMembrete(ok=True, error=None) # type: ignore
        except Membrete.DoesNotExist:
            return EliminarMembrete(ok=False, error="El membrete no existe.") # type: ignore


class CrearEvento(graphene.Mutation):
    class Arguments:
        id_tipo_evento = graphene.ID(required=True)
        id_nivel_evento = graphene.ID(required=True)
        id_membrete = graphene.ID(required=True)
        nombre = graphene.String(required=True)
        version = graphene.Int(required=True)
        gestion = graphene.Int(required=True)

    evento = graphene.Field(EventoType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_tipo_evento, id_nivel_evento, id_membrete, nombre, version, gestion):
        if Evento.objects.filter(nombre=nombre, version=version, gestion=gestion).exists():
            return CrearEvento(evento=None, ok=False, error="Ya existe un evento con este nombre, versión y gestión.") # type: ignore

        try:
            tipo_evento = TipoEvento.objects.get(pk=id_tipo_evento)
        except TipoEvento.DoesNotExist:
            return CrearEvento(evento=None, ok=False, error="El tipo de evento no existe.") # type: ignore
            
        try:
            nivel_evento = NivelEvento.objects.get(pk=id_nivel_evento)
        except NivelEvento.DoesNotExist:
            return CrearEvento(evento=None, ok=False, error="El nivel de evento no existe.") # type: ignore
            
        try:
            membrete = Membrete.objects.get(pk=id_membrete)
        except Membrete.DoesNotExist:
            return CrearEvento(evento=None, ok=False, error="El membrete no existe.") # type: ignore

        evento = Evento.objects.create(
            tipo_evento=tipo_evento,
            nivel_evento=nivel_evento,
            membrete=membrete,
            nombre=nombre,
            version=version,
            gestion=gestion
        )
        return CrearEvento(evento=evento, ok=True, error=None) # type: ignore

class EditarEvento(graphene.Mutation):
    class Arguments:
        id_evento = graphene.ID(required=True)
        id_tipo_evento = graphene.ID()
        id_nivel_evento = graphene.ID()
        id_membrete = graphene.ID()
        nombre = graphene.String()
        version = graphene.Int()
        gestion = graphene.Int()
        estado = graphene.Boolean()

    evento = graphene.Field(EventoType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_evento, **kwargs):
        try:
            evento = Evento.objects.get(pk=id_evento)
        except Evento.DoesNotExist:
            return EditarEvento(evento=None, ok=False, error="El evento no existe.") # type: ignore

        new_nombre = kwargs.get('nombre', evento.nombre)
        new_version = kwargs.get('version', evento.version)
        new_gestion = kwargs.get('gestion', evento.gestion)
        
        if 'nombre' in kwargs or 'version' in kwargs or 'gestion' in kwargs:
            if Evento.objects.filter(nombre=new_nombre, version=new_version, gestion=new_gestion).exclude(pk=id_evento).exists():
                return EditarEvento(evento=None, ok=False, error="Ya existe otro evento con este nombre, versión y gestión.") # type: ignore

        if 'id_tipo_evento' in kwargs and kwargs['id_tipo_evento'] is not None:
            try:
                evento.tipo_evento = TipoEvento.objects.get(pk=kwargs['id_tipo_evento'])
            except TipoEvento.DoesNotExist:
                return EditarEvento(evento=None, ok=False, error="El tipo de evento no existe.") # type: ignore

        if 'id_nivel_evento' in kwargs and kwargs['id_nivel_evento'] is not None:
            try:
                evento.nivel_evento = NivelEvento.objects.get(pk=kwargs['id_nivel_evento'])
            except NivelEvento.DoesNotExist:
                return EditarEvento(evento=None, ok=False, error="El nivel de evento no existe.") # type: ignore

        if 'id_membrete' in kwargs and kwargs['id_membrete'] is not None:
            try:
                evento.membrete = Membrete.objects.get(pk=kwargs['id_membrete'])
            except Membrete.DoesNotExist:
                return EditarEvento(evento=None, ok=False, error="El membrete no existe.") # type: ignore

        for field in ['nombre', 'version', 'gestion', 'estado']:
            if field in kwargs and kwargs[field] is not None:
                setattr(evento, field, kwargs[field])

        evento.save()
        return EditarEvento(evento=evento, ok=True, error=None) # type: ignore

class EliminarEvento(graphene.Mutation):
    class Arguments:
        id_evento = graphene.ID(required=True)

    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_evento):
        try:
            evento = Evento.objects.get(pk=id_evento)
            evento.estado = False
            evento.save()
            return EliminarEvento(ok=True, error=None) # type: ignore
        except Evento.DoesNotExist:
            return EliminarEvento(ok=False, error="El evento no existe.") # type: ignore

class CrearGrupo(graphene.Mutation):
    class Arguments:
        descripcion = graphene.String(required=True)

    grupo = graphene.Field(GrupoType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, descripcion):
        if Grupo.objects.filter(descripcion=descripcion).exists():
            return CrearGrupo(grupo=None, ok=False, error="El grupo ya existe.") # type: ignore

        grupo = Grupo.objects.create(descripcion=descripcion)
        return CrearGrupo(grupo=grupo, ok=True, error=None) # type: ignore

class EditarGrupo(graphene.Mutation):
    class Arguments:
        id_grupo = graphene.ID(required=True)
        descripcion = graphene.String()
        estado = graphene.Boolean()

    grupo = graphene.Field(GrupoType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_grupo, descripcion=None, estado=None):
        try:
            grupo = Grupo.objects.get(pk=id_grupo)
        except Grupo.DoesNotExist:
            return EditarGrupo(grupo=None, ok=False, error="El grupo no existe.") # type: ignore

        if descripcion is not None and descripcion != grupo.descripcion:
            if Grupo.objects.filter(descripcion=descripcion).exists():
                return EditarGrupo(grupo=None, ok=False, error="La descripción ya está registrada en otro grupo.") # type: ignore
            grupo.descripcion = descripcion

        if estado is not None:
            grupo.estado = estado

        grupo.save()
        return EditarGrupo(grupo=grupo, ok=True, error=None) # type: ignore

class EliminarGrupo(graphene.Mutation):
    class Arguments:
        id_grupo = graphene.ID(required=True)

    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_grupo):
        try:
            grupo = Grupo.objects.get(pk=id_grupo)
            grupo.estado = False
            grupo.save()
            return EliminarGrupo(ok=True, error=None) # type: ignore
        except Grupo.DoesNotExist:
            return EliminarGrupo(ok=False, error="El grupo no existe.") # type: ignore

class CrearActividad(graphene.Mutation):
    class Arguments:
        id_grupo = graphene.ID(required=True)
        nombre_actividad = graphene.String(required=True)

    actividad = graphene.Field(ActividadType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_grupo, nombre_actividad):
        try:
            grupo = Grupo.objects.get(pk=id_grupo)
        except Grupo.DoesNotExist:
            return CrearActividad(actividad=None, ok=False, error="El grupo no existe.") # type: ignore

        if Actividad.objects.filter(grupo=grupo, nombre_actividad=nombre_actividad).exists():
            return CrearActividad(actividad=None, ok=False, error="Esta actividad ya existe en este grupo.") # type: ignore

        actividad = Actividad.objects.create(grupo=grupo, nombre_actividad=nombre_actividad)
        return CrearActividad(actividad=actividad, ok=True, error=None) # type: ignore

class EditarActividad(graphene.Mutation):
    class Arguments:
        id_actividad = graphene.ID(required=True)
        id_grupo = graphene.ID()
        nombre_actividad = graphene.String()
        estado = graphene.Boolean()

    actividad = graphene.Field(ActividadType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_actividad, **kwargs):
        try:
            actividad = Actividad.objects.get(pk=id_actividad)
        except Actividad.DoesNotExist:
            return EditarActividad(actividad=None, ok=False, error="La actividad no existe.") # type: ignore

        if 'id_grupo' in kwargs and kwargs['id_grupo'] is not None:
            try:
                actividad.grupo = Grupo.objects.get(pk=kwargs['id_grupo'])
            except Grupo.DoesNotExist:
                return EditarActividad(actividad=None, ok=False, error="El grupo no existe.") # type: ignore

        new_nombre = kwargs.get('nombre_actividad', actividad.nombre_actividad)
        if 'id_grupo' in kwargs or 'nombre_actividad' in kwargs:
            if Actividad.objects.filter(grupo=actividad.grupo, nombre_actividad=new_nombre).exclude(pk=id_actividad).exists():
                return EditarActividad(actividad=None, ok=False, error="Esta actividad ya existe en este grupo.") # type: ignore

        for field in ['nombre_actividad', 'estado']:
            if field in kwargs and kwargs[field] is not None:
                setattr(actividad, field, kwargs[field])

        actividad.save()
        return EditarActividad(actividad=actividad, ok=True, error=None) # type: ignore

class EliminarActividad(graphene.Mutation):
    class Arguments:
        id_actividad = graphene.ID(required=True)

    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_actividad):
        try:
            actividad = Actividad.objects.get(pk=id_actividad)
            actividad.estado = False
            actividad.save()
            return EliminarActividad(ok=True, error=None) # type: ignore
        except Actividad.DoesNotExist:
            return EliminarActividad(ok=False, error="La actividad no existe.") # type: ignore

class CrearCronograma(graphene.Mutation):
    class Arguments:
        id_evento = graphene.ID(required=True)
        id_actividad = graphene.ID(required=True)
        fecha_inicio = graphene.DateTime(required=True)
        fecha_fin = graphene.DateTime(required=True)

    cronograma = graphene.Field(CronogramaType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_evento, id_actividad, fecha_inicio, fecha_fin):
        if fecha_inicio >= fecha_fin:
            return CrearCronograma(cronograma=None, ok=False, error="La fecha de inicio debe ser anterior a la de fin.") # type: ignore

        try:
            evento = Evento.objects.get(pk=id_evento)
        except Evento.DoesNotExist:
            return CrearCronograma(cronograma=None, ok=False, error="El evento no existe.") # type: ignore

        try:
            actividad = Actividad.objects.get(pk=id_actividad)
        except Actividad.DoesNotExist:
            return CrearCronograma(cronograma=None, ok=False, error="La actividad no existe.") # type: ignore

        if Cronograma.objects.filter(evento=evento, actividad=actividad).exists():
            return CrearCronograma(cronograma=None, ok=False, error="Esta actividad ya está programada para este evento.") # type: ignore

        cronograma = Cronograma.objects.create(evento=evento, actividad=actividad, fecha_inicio=fecha_inicio, fecha_fin=fecha_fin)
        return CrearCronograma(cronograma=cronograma, ok=True, error=None) # type: ignore

class EditarCronograma(graphene.Mutation):
    class Arguments:
        id_cronograma = graphene.ID(required=True)
        id_evento = graphene.ID()
        id_actividad = graphene.ID()
        fecha_inicio = graphene.DateTime()
        fecha_fin = graphene.DateTime()
        estado = graphene.Boolean()

    cronograma = graphene.Field(CronogramaType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_cronograma, **kwargs):
        try:
            cronograma = Cronograma.objects.get(pk=id_cronograma)
        except Cronograma.DoesNotExist:
            return EditarCronograma(cronograma=None, ok=False, error="El cronograma no existe.") # type: ignore

        new_inicio = kwargs.get('fecha_inicio', cronograma.fecha_inicio)
        new_fin = kwargs.get('fecha_fin', cronograma.fecha_fin)
        if new_inicio >= new_fin:
            return EditarCronograma(cronograma=None, ok=False, error="La fecha de inicio debe ser anterior a la de fin.") # type: ignore

        if 'id_evento' in kwargs and kwargs['id_evento'] is not None:
            try:
                cronograma.evento = Evento.objects.get(pk=kwargs['id_evento'])
            except Evento.DoesNotExist:
                return EditarCronograma(cronograma=None, ok=False, error="El evento no existe.") # type: ignore

        if 'id_actividad' in kwargs and kwargs['id_actividad'] is not None:
            try:
                cronograma.actividad = Actividad.objects.get(pk=kwargs['id_actividad'])
            except Actividad.DoesNotExist:
                return EditarCronograma(cronograma=None, ok=False, error="La actividad no existe.") # type: ignore

        if 'id_evento' in kwargs or 'id_actividad' in kwargs:
            if Cronograma.objects.filter(evento=cronograma.evento, actividad=cronograma.actividad).exclude(pk=id_cronograma).exists():
                return EditarCronograma(cronograma=None, ok=False, error="Esta actividad ya está programada para este evento.") # type: ignore

        for field in ['fecha_inicio', 'fecha_fin', 'estado']:
            if field in kwargs and kwargs[field] is not None:
                setattr(cronograma, field, kwargs[field])

        cronograma.save()
        return EditarCronograma(cronograma=cronograma, ok=True, error=None) # type: ignore

class EliminarCronograma(graphene.Mutation):
    class Arguments:
        id_cronograma = graphene.ID(required=True)

    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_cronograma):
        try:
            cronograma = Cronograma.objects.get(pk=id_cronograma)
            cronograma.estado = False
            cronograma.save()
            return EliminarCronograma(ok=True, error=None) # type: ignore
        except Cronograma.DoesNotExist:
            return EliminarCronograma(ok=False, error="El cronograma no existe.") # type: ignore


class Mutation(graphene.ObjectType):
    crear_tipo_evento = CrearTipoEvento.Field()
    editar_tipo_evento = EditarTipoEvento.Field()
    eliminar_tipo_evento = EliminarTipoEvento.Field()

    crear_nivel_evento = CrearNivelEvento.Field()
    editar_nivel_evento = EditarNivelEvento.Field()
    eliminar_nivel_evento = EliminarNivelEvento.Field()

    crear_membrete = CrearMembrete.Field()
    editar_membrete = EditarMembrete.Field()
    eliminar_membrete = EliminarMembrete.Field()

    crear_evento = CrearEvento.Field()
    editar_evento = EditarEvento.Field()
    eliminar_evento = EliminarEvento.Field()

    crear_grupo = CrearGrupo.Field()
    editar_grupo = EditarGrupo.Field()
    eliminar_grupo = EliminarGrupo.Field()

    crear_actividad = CrearActividad.Field()
    editar_actividad = EditarActividad.Field()
    eliminar_actividad = EliminarActividad.Field()

    crear_cronograma = CrearCronograma.Field()
    editar_cronograma = EditarCronograma.Field()
    eliminar_cronograma = EliminarCronograma.Field()
