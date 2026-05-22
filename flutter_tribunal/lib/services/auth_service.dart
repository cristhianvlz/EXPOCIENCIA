import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthService {
  static const _storage = FlutterSecureStorage();
  static const _tokenKey = 'jwt_token';
  static const _tribunalIdKey = 'tribunal_id';
  static const _tribunalNombreKey = 'tribunal_nombre';

  static Future<void> saveSession({
    required String token,
    required String tribunalId,
    required String tribunalNombre,
  }) async {
    await _storage.write(key: _tokenKey, value: token);
    await _storage.write(key: _tribunalIdKey, value: tribunalId);
    await _storage.write(key: _tribunalNombreKey, value: tribunalNombre);
  }

  static Future<String?> getToken() => _storage.read(key: _tokenKey);

  static Future<String?> getTribunalNombre() =>
      _storage.read(key: _tribunalNombreKey);

  static Future<bool> isLoggedIn() async {
    final token = await _storage.read(key: _tokenKey);
    return token != null && token.isNotEmpty;
  }

  static Future<void> logout() async {
    await _storage.deleteAll();
  }
}
