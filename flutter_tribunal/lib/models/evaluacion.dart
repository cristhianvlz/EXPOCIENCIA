import 'proyecto.dart';

class Criterio {
  final String idCriterio;
  final String nombre;
  final double puntaje;

  Criterio({required this.idCriterio, required this.nombre, required this.puntaje});

  factory Criterio.fromJson(Map<String, dynamic> json) => Criterio(
        idCriterio: json['idCriterio'].toString(),
        nombre: json['nombre'] ?? '',
        puntaje: double.tryParse(json['puntaje'].toString()) ?? 0,
      );
}

class Seccion {
  final String idSeccion;
  final String nombre;
  final double ponderacion;
  final List<Criterio> criterios;

  Seccion({
    required this.idSeccion,
    required this.nombre,
    required this.ponderacion,
    required this.criterios,
  });

  factory Seccion.fromJson(Map<String, dynamic> json) => Seccion(
        idSeccion: json['idSeccion'].toString(),
        nombre: json['nombre'] ?? '',
        ponderacion: double.tryParse(json['ponderacion'].toString()) ?? 0,
        criterios: (json['criterios'] as List<dynamic>? ?? [])
            .map((c) => Criterio.fromJson(c as Map<String, dynamic>))
            .toList(),
      );
}

class PlanillaEvaluativa {
  final String idPlanilla;
  final String nombre;
  final double notaMaxima;
  final List<Seccion> secciones;

  PlanillaEvaluativa({
    required this.idPlanilla,
    required this.nombre,
    required this.notaMaxima,
    required this.secciones,
  });

  factory PlanillaEvaluativa.fromJson(Map<String, dynamic> json) =>
      PlanillaEvaluativa(
        idPlanilla: json['idPlanillaEvaluativa'].toString(),
        nombre: json['nombre'] ?? '',
        notaMaxima: double.tryParse(json['notaMaxima'].toString()) ?? 100,
        secciones: (json['secciones'] as List<dynamic>? ?? [])
            .map((s) => Seccion.fromJson(s as Map<String, dynamic>))
            .toList(),
      );
}

class ActaEvaluacion {
  final String idActa;
  final String? fecha;
  final bool consolidada;
  final PlanillaEvaluativa planilla;
  final Proyecto proyecto;

  ActaEvaluacion({
    required this.idActa,
    this.fecha,
    required this.consolidada,
    required this.planilla,
    required this.proyecto,
  });

  factory ActaEvaluacion.fromJson(Map<String, dynamic> json) => ActaEvaluacion(
        idActa: json['idActaEvaluacion'].toString(),
        fecha: json['fecha'],
        consolidada: json['consolidada'] as bool? ?? false,
        planilla: PlanillaEvaluativa.fromJson(
            json['planillaEvaluativa'] as Map<String, dynamic>),
        proyecto: Proyecto.fromJson(json['proyecto'] as Map<String, dynamic>),
      );
}

class DetalleEvaluacion {
  final String idDetalle;
  final bool yaEvaluo;
  final double? puntuacion;
  final bool permisoCalificacionTardia;
  final ActaEvaluacion acta;

  DetalleEvaluacion({
    required this.idDetalle,
    required this.yaEvaluo,
    this.puntuacion,
    required this.permisoCalificacionTardia,
    required this.acta,
  });

  factory DetalleEvaluacion.fromJson(Map<String, dynamic> json) =>
      DetalleEvaluacion(
        idDetalle: json['id'].toString(),
        yaEvaluo: json['yaEvaluo'] as bool? ?? false,
        puntuacion: json['puntuacion'] != null
            ? double.tryParse(json['puntuacion'].toString())
            : null,
        permisoCalificacionTardia:
            json['permisoCalificacionTardia'] as bool? ?? false,
        acta: ActaEvaluacion.fromJson(
            json['actaEvaluacion'] as Map<String, dynamic>),
      );
}
