import pyotp
import qrcode
import base64
from io import BytesIO

import graphene
from graphene_django import DjangoObjectType
import graphql_jwt
from django.contrib.auth import authenticate

# pyrefly: ignore [missing-import]
from apps.usuarios.models import (
    Participante,
    ParticipanteExt,
    Permiso,
    Personal,
    Rol,
    RolesPermiso,
    Tribunal,
    Tutor,
    Usuario,
)


# ─────────────────────────────────────────────────────────────────────────────
# Types
# ─────────────────────────────────────────────────────────────────────────────

class PermisoType(DjangoObjectType):
    class Meta:
        model = Permiso
        fields = ('id_permiso', 'code', 'nombre', 'modulo')


class RolType(DjangoObjectType):
    permisos = graphene.List(PermisoType)

    class Meta:
        model = Rol
        fields = ('id_rol', 'nombre')

    def resolve_permisos(root, info):
        return Permiso.objects.filter(roles_permisos__rol=root)


class UsuarioType(DjangoObjectType):
    estado = graphene.Boolean()
    locked_until = graphene.String()
    participante = graphene.Field('apps.usuarios.schema.ParticipanteType')
    tutor = graphene.Field('apps.usuarios.schema.TutorType')
    tribunal = graphene.Field('apps.usuarios.schema.TribunalType')
    personal = graphene.Field('apps.usuarios.schema.PersonalType')

    class Meta:
        model = Usuario
        exclude = (
            'password',
            'is_active',
        )

    def resolve_estado(root, info):
        return root.is_active

    def resolve_locked_until(root, info):
        return root.locked_until.isoformat() if root.locked_until else None

    def resolve_participante(root, info):
        try:
            return root.participante
        except Exception:
            return None

    def resolve_tutor(root, info):
        try:
            return root.tutor
        except Exception:
            return None

    def resolve_tribunal(root, info):
        try:
            return root.tribunal
        except Exception:
            return None

    def resolve_personal(root, info):
        try:
            return root.personal
        except Exception:
            return None


class TribunalType(DjangoObjectType):
    class Meta:
        model = Tribunal
        fields = '__all__'


class TutorType(DjangoObjectType):
    class Meta:
        model = Tutor
        fields = '__all__'


class ParticipanteType(DjangoObjectType):
    class Meta:
        model = Participante
        fields = '__all__'


class ParticipanteExtType(DjangoObjectType):
    class Meta:
        model = ParticipanteExt
        fields = '__all__'


class PersonalType(DjangoObjectType):
    class Meta:
        model = Personal
        fields = '__all__'


# ─────────────────────────────────────────────────────────────────────────────
# Queries
# ─────────────────────────────────────────────────────────────────────────────

class Query(graphene.ObjectType):
    todos_los_roles = graphene.List(RolType)
    todos_los_permisos = graphene.List(PermisoType)
    me_permisos = graphene.List(graphene.String)
    me = graphene.Field(UsuarioType)

    todos_los_usuarios = graphene.List(UsuarioType)
    usuario = graphene.Field(UsuarioType, id=graphene.ID(required=True))

    todos_los_tribunales = graphene.List(TribunalType)
    tribunal = graphene.Field(TribunalType, id=graphene.ID(required=True))

    todos_los_tutores = graphene.List(TutorType)
    tutor = graphene.Field(TutorType, id=graphene.ID(required=True))

    todos_los_participantes = graphene.List(ParticipanteType)
    participante = graphene.Field(ParticipanteType, id=graphene.ID(required=True))

    todos_los_participantes_ext = graphene.List(ParticipanteExtType)
    participante_ext = graphene.Field(ParticipanteExtType, id=graphene.ID(required=True))

    todo_el_personal = graphene.List(PersonalType)
    personal = graphene.Field(PersonalType, id=graphene.ID(required=True))

    def resolve_todos_los_roles(root, info):
        return Rol.objects.all()

    def resolve_todos_los_permisos(root, info):
        return Permiso.objects.all().order_by('modulo', 'nombre')

    def resolve_me_permisos(root, info):
        user = info.context.user
        if not user.is_authenticated:
            return []
        if user.is_superuser:
            return list(Permiso.objects.values_list('code', flat=True))
        if not user.rol_id:
            return []
        return list(
            Permiso.objects.filter(roles_permisos__rol=user.rol)
            .values_list('code', flat=True)
        )

    def resolve_me(root, info):
        user = info.context.user
        if not user.is_authenticated:
            return None
        return user

    def resolve_todos_los_usuarios(root, info):
        return Usuario.objects.all()

    def resolve_usuario(root, info, id):
        try:
            return Usuario.objects.get(pk=id)
        except Usuario.DoesNotExist:
            return None

    def resolve_todos_los_tribunales(root, info):
        # select_related('usuario') resuelve el OneToOneField en una sola
        # query JOIN, eliminando el problema de N+1 queries
        return Tribunal.objects.select_related('usuario').all()

    def resolve_tribunal(root, info, id):
        try:
            return Tribunal.objects.get(pk=id)
        except Tribunal.DoesNotExist:
            return None

    def resolve_todos_los_tutores(root, info):
        return Tutor.objects.select_related('usuario').all()

    def resolve_tutor(root, info, id):
        try:
            return Tutor.objects.get(pk=id)
        except Tutor.DoesNotExist:
            return None

    def resolve_todos_los_participantes(root, info):
        return Participante.objects.select_related('usuario').all()

    def resolve_participante(root, info, id):
        try:
            return Participante.objects.get(pk=id)
        except Participante.DoesNotExist:
            return None

    def resolve_todos_los_participantes_ext(root, info):
        return ParticipanteExt.objects.select_related('participante').all()

    def resolve_participante_ext(root, info, id):
        try:
            return ParticipanteExt.objects.get(pk=id)
        except ParticipanteExt.DoesNotExist:
            return None

    def resolve_todo_el_personal(root, info):
        return Personal.objects.select_related('usuario').all()

    def resolve_personal(root, info, id):
        try:
            return Personal.objects.get(pk=id)
        except Personal.DoesNotExist:
            return None


