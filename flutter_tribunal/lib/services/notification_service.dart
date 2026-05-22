import 'package:flutter/material.dart' show Color;
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

// Handler para mensajes cuando la app está en background/cerrada
@pragma('vm:entry-point')
Future<void> firebaseBackgroundHandler(RemoteMessage message) async {
  // Firebase ya se inicializó en main.dart antes de llamar a esto
}

class NotificationService {
  static final _fcm = FirebaseMessaging.instance;
  static final _localNotif = FlutterLocalNotificationsPlugin();

  static const _channelId = 'tribunal_channel';
  static const _channelName = 'Proyectos asignados';

  static Future<void> init() async {
    // Solicitar permiso (Android 13+)
    await _fcm.requestPermission(alert: true, badge: true, sound: true);

    // Canal de notificaciones para Android
    const androidChannel = AndroidNotificationChannel(
      _channelId,
      _channelName,
      description: 'Notificaciones de proyectos asignados al tribunal',
      importance: Importance.high,
    );
    await _localNotif
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(androidChannel);

    // Inicializar flutter_local_notifications
    const initSettings = InitializationSettings(
      android: AndroidInitializationSettings('@mipmap/ic_launcher'),
    );
    await _localNotif.initialize(initSettings);

    // Notificaciones mientras la app está abierta (foreground)
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      final n = message.notification;
      if (n == null) return;
      _localNotif.show(
        message.hashCode,
        n.title,
        n.body,
        NotificationDetails(
          android: AndroidNotificationDetails(
            _channelId,
            _channelName,
            importance: Importance.high,
            priority: Priority.high,
            color: const Color(0xFF0D1B3E),
          ),
        ),
      );
    });

    // Asegura que la app reciba mensajes en foreground
    await _fcm.setForegroundNotificationPresentationOptions(
      alert: true,
      badge: true,
      sound: true,
    );
  }

  static Future<String?> getToken() => _fcm.getToken();
}
