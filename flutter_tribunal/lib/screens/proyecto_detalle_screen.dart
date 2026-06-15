import 'dart:io';
import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:flutter_pdfview/flutter_pdfview.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:open_file/open_file.dart';
import 'package:path_provider/path_provider.dart';
import '../models/evaluacion.dart';
import '../config/graphql_config.dart';
import '../services/auth_service.dart';
import 'calificar_screen.dart';

const String _getDetalleEstadoQuery = r'''
  query GetDetalleEstado($id: ID!) {
    detalleEvaluacion(id: $id) {
      id
      yaEvaluo
      puntuacion
      permisoCalificacionTardia
      actaEvaluacion {
        consolidada
      }
    }
  }
''';

// ─── Colores del tema ───────────────────────────────────────────────────────
const _kNavy  = Color(0xFF0D1B3E);
const _kNavy2 = Color(0xFF1A3A6E);
const _kGold  = Color(0xFFD4AF37);

class ProyectoDetalleScreen extends StatefulWidget {
  final DetalleEvaluacion detalle;
  const ProyectoDetalleScreen({super.key, required this.detalle});

  @override
  State<ProyectoDetalleScreen> createState() => _ProyectoDetalleScreenState();
}

class _ProyectoDetalleScreenState extends State<ProyectoDetalleScreen> {
  late bool _yaEvaluo;
  late bool _permisoCalificacionTardia;
  late double? _puntuacion;
  late bool _consolidada;

  @override
  void initState() {
    super.initState();
    _yaEvaluo = widget.detalle.yaEvaluo;
    _permisoCalificacionTardia = widget.detalle.permisoCalificacionTardia;
    _puntuacion = widget.detalle.puntuacion;
    _consolidada = widget.detalle.acta.consolidada;
    _refrescarEstado();
  }

  Future<void> _refrescarEstado() async {
    try {
      final client = await GraphQLConfig.buildClient();
      final result = await client.query(QueryOptions(
        document: gql(_getDetalleEstadoQuery),
        variables: {'id': widget.detalle.idDetalle},
        fetchPolicy: FetchPolicy.networkOnly,
      ));
      final data = result.data?['detalleEvaluacion'];
      if (data != null && mounted) {
        setState(() {
          _yaEvaluo = data['yaEvaluo'] as bool? ?? _yaEvaluo;
          _permisoCalificacionTardia =
              data['permisoCalificacionTardia'] as bool? ?? _permisoCalificacionTardia;
          _puntuacion = data['puntuacion'] != null
              ? double.tryParse(data['puntuacion'].toString())
              : _puntuacion;
          if (data['actaEvaluacion'] != null) {
            _consolidada = data['actaEvaluacion']['consolidada'] as bool? ?? _consolidada;
          }
        });
      }
    } catch (_) {
      // Si falla la red, usa los datos iniciales
    }
  }

  DetalleEvaluacion get _detalleActualizado => DetalleEvaluacion(
        idDetalle: widget.detalle.idDetalle,
        yaEvaluo: _yaEvaluo,
        puntuacion: _puntuacion,
        permisoCalificacionTardia: _permisoCalificacionTardia,
        acta: ActaEvaluacion(
          idActa: widget.detalle.acta.idActa,
          fecha: widget.detalle.acta.fecha,
          consolidada: _consolidada,
          planilla: widget.detalle.acta.planilla,
          proyecto: widget.detalle.acta.proyecto,
        ),
      );