# ─────────────────────────────────────────────────────────────────────────────
# Mutations
# ─────────────────────────────────────────────────────────────────────────────

import re

def validar_password(password):
    if len(password) < 8:
        return False, "La contraseña debe tener al menos 8 caracteres."
    if not re.search(r'[A-Z]', password):
        return False, "La contraseña debe contener al menos una letra mayúscula."
    if not re.search(r'[a-z]', password):
        return False, "La contraseña debe contener al menos una letra minúscula."
    if not re.search(r'[0-9]', password):
        return False, "La contraseña debe contener al menos un número."
    return True, ""

class CrearUsuario(graphene.Mutation):

    class Arguments:
        # Credenciales obligatorias
        username = graphene.String(required=True)
        email = graphene.String(required=True)
        password = graphene.String(required=True)

    usuario = graphene.Field(UsuarioType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, username, email, password):

        if Usuario.objects.filter(username=username).exists():
            return CrearUsuario( # type: ignore
                usuario=None, ok=False,
                error="El nombre de usuario ya está en uso.",
            )

        if Usuario.objects.filter(email=email).exists():
            return CrearUsuario( # type: ignore
                usuario=None, ok=False,
                error="El correo electrónico ya está registrado.",
            )

        valid, msg = validar_password(password)
        if not valid:
            return CrearUsuario(usuario=None, ok=False, error=msg) # type: ignore

        # create_user() aplica set_password() internamente: nunca texto plano
        usuario = Usuario.objects.create_user(
            username=username,
            email=email,
            password=password,
        )
        return CrearUsuario(usuario=usuario, ok=True, error=None) # type: ignore


class EditarUsuario(graphene.Mutation):
    class Arguments:
        id_usuario = graphene.ID(required=True)
        username = graphene.String()
        email = graphene.String()
        password = graphene.String()
        estado = graphene.Boolean()

    usuario = graphene.Field(UsuarioType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_usuario, username=None, email=None, password=None, estado=None):
        try:
            usuario = Usuario.objects.get(pk=id_usuario)
        except Usuario.DoesNotExist:
            return EditarUsuario( # type: ignore
                usuario=None, ok=False,
                error="El usuario no existe.",
            )

        if username is not None and username != usuario.username:
            if Usuario.objects.filter(username=username).exists():
                return EditarUsuario( # type: ignore
                    usuario=None, ok=False,
                    error="El nombre de usuario ya está en uso.",
                )
            usuario.username = username

        if email is not None and email != usuario.email:
            if Usuario.objects.filter(email=email).exists():
                return EditarUsuario( # type: ignore
                    usuario=None, ok=False,
                    error="El correo electrónico ya está registrado.",
                )
            usuario.email = email

        if password:
            valid, msg = validar_password(password)
            if not valid:
                return EditarUsuario(usuario=None, ok=False, error=msg) # type: ignore
            usuario.set_password(password)

        if estado is not None:
            usuario.estado = estado

        usuario.save()
        return EditarUsuario(usuario=usuario, ok=True, error=None) # type: ignore


class EliminarUsuario(graphene.Mutation):
    class Arguments:
        id_usuario = graphene.ID(required=True)

    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_usuario):
        try:
            usuario = Usuario.objects.get(pk=id_usuario)
            # Soft delete: lo pasamos a inactivo
            usuario.estado = False
            usuario.save()
            return EliminarUsuario(ok=True, error=None) # type: ignore
        except Usuario.DoesNotExist:
            return EliminarUsuario(ok=False, error="El usuario no existe.") # type: ignore


class DesbloquearUsuario(graphene.Mutation):
    class Arguments:
        id_usuario = graphene.ID(required=True)

    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_usuario):
        try:
            usuario = Usuario.objects.get(pk=id_usuario)
            usuario.failed_login_attempts = 0
            usuario.locked_until = None
            usuario.save(update_fields=['failed_login_attempts', 'locked_until'])
            return DesbloquearUsuario(ok=True, error=None) # type: ignore
        except Usuario.DoesNotExist:
            return DesbloquearUsuario(ok=False, error="El usuario no existe.") # type: ignore


class CrearTribunal(graphene.Mutation):
    class Arguments:
        id_usuario = graphene.ID(required=True)
        especialidad = graphene.String(required=True)
        nombre = graphene.String(required=True)
        apellido = graphene.String(required=True)
        celular = graphene.String(required=True)
        ci = graphene.String(required=True)
        expedicion = graphene.String(required=True)
        direccion = graphene.String(required=True)
        areas_ids = graphene.List(graphene.ID)

    tribunal = graphene.Field(TribunalType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_usuario, especialidad, nombre, apellido, celular, ci, expedicion, direccion, areas_ids=None):
        try:
            usuario = Usuario.objects.get(pk=id_usuario)
        except Usuario.DoesNotExist:
            return CrearTribunal(tribunal=None, ok=False, error="El usuario no existe.") # type: ignore

        # --- Flujo 1: Asegurar y asignar rol base ---
        rol_obj, _ = Rol.objects.get_or_create(nombre='Tribunal')
        if usuario.rol != rol_obj:
            usuario.rol = rol_obj
            usuario.save(update_fields=['rol'])
        # ---------------------------------------------

        if Tribunal.objects.filter(ci=ci).exists():
            return CrearTribunal(tribunal=None, ok=False, error="El CI ya está registrado en otro tribunal.") # type: ignore


        tribunal = Tribunal.objects.create(
            usuario=usuario,
            especialidad=especialidad,
            nombre=nombre,
            apellido=apellido,
            celular=celular,
            ci=ci,
            expedicion=expedicion,
            direccion=direccion
        )
        if areas_ids:
            tribunal.areas.set(areas_ids)
            
        return CrearTribunal(tribunal=tribunal, ok=True, error=None) # type: ignore


