# Flutter Tribunal — Guía de Setup

## 1. Instalar Flutter (Windows)

1. Descarga el SDK: https://docs.flutter.dev/get-started/install/windows
2. Extrae en `C:\flutter` (o donde prefieras)
3. Agrega `C:\flutter\bin` al PATH del sistema
4. Ejecuta en terminal:
   ```
   flutter doctor
   ```
   Sigue las instrucciones para instalar dependencias faltantes (Android Studio, SDK, etc.)

## 2. Configurar la URL del backend

Edita `lib/config/graphql_config.dart`:

```dart
// Para emulador Android (apunta al localhost de tu PC):
const String kBackendUrl = 'http://10.0.2.2:8000/graphql/';

// Para dispositivo físico en red local (reemplaza con la IP de tu PC):
const String kBackendUrl = 'http://192.168.1.X:8000/graphql/';
```

## 3. Instalar dependencias

```bash
cd flutter_tribunal
flutter pub get
```

## 4. Ejecutar la app

```bash
# En emulador Android (ábrelo desde Android Studio primero)
flutter run

# En dispositivo físico (conectar con USB, habilitar depuración USB)
flutter run

# Compilar APK para distribución
flutter build apk --release
```

## 5. Flujo de uso

1. El administrador crea el usuario con perfil **Tribunal** desde el sistema web
2. El tribunal descarga e instala la APK
3. Inicia sesión con el usuario y contraseña creados por el admin
4. Ve la lista de proyectos asignados (solo los suyos)
5. Toca un proyecto → ver detalles completos → botón "Calificar"
6. Completa los criterios y envía

## 6. Estructura del proyecto

```
flutter_tribunal/
├── lib/
│   ├── main.dart                          # Entry point + splash + rutas
│   ├── config/graphql_config.dart         # URL backend y cliente GraphQL
│   ├── services/auth_service.dart         # JWT en secure storage
│   ├── models/
│   │   ├── proyecto.dart                  # Modelos Proyecto, Participante, Tutor
│   │   └── evaluacion.dart               # Modelos DetalleEvaluacion, Acta, Planilla
│   └── screens/
│       ├── login_screen.dart              # Login usuario/contraseña
│       ├── proyectos_screen.dart          # Lista de proyectos asignados
│       ├── proyecto_detalle_screen.dart   # Detalle con tabs
│       └── calificar_screen.dart         # Formulario de calificación por criterios
└── pubspec.yaml
```