  @override
  Widget build(BuildContext context) {
    final proyecto = widget.detalle.acta.proyecto;
    return DefaultTabController(
      length: 4,
      child: Scaffold(
        backgroundColor: const Color(0xFFF0F2F8),
        body: NestedScrollView(
          headerSliverBuilder: (_, __) => [
            SliverAppBar(
              expandedHeight: 130,
              pinned: true,
              backgroundColor: _kNavy,
              foregroundColor: Colors.white,
              flexibleSpace: FlexibleSpaceBar(
                titlePadding: const EdgeInsets.fromLTRB(56, 0, 16, 56),
                title: Text(
                  proyecto.titulo,
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                background: Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [_kNavy, _kNavy2],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: Align(
                    alignment: Alignment.topRight,
                    child: Padding(
                      padding: const EdgeInsets.only(top: 48, right: 16),
                      child: _estadoBadge(proyecto.estado),
                    ),
                  ),
                ),
              ),
              bottom: PreferredSize(
                preferredSize: const Size.fromHeight(48),
                child: Container(
                  color: _kNavy,
                  child: const TabBar(
                    indicatorColor: _kGold,
                    indicatorWeight: 3,
                    labelColor: Colors.white,
                    unselectedLabelColor: Colors.white54,
                    labelStyle: TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
                    tabs: [
                      Tab(icon: Icon(Icons.info_outline, size: 18), text: 'Info'),
                      Tab(icon: Icon(Icons.school_outlined, size: 18), text: 'Académico'),
                      Tab(icon: Icon(Icons.people_outline, size: 18), text: 'Equipo'),
                      Tab(icon: Icon(Icons.attach_file, size: 18), text: 'Archivo'),
                    ],
                  ),
                ),
              ),
            ),
          ],
          body: TabBarView(
            children: [
              _InfoTab(detalle: _detalleActualizado),
              _AcademicoTab(proyecto: proyecto),
              _EquipoTab(proyecto: proyecto),
              _ArchivoTab(proyecto: proyecto),
            ],
          ),
        ),
        floatingActionButton: ((!_yaEvaluo || _permisoCalificacionTardia) && (!_consolidada || _permisoCalificacionTardia))
            ? FloatingActionButton.extended(
                backgroundColor: _permisoCalificacionTardia ? Colors.blue[700] : _kNavy,
                foregroundColor: Colors.white,
                icon: Icon(_permisoCalificacionTardia
                    ? Icons.vpn_key_rounded
                    : Icons.rate_review_outlined),
                label: Text(
                  _permisoCalificacionTardia
                      ? 'Registrar nota tardía'
                      : 'Calificar',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                onPressed: () async {
                  await Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => CalificarScreen(detalle: _detalleActualizado),
                    ),
                  );
                  _refrescarEstado();
                },
              )
            : null,
      ),
    );
  }

  Widget _estadoBadge(String estado) {
    final isActivo = estado.toLowerCase() == 'activo';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: isActivo ? Colors.green.withOpacity(0.25) : Colors.orange.withOpacity(0.25),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isActivo ? Colors.green.shade300 : Colors.orange.shade300,
        ),
      ),
      child: Text(
        estado.toUpperCase(),
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.bold,
          color: isActivo ? Colors.green[300] : Colors.orange[300],
        ),
      ),
    );
  }
}

// ─── Tab: Info ───────────────────────────────────────────────────────────────
class _InfoTab extends StatelessWidget {
  final DetalleEvaluacion detalle;
  const _InfoTab({required this.detalle});