class EditarTribunal(graphene.Mutation):
    class Arguments:
        id_tribunal = graphene.ID(required=True)
        id_usuario = graphene.ID()
        especialidad = graphene.String()
        nombre = graphene.String()
        apellido = graphene.String()
        celular = graphene.String()
        ci = graphene.String()
        expedicion = graphene.String()
        direccion = graphene.String()
        estado = graphene.Boolean()
        areas_ids = graphene.List(graphene.ID)

    tribunal = graphene.Field(TribunalType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_tribunal, **kwargs):
        try:
            tribunal = Tribunal.objects.get(pk=id_tribunal)
        except Tribunal.DoesNotExist:
            return EditarTribunal(tribunal=None, ok=False, error="El tribunal no existe.") # type: ignore

        id_usuario = kwargs.get('id_usuario')
        if id_usuario is not None:
            try:
                usuario = Usuario.objects.get(pk=id_usuario)
                tribunal.usuario = usuario
            except Usuario.DoesNotExist:
                return EditarTribunal(tribunal=None, ok=False, error="El usuario no existe.") # type: ignore

        ci = kwargs.get('ci')
        if ci is not None and ci != tribunal.ci:
            if Tribunal.objects.filter(ci=ci).exists():
                return EditarTribunal(tribunal=None, ok=False, error="El CI ya está registrado en otro tribunal.") # type: ignore
            tribunal.ci = ci

        for field in ['especialidad', 'nombre', 'apellido', 'celular', 'expedicion', 'direccion', 'estado']:
            if field in kwargs and kwargs[field] is not None:
                setattr(tribunal, field, kwargs[field])

        tribunal.save()
        
        areas_ids = kwargs.get('areas_ids')
        if areas_ids is not None:
            tribunal.areas.set(areas_ids)
            
        return EditarTribunal(tribunal=tribunal, ok=True, error=None) # type: ignore


class EliminarTribunal(graphene.Mutation):
    class Arguments:
        id_tribunal = graphene.ID(required=True)

    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_tribunal):
        try:
            tribunal = Tribunal.objects.get(pk=id_tribunal)
            tribunal.estado = False
            tribunal.save()
            return EliminarTribunal(ok=True, error=None) # type: ignore
        except Tribunal.DoesNotExist:
            return EliminarTribunal(ok=False, error="El tribunal no existe.") # type: ignore


class CrearTutor(graphene.Mutation):
    class Arguments:
        id_usuario = graphene.ID(required=True)
        id_proyecto = graphene.ID()
        cod_empleado = graphene.String(required=True)
        nombre = graphene.String(required=True)
        apellido = graphene.String(required=True)
        celular = graphene.String(required=True)
        direccion = graphene.String(required=True)
        ci = graphene.String(required=True)
        expedicion = graphene.String(required=True)

    tutor = graphene.Field(TutorType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_usuario, cod_empleado, nombre, apellido, celular, direccion, ci, expedicion, id_proyecto=None):
        try:
            usuario = Usuario.objects.get(pk=id_usuario)
        except Usuario.DoesNotExist:
            return CrearTutor(tutor=None, ok=False, error="El usuario no existe.") # type: ignore

        # --- Flujo 1: Asegurar y asignar rol base ---
        rol_obj, _ = Rol.objects.get_or_create(nombre='Tutor')
        if usuario.rol != rol_obj:
            usuario.rol = rol_obj
            usuario.save(update_fields=['rol'])
        # ---------------------------------------------

        if Tutor.objects.filter(ci=ci).exists():
            return CrearTutor(tutor=None, ok=False, error="El CI ya está registrado en otro tutor.") # type: ignore
        
        if Tutor.objects.filter(cod_empleado=cod_empleado).exists():
            return CrearTutor(tutor=None, ok=False, error="El código de empleado ya está registrado en otro tutor.") # type: ignore

        tutor = Tutor.objects.create(
            usuario=usuario,
            cod_empleado=cod_empleado,
            nombre=nombre,
            apellido=apellido,
            celular=celular,
            direccion=direccion,
            ci=ci,
            expedicion=expedicion
        )
        if id_proyecto:
            tutor.proyectos_tutelados.add(id_proyecto)
            
        return CrearTutor(tutor=tutor, ok=True, error=None) # type: ignore


class EditarTutor(graphene.Mutation):
    class Arguments:
        id_tutor = graphene.ID(required=True)
        id_usuario = graphene.ID()
        id_proyecto = graphene.ID()
        cod_empleado = graphene.String()
        nombre = graphene.String()
        apellido = graphene.String()
        celular = graphene.String()
        direccion = graphene.String()
        ci = graphene.String()
        expedicion = graphene.String()
        estado = graphene.Boolean()

    tutor = graphene.Field(TutorType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_tutor, **kwargs):
        try:
            tutor = Tutor.objects.get(pk=id_tutor)
        except Tutor.DoesNotExist:
            return EditarTutor(tutor=None, ok=False, error="El tutor no existe.") # type: ignore

        id_usuario = kwargs.get('id_usuario')
        if id_usuario is not None:
            try:
                usuario = Usuario.objects.get(pk=id_usuario)
                tutor.usuario = usuario
            except Usuario.DoesNotExist:
                return EditarTutor(tutor=None, ok=False, error="El usuario no existe.") # type: ignore
                
        id_proyecto = kwargs.get('id_proyecto')
        if id_proyecto is not None:
            tutor.proyectos_tutelados.add(id_proyecto)

        ci = kwargs.get('ci')
        if ci is not None and ci != tutor.ci:
            if Tutor.objects.filter(ci=ci).exists():
                return EditarTutor(tutor=None, ok=False, error="El CI ya está registrado en otro tutor.") # type: ignore
            tutor.ci = ci
            
        cod_empleado = kwargs.get('cod_empleado')
        if cod_empleado is not None and cod_empleado != tutor.cod_empleado:
            if Tutor.objects.filter(cod_empleado=cod_empleado).exists():
                return EditarTutor(tutor=None, ok=False, error="El código de empleado ya está registrado en otro tutor.") # type: ignore
            tutor.cod_empleado = cod_empleado

        for field in ['nombre', 'apellido', 'celular', 'direccion', 'expedicion', 'estado']:
            if field in kwargs and kwargs[field] is not None:
                setattr(tutor, field, kwargs[field])

        tutor.save()
        return EditarTutor(tutor=tutor, ok=True, error=None) # type: ignore


