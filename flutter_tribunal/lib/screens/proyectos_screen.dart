import 'dart:math';
import 'package:flutter/material.dart';
import '../config/graphql_config.dart';
import '../models/evaluacion.dart';
import '../services/auth_service.dart';
import 'proyecto_detalle_screen.dart';
import 'package:graphql_flutter/graphql_flutter.dart';

const String _misProyectosQuery = r'''
  query MisProyectosAsignados {
    misProyectosAsignados {
      id
      yaEvaluo
      puntuacion
      permisoCalificacionTardia
      actaEvaluacion {
        idActaEvaluacion
        fecha
        consolidada
        planillaEvaluativa {
          idPlanillaEvaluativa
          nombre
          notaMaxima
          secciones {
            idSeccion
            nombre
            ponderacion
            criterios {
              idCriterio
              nombre
              puntaje
            }
          }
        }
        proyecto {
          idProyecto
          titulo
          resumen
          archivo
          estado
          ofertaEaCarrera {
            carrera
            entidadAcademica { nombre }
            oferta {
              modalidadArea {
                area { nombre }
              }
            }
          }
          participantes { nombre apellido ci }
          tutores { nombre apellido codEmpleado }
        }
      }
    }
  }
''';

const _kNavy  = Color(0xFF0D1B3E);
const _kNavy2 = Color(0xFF1A3A6E);
const _kGold  = Color(0xFFD4AF37);

class ProyectosScreen extends StatefulWidget {
  const ProyectosScreen({super.key});

  @override
  State<ProyectosScreen> createState() => _ProyectosScreenState();
}

