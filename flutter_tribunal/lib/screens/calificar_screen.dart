import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../models/evaluacion.dart';
import '../config/graphql_config.dart';

const String _editarDetalleMutation = r'''
  mutation EditarDetalleEvaluacion($idDetalleEvaluacion: ID!, $puntuacion: Decimal!) {
    editarDetalleEvaluacion(
      idDetalleEvaluacion: $idDetalleEvaluacion,
      puntuacion: $puntuacion
    ) {
      detalleEvaluacion { id puntuacion }
      ok
      error
    }
  }
''';

const String _crearPuntuacionMutation = r'''
  mutation CrearPuntuacionCriterio(
    $idDetalleEvaluacion: ID!,
    $idCriterio: ID!,
    $puntuacionCriterio: Decimal!
  ) {
    crearPuntuacionCriterio(
      idDetalleEvaluacion: $idDetalleEvaluacion,
      idCriterio: $idCriterio,
      puntuacionCriterio: $puntuacionCriterio
    ) {
      puntuacion { id puntuacionCriterio }
      ok
      error
    }
  }
''';

const String _editarPuntuacionMutation = r'''
  mutation EditarPuntuacionCriterio(
    $idPuntuacionCriterio: ID!,
    $puntuacionCriterio: Decimal!
  ) {
    editarPuntuacionCriterio(
      idPuntuacionCriterio: $idPuntuacionCriterio,
      puntuacionCriterio: $puntuacionCriterio
    ) {
      ok
      error
    }
  }
''';

const String _getPuntuacionesQuery = r'''
  query GetPuntuacionesDetalle($id: ID!) {
    detalleEvaluacion(id: $id) {
      puntuacionesCriterio {
        id
        criterio { idCriterio }
        puntuacionCriterio
      }
    }
  }
''';

class CalificarScreen extends StatefulWidget {
  final DetalleEvaluacion detalle;
  const CalificarScreen({super.key, required this.detalle});

  @override
  State<CalificarScreen> createState() => _CalificarScreenState();
}

class _CalificarScreenState extends State<CalificarScreen> {
  final Map<String, TextEditingController> _controllers = {};
  final Map<String, String> _existingPuntuacionIds = {};
  bool _loading = false;
  bool _loadingExisting = true;
  String? _errorMsg;

  @override
  void initState() {
    super.initState();
    _initControllers();
    _loadExistingPuntuaciones();
  }

  void _initControllers() {
    for (final seccion in widget.detalle.acta.planilla.secciones) {
      for (final criterio in seccion.criterios) {
        _controllers[criterio.idCriterio] = TextEditingController(text: '0');
      }
    }
  }

  Future<void> _loadExistingPuntuaciones() async {
    setState(() => _loadingExisting = true);
    try {
      final client = await GraphQLConfig.buildClient();
      final result = await client.query(QueryOptions(
        document: gql(_getPuntuacionesQuery),
        variables: {'id': widget.detalle.idDetalle},
        fetchPolicy: FetchPolicy.networkOnly,
      ));
      final puns = result.data?['detalleEvaluacion']?['puntuacionesCriterio']
          as List<dynamic>?;
      if (puns != null) {
        for (final p in puns) {
          final criterioId = p['criterio']['idCriterio'].toString();
          final idPun = p['id'].toString();
          final valor = p['puntuacionCriterio'].toString();
          _existingPuntuacionIds[criterioId] = idPun;
          _controllers[criterioId]?.text = valor;
        }
      }
    } catch (_) {}
    if (mounted) setState(() => _loadingExisting = false);
  }

  double get _totalActual {
    double total = 0;
    for (final ctrl in _controllers.values) {
      total += double.tryParse(ctrl.text) ?? 0;
    }
    return total;
  }

  double get _notaMaxima => widget.detalle.acta.planilla.notaMaxima;

  double get _porcentaje =>
      _notaMaxima > 0 ? (_totalActual / _notaMaxima).clamp(0.0, 1.0) : 0;