class EliminarTutor(graphene.Mutation):
    class Arguments:
        id_tutor = graphene.ID(required=True)

    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_tutor):
        try:
            tutor = Tutor.objects.get(pk=id_tutor)
            tutor.estado = False
            tutor.save()
            return EliminarTutor(ok=True, error=None) # type: ignore
        except Tutor.DoesNotExist:
            return EliminarTutor(ok=False, error="El tutor no existe.") # type: ignore


class CrearParticipante(graphene.Mutation):
    class Arguments:
        id_usuario = graphene.ID(required=True)
        id_proyecto = graphene.ID()
        id_tutor = graphene.ID()
        codigo_especifico = graphene.String(required=True)
        nombre = graphene.String(required=True)
        apellido = graphene.String(required=True)
        celular = graphene.String(required=True)
        ci = graphene.String(required=True)
        expedicion = graphene.String(required=True)
        direccion = graphene.String()
        institucion = graphene.String()

    participante = graphene.Field(ParticipanteType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_usuario, codigo_especifico, nombre, apellido, celular, ci, expedicion, id_proyecto=None, id_tutor=None, direccion=None, institucion=None):
        try:
            usuario = Usuario.objects.get(pk=id_usuario)
        except Usuario.DoesNotExist:
            return CrearParticipante(participante=None, ok=False, error="El usuario no existe.") # type: ignore

        # --- Flujo 1: Asegurar y asignar rol base ---
        rol_obj, _ = Rol.objects.get_or_create(nombre='Participante')
        if usuario.rol != rol_obj:
            usuario.rol = rol_obj
            usuario.save(update_fields=['rol'])
        # ---------------------------------------------

        if Participante.objects.filter(ci=ci).exists():
            return CrearParticipante(participante=None, ok=False, error="El CI ya está registrado en otro participante.") # type: ignore
        
        if Participante.objects.filter(codigo_especifico=codigo_especifico).exists():
            return CrearParticipante(participante=None, ok=False, error="El código específico ya está registrado en otro participante.") # type: ignore

        participante = Participante.objects.create(
            usuario=usuario,
            codigo_especifico=codigo_especifico,
            nombre=nombre,
            apellido=apellido,
            celular=celular,
            ci=ci,
            expedicion=expedicion,
            tutor_id=id_tutor
        )
        if id_proyecto:
            participante.proyectos_inscritos.add(id_proyecto)
        
        if direccion or institucion:
            ParticipanteExt.objects.create(
                participante=participante,
                direccion=direccion or '',
                institucion=institucion or ''
            )

        return CrearParticipante(participante=participante, ok=True, error=None) # type: ignore


class EditarParticipante(graphene.Mutation):
    class Arguments:
        id_participante = graphene.ID(required=True)
        id_usuario = graphene.ID()
        id_proyecto = graphene.ID()
        id_tutor = graphene.ID()
        codigo_especifico = graphene.String()
        nombre = graphene.String()
        apellido = graphene.String()
        celular = graphene.String()
        ci = graphene.String()
        expedicion = graphene.String()
        estado = graphene.Boolean()
        direccion = graphene.String()
        institucion = graphene.String()

    participante = graphene.Field(ParticipanteType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_participante, **kwargs):
        try:
            participante = Participante.objects.get(pk=id_participante)
        except Participante.DoesNotExist:
            return EditarParticipante(participante=None, ok=False, error="El participante no existe.") # type: ignore

        id_usuario = kwargs.get('id_usuario')
        if id_usuario is not None:
            try:
                usuario = Usuario.objects.get(pk=id_usuario)
                participante.usuario = usuario
            except Usuario.DoesNotExist:
                return EditarParticipante(participante=None, ok=False, error="El usuario no existe.") # type: ignore
                
        id_proyecto = kwargs.get('id_proyecto')
        if id_proyecto is not None:
            participante.proyectos_inscritos.add(id_proyecto)
            
        id_tutor = kwargs.get('id_tutor')
        if id_tutor is not None:
            participante.tutor_id = id_tutor

        ci = kwargs.get('ci')
        if ci is not None and ci != participante.ci:
            if Participante.objects.filter(ci=ci).exists():
                return EditarParticipante(participante=None, ok=False, error="El CI ya está registrado en otro participante.") # type: ignore
            participante.ci = ci
            
        codigo_especifico = kwargs.get('codigo_especifico')
        if codigo_especifico is not None and codigo_especifico != participante.codigo_especifico:
            if Participante.objects.filter(codigo_especifico=codigo_especifico).exists():
                return EditarParticipante(participante=None, ok=False, error="El código específico ya está registrado en otro participante.") # type: ignore
            participante.codigo_especifico = codigo_especifico

        for field in ['nombre', 'apellido', 'celular', 'expedicion', 'estado']:
            if field in kwargs and kwargs[field] is not None:
                setattr(participante, field, kwargs[field])

        participante.save()

        direccion = kwargs.get('direccion')
        institucion = kwargs.get('institucion')

        if direccion is not None or institucion is not None:
            try:
                participante_ext = participante.participante_ext
                if direccion is not None:
                    participante_ext.direccion = direccion
                if institucion is not None:
                    participante_ext.institucion = institucion
                participante_ext.save()
            except ParticipanteExt.DoesNotExist:
                ParticipanteExt.objects.create(
                    participante=participante,
                    direccion=direccion or '',
                    institucion=institucion or ''
                )

        return EditarParticipante(participante=participante, ok=True, error=None) # type: ignore


class EliminarParticipante(graphene.Mutation):
    class Arguments:
        id_participante = graphene.ID(required=True)

    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_participante):
        try:
            participante = Participante.objects.get(pk=id_participante)
            participante.estado = False
            participante.save()
            return EliminarParticipante(ok=True, error=None) # type: ignore
        except Participante.DoesNotExist:
            return EliminarParticipante(ok=False, error="El participante no existe.") # type: ignore