class _ProyectosScreenState extends State<ProyectosScreen>
    with TickerProviderStateMixin {
  List<DetalleEvaluacion> _detalles = [];
  bool _loading = true;
  String? _error;
  String? _tribunalNombre;
  String _searchQuery = '';
  String _filtro = 'todos'; // 'todos' | 'pendientes' | 'calificados'
  final TextEditingController _searchCtrl = TextEditingController();

  late final AnimationController _listAnimCtrl;
  late final AnimationController _progressAnimCtrl;
  late Animation<double> _progressAnim;

  List<DetalleEvaluacion> get _filtrados {
    var lista = _detalles;
    // Un jurado con permiso tardío es tratado como pendiente aunque yaEvaluo=true
    if (_filtro == 'pendientes') lista = lista.where((d) => !d.yaEvaluo || d.permisoCalificacionTardia).toList();
    if (_filtro == 'calificados') lista = lista.where((d) => d.yaEvaluo && !d.permisoCalificacionTardia).toList();
    if (_searchQuery.isNotEmpty) {
      final q = _searchQuery.toLowerCase();
      lista = lista.where((d) =>
          d.acta.proyecto.titulo.toLowerCase().contains(q)).toList();
    }
    return lista;
  }

  @override
  void initState() {
    super.initState();
    _listAnimCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 600));
    _progressAnimCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 1200));
    _progressAnim = Tween<double>(begin: 0, end: 0).animate(
        CurvedAnimation(parent: _progressAnimCtrl, curve: Curves.easeOutCubic));
    _loadData();
  }

  @override
  void dispose() {
    _listAnimCtrl.dispose();
    _progressAnimCtrl.dispose();
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() { _loading = true; _error = null; });
    try {
      _tribunalNombre = await AuthService.getTribunalNombre();
      final client = await GraphQLConfig.buildClient();
      final result = await client.query(QueryOptions(
        document: gql(_misProyectosQuery),
        fetchPolicy: FetchPolicy.networkOnly,
      ));
      if (result.hasException) {
        setState(() => _error = 'Error al cargar proyectos. Intenta nuevamente.');
        return;
      }
      final rawList = result.data?['misProyectosAsignados'] as List<dynamic>? ?? [];
      setState(() {
        _detalles = rawList
            .map((e) => DetalleEvaluacion.fromJson(e as Map<String, dynamic>))
            .toList();
      });
      // Animar el círculo de progreso
      final pct = _detalles.isEmpty
          ? 0.0
          : _detalles.where((d) => d.yaEvaluo).length / _detalles.length;
      _progressAnim = Tween<double>(begin: _progressAnim.value, end: pct).animate(
          CurvedAnimation(parent: _progressAnimCtrl, curve: Curves.easeOutCubic));
      _progressAnimCtrl.forward(from: 0);
      _listAnimCtrl.forward(from: 0);
    } catch (e) {
      setState(() => _error = 'Error: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _logout() async {
    await AuthService.logout();
    if (mounted) Navigator.of(context).pushReplacementNamed('/login');
  }

  void _openDetalle(DetalleEvaluacion detalle) async {
    await Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => ProyectoDetalleScreen(detalle: detalle)),
    );
    _loadData();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF0F2F8),
      body: RefreshIndicator(
        color: _kNavy,
        onRefresh: _loadData,
        child: CustomScrollView(
          slivers: [
            _buildSliverHeader(),
            if (_loading)
              const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator(color: _kNavy)),
              )
            else if (_error != null)
              SliverFillRemaining(child: _buildError())
            else if (_detalles.isEmpty)
              SliverFillRemaining(child: _buildEmpty())
            else
              _buildList(),

          ],
        ),
      ),
    );
  }

  Widget _buildSliverHeader() {
    final total      = _detalles.length;
    final evaluados  = _detalles.where((d) => d.yaEvaluo).length;
    final pendientes = total - evaluados;
    final pct = total == 0 ? 0.0 : evaluados / total;

    return SliverToBoxAdapter(
      child: ClipPath(
        clipper: _WaveClipper(),
        child: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [_kNavy, _kNavy2],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        child: SafeArea(
          bottom: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 52),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Topbar
                Row(
                  children: [
                    Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      padding: const EdgeInsets.all(5),
                      child: Image.asset('assets/images/logo.png'),
                    ),
                    const SizedBox(width: 10),
                    const Expanded(
                      child: Text('Panel de Tribunal',
                          style: TextStyle(
                              color: Colors.white,
                              fontSize: 15,
                              fontWeight: FontWeight.bold)),
                    ),
                    IconButton(
                      icon: const Icon(Icons.refresh_rounded, color: Colors.white70, size: 22),
                      onPressed: _loadData,
                      tooltip: 'Actualizar',
                    ),
                    IconButton(
                      icon: const Icon(Icons.logout_rounded, color: Colors.white70, size: 22),
                      onPressed: _logout,
                      tooltip: 'Cerrar sesión',
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Greeting + dashboard card
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(color: Colors.white.withOpacity(0.18)),
                  ),
                  child: Row(
                    children: [
                      // Círculo de progreso
                      AnimatedBuilder(
                        animation: _progressAnim,
                        builder: (_, __) => SizedBox(
                          width: 90,
                          height: 90,
                          child: CustomPaint(
                            painter: _CircleProgressPainter(
                              progress: _progressAnim.value,
                              trackColor: Colors.white.withOpacity(0.2),
                              progressColor: _kGold,
                              strokeWidth: 8,
                            ),
                            child: Center(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    '${(pct * 100).toInt()}%',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 20,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 18),

                      // Texto bienvenida + stats
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _loading
                                  ? 'Bienvenido'
                                  : _tribunalNombre != null
                                      ? 'Hola,'
                                      : 'Bienvenido',
                              style: TextStyle(
                                color: Colors.white.withOpacity(0.75),
                                fontSize: 13,
                              ),
                            ),
                            if (_tribunalNombre != null)
                              Text(
                                _tribunalNombre!,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 17,
                                  fontWeight: FontWeight.bold,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                _miniStat(evaluados.toString(), 'Evaluados', Colors.greenAccent),
                                const SizedBox(width: 12),
                                _miniStat(pendientes.toString(), 'Pendientes', Colors.orangeAccent),
                                const SizedBox(width: 12),
                                _miniStat(total.toString(), 'Total', Colors.white70),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                // Mensaje de progreso
                if (!_loading && total > 0) ...[
                  const SizedBox(height: 14),
                  _progressMessage(evaluados, total),
                ],

                const SizedBox(height: 18),
                // Buscador
                Container(
                  height: 44,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.13),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: Colors.white.withOpacity(0.2)),
                  ),
                  child: TextField(
                    controller: _searchCtrl,
                    onChanged: (v) => setState(() => _searchQuery = v),
                    style: const TextStyle(color: Colors.white, fontSize: 14),
                    cursorColor: _kGold,
                    decoration: InputDecoration(
                      hintText: 'Buscar proyecto...',
                      hintStyle: TextStyle(color: Colors.white.withOpacity(0.45), fontSize: 14),
                      prefixIcon: Icon(Icons.search_rounded, color: Colors.white.withOpacity(0.6), size: 20),
                      suffixIcon: _searchQuery.isNotEmpty
                          ? IconButton(
                              icon: Icon(Icons.close_rounded, color: Colors.white.withOpacity(0.6), size: 18),
                              onPressed: () { _searchCtrl.clear(); setState(() => _searchQuery = ''); },
                            )
                          : null,
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        ),
      ),
    );
  }

  Widget _miniStat(String value, String label, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(value,
            style: TextStyle(
                color: color, fontSize: 18, fontWeight: FontWeight.bold)),
        Text(label,
            style: TextStyle(
                color: Colors.white.withOpacity(0.6), fontSize: 10)),
      ],
    );
  }

  Widget _progressMessage(int evaluados, int total) {
    String msg;
    IconData icon;
    Color color;
    if (evaluados == 0) {
      msg = 'Aún no has calificado ningún proyecto';
      icon = Icons.hourglass_empty_rounded;
      color = Colors.orangeAccent;
    } else if (evaluados == total) {
      msg = '¡Completaste todas tus evaluaciones!';
      icon = Icons.celebration_rounded;
      color = Colors.greenAccent;
    } else {
      msg = 'Llevas $evaluados de $total proyectos calificados';
      icon = Icons.trending_up_rounded;
      color = _kGold;
    }
    return Row(
      children: [
        Icon(icon, color: color, size: 16),
        const SizedBox(width: 6),
        Text(msg,
            style: TextStyle(
                color: Colors.white.withOpacity(0.8),
                fontSize: 12,
                fontWeight: FontWeight.w500)),
      ],
    );
  }

  Widget _buildList() {
    final lista      = _filtrados;
    // Pendientes: sin calificar O con permiso tardío (aunque ya evaluaron)
    final pendientes = lista.where((d) => !d.yaEvaluo || d.permisoCalificacionTardia).toList();
    final evaluados  = lista.where((d) => d.yaEvaluo && !d.permisoCalificacionTardia).toList();

    return SliverPadding(
      padding: const EdgeInsets.fromLTRB(14, 8, 14, 30),
      sliver: SliverList(
        delegate: SliverChildListDelegate([
          _buildFiltros(),
          const SizedBox(height: 14),

          if (lista.isEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 48),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.search_off_rounded, size: 48, color: Colors.grey[400]),
                  const SizedBox(height: 12),
                  Text(
                    _searchQuery.isNotEmpty
                        ? 'Sin resultados para "$_searchQuery"'
                        : 'Sin proyectos en este filtro',
                    style: TextStyle(color: Colors.grey[500], fontSize: 14),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),

          // ── Pendientes y con permiso tardío ────────────────────────
          if (pendientes.isNotEmpty) ...[
            _sectionHeader('Pendientes', pendientes.length, Colors.orange),
            const SizedBox(height: 10),
            ...pendientes.asMap().entries.map((e) => _animatedCard(
                  e.key,
                  _ProyectoCard(detalle: e.value, onTap: () => _openDetalle(e.value)),
                )),
          ],

          // ── Calificados: carrusel horizontal ────────────────────────
          if (evaluados.isNotEmpty) ...[
            const SizedBox(height: 20),
            _sectionHeader('Calificados', evaluados.length, Colors.green),
            const SizedBox(height: 12),
            SizedBox(
              height: 220,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.only(right: 4),
                itemCount: evaluados.length,
                itemBuilder: (_, i) => _CarruselCard(
                  detalle: evaluados[i],
                  onTap: () => _openDetalle(evaluados[i]),
                ),
              ),
            ),
          ],
        ]),
      ),
    );
  }

  Widget _buildFiltros() {
    const opciones = [
      ('todos',        'Todos',       Icons.apps_rounded),
      ('pendientes',   'Pendientes',  Icons.hourglass_top_rounded),
      ('calificados',  'Calificados', Icons.check_circle_outline_rounded),
    ];
    return Row(
      children: opciones.map((op) {
        final activo = _filtro == op.$1;
        return Padding(
          padding: const EdgeInsets.only(right: 8),
          child: GestureDetector(
            onTap: () => setState(() => _filtro = op.$1),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: activo ? _kNavy : Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: activo
                        ? _kNavy.withOpacity(0.3)
                        : Colors.black.withOpacity(0.05),
                    blurRadius: activo ? 8 : 4,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(op.$3,
                      size: 14,
                      color: activo ? _kGold : Colors.grey[500]),
                  const SizedBox(width: 5),
                  Text(
                    op.$2,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: activo ? FontWeight.bold : FontWeight.w500,
                      color: activo ? Colors.white : Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _animatedCard(int index, Widget child) {
    return AnimatedBuilder(
      animation: _listAnimCtrl,
      builder: (_, c) {
        final delay = (index * 0.08).clamp(0.0, 0.7);
        final anim = CurvedAnimation(
          parent: _listAnimCtrl,
          curve: Interval(delay, (delay + 0.4).clamp(0.0, 1.0),
              curve: Curves.easeOut),
        );
        return FadeTransition(
          opacity: anim,
          child: SlideTransition(
            position: Tween<Offset>(
                    begin: const Offset(0, 0.15), end: Offset.zero)
                .animate(anim),
            child: c,
          ),
        );
      },
      child: child,
    );
  }

  Widget _sectionHeader(String title, int count, Color color) {
    return Row(
      children: [
        Container(
          width: 4, height: 20,
          decoration: BoxDecoration(
              color: color, borderRadius: BorderRadius.circular(2)),
        ),
        const SizedBox(width: 10),
        Text(title,
            style: const TextStyle(
                fontWeight: FontWeight.bold, fontSize: 15, color: _kNavy)),
        const SizedBox(width: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
          decoration: BoxDecoration(
              color: color.withOpacity(0.15),
              borderRadius: BorderRadius.circular(12)),
          child: Text('$count',
              style: TextStyle(
                  color: color, fontWeight: FontWeight.bold, fontSize: 13)),
        ),
      ],
    );
  }

  Widget _buildError() => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                    color: Colors.red[50], shape: BoxShape.circle),
                child: const Icon(Icons.error_outline, size: 40, color: Colors.red),
              ),
              const SizedBox(height: 16),
              Text(_error!,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.grey)),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: _loadData,
                icon: const Icon(Icons.refresh),
                label: const Text('Reintentar'),
                style: ElevatedButton.styleFrom(
                    backgroundColor: _kNavy, foregroundColor: Colors.white),
              ),
            ],
          ),
        ),
      );

  Widget _buildEmpty() => Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                  color: Colors.grey[200], shape: BoxShape.circle),
              child: Icon(Icons.inbox_outlined, size: 48, color: Colors.grey[500]),
            ),
            const SizedBox(height: 16),
            Text('No tienes proyectos asignados.',
                style: TextStyle(color: Colors.grey[600], fontSize: 15)),
          ],
        ),
      );
}

