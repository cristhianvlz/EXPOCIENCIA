import graphene
import graphql_jwt

import apps.usuarios.schema as usuarios_schema
import apps.eventos.schema as eventos_schema
import apps.academico.schema as academico_schema
import apps.proyectos.schema as proyectos_schema
import apps.evaluaciones.schema as evaluaciones_schema
import apps.premiacion.schema as premiacion_schema


class Query(
    usuarios_schema.Query,
    eventos_schema.Query,
    academico_schema.Query,
    proyectos_schema.Query,
    evaluaciones_schema.Query,
    premiacion_schema.Query,
    graphene.ObjectType,
):
    pass


class Mutation(
    usuarios_schema.Mutation,
    eventos_schema.Mutation,
    academico_schema.Mutation,
    proyectos_schema.Mutation,
    evaluaciones_schema.Mutation,
    premiacion_schema.Mutation,
    graphene.ObjectType,
):
    token_auth = graphql_jwt.ObtainJSONWebToken.Field()
    verify_token = graphql_jwt.Verify.Field()
    refresh_token = graphql_jwt.Refresh.Field()


schema = graphene.Schema(query=Query, mutation=Mutation)