class CrearParticipanteExt(graphene.Mutation):
    class Arguments:
        id_participante = graphene.ID(required=True)
        direccion = graphene.String(required=True)
        institucion = graphene.String(required=True)

    participante_ext = graphene.Field(ParticipanteExtType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_participante, direccion, institucion):
        try:
            participante = Participante.objects.get(pk=id_participante)
        except Participante.DoesNotExist:
            return CrearParticipanteExt(participante_ext=None, ok=False, error="El participante no existe.") # type: ignore

        if ParticipanteExt.objects.filter(participante_id=id_participante).exists():
            return CrearParticipanteExt(participante_ext=None, ok=False, error="Este participante ya tiene un perfil extendido.") # type: ignore

        participante_ext = ParticipanteExt.objects.create(
            participante=participante,
            direccion=direccion,
            institucion=institucion
        )
        return CrearParticipanteExt(participante_ext=participante_ext, ok=True, error=None) # type: ignore


class EditarParticipanteExt(graphene.Mutation):
    class Arguments:
        id_participante_ext = graphene.ID(required=True)
        id_participante = graphene.ID()
        direccion = graphene.String()
        institucion = graphene.String()
        estado = graphene.Boolean()

    participante_ext = graphene.Field(ParticipanteExtType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_participante_ext, **kwargs):
        try:
            participante_ext = ParticipanteExt.objects.get(pk=id_participante_ext)
        except ParticipanteExt.DoesNotExist:
            return EditarParticipanteExt(participante_ext=None, ok=False, error="El perfil extendido no existe.") # type: ignore

        id_participante = kwargs.get('id_participante')
        if id_participante is not None:
            if ParticipanteExt.objects.filter(participante_id=id_participante).exclude(pk=id_participante_ext).exists():
                return EditarParticipanteExt(participante_ext=None, ok=False, error="Ese participante ya tiene otro perfil extendido.") # type: ignore
            try:
                participante = Participante.objects.get(pk=id_participante)
                participante_ext.participante = participante
            except Participante.DoesNotExist:
                return EditarParticipanteExt(participante_ext=None, ok=False, error="El participante no existe.") # type: ignore

        for field in ['direccion', 'institucion', 'estado']:
            if field in kwargs and kwargs[field] is not None:
                setattr(participante_ext, field, kwargs[field])

        participante_ext.save()
        return EditarParticipanteExt(participante_ext=participante_ext, ok=True, error=None) # type: ignore


class EliminarParticipanteExt(graphene.Mutation):
    class Arguments:
        id_participante_ext = graphene.ID(required=True)

    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_participante_ext):
        try:
            participante_ext = ParticipanteExt.objects.get(pk=id_participante_ext)
            participante_ext.estado = False
            participante_ext.save()
            return EliminarParticipanteExt(ok=True, error=None) # type: ignore
        except ParticipanteExt.DoesNotExist:
            return EliminarParticipanteExt(ok=False, error="El perfil extendido no existe.") # type: ignore


class CrearPersonal(graphene.Mutation):
    class Arguments:
        id_usuario = graphene.ID(required=True)
        nombre = graphene.String(required=True)
        apellido = graphene.String(required=True)
        ci = graphene.String(required=True)
        expedicion = graphene.String(required=True)
        cargo = graphene.String(required=True)
        direccion = graphene.String(required=True)
        celular = graphene.String(required=True)

    personal = graphene.Field(PersonalType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_usuario, nombre, apellido, ci, expedicion, cargo, direccion, celular):
        try:
            usuario = Usuario.objects.get(pk=id_usuario)
        except Usuario.DoesNotExist:
            return CrearPersonal(personal=None, ok=False, error="El usuario no existe.")  # type: ignore

        if Personal.objects.filter(usuario=usuario).exists():
            return CrearPersonal(personal=None, ok=False, error="Este usuario ya tiene un registro de personal.")  # type: ignore

        if Personal.objects.filter(ci=ci).exists():
            return CrearPersonal(personal=None, ok=False, error="El CI ya está registrado en otro personal.")  # type: ignore

        personal = Personal.objects.create(
            usuario=usuario,
            nombre=nombre,
            apellido=apellido,
            ci=ci,
            expedicion=expedicion,
            cargo=cargo,
            direccion=direccion,
            celular=celular,
        )
        return CrearPersonal(personal=personal, ok=True, error=None)  # type: ignore


class EditarPersonal(graphene.Mutation):
    class Arguments:
        id_personal = graphene.ID(required=True)
        nombre = graphene.String()
        apellido = graphene.String()
        ci = graphene.String()
        expedicion = graphene.String()
        cargo = graphene.String()
        direccion = graphene.String()
        celular = graphene.String()
        estado = graphene.Boolean()

    personal = graphene.Field(PersonalType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_personal, **kwargs):
        try:
            personal = Personal.objects.get(pk=id_personal)
        except Personal.DoesNotExist:
            return EditarPersonal(personal=None, ok=False, error="El personal no existe.")  # type: ignore

        ci = kwargs.get('ci')
        if ci is not None and ci != personal.ci:
            if Personal.objects.filter(ci=ci).exists():
                return EditarPersonal(personal=None, ok=False, error="El CI ya está registrado en otro personal.")  # type: ignore
            personal.ci = ci

        for field in ['nombre', 'apellido', 'expedicion', 'cargo', 'direccion', 'celular', 'estado']:
            if field in kwargs and kwargs[field] is not None:
                setattr(personal, field, kwargs[field])

        personal.save()
        return EditarPersonal(personal=personal, ok=True, error=None)  # type: ignore


class EliminarPersonal(graphene.Mutation):
    class Arguments:
        id_personal = graphene.ID(required=True)

    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_personal):
        try:
            personal = Personal.objects.get(pk=id_personal)
            personal.estado = False
            personal.save()
            return EliminarPersonal(ok=True, error=None)  # type: ignore
        except Personal.DoesNotExist:
            return EliminarPersonal(ok=False, error="El personal no existe.")  # type: ignore