// ─── Wave Clipper ────────────────────────────────────────────────────────────
class _WaveClipper extends CustomClipper<Path> {
  @override
  Path getClip(Size size) {
    final path = Path();
    path.lineTo(0, size.height - 36);
    path.quadraticBezierTo(
      size.width * 0.25, size.height - 2,
      size.width * 0.5,  size.height - 22,
    );
    path.quadraticBezierTo(
      size.width * 0.75, size.height - 42,
      size.width,        size.height - 14,
    );
    path.lineTo(size.width, 0);
    path.close();
    return path;
  }

  @override
  bool shouldReclip(_WaveClipper old) => false;
}

// ─── Painter del círculo de progreso ────────────────────────────────────────
class _CircleProgressPainter extends CustomPainter {
  final double progress;
  final Color trackColor;
  final Color progressColor;
  final double strokeWidth;

  const _CircleProgressPainter({
    required this.progress,
    required this.trackColor,
    required this.progressColor,
    required this.strokeWidth,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - strokeWidth) / 2;

    // Track
    canvas.drawCircle(
      center,
      radius,
      Paint()
        ..color = trackColor
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth,
    );

    // Arc
    if (progress > 0) {
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        -pi / 2,
        2 * pi * progress,
        false,
        Paint()
          ..color = progressColor
          ..style = PaintingStyle.stroke
          ..strokeWidth = strokeWidth
          ..strokeCap = StrokeCap.round,
      );
    }
  }

  @override
  bool shouldRepaint(_CircleProgressPainter old) =>
      old.progress != progress;
}