  @override
  Widget build(BuildContext context) {
    final p = detalle.acta.proyecto;
    return ListView(
      padding: const EdgeInsets.fromLTRB(14, 14, 14, 100),
      children: [
        // Badge de permiso tardío (tiene prioridad visual)
        if (detalle.permisoCalificacionTardia) ...[
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.blue.shade700, Colors.blue.shade500],
              ),
              borderRadius: BorderRadius.circular(14),
              boxShadow: [
                BoxShadow(
                  color: Colors.blue.withOpacity(0.3),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              children: [
                const Icon(Icons.vpn_key_rounded, color: Colors.white, size: 28),
                const SizedBox(width: 12),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Permiso concedido',
                          style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 14)),
                      Text(
                        'Puedes registrar tu nota ahora. Usa el botón inferior.',
                        style: TextStyle(color: Colors.white70, fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
        ] else if (detalle.yaEvaluo) ...[
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.green.shade600, Colors.green.shade400],
              ),
              borderRadius: BorderRadius.circular(14),
              boxShadow: [
                BoxShadow(
                  color: Colors.green.withOpacity(0.3),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              children: [
                const Icon(Icons.check_circle, color: Colors.white, size: 28),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Proyecto ya calificado',
                        style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 14)),
                    Text(
                      'Nota final: ${detalle.puntuacion?.toStringAsFixed(2) ?? '-'} pts',
                      style: const TextStyle(color: Colors.white70, fontSize: 13),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
        ],

        // Tarjeta de datos básicos
        _sectionCard(
          icon: Icons.assignment_outlined,
          title: 'Datos del proyecto',
          children: [
            _dataRow(Icons.title, 'Título', p.titulo),
            _divider(),
            _dataRow(Icons.calendar_today_outlined, 'Fecha evaluación',
                detalle.acta.fecha ?? 'No definida'),
            _divider(),
            _dataRow(Icons.fact_check_outlined, 'Planilla', detalle.acta.planilla.nombre),
          ],
        ),
        const SizedBox(height: 12),

        // Tarjeta resumen
        _sectionCard(
          icon: Icons.description_outlined,
          title: 'Resumen',
          children: [
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                p.resumen.isNotEmpty ? p.resumen : 'Sin resumen registrado.',
                style: TextStyle(
                  fontSize: 14,
                  height: 1.6,
                  color: p.resumen.isNotEmpty ? Colors.grey[800] : Colors.grey,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _sectionCard({
    required IconData icon,
    required String title,
    required List<Widget> children,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header de la tarjeta
          Container(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
            decoration: const BoxDecoration(
              gradient: LinearGradient(colors: [_kNavy, _kNavy2]),
              borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
            ),
            child: Row(
              children: [
                Icon(icon, color: _kGold, size: 18),
                const SizedBox(width: 8),
                Text(title,
                    style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 13)),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: children,
            ),
          ),
        ],
      ),
    );
  }

  Widget _dataRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: _kNavy2),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: TextStyle(
                        fontSize: 11, color: Colors.grey[500])),
                const SizedBox(height: 2),
                Text(value,
                    style: const TextStyle(
                        fontSize: 13, fontWeight: FontWeight.w600)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _divider() => Divider(height: 12, color: Colors.grey[100]);
}

// ─── Tab: Académico ──────────────────────────────────────────────────────────
class _AcademicoTab extends StatelessWidget {
  final dynamic proyecto;
  const _AcademicoTab({required this.proyecto});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(14, 14, 14, 100),
      children: [
        _AcademicoCard(
          icon: Icons.school_outlined,
          iconColor: const Color(0xFF1565C0),
          bgColor: const Color(0xFFE3F2FD),
          label: 'Carrera',
          value: proyecto.carrera ?? 'No registrada',
        ),
        const SizedBox(height: 10),
        _AcademicoCard(
          icon: Icons.category_outlined,
          iconColor: const Color(0xFF6A1B9A),
          bgColor: const Color(0xFFF3E5F5),
          label: 'Área temática',
          value: proyecto.area ?? 'No registrada',
        ),
        const SizedBox(height: 10),
        _AcademicoCard(
          icon: Icons.account_balance_outlined,
          iconColor: const Color(0xFF00695C),
          bgColor: const Color(0xFFE0F2F1),
          label: 'Entidad Académica',
          value: proyecto.entidadAcademica ?? 'No registrada',
        ),
      ],
    );
  }
}

class _AcademicoCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final Color bgColor;
  final String label;
  final String value;

  const _AcademicoCard({
    required this.icon,
    required this.iconColor,
    required this.bgColor,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: iconColor, size: 26),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: TextStyle(
                        fontSize: 11,
                        color: Colors.grey[500],
                        fontWeight: FontWeight.w500)),
                const SizedBox(height: 4),
                Text(value,
                    style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: _kNavy)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Tab: Equipo ─────────────────────────────────────────────────────────────
class _EquipoTab extends StatelessWidget {
  final dynamic proyecto;
  const _EquipoTab({required this.proyecto});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(14, 14, 14, 100),
      children: [
        _equipoHeader(
          icon: Icons.person_outline,
          title: 'Participantes',
          count: proyecto.participantes.length,
          color: _kNavy,
        ),
        const SizedBox(height: 8),
        if (proyecto.participantes.isEmpty)
          _emptyState('Sin participantes registrados')
        else
          ...proyecto.participantes.asMap().entries.map<Widget>((entry) =>
              _participanteCard(
                entry.value,
                entry.key,
                isParticipante: true,
              )),
        const SizedBox(height: 16),
        _equipoHeader(
          icon: Icons.supervisor_account_outlined,
          title: 'Tutores',
          count: proyecto.tutores.length,
          color: const Color(0xFF00695C),
        ),
        const SizedBox(height: 8),
        if (proyecto.tutores.isEmpty)
          _emptyState('Sin tutor registrado')
        else
          ...proyecto.tutores.asMap().entries.map<Widget>((entry) =>
              _tutorCard(entry.value, entry.key)),
      ],
    );
  }