# ─────────────────────────────────────────────────────────────────────────────
# Mutations — Roles y Permisos
# ─────────────────────────────────────────────────────────────────────────────

class CrearRol(graphene.Mutation):
    class Arguments:
        nombre = graphene.String(required=True)

    rol = graphene.Field(RolType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, nombre):
        if Rol.objects.filter(nombre=nombre).exists():
            return CrearRol(rol=None, ok=False, error="Ya existe un rol con ese nombre.")  # type: ignore
        rol = Rol.objects.create(nombre=nombre)
        return CrearRol(rol=rol, ok=True, error=None)  # type: ignore


class EditarRol(graphene.Mutation):
    class Arguments:
        id_rol = graphene.ID(required=True)
        nombre = graphene.String(required=True)

    rol = graphene.Field(RolType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_rol, nombre):
        try:
            rol = Rol.objects.get(pk=id_rol)
        except Rol.DoesNotExist:
            return EditarRol(rol=None, ok=False, error="El rol no existe.")  # type: ignore
        if Rol.objects.filter(nombre=nombre).exclude(pk=id_rol).exists():
            return EditarRol(rol=None, ok=False, error="Ya existe un rol con ese nombre.")  # type: ignore
        rol.nombre = nombre
        rol.save()
        return EditarRol(rol=rol, ok=True, error=None)  # type: ignore


class EliminarRol(graphene.Mutation):
    class Arguments:
        id_rol = graphene.ID(required=True)

    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_rol):
        try:
            rol = Rol.objects.get(pk=id_rol)
        except Rol.DoesNotExist:
            return EliminarRol(ok=False, error="El rol no existe.")  # type: ignore
        if rol.usuarios.exists():
            return EliminarRol(ok=False, error="No se puede eliminar: hay usuarios asignados a este rol.")  # type: ignore
        rol.delete()
        return EliminarRol(ok=True, error=None)  # type: ignore


class AsignarPermisosARol(graphene.Mutation):
    class Arguments:
        id_rol = graphene.ID(required=True)
        codigos = graphene.List(graphene.String, required=True)

    rol = graphene.Field(RolType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_rol, codigos):
        try:
            rol = Rol.objects.get(pk=id_rol)
        except Rol.DoesNotExist:
            return AsignarPermisosARol(rol=None, ok=False, error="El rol no existe.")  # type: ignore
        RolesPermiso.objects.filter(rol=rol).delete()
        for code in codigos:
            try:
                permiso = Permiso.objects.get(code=code)
                RolesPermiso.objects.create(rol=rol, permiso=permiso)
            except Permiso.DoesNotExist:
                pass
        return AsignarPermisosARol(rol=rol, ok=True, error=None)  # type: ignore


class AsignarRolAUsuario(graphene.Mutation):
    class Arguments:
        id_usuario = graphene.ID(required=True)
        id_rol = graphene.ID()

    usuario = graphene.Field(UsuarioType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_usuario, id_rol=None):
        try:
            usuario = Usuario.objects.get(pk=id_usuario)
        except Usuario.DoesNotExist:
            return AsignarRolAUsuario(usuario=None, ok=False, error="El usuario no existe.")  # type: ignore
        if id_rol is not None:
            try:
                rol = Rol.objects.get(pk=id_rol)
                usuario.rol = rol
            except Rol.DoesNotExist:
                return AsignarRolAUsuario(usuario=None, ok=False, error="El rol no existe.")  # type: ignore
        else:
            usuario.rol = None
        usuario.save()
        return AsignarRolAUsuario(usuario=usuario, ok=True, error=None)  # type: ignore


# ─────────────────────────────────────────────────────────────────────────────
# Mutations 2FA (TOTP)
# ─────────────────────────────────────────────────────────────────────────────

class LoginConTotp(graphene.Mutation):
    """
    Login con 2FA OBLIGATORIO para todos los usuarios.
    - Si credenciales son incorrectas: ok=False, error=mensaje.
    - Si usuario NO tiene 2FA configurado: needs_setup=True → el frontend lo fuerza a configurarlo.
    - Si usuario SÍ tiene 2FA configurado: requires2fa=True → el frontend pide el código TOTP.
    - NUNCA se devuelve el token directamente (2FA es obligatorio).
    """
    class Arguments:
        username = graphene.String(required=True)
        password = graphene.String(required=True)

    token = graphene.String()
    requires2fa = graphene.Boolean()
    needs_setup = graphene.Boolean()  # True si el usuario nunca ha configurado 2FA
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, username, password):
        from graphql_jwt.shortcuts import get_token
        from django.contrib.auth import get_user_model
        from django.utils import timezone
        import datetime
        User = get_user_model()
        
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return LoginConTotp(token=None, requires2fa=False, needs_setup=False, ok=False, error="Credenciales incorrectas.")  # type: ignore

        if user.locked_until and user.locked_until > timezone.now():
            minutes_left = int((user.locked_until - timezone.now()).total_seconds() / 60) + 1
            return LoginConTotp(token=None, requires2fa=False, needs_setup=False, ok=False, error=f"Cuenta bloqueada por múltiples intentos fallidos. Intente de nuevo en {minutes_left} minutos o contacte al administrador.")  # type: ignore

        if not user.check_password(password):
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= 5:
                user.locked_until = timezone.now() + datetime.timedelta(minutes=15)
            user.save(update_fields=['failed_login_attempts', 'locked_until'])
            
            if user.failed_login_attempts >= 5:
                return LoginConTotp(token=None, requires2fa=False, needs_setup=False, ok=False, error="Demasiados intentos fallidos. Cuenta bloqueada por 15 minutos.")  # type: ignore
            return LoginConTotp(token=None, requires2fa=False, needs_setup=False, ok=False, error="Credenciales incorrectas.")  # type: ignore
            
        if user.failed_login_attempts > 0 or user.locked_until:
            user.failed_login_attempts = 0
            user.locked_until = None
            user.save(update_fields=['failed_login_attempts', 'locked_until'])

        if not user.is_active:
            return LoginConTotp(token=None, requires2fa=False, needs_setup=False, ok=False, error="Cuenta inactiva, apersónese con el administrador.")  # type: ignore
        if user.is_2fa_enabled:
            return LoginConTotp(token=None, requires2fa=True, needs_setup=False, ok=True, error=None)  # type: ignore
        # 2FA es opcional: si no está habilitado, login directo
        token = get_token(user)
        return LoginConTotp(token=token, requires2fa=False, needs_setup=False, ok=True, error=None)  # type: ignore