  Future<void> _confirmarCalificacion() async {
    for (final seccion in widget.detalle.acta.planilla.secciones) {
      for (final criterio in seccion.criterios) {
        final val =
            double.tryParse(_controllers[criterio.idCriterio]?.text ?? '0') ?? 0;
        if (val < 0 || val > criterio.puntaje) {
          setState(() => _errorMsg =
              '"${criterio.nombre}" debe estar entre 0 y ${criterio.puntaje}.');
          return;
        }
      }
    }

    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF0D1B3E).withOpacity(0.08),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.send_rounded,
                    color: Color(0xFF0D1B3E), size: 32),
              ),
              const SizedBox(height: 16),
              const Text('Confirmar calificación',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17)),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.grey[50],
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: Column(
                  children: [
                    Text(
                      '${_totalActual.toStringAsFixed(2)} / ${_notaMaxima.toStringAsFixed(2)}',
                      style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF0D1B3E)),
                    ),
                    const SizedBox(height: 6),
                    LinearProgressIndicator(
                      value: _porcentaje,
                      backgroundColor: Colors.grey[200],
                      color: _porcentaje > 0.6 ? Colors.green : Colors.orange,
                      minHeight: 6,
                      borderRadius: BorderRadius.circular(3),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'Esta acción registrará tu evaluación. ¿Continuar?',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey[600], fontSize: 13),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(ctx, false),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10)),
                      ),
                      child: const Text('Cancelar'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0D1B3E),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10)),
                      ),
                      onPressed: () => Navigator.pop(ctx, true),
                      child: const Text('Enviar'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );

    if (confirm != true) return;

    setState(() {
      _loading = true;
      _errorMsg = null;
    });

    try {
      final client = await GraphQLConfig.buildClient();

      final detalleResult = await client.mutate(MutationOptions(
        document: gql(_editarDetalleMutation),
        variables: {
          'idDetalleEvaluacion': widget.detalle.idDetalle,
          'puntuacion': _totalActual.toStringAsFixed(2),
        },
      ));
      if (detalleResult.data?['editarDetalleEvaluacion']?['ok'] != true) {
        setState(() => _errorMsg =
            detalleResult.data?['editarDetalleEvaluacion']?['error'] ??
                'Error al guardar puntuación total.');
        return;
      }

      for (final seccion in widget.detalle.acta.planilla.secciones) {
        for (final criterio in seccion.criterios) {
          final val =
              double.tryParse(_controllers[criterio.idCriterio]?.text ?? '0') ?? 0;
          final existingId = _existingPuntuacionIds[criterio.idCriterio];

          QueryResult result;
          if (existingId != null) {
            result = await client.mutate(MutationOptions(
              document: gql(_editarPuntuacionMutation),
              variables: {
                'idPuntuacionCriterio': existingId,
                'puntuacionCriterio': val.toStringAsFixed(2),
              },
            ));
          } else {
            result = await client.mutate(MutationOptions(
              document: gql(_crearPuntuacionMutation),
              variables: {
                'idDetalleEvaluacion': widget.detalle.idDetalle,
                'idCriterio': criterio.idCriterio,
                'puntuacionCriterio': val.toStringAsFixed(2),
              },
            ));
          }

          final key = existingId != null
              ? 'editarPuntuacionCriterio'
              : 'crearPuntuacionCriterio';
          if (result.data?[key]?['ok'] != true) {
            setState(() => _errorMsg =
                result.data?[key]?['error'] ??
                    'Error al guardar criterio "${criterio.nombre}".');
            return;
          }
        }
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Row(
              children: [
                Icon(Icons.check_circle, color: Colors.white),
                SizedBox(width: 10),
                Text('Calificación enviada correctamente.'),
              ],
            ),
            backgroundColor: Colors.green[700],
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
        Navigator.of(context).pop();
      }
    } catch (e) {
      setState(() => _errorMsg = 'Error inesperado: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    for (final c in _controllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF0F2F8),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0D1B3E),
        foregroundColor: Colors.white,
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Calificar proyecto',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            Text(
              widget.detalle.acta.planilla.nombre,
              style: const TextStyle(fontSize: 11, color: Colors.white60),
            ),
          ],
        ),
      ),
      body: _loadingExisting
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFF0D1B3E)))
          : Column(
              children: [
                Expanded(child: _buildForm()),
                _buildBottomBar(),
              ],
            ),
    );
  }

  Widget _buildForm() {
    final planilla = widget.detalle.acta.planilla;
    return ListView(
      padding: const EdgeInsets.all(14),
      children: [
        // Proyecto header card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF0D1B3E), Color(0xFF1A3A6E)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF0D1B3E).withOpacity(0.3),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                widget.detalle.acta.proyecto.titulo,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 15,
                ),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: _scoreBox('Total actual',
                        _totalActual.toStringAsFixed(2), Colors.orange),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _scoreBox('Nota máxima',
                        _notaMaxima.toStringAsFixed(2), const Color(0xFFD4AF37)),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: _porcentaje,
                  backgroundColor: Colors.white.withOpacity(0.2),
                  color: _porcentaje > 0.6 ? Colors.green[300] : Colors.orange[300],
                  minHeight: 6,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        ...planilla.secciones.map((seccion) => _SeccionWidget(
              seccion: seccion,
              controllers: _controllers,
              onChanged: () => setState(() {}),
            )),
        if (_errorMsg != null)
          Container(
            margin: const EdgeInsets.only(top: 4, bottom: 8),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.red[50],
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Colors.red.shade200),
            ),
            child: Row(
              children: [
                const Icon(Icons.error_outline, color: Colors.red, size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(_errorMsg!,
                      style: const TextStyle(color: Colors.red, fontSize: 13)),
                ),
              ],
            ),
          ),
        const SizedBox(height: 80),
      ],
    );
  }

  Widget _scoreBox(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.12),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style: TextStyle(
                  color: Colors.white.withOpacity(0.65), fontSize: 11)),
          const SizedBox(height: 2),
          Text(value,
              style: TextStyle(
                  color: color,
                  fontSize: 18,
                  fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildBottomBar() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 12,
            offset: const Offset(0, -3),
          )
        ],
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('Total acumulado',
                      style: TextStyle(fontSize: 11, color: Colors.grey)),
                  const SizedBox(height: 2),
                  Text(
                    '${_totalActual.toStringAsFixed(2)} / ${_notaMaxima.toStringAsFixed(2)}',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: _totalActual > _notaMaxima
                          ? Colors.red
                          : const Color(0xFF0D1B3E),
                    ),
                  ),
                ],
              ),
            ),
            SizedBox(
              height: 48,
              child: ElevatedButton.icon(
                icon: _loading
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.send_rounded, size: 18),
                label: const Text('Enviar calificación',
                    style: TextStyle(fontWeight: FontWeight.w600)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0D1B3E),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 18),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
                onPressed: _loading ? null : _confirmarCalificacion,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MaxValueFormatter extends TextInputFormatter {
  final double max;
  _MaxValueFormatter(this.max);

  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    if (newValue.text.isEmpty) return newValue;
    if (newValue.text == '.' || newValue.text.endsWith('.')) return newValue;
    final val = double.tryParse(newValue.text);
    if (val == null) return oldValue;
    if (val > max) {
      final capped = max % 1 == 0 ? max.toInt().toString() : max.toStringAsFixed(2);
      return TextEditingValue(
        text: capped,
        selection: TextSelection.collapsed(offset: capped.length),
      );
    }
    return newValue;
  }
}