// ─── Tarjeta de proyecto ─────────────────────────────────────────────────────
class _ProyectoCard extends StatelessWidget {
  final DetalleEvaluacion detalle;
  final VoidCallback onTap;

  const _ProyectoCard({required this.detalle, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final proyecto       = detalle.acta.proyecto;
    final evaluado       = detalle.yaEvaluo;
    final tienePermiso   = detalle.permisoCalificacionTardia;
    // Con permiso tardío → azul; pendiente normal → naranja; calificado → verde
    final cardColor      = tienePermiso ? Colors.blue : (evaluado ? Colors.green : Colors.orange);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(18),
        child: InkWell(
          borderRadius: BorderRadius.circular(18),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Ícono izquierdo
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: tienePermiso
                          ? [Colors.blue.shade400, Colors.blue.shade700]
                          : evaluado
                              ? [Colors.green.shade400, Colors.green.shade700]
                              : [Colors.orange.shade300, Colors.orange.shade600],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Icon(
                    tienePermiso
                        ? Icons.vpn_key_rounded
                        : evaluado
                            ? Icons.check_circle_outline_rounded
                            : Icons.pending_actions_rounded,
                    color: Colors.white,
                    size: 26,
                  ),
                ),
                const SizedBox(width: 12),

                // Contenido central
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        proyecto.titulo,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                          color: _kNavy,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 6),
                      if (proyecto.area != null)
                        _chip(Icons.category_outlined, proyecto.area!, Colors.blue[700]!),
                      if (proyecto.carrera != null) ...[
                        const SizedBox(height: 4),
                        _chip(Icons.school_outlined, proyecto.carrera!, Colors.purple[700]!),
                      ],
                      const SizedBox(height: 8),
                      // Barra de estado inferior
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: cardColor.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  tienePermiso
                                      ? Icons.vpn_key_rounded
                                      : evaluado
                                          ? Icons.check_rounded
                                          : Icons.radio_button_unchecked,
                                  size: 12,
                                  color: cardColor,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  tienePermiso
                                      ? 'Permiso concedido'
                                      : evaluado
                                          ? 'Calificado'
                                          : 'Pendiente',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: cardColor,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          if (evaluado && detalle.puntuacion != null) ...[
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: _kNavy.withOpacity(0.07),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                '${detalle.puntuacion!.toStringAsFixed(1)} pts',
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: _kNavy,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 4),
                Icon(Icons.chevron_right_rounded,
                    color: Colors.grey[300], size: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _chip(IconData icon, String label, Color color) {
    return Row(
      children: [
        Icon(icon, size: 12, color: color.withOpacity(0.7)),
        const SizedBox(width: 4),
        Expanded(
          child: Text(
            label,
            style: TextStyle(fontSize: 11, color: Colors.grey[600]),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}

// ─── Tarjeta carrusel (calificados) ─────────────────────────────────────────
class _CarruselCard extends StatelessWidget {
  final DetalleEvaluacion detalle;
  final VoidCallback onTap;

  const _CarruselCard({required this.detalle, required this.onTap});

  // Paleta formal y académica — tonos apagados, sobrios
  static const _gradients = [
    [Color(0xFF1C2E4A), Color(0xFF243B55)],
    [Color(0xFF2C3E50), Color(0xFF34495E)],
    [Color(0xFF1A3A4A), Color(0xFF1F4E6A)],
    [Color(0xFF2D3561), Color(0xFF1A2540)],
    [Color(0xFF263445), Color(0xFF1E2D3D)],
  ];

  @override
  Widget build(BuildContext context) {
    final proyecto = detalle.acta.proyecto;
    final nota     = detalle.puntuacion;
    final max      = detalle.acta.planilla.notaMaxima;
    final pct      = max > 0 ? (nota ?? 0) / max : 0.0;
    final idx      = detalle.idDetalle.hashCode.abs() % _gradients.length;
    final grad     = _gradients[idx];

    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 172,
        margin: const EdgeInsets.only(right: 12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          gradient: LinearGradient(
            colors: grad,
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          boxShadow: [
            BoxShadow(
              color: grad[0].withOpacity(0.35),
              blurRadius: 12,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: Stack(
          children: [
            // Círculo decorativo de fondo
            Positioned(
              top: -18,
              right: -18,
              child: Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withOpacity(0.07),
                ),
              ),
            ),
            Positioned(
              bottom: -10,
              left: -10,
              child: Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withOpacity(0.05),
                ),
              ),
            ),

            // Contenido
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Badge calificado
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.18),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.check_rounded, color: Colors.greenAccent, size: 11),
                        SizedBox(width: 3),
                        Text('Calificado',
                            style: TextStyle(
                                color: Colors.white,
                                fontSize: 10,
                                fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 10),

                  // Título
                  Text(
                    proyecto.titulo,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                      height: 1.3,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),

                  const Spacer(),

                  // Barra de progreso de nota
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: pct.clamp(0.0, 1.0),
                      backgroundColor: Colors.white.withOpacity(0.2),
                      color: _kGold,
                      minHeight: 4,
                    ),
                  ),
                  const SizedBox(height: 8),

                  // Nota y max
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        nota != null ? nota.toStringAsFixed(1) : '-',
                        style: const TextStyle(
                          color: _kGold,
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        '/ ${max.toStringAsFixed(0)} pts',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.6),
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