class VerificarTotp(graphene.Mutation):
    """
    Segunda etapa del login cuando 2FA está activo.
    Recibe el código TOTP de 6 dígitos y devuelve el JWT si es correcto.
    """
    class Arguments:
        username = graphene.String(required=True)
        totp_code = graphene.String(required=True)

    token = graphene.String()
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, username, totp_code):
        from graphql_jwt.shortcuts import get_token
        try:
            user = Usuario.objects.get(username=username)
        except Usuario.DoesNotExist:
            return VerificarTotp(token=None, ok=False, error="Usuario no encontrado.")  # type: ignore

        if not user.is_2fa_enabled or not user.totp_secret:
            return VerificarTotp(token=None, ok=False, error="2FA no está activo para este usuario.")  # type: ignore

        totp = pyotp.TOTP(user.totp_secret)
        if not totp.verify(totp_code, valid_window=1):
            return VerificarTotp(token=None, ok=False, error="Código incorrecto o expirado.")  # type: ignore

        token = get_token(user)
        return VerificarTotp(token=token, ok=True, error=None)  # type: ignore


class GenerarQr2fa(graphene.Mutation):
    """
    Genera un secreto TOTP y devuelve el QR como imagen base64.
    El usuario debe confirmar con ConfirmarActivacion2fa para habilitarlo.
    """
    class Arguments:
        id_usuario = graphene.ID(required=True)

    qr_base64 = graphene.String()
    secret = graphene.String()
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_usuario):
        try:
            usuario = Usuario.objects.get(pk=id_usuario)
        except Usuario.DoesNotExist:
            return GenerarQr2fa(qr_base64=None, secret=None, ok=False, error="Usuario no encontrado.")  # type: ignore

        # Generar nuevo secreto
        secret = pyotp.random_base32()
        usuario.totp_secret = secret
        usuario.is_2fa_enabled = False  # aún no confirmado
        usuario.save()

        # Generar URL y QR
        totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
            name=usuario.email or usuario.username,
            issuer_name="UAGRM ExpoCarrera"
        )
        img = qrcode.make(totp_uri)
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        qr_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

        return GenerarQr2fa(qr_base64=qr_base64, secret=secret, ok=True, error=None)  # type: ignore


class ConfirmarActivacion2fa(graphene.Mutation):
    """
    Confirma la activación del 2FA verificando el primer código TOTP del usuario.
    """
    class Arguments:
        id_usuario = graphene.ID(required=True)
        totp_code = graphene.String(required=True)

    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_usuario, totp_code):
        try:
            usuario = Usuario.objects.get(pk=id_usuario)
        except Usuario.DoesNotExist:
            return ConfirmarActivacion2fa(ok=False, error="Usuario no encontrado.")  # type: ignore

        if not usuario.totp_secret:
            return ConfirmarActivacion2fa(ok=False, error="Primero genera el QR.")  # type: ignore

        totp = pyotp.TOTP(usuario.totp_secret)
        if not totp.verify(totp_code, valid_window=1):
            return ConfirmarActivacion2fa(ok=False, error="Código incorrecto. Asegúrate de haber escaneado el QR.")  # type: ignore

        usuario.is_2fa_enabled = True
        usuario.save()
        return ConfirmarActivacion2fa(ok=True, error=None)  # type: ignore


class Desactivar2fa(graphene.Mutation):
    """
    Desactiva el 2FA del usuario.
    """
    class Arguments:
        id_usuario = graphene.ID(required=True)
        totp_code = graphene.String(required=True)

    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, id_usuario, totp_code):
        try:
            usuario = Usuario.objects.get(pk=id_usuario)
        except Usuario.DoesNotExist:
            return Desactivar2fa(ok=False, error="Usuario no encontrado.")  # type: ignore

        if not usuario.is_2fa_enabled or not usuario.totp_secret:
            return Desactivar2fa(ok=False, error="El 2FA no está activo.")  # type: ignore

        totp = pyotp.TOTP(usuario.totp_secret)
        if not totp.verify(totp_code, valid_window=1):
            return Desactivar2fa(ok=False, error="Código incorrecto.")  # type: ignore

        usuario.is_2fa_enabled = False
        usuario.totp_secret = None
        usuario.save()
        return Desactivar2fa(ok=True, error=None)  # type: ignore


class GenerarQrPorUsername(graphene.Mutation):
    """
    Genera el QR de 2FA usando solo el username (sin autenticación previa).
    Usado durante el flujo de primer login cuando 2FA es obligatorio.
    """
    class Arguments:
        username = graphene.String(required=True)

    qr_base64 = graphene.String()
    secret = graphene.String()
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, username):
        try:
            usuario = Usuario.objects.get(username=username)
        except Usuario.DoesNotExist:
            return GenerarQrPorUsername(qr_base64=None, secret=None, ok=False, error="Usuario no encontrado.")  # type: ignore

        secret = pyotp.random_base32()
        usuario.totp_secret = secret
        usuario.is_2fa_enabled = False  # aún no confirmado
        usuario.save()

        totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
            name=usuario.email or usuario.username,
            issuer_name="UAGRM ExpoCarrera"
        )
        img = qrcode.make(totp_uri)
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        qr_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

        return GenerarQrPorUsername(qr_base64=qr_base64, secret=secret, ok=True, error=None)  # type: ignore