  Widget _equipoHeader({
    required IconData icon,
    required String title,
    required int count,
    required Color color,
  }) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: color, size: 18),
        ),
        const SizedBox(width: 10),
        Text(title,
            style: TextStyle(
                fontWeight: FontWeight.bold, fontSize: 15, color: color)),
        const SizedBox(width: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
          decoration: BoxDecoration(
            color: color.withOpacity(0.12),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Text('$count',
              style: TextStyle(
                  color: color, fontWeight: FontWeight.bold, fontSize: 12)),
        ),
      ],
    );
  }

  Widget _participanteCard(dynamic p, int index, {required bool isParticipante}) {
    final initials = _initials('${p.nombre} ${p.apellido}');
    final colors = [
      const Color(0xFF1565C0),
      const Color(0xFF6A1B9A),
      const Color(0xFF0D1B3E),
      const Color(0xFF1B5E20),
    ];
    final color = colors[index % colors.length];

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 22,
            backgroundColor: color,
            child: Text(initials,
                style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 14)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('${p.nombre} ${p.apellido}',
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 14)),
                const SizedBox(height: 3),
                Row(
                  children: [
                    Icon(Icons.badge_outlined, size: 13, color: Colors.grey[500]),
                    const SizedBox(width: 4),
                    Text('CI: ${p.ci}',
                        style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                  ],
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text('Participante',
                style: TextStyle(
                    fontSize: 10,
                    color: color,
                    fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }

  Widget _tutorCard(dynamic t, int index) {
    final initials = _initials('${t.nombre} ${t.apellido}');
    const color = Color(0xFF00695C);

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withOpacity(0.2)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 22,
            backgroundColor: color,
            child: Text(initials,
                style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 14)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('${t.nombre} ${t.apellido}',
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 14)),
                const SizedBox(height: 3),
                Row(
                  children: [
                    Icon(Icons.work_outline, size: 13, color: Colors.grey[500]),
                    const SizedBox(width: 4),
                    Text('Cód: ${t.codEmpleado}',
                        style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                  ],
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Text('Tutor',
                style: TextStyle(
                    fontSize: 10,
                    color: color,
                    fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }

  Widget _emptyState(String msg) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Row(
          children: [
            Icon(Icons.info_outline, size: 16, color: Colors.grey[400]),
            const SizedBox(width: 8),
            Text(msg, style: TextStyle(color: Colors.grey[500], fontSize: 13)),
          ],
        ),
      );

  String _initials(String name) {
    final parts = name.trim().split(' ');
    if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    if (parts.isNotEmpty && parts[0].isNotEmpty) return parts[0][0].toUpperCase();
    return '?';
  }
}

// ─── Tab: Archivo ────────────────────────────────────────────────────────────
class _ArchivoTab extends StatefulWidget {
  final dynamic proyecto;
  const _ArchivoTab({required this.proyecto});

  @override
  State<_ArchivoTab> createState() => _ArchivoTabState();
}

class _ArchivoTabState extends State<_ArchivoTab> {
  bool _descargando = false;
  double _progreso = 0;
  String? _error;

  String? get _archivoUrl {
    if (widget.proyecto.archivo == null || widget.proyecto.archivo!.isEmpty)
      return null;
    final archivo = widget.proyecto.archivo as String;
    if (archivo.startsWith('http')) return archivo;
    final base = kBackendUrl.replaceAll('/graphql/', '');
    return '$base/media/$archivo';
  }

  bool _esPdf(String url) {
    final ext = url.split('?').first.split('.').last.toLowerCase();
    return ext == 'pdf';
  }

  bool _esWord(String url) {
    final ext = url.split('?').first.split('.').last.toLowerCase();
    return ext == 'doc' || ext == 'docx';
  }

  String _nombreArchivo(String url) => url.split('/').last.split('?').first;

  Future<void> _abrirArchivo() async {
    final url = _archivoUrl;
    if (url == null) return;

    setState(() { _descargando = true; _progreso = 0; _error = null; });

    try {
      final token = await AuthService.getToken();
      final dir = await getTemporaryDirectory();
      final nombre = _nombreArchivo(url);
      final filePath = '${dir.path}/$nombre';
      final file = File(filePath);

      if (!file.existsSync()) {
        final dio = Dio();
        await dio.download(
          url,
          filePath,
          options: Options(
            headers: {'Authorization': 'JWT $token'},
            receiveTimeout: const Duration(minutes: 10),
            sendTimeout: const Duration(minutes: 2),
          ),
          onReceiveProgress: (recv, total) {
            if (total > 0 && mounted) {
              setState(() => _progreso = recv / total);
            }
          },
        );
      }

      if (!mounted) return;

      if (_esPdf(url)) {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => _PdfViewerScreen(filePath: filePath)),
        );
      } else {
        final result = await OpenFile.open(filePath);
        if (result.type != ResultType.done) {
          setState(() => _error =
              'No se encontró una app para abrir este archivo. Instala WPS Office o Microsoft Word.');
        }
      }
    } catch (e) {
      setState(() => _error = 'Error al descargar el documento. Verifica la conexión.');
    } finally {
      if (mounted) setState(() => _descargando = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final url = _archivoUrl;

    if (url == null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.insert_drive_file_outlined,
                  size: 48, color: Colors.grey[400]),
            ),
            const SizedBox(height: 16),
            Text('Sin documento adjunto',
                style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.grey[700])),
            const SizedBox(height: 6),
            Text('Este proyecto no tiene archivos disponibles.',
                style: TextStyle(fontSize: 13, color: Colors.grey[500])),
          ],
        ),
      );
    }

    final esPdf = _esPdf(url);
    final esWord = _esWord(url);
    final nombre = _nombreArchivo(url);
    final tipoLabel = esPdf ? 'PDF' : esWord ? 'Word' : 'Documento';
    final tipoColor = esPdf ? Colors.red[700]! : Colors.blue[700]!;
    final tipoIcon = esPdf ? Icons.picture_as_pdf : Icons.description;

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 100),
      children: [
        // Tarjeta del archivo
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.06),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            children: [
              // Preview tipo
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 28),
                decoration: BoxDecoration(
                  color: esPdf ? Colors.red[50] : Colors.blue[50],
                  borderRadius:
                      const BorderRadius.vertical(top: Radius.circular(20)),
                ),
                child: Column(
                  children: [
                    Icon(tipoIcon, size: 64, color: tipoColor),
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 4),
                      decoration: BoxDecoration(
                        color: tipoColor.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(tipoLabel,
                          style: TextStyle(
                              color: tipoColor,
                              fontWeight: FontWeight.bold,
                              fontSize: 13)),
                    ),
                  ],
                ),
              ),
              // Info del archivo
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.insert_drive_file_outlined,
                            size: 16, color: Colors.grey[500]),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            nombre,
                            style: const TextStyle(
                                fontSize: 13, fontWeight: FontWeight.w600),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(esPdf ? Icons.visibility_outlined : Icons.open_in_new,
                            size: 14, color: Colors.grey[500]),
                        const SizedBox(width: 6),
                        Text(
                          esPdf
                              ? 'Se abrirá en el visor interno'
                              : 'Se abrirá con una app externa',
                          style:
                              TextStyle(fontSize: 12, color: Colors.grey[500]),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Progreso de descarga
        if (_descargando) ...[
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: _kNavy),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      _progreso > 0
                          ? 'Descargando ${(_progreso * 100).toStringAsFixed(0)}%...'
                          : 'Conectando con el servidor...',
                      style:
                          const TextStyle(fontSize: 13, color: _kNavy),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: _progreso > 0 ? _progreso : null,
                    backgroundColor: Colors.grey[200],
                    color: _kNavy,
                    minHeight: 6,
                  ),
                ),
              ],
            ),
          ),
        ] else ...[
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton.icon(
              icon: Icon(esPdf ? Icons.visibility_outlined : Icons.open_in_new,
                  size: 20),
              label: Text(
                esPdf ? 'Abrir PDF' : 'Abrir documento',
                style: const TextStyle(
                    fontSize: 15, fontWeight: FontWeight.bold),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: _kNavy,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14)),
                elevation: 0,
              ),
              onPressed: _abrirArchivo,
            ),
          ),
        ],

        // Error
        if (_error != null) ...[
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.red[50],
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.red.shade200),
            ),
            child: Row(
              children: [
                const Icon(Icons.error_outline, color: Colors.red, size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(_error!,
                      style:
                          const TextStyle(color: Colors.red, fontSize: 13)),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

// ─── PDF Viewer ──────────────────────────────────────────────────────────────
class _PdfViewerScreen extends StatefulWidget {
  final String filePath;
  const _PdfViewerScreen({required this.filePath});

  @override
  State<_PdfViewerScreen> createState() => _PdfViewerScreenState();
}

class _PdfViewerScreenState extends State<_PdfViewerScreen> {
  int _paginaActual = 0;
  int _totalPaginas = 0;
  bool _listo = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[900],
      appBar: AppBar(
        backgroundColor: _kNavy,
        foregroundColor: Colors.white,
        title: const Text('Documento del proyecto',
            style: TextStyle(fontSize: 15)),
        actions: [
          if (_totalPaginas > 0)
            Container(
              margin: const EdgeInsets.only(right: 12),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                '${_paginaActual + 1} / $_totalPaginas',
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
              ),
            ),
        ],
      ),
      body: Stack(
        children: [
          PDFView(
            filePath: widget.filePath,
            enableSwipe: true,
            swipeHorizontal: false,
            autoSpacing: true,
            pageFling: true,
            onRender: (pages) {
              if (mounted)
                setState(() { _totalPaginas = pages ?? 0; _listo = true; });
            },
            onPageChanged: (page, total) {
              if (mounted) setState(() => _paginaActual = page ?? 0);
            },
            onError: (e) {
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Error al abrir PDF: $e'),
                    backgroundColor: Colors.red,
                  ),
                );
              }
            },
          ),
          if (!_listo)
            Container(
              color: Colors.grey[900],
              child: const Center(
                child: CircularProgressIndicator(color: _kGold),
              ),
            ),
        ],
      ),
    );
  }
}
