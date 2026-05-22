class Participante {
  final String nombre;
  final String apellido;
  final String ci;

  Participante({required this.nombre, required this.apellido, required this.ci});

  factory Participante.fromJson(Map<String, dynamic> json) => Participante(
        nombre: json['nombre'] ?? '',
        apellido: json['apellido'] ?? '',
        ci: json['ci'] ?? '',
      );
}

class Tutor {
  final String nombre;
  final String apellido;
  final String codEmpleado;

  Tutor({required this.nombre, required this.apellido, required this.codEmpleado});

  factory Tutor.fromJson(Map<String, dynamic> json) => Tutor(
        nombre: json['nombre'] ?? '',
        apellido: json['apellido'] ?? '',
        codEmpleado: json['codEmpleado'] ?? '',
      );
}

class Proyecto {
  final String idProyecto;
  final String titulo;
  final String resumen;
  final String? archivo;
  final String estado;
  final String? carrera;
  final String? area;
  final String? entidadAcademica;
  final List<Participante> participantes;
  final List<Tutor> tutores;

  Proyecto({
    required this.idProyecto,
    required this.titulo,
    required this.resumen,
    this.archivo,
    required this.estado,
    this.carrera,
    this.area,
    this.entidadAcademica,
    required this.participantes,
    required this.tutores,
  });

  factory Proyecto.fromJson(Map<String, dynamic> json) {
    final oec = json['ofertaEaCarrera'] as Map<String, dynamic>?;
    // area: ofertaEaCarrera → oferta → modalidadArea → area → nombre
    final area = oec?['oferta']?['modalidadArea']?['area']?['nombre'] as String?;
    return Proyecto(
      idProyecto: json['idProyecto'].toString(),
      titulo: json['titulo'] ?? '',
      resumen: json['resumen'] ?? '',
      archivo: json['archivo'],
      estado: json['estado'] ?? '',
      carrera: oec?['carrera'] as String?,
      area: area,
      entidadAcademica: oec?['entidadAcademica']?['nombre'] as String?,
      participantes: (json['participantes'] as List<dynamic>? ?? [])
          .map((p) => Participante.fromJson(p as Map<String, dynamic>))
          .toList(),
      tutores: (json['tutores'] as List<dynamic>? ?? [])
          .map((t) => Tutor.fromJson(t as Map<String, dynamic>))
          .toList(),
    );
  }
}