class ConfirmarSetupYLogin(graphene.Mutation):
    """
    Confirma el primer setup de 2FA Y devuelve el JWT en un solo paso.
    Usado durante el flujo de primer login forzado.
    """
    class Arguments:
        username = graphene.String(required=True)
        totp_code = graphene.String(required=True)

    token = graphene.String()
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, username, totp_code):
        from graphql_jwt.shortcuts import get_token
        try:
            user = Usuario.objects.get(username=username)
        except Usuario.DoesNotExist:
            return ConfirmarSetupYLogin(token=None, ok=False, error="Usuario no encontrado.")  # type: ignore

        if not user.totp_secret:
            return ConfirmarSetupYLogin(token=None, ok=False, error="Primero genera el QR.")  # type: ignore

        totp = pyotp.TOTP(user.totp_secret)
        if not totp.verify(totp_code, valid_window=1):
            return ConfirmarSetupYLogin(token=None, ok=False, error="Código incorrecto. Asegúrate de haber escaneado el QR.")  # type: ignore

        user.is_2fa_enabled = True
        user.save()

        token = get_token(user)
        return ConfirmarSetupYLogin(token=token, ok=True, error=None)  # type: ignore


class LoginTribunalMovil(graphene.Mutation):
    """
    Login simplificado sin 2FA para la app móvil de tribunales.
    Solo accesible si el usuario tiene un perfil Tribunal activo.
    """
    class Arguments:
        username = graphene.String(required=True)
        password = graphene.String(required=True)

    token = graphene.String()
    tribunal = graphene.Field(TribunalType)
    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, username, password):
        from graphql_jwt.shortcuts import get_token
        from django.contrib.auth import get_user_model
        User = get_user_model()

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return LoginTribunalMovil(token=None, tribunal=None, ok=False, error="Credenciales incorrectas.")  # type: ignore

        if not user.check_password(password):
            return LoginTribunalMovil(token=None, tribunal=None, ok=False, error="Credenciales incorrectas.")  # type: ignore

        if not user.is_active:
            return LoginTribunalMovil(token=None, tribunal=None, ok=False, error="Cuenta inactiva, apersónese con el administrador.")  # type: ignore
        try:
            tribunal_obj = user.tribunal
        except Exception:
            return LoginTribunalMovil(token=None, tribunal=None, ok=False, error="Acceso no autorizado. Este usuario no es un tribunal.")  # type: ignore
        if not tribunal_obj.estado:
            return LoginTribunalMovil(token=None, tribunal=None, ok=False, error="Tribunal inactivo. Contacte al administrador.")  # type: ignore
        token = get_token(user)
        return LoginTribunalMovil(token=token, tribunal=tribunal_obj, ok=True, error=None)  # type: ignore


class GuardarFcmToken(graphene.Mutation):
    """Guarda el token FCM del dispositivo móvil del tribunal para notificaciones push."""
    class Arguments:
        id_tribunal = graphene.ID(required=True)
        token = graphene.String(required=True)

    ok = graphene.Boolean()

    @staticmethod
    def mutate(root, info, id_tribunal, token):
        try:
            tribunal = Tribunal.objects.get(pk=id_tribunal)
            tribunal.fcm_token = token
            tribunal.save(update_fields=['fcm_token'])
            return GuardarFcmToken(ok=True)  # type: ignore
        except Tribunal.DoesNotExist:
            return GuardarFcmToken(ok=False)  # type: ignore


class CambiarPasswordPropio(graphene.Mutation):
    class Arguments:
        password_actual = graphene.String(required=True)
        password_nuevo = graphene.String(required=True)

    ok = graphene.Boolean()
    error = graphene.String()

    @staticmethod
    def mutate(root, info, password_actual, password_nuevo):
        user = info.context.user
        if not user.is_authenticated:
            return CambiarPasswordPropio(ok=False, error="No autenticado.")  # type: ignore
        if not user.check_password(password_actual):
            return CambiarPasswordPropio(ok=False, error="La contraseña actual es incorrecta.")  # type: ignore
        if len(password_nuevo) < 6:
            return CambiarPasswordPropio(ok=False, error="La nueva contraseña debe tener al menos 6 caracteres.")  # type: ignore
        user.set_password(password_nuevo)
        user.save()
        return CambiarPasswordPropio(ok=True, error=None)  # type: ignore


class Mutation(graphene.ObjectType):
    crear_rol = CrearRol.Field()
    editar_rol = EditarRol.Field()
    eliminar_rol = EliminarRol.Field()
    asignar_permisos_a_rol = AsignarPermisosARol.Field()
    asignar_rol_a_usuario = AsignarRolAUsuario.Field()

    crear_usuario = CrearUsuario.Field()
    editar_usuario = EditarUsuario.Field()
    eliminar_usuario = EliminarUsuario.Field()

    crear_tribunal = CrearTribunal.Field()
    editar_tribunal = EditarTribunal.Field()
    eliminar_tribunal = EliminarTribunal.Field()

    crear_tutor = CrearTutor.Field()
    editar_tutor = EditarTutor.Field()
    eliminar_tutor = EliminarTutor.Field()

    crear_participante = CrearParticipante.Field()
    editar_participante = EditarParticipante.Field()
    eliminar_participante = EliminarParticipante.Field()

    crear_participante_ext = CrearParticipanteExt.Field()
    editar_participante_ext = EditarParticipanteExt.Field()
    eliminar_participante_ext = EliminarParticipanteExt.Field()

    crear_personal = CrearPersonal.Field()
    editar_personal = EditarPersonal.Field()
    eliminar_personal = EliminarPersonal.Field()

    desbloquear_usuario = DesbloquearUsuario.Field()
    login_con_totp = LoginConTotp.Field()

    cambiar_password_propio = CambiarPasswordPropio.Field()
    login_tribunal_movil = LoginTribunalMovil.Field()
    guardar_fcm_token = GuardarFcmToken.Field()

    # 2FA
    login_con_totp = LoginConTotp.Field()
    verificar_totp = VerificarTotp.Field()
    generar_qr_2fa = GenerarQr2fa.Field()
    generar_qr_por_username = GenerarQrPorUsername.Field()
    confirmar_activacion_2fa = ConfirmarActivacion2fa.Field()
    confirmar_setup_y_login = ConfirmarSetupYLogin.Field()
    desactivar_2fa = Desactivar2fa.Field()
