import 'package:flutter/foundation.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

// ─── Configuración de URL del Backend ───
// IP ESTÁTICA de la PC servidor — cambiar solo si se cambia la IP del servidor
const String kBackendUrl = 'http://192.168.0.20:8000/graphql/';

class GraphQLConfig {
  static final FlutterSecureStorage _storage = const FlutterSecureStorage();

  static Future<GraphQLClient> buildClient() async {
    final authLink = AuthLink(
      getToken: () async {
        final t = await _storage.read(key: 'jwt_token');
        return t != null ? 'JWT $t' : null;
      },
    );

    final httpLink = HttpLink(
      kBackendUrl,
      defaultHeaders: const {'Accept': 'application/json'},
    );
    final link = authLink.concat(httpLink);

    return GraphQLClient(
      link: link,
      cache: GraphQLCache(store: InMemoryStore()),
    );
  }

  static ValueNotifier<GraphQLClient> buildClientNotifier() {
    final authLink = AuthLink(
      getToken: () async {
        final t = await _storage.read(key: 'jwt_token');
        return t != null ? 'JWT $t' : null;
      },
    );

    final httpLink = HttpLink(
      kBackendUrl,
      defaultHeaders: const {'Accept': 'application/json'},
    );
    final link = authLink.concat(httpLink);

    return ValueNotifier(
      GraphQLClient(
        link: link,
        cache: GraphQLCache(store: InMemoryStore()),
      ),
    );
    
  }
}