class _SeccionWidget extends StatelessWidget {
  final Seccion seccion;
  final Map<String, TextEditingController> controllers;
  final VoidCallback onChanged;

  const _SeccionWidget({
    required this.seccion,
    required this.controllers,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                const Color(0xFF0D1B3E).withOpacity(0.85),
                const Color(0xFF1A3A6E).withOpacity(0.85),
              ],
            ),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            children: [
              const Icon(Icons.list_alt_rounded,
                  color: Color(0xFFD4AF37), size: 18),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  seccion.nombre,
                  style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                      fontSize: 13),
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFD4AF37).withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '${seccion.ponderacion.toStringAsFixed(0)}%',
                  style: const TextStyle(
                      color: Color(0xFFD4AF37),
                      fontWeight: FontWeight.bold,
                      fontSize: 12),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 6),
        ...seccion.criterios.map((criterio) => _CriterioField(
              criterio: criterio,
              controller: controllers[criterio.idCriterio]!,
              onChanged: onChanged,
            )),
        const SizedBox(height: 14),
      ],
    );
  }
}

class _CriterioField extends StatelessWidget {
  final Criterio criterio;
  final TextEditingController controller;
  final VoidCallback onChanged;

  const _CriterioField({
    required this.criterio,
    required this.controller,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final valor = double.tryParse(controller.text) ?? 0;
    final porcentaje =
        criterio.puntaje > 0 ? (valor / criterio.puntaje).clamp(0.0, 1.0) : 0.0;

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 4),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade100),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(criterio.nombre,
                    style: const TextStyle(
                        fontSize: 13, fontWeight: FontWeight.w600)),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(3),
                        child: LinearProgressIndicator(
                          value: porcentaje,
                          backgroundColor: Colors.grey[100],
                          color: porcentaje > 0.6
                              ? Colors.green[400]
                              : Colors.orange[400],
                          minHeight: 4,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text('/ ${criterio.puntaje.toStringAsFixed(0)}',
                        style: const TextStyle(
                            fontSize: 11, color: Colors.grey)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          SizedBox(
            width: 72,
            child: TextFormField(
              controller: controller,
              keyboardType:
                  const TextInputType.numberWithOptions(decimal: true),
              textAlign: TextAlign.center,
              style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 17,
                  color: Color(0xFF0D1B3E)),
              decoration: InputDecoration(
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: BorderSide(color: Colors.grey.shade300)),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(
                      color: Color(0xFF0D1B3E), width: 2),
                ),
                filled: true,
                fillColor: Colors.grey[50],
              ),
              inputFormatters: [
                FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d*')),
                _MaxValueFormatter(criterio.puntaje),
              ],
              onChanged: (_) => onChanged(),
            ),
          ),
        ],
      ),
    );
  }
}
