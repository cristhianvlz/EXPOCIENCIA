import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
  Box, Button, Card, CardContent, CardActions, Typography, CircularProgress,
  Alert, Chip, Grid, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Divider, Stack, LinearProgress, Snackbar, Tooltip, IconButton,
  Tabs, Tab
} from '@mui/material';
import {
  ClockCircleOutlined, CheckOutlined, FormOutlined, TrophyOutlined,
  SearchOutlined, ClearOutlined, BankOutlined
} from '@ant-design/icons';
import MainCard from 'components/MainCard';
import { useAuth } from 'contexts/AuthContext';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Criterio {
  idCriterio: string;
  nombre: string;
  puntaje: string;
}

interface Seccion {
  idSeccion: string;
  nombre: string;
  ponderacion: number;
  criterios: Criterio[];
}

interface PuntuacionCriterio {
  id: string;
  puntuacionCriterio: string;
  criterio: { idCriterio: string; nombre: string; puntaje: string };
}

interface Tribunal {
  idTribunal: string;
  nombre: string;
  apellido: string;
}

interface DetalleEvaluacion {
  id: string;
  puntuacion: string;
  estado: string;
  permisoCalificacionTardia?: boolean;
  tribunal: Tribunal;
  puntuacionesCriterio: PuntuacionCriterio[];
}

interface PlanillaEvaluativa {
  idPlanillaEvaluativa: string;
  nombre: string;
  notaMaxima: string;
  secciones: Seccion[];
}

interface Acta {
  idActaEvaluacion: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  notaFinal: string;
  estado: boolean;
  consolidada: boolean;
  proyecto: {
    idProyecto: string;
    titulo: string;
    estado: string;
    ofertaEaCarrera?: {
      oferta?: {
        modalidadArea?: {
          area?: { idArea: string; nombre: string };
        };
        categoriaEvento?: {
          evento?: { idEvento: string; nombre: string };
        };
      };
    };
  };
  planillaEvaluativa: PlanillaEvaluativa;
  detallesEvaluacion: DetalleEvaluacion[];
}

// ── GQL ──────────────────────────────────────────────────────────────────────
const GET_DATA = gql`
  query {
    todasLasActas {
      idActaEvaluacion
      fecha
      horaInicio
      horaFin
      notaFinal
      estado
      consolidada
      proyecto {
        idProyecto titulo estado
        ofertaEaCarrera {
          oferta {
            modalidadArea {
              area { idArea nombre }
            }
            categoriaEvento {
              evento { idEvento nombre }
            }
          }
        }
      }
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
      detallesEvaluacion {
        id
        puntuacion
        estado
        permisoCalificacionTardia
        tribunal { idTribunal nombre apellido }
        puntuacionesCriterio {
          id
          puntuacionCriterio
          criterio { idCriterio nombre puntaje }
        }
      }
    }
    todosLosTribunales { idTribunal nombre apellido especialidad }
    todosLosCronogramas {
      idCronograma fechaInicio fechaFin estado
      actividad { nombreActividad }
      evento { idEvento nombre }
    }
  }
`;

const CREATE_PUNTUACION = gql`mutation($idDetalleEvaluacion: ID!, $idCriterio: ID!, $puntuacionCriterio: Decimal!) {
  crearPuntuacionCriterio(idDetalleEvaluacion: $idDetalleEvaluacion, idCriterio: $idCriterio, puntuacionCriterio: $puntuacionCriterio) { ok error }
}`;
const EDIT_PUNTUACION = gql`mutation($idPuntuacionCriterio: ID!, $puntuacionCriterio: Decimal) {
  editarPuntuacionCriterio(idPuntuacionCriterio: $idPuntuacionCriterio, puntuacionCriterio: $puntuacionCriterio) { ok error }
}`;
const EDIT_DETALLE = gql`mutation($idDetalleEvaluacion: ID!, $puntuacion: Decimal) {
  editarDetalleEvaluacion(idDetalleEvaluacion: $idDetalleEvaluacion, puntuacion: $puntuacion) { ok error }
}`;

// ── Scoring dialog ────────────────────────────────────────────────────────────
interface ScoringDialogProps {
  open: boolean;
  onClose: () => void;
  acta: Acta | null;
  detalle: DetalleEvaluacion | null;
  onSave: (scores: Record<string, string>, total: number, existingMap: Record<string, PuntuacionCriterio>) => void;
  saving: boolean;
}

function ScoringDialog({ open, onClose, acta, detalle, onSave, saving }: ScoringDialogProps) {
  const planilla = acta?.planillaEvaluativa;
  const existingMap: Record<string, PuntuacionCriterio> = {};
  (detalle?.puntuacionesCriterio || []).forEach(p => {
    existingMap[p.criterio.idCriterio] = p;
  });

  const allCriterios = (planilla?.secciones || []).flatMap(s => s.criterios || []);
  const [scores, setScores] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    allCriterios.forEach(c => {
      init[c.idCriterio] = existingMap[c.idCriterio]?.puntuacionCriterio ?? '';
    });
    return init;
  });

  const handleEnter = () => {
    const init: Record<string, string> = {};
    allCriterios.forEach(c => {
      init[c.idCriterio] = existingMap[c.idCriterio]?.puntuacionCriterio ?? '';
    });
    setScores(init);
  };

  const totalPuntuacion = allCriterios.reduce((sum, c) => {
    const v = parseFloat(scores[c.idCriterio]);
    return sum + (isNaN(v) ? 0 : v);
  }, 0);

  const notaMaxima = parseFloat(planilla?.notaMaxima || '100');
  const progress = Math.min((totalPuntuacion / notaMaxima) * 100, 100);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md"
      TransitionProps={{ onEnter: handleEnter }}>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6">{acta?.proyecto?.titulo}</Typography>
            <Typography variant="caption" color="text.secondary">
              Planilla: {planilla?.nombre} &nbsp;·&nbsp;
              Jurado: {detalle?.tribunal?.nombre} {detalle?.tribunal?.apellido}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h5" color="primary.main" fontWeight={700}>
              {totalPuntuacion.toFixed(1)} / {notaMaxima}
            </Typography>
            <LinearProgress variant="determinate" value={progress}
              sx={{ width: 120, mt: 0.5, height: 6, borderRadius: 3 }} />
          </Box>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        {(planilla?.secciones || []).map(seccion => {
          const seccionTotal = (seccion.criterios || []).reduce((s, c) => {
            const v = parseFloat(scores[c.idCriterio]);
            return s + (isNaN(v) ? 0 : v);
          }, 0);
          const seccionMax = (seccion.criterios || []).reduce((s, c) => s + parseFloat(c.puntaje || '0'), 0);

          return (
            <Box key={seccion.idSeccion} sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, gap: 1 }}>
                <Typography variant="subtitle1" fontWeight={600}>{seccion.nombre}</Typography>
                <Chip label={`${seccion.ponderacion}%`} size="small" color="secondary" variant="outlined" />
                <Box sx={{ flex: 1 }} />
                <Typography variant="body2" color="primary.main" fontWeight={500}>
                  {seccionTotal.toFixed(1)} / {seccionMax} pts
                </Typography>
              </Box>
              <Stack spacing={1.5}>
                {(seccion.criterios || []).map(criterio => {
                  const val = scores[criterio.idCriterio];
                  const numVal = parseFloat(val);
                  const max = parseFloat(criterio.puntaje);
                  const overMax = !isNaN(numVal) && numVal > max;
                  return (
                    <Box key={criterio.idCriterio} sx={{ display: 'flex', alignItems: 'center', gap: 2,
                      p: 1.5, borderRadius: 1, border: '1px solid', borderColor: 'divider',
                      bgcolor: overMax ? 'error.lighter' : 'background.paper' }}>
                      <Typography variant="body2" sx={{ flex: 1 }}>{criterio.nombre}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 60, textAlign: 'right' }}>
                        máx. {criterio.puntaje}
                      </Typography>
                      <TextField
                        size="small" type="number" value={val}
                        error={overMax}
                        helperText={overMax ? `No puede superar ${max}` : ''}
                        inputProps={{ min: 0, max: max, step: 0.01 }}
                        sx={{ width: 110 }}
                        onChange={e => setScores(p => ({ ...p, [criterio.idCriterio]: e.target.value }))}
                      />
                    </Box>
                  );
                })}
              </Stack>
              <Divider sx={{ mt: 2 }} />
            </Box>
          );
        })}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">Cancelar</Button>
        <Button variant="contained" disabled={saving}
          onClick={() => onSave(scores, totalPuntuacion, existingMap)}>
          {saving ? <CircularProgress size={22} color="inherit" /> : 'Guardar calificación'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Acta card ─────────────────────────────────────────────────────────────────
interface ActaCardProps {
  acta: Acta;
  miDetalle: DetalleEvaluacion;
  onCalificar: (acta: Acta, detalle: DetalleEvaluacion) => void;
}

function ActaCard({ acta, miDetalle, onCalificar }: ActaCardProps) {
  const detalles = acta.detallesEvaluacion || [];
  const totalJurados = detalles.length;
  const completados = detalles.filter(d => (d.puntuacionesCriterio || []).length > 0).length;
  const yaCalifique = (miDetalle.puntuacionesCriterio || []).length > 0;

  return (
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={1}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ flex: 1, mr: 1 }}>
            {acta.proyecto.titulo}
          </Typography>
          <Chip label={acta.proyecto.estado} size="small"
            color={({ aprobado: 'success', inscrito: 'info', revision: 'warning', rechazado: 'error' } as Record<string, 'success' | 'info' | 'warning' | 'error'>)[acta.proyecto.estado] || 'default'} />
        </Stack>

        <Typography variant="caption" color="text.secondary">
          {acta.planillaEvaluativa.nombre}
        </Typography>

        <Stack direction="row" alignItems="center" spacing={1} mt={1.5}>
          <ClockCircleOutlined style={{ fontSize: 14, color: '#8c8c8c' }} />
          <Typography variant="body2" color="text.secondary">
            {acta.fecha} &nbsp; {acta.horaInicio} – {acta.horaFin}
          </Typography>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1} mt={1}>
          <TrophyOutlined style={{ fontSize: 14, color: '#faad14' }} />
          <Typography variant="body2">
            Nota final: <strong>{acta.notaFinal}</strong> / {acta.planillaEvaluativa.notaMaxima}
          </Typography>
        </Stack>

        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Jurados: {completados}/{totalJurados} calificados
          </Typography>
          <LinearProgress variant="determinate"
            value={totalJurados > 0 ? (completados / totalJurados) * 100 : 0}
            sx={{ mt: 0.5, height: 5, borderRadius: 3 }}
            color={completados === totalJurados && totalJurados > 0 ? 'success' : 'primary'} />
        </Box>

        {detalles.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" fontWeight={500} gutterBottom>Jurados asignados:</Typography>
            <Stack spacing={0.5} sx={{ mt: 0.5 }}>
              {detalles.map(d => {
                const calificado = (d.puntuacionesCriterio || []).length > 0;
                return (
                  <Box key={d.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {calificado
                      ? <CheckOutlined style={{ fontSize: 12, color: '#52c41a' }} />
                      : <FormOutlined style={{ fontSize: 12, color: '#faad14' }} />}
                    <Typography variant="caption">
                      {d.tribunal.nombre} {d.tribunal.apellido}
                    </Typography>
                    {calificado && (
                      <Chip label={`${d.puntuacion} pts`} size="small" color="success" variant="outlined" sx={{ ml: 'auto' }} />
                    )}
                  </Box>
                );
              })}
            </Stack>
          </Box>
        )}
      </CardContent>

      <CardActions sx={{ pt: 0, px: 2, pb: 2 }}>
        <Tooltip title={`Calificar como: ${miDetalle.tribunal.nombre} ${miDetalle.tribunal.apellido}`}>
          <Button
            size="small"
            variant={yaCalifique ? 'outlined' : 'contained'}
            color={yaCalifique ? 'success' : 'primary'}
            startIcon={yaCalifique ? <CheckOutlined /> : <FormOutlined />}
            onClick={() => onCalificar(acta, miDetalle)}
          >
            {miDetalle.tribunal.nombre}
          </Button>
        </Tooltip>
      </CardActions>
    </Card>
  );
}

// ── Animated block alert ──────────────────────────────────────────────────────
function BlockAlert({ open, message, onClose }: { open: boolean; message: string; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          border: '2.5px solid #ff0000',
          bgcolor: '#0d0000',
          boxShadow: '0 0 32px rgba(255,0,0,0.5)',
          animation: open
            ? 'blockShake 0.5s cubic-bezier(.36,.07,.19,.97) both, pulseBorder 1.2s ease 0.5s infinite'
            : 'none',
          '@keyframes blockShake': {
            '0%':   { transform: 'translateX(0)' },
            '10%':  { transform: 'translateX(-12px)' },
            '25%':  { transform: 'translateX(12px)' },
            '40%':  { transform: 'translateX(-10px)' },
            '55%':  { transform: 'translateX(10px)' },
            '70%':  { transform: 'translateX(-6px)' },
            '85%':  { transform: 'translateX(6px)' },
            '100%': { transform: 'translateX(0)' },
          },
          '@keyframes pulseBorder': {
            '0%, 100%': { boxShadow: '0 0 0 0 rgba(255,0,0,0.7), 0 0 32px rgba(255,0,0,0.4)' },
            '50%':      { boxShadow: '0 0 0 8px rgba(255,0,0,0), 0 0 32px rgba(255,0,0,0.4)' },
          },
        }
      }}>
      <DialogContent sx={{ py: 3, px: 3 }}>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Box sx={{
            width: 56, height: 56, borderRadius: '50%', flexShrink: 0, mt: 0.25,
            background: 'radial-gradient(circle, rgba(255,0,0,0.25) 0%, rgba(255,0,0,0.05) 70%)',
            border: '1.5px solid rgba(255,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Typography sx={{ fontSize: 28, lineHeight: 1 }}>🚫</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 0.75, color: '#ff1a1a', letterSpacing: 0.3 }}>
              Calificación no permitida
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,200,200,0.9)', lineHeight: 1.65 }}>
              {message}
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, pt: 0 }}>
        <Button
          variant="contained"
          fullWidth
          onClick={onClose}
          sx={{
            bgcolor: '#cc0000',
            '&:hover': { bgcolor: '#990000' },
            borderRadius: 1.5, fontWeight: 700, py: 1,
            boxShadow: '0 4px 16px rgba(204,0,0,0.5)',
          }}>
          Entendido
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PanelCalificacionPage() {
  const { usuario } = useAuth();
  const miIdTribunal = String(usuario?.tribunal?.idTribunal ?? '');

  const { data, loading, error, refetch } = useQuery(GET_DATA, { fetchPolicy: 'network-only' });

  const [crearPuntuacion] = useMutation(CREATE_PUNTUACION);
  const [editarPuntuacion] = useMutation(EDIT_PUNTUACION);
  const [editarDetalle]   = useMutation(EDIT_DETALLE);

  const [saving, setSaving] = useState(false);
  const [notif, setNotif] = useState({ open: false, msg: '', sev: 'success' as 'success' | 'error' });
  const showNotif = (msg: string, sev: 'success' | 'error' = 'success') => setNotif({ open: true, msg, sev });

  const [scoringDialog, setScoringDialog] = useState<{ open: boolean; acta: Acta | null; detalle: DetalleEvaluacion | null }>(
    { open: false, acta: null, detalle: null }
  );

  const [blockAlert, setBlockAlert] = useState({ open: false, message: '' });
  const [busqueda, setBusqueda] = useState('');
  const [collapsedAreas, setCollapsedAreas] = useState<Set<string>>(new Set());
  const [tabActual, setTabActual] = useState<'todos' | 'pendientes' | 'calificadas'>('todos');

  const cronogramas: any[] = data?.todosLosCronogramas || [];
  const now = new Date();

  // Verificación POR ACTA: encuentra el cronograma de evaluación del evento específico
  const getEvaluacionStatus = (acta: Acta): { activa: boolean; mensaje: string } => {
    const idEvento = acta.proyecto?.ofertaEaCarrera?.oferta?.categoriaEvento?.evento?.idEvento;
    const nombreEvento = acta.proyecto?.ofertaEaCarrera?.oferta?.categoriaEvento?.evento?.nombre || 'este evento';

    // Sin evento determinado → permitir (fail-open)
    if (!idEvento) return { activa: true, mensaje: '' };

    const cronograma = cronogramas.find((c: any) => {
      const nombre = (c.actividad?.nombreActividad || '').toLowerCase();
      return (
        (nombre.includes('evaluacion') || nombre.includes('defenza') || nombre.includes('defensa')) &&
        String(c.evento?.idEvento) === String(idEvento)
      );
    });

    // Sin cronograma de evaluación para este evento → permitir
    if (!cronograma) return { activa: true, mensaje: '' };

    const inicio = new Date(cronograma.fechaInicio);
    const fin    = new Date(cronograma.fechaFin);

    if (now >= inicio && now <= fin) return { activa: true, mensaje: '' };

    if (now < inicio) {
      return {
        activa: false,
        mensaje: `La fase de evaluación para "${nombreEvento}" aún no ha iniciado. Estará disponible a partir del ${inicio.toLocaleString('es-BO', { dateStyle: 'long', timeStyle: 'short' })}.`,
      };
    }

    return {
      activa: false,
      mensaje: `La fase de evaluación para "${nombreEvento}" ya finalizó el ${fin.toLocaleString('es-BO', { dateStyle: 'long', timeStyle: 'short' })}. Ya no es posible calificar.`,
    };
  };

  // Only show actas where the current tribunal user is assigned as a jurado
  const actas: Acta[] = (data?.todasLasActas || []).filter((a: Acta) => {
    if (!a.estado) return false;
    if (!miIdTribunal) return false;
    return a.detallesEvaluacion.some(d => String(d.tribunal.idTribunal) === miIdTribunal);
  });

  const hayFiltro = busqueda !== '';

  const actasFiltradas = actas.filter(a =>
    a.proyecto.titulo.toLowerCase().includes(busqueda.toLowerCase())
  );

  const getMiDetalle = (a: Acta) =>
    a.detallesEvaluacion.find(d => String(d.tribunal.idTribunal) === miIdTribunal)!;

  const actasPendientes = actasFiltradas.filter(a => (getMiDetalle(a)?.puntuacionesCriterio || []).length === 0);
  const actasCalificadas = actasFiltradas.filter(a => (getMiDetalle(a)?.puntuacionesCriterio || []).length > 0);

  const toggleArea = (key: string) => setCollapsedAreas(prev => {
    const next = new Set(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });

  const groupByArea = (list: Acta[]) =>
    list.reduce<Record<string, { nombre: string; actas: Acta[]; pendientes: number; calificadas: number }>>((acc, a) => {
      const area = a.proyecto?.ofertaEaCarrera?.oferta?.modalidadArea?.area;
      const key = area?.idArea || 'sin_area';
      const nombre = area?.nombre || 'Sin Área';
      if (!acc[key]) acc[key] = { nombre, actas: [], pendientes: 0, calificadas: 0 };
      acc[key].actas.push(a);
      const esCalificada = (getMiDetalle(a)?.puntuacionesCriterio || []).length > 0;
      if (esCalificada) acc[key].calificadas++; else acc[key].pendientes++;
      return acc;
    }, {});

  const handleCalificar = (acta: Acta, detalle: DetalleEvaluacion) => {
    // Verificar si ya calificó y NO tiene permiso para corregir
    const yaCalifique = parseFloat(detalle.puntuacion || '0') > 0;
    if (yaCalifique && !detalle.permisoCalificacionTardia) {
      setBlockAlert({
        open: true,
        message: 'Ya calificaste este proyecto. Si necesitas corregir tu nota o calificar nuevamente, solicita un permiso especial al administrador.'
      });
      return;
    }

    if (acta.consolidada && !detalle.permisoCalificacionTardia) {
      setBlockAlert({
        open: true,
        message: 'El acta ya fue consolidada por el administrador. Solicita permiso especial para registrar o modificar tu calificación.'
      });
      return;
    }

    const status = getEvaluacionStatus(acta);
    if (!status.activa && !detalle.permisoCalificacionTardia) {
      setBlockAlert({ open: true, message: status.mensaje });
      return;
    }
    setScoringDialog({ open: true, acta, detalle });
  };

  const handleSaveScores = async (
    scores: Record<string, string>,
    totalPuntuacion: number,
    existingMap: Record<string, PuntuacionCriterio>
  ) => {
    setSaving(true);
    const { detalle } = scoringDialog;
    try {
      for (const idCriterio of Object.keys(scores)) {
        const val = parseFloat(scores[idCriterio]);
        if (isNaN(val)) continue;
        const existing = existingMap[idCriterio];
        let res;
        if (existing) {
          res = await editarPuntuacion({ variables: { idPuntuacionCriterio: existing.id, puntuacionCriterio: val } });
          if (res.data?.editarPuntuacionCriterio?.ok === false) throw new Error(res.data.editarPuntuacionCriterio.error);
        } else {
          res = await crearPuntuacion({ variables: { idDetalleEvaluacion: detalle!.id, idCriterio, puntuacionCriterio: val } });
          if (res.data?.crearPuntuacionCriterio?.ok === false) throw new Error(res.data.crearPuntuacionCriterio.error);
        }
      }
      const finalRes = await editarDetalle({ variables: { idDetalleEvaluacion: detalle!.id, puntuacion: totalPuntuacion } });
      if (finalRes.data?.editarDetalleEvaluacion?.ok === false) throw new Error(finalRes.data.editarDetalleEvaluacion.error);

      showNotif('Calificación guardada exitosamente');
      refetch();
      setScoringDialog({ open: false, acta: null, detalle: null });
    } catch (err: any) {
      showNotif(err.message || 'Error al guardar calificación', 'error');
    }
    setSaving(false);
  };

  const noEsTribunal = !loading && !error && !miIdTribunal;

  const renderAreaGroups = (list: Acta[], statusPrefix: string, showStats = false) => {
    const grupos = groupByArea(list);
    return (
      <>
        {Object.entries(grupos).map(([areaKey, grupo]) => {
          const fullKey = `${statusPrefix}_${areaKey}`;
          const isOpen = !collapsedAreas.has(fullKey);
          return (
            <Box key={fullKey} sx={{ mb: 1.5 }}>
              <Box sx={{
                px: 2, py: 1.25,
                borderRadius: isOpen ? '8px 8px 0 0' : 1.5,
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.700' : 'grey.100',
                border: '1px solid', borderColor: 'divider',
                display: 'flex', alignItems: 'center', gap: 1.5,
                cursor: 'pointer', userSelect: 'none',
              }} onClick={() => toggleArea(fullKey)}>
                <BankOutlined style={{ color: '#8c8c8c', fontSize: 15 }} />
                <Typography variant="body2" fontWeight={700} sx={{ flex: 1 }}>{grupo.nombre}</Typography>
                {showStats && (
                  <Stack direction="row" spacing={0.5}>
                    {grupo.pendientes > 0 && (
                      <Chip label={`${grupo.pendientes} pend.`} size="small"
                        sx={{ bgcolor: 'rgba(250,173,20,0.15)', color: '#faad14', fontSize: 11, height: 20, fontWeight: 600 }} />
                    )}
                    {grupo.calificadas > 0 && (
                      <Chip label={`${grupo.calificadas} calif.`} size="small"
                        sx={{ bgcolor: 'rgba(82,196,26,0.15)', color: '#52c41a', fontSize: 11, height: 20, fontWeight: 600 }} />
                    )}
                  </Stack>
                )}
                <Chip
                  label={isOpen ? `▲ ${grupo.actas.length}` : `▼ ${grupo.actas.length}`}
                  size="small"
                  variant={isOpen ? 'filled' : 'outlined'}
                  sx={{ cursor: 'pointer', fontWeight: 600 }}
                />
              </Box>
              {isOpen && (
                <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderTop: 'none', borderRadius: '0 0 8px 8px' }}>
                  <Grid container spacing={2}>
                    {grupo.actas.map(acta => (
                      <Grid item xs={12} sm={6} lg={4} key={acta.idActaEvaluacion}>
                        <ActaCard acta={acta} miDetalle={getMiDetalle(acta)} onCalificar={handleCalificar} />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </Box>
          );
        })}
      </>
    );
  };

  return (
    <MainCard title="Panel de Calificación">
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error">Error al cargar: {error.message}</Alert>
      ) : noEsTribunal ? (
        <Alert severity="warning">Tu usuario no tiene un perfil de tribunal asignado.</Alert>
      ) : (
        <>
          {/* Filtro */}
          <Box sx={{
            mb: 3, p: 2,
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
            borderRadius: 2, border: '1px solid', borderColor: 'divider'
          }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={11}>
                <TextField
                  fullWidth size="small"
                  placeholder="Buscar por nombre de proyecto..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  InputProps={{ startAdornment: <SearchOutlined style={{ color: '#bfbfbf', marginRight: 8 }} /> }}
                  sx={{ bgcolor: 'background.paper' }}
                />
              </Grid>
              <Grid item xs={12} md={1} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Tooltip title="Limpiar Filtros">
                  <IconButton
                    onClick={() => setBusqueda('')}
                    color="secondary"
                    sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px', visibility: hayFiltro ? 'visible' : 'hidden' }}
                  >
                    <ClearOutlined />
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>
          </Box>

          {/* Tabs de estado */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs
              value={tabActual}
              onChange={(_, v) => setTabActual(v)}
              TabIndicatorProps={{
                sx: {
                  bgcolor: tabActual === 'pendientes' ? '#faad14'
                         : tabActual === 'calificadas' ? '#52c41a'
                         : 'primary.main',
                  height: 3, borderRadius: '3px 3px 0 0',
                }
              }}
              sx={{
                '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minWidth: 'auto', px: 2.5 },
                '& .Mui-selected': {
                  color: tabActual === 'pendientes' ? '#faad14 !important'
                       : tabActual === 'calificadas' ? '#52c41a !important'
                       : undefined,
                },
              }}
            >
              <Tab value="todos" label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <span>Todos</span>
                  {actasFiltradas.length > 0 && (
                    <Chip label={actasFiltradas.length} size="small"
                      sx={{ height: 18, fontSize: 11, fontWeight: 700 }} />
                  )}
                </Box>
              } />
              <Tab value="pendientes" label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <ClockCircleOutlined style={{ fontSize: 14, color: tabActual === 'pendientes' ? '#faad14' : '#8c8c8c' }} />
                  <span>Pendientes</span>
                  {actasPendientes.length > 0 && (
                    <Chip label={actasPendientes.length} size="small" color="warning"
                      sx={{ height: 18, fontSize: 11, fontWeight: 700 }} />
                  )}
                </Box>
              } />
              <Tab value="calificadas" label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <CheckOutlined style={{ fontSize: 14, color: tabActual === 'calificadas' ? '#52c41a' : '#8c8c8c' }} />
                  <span>Calificadas</span>
                  {actasCalificadas.length > 0 && (
                    <Chip label={actasCalificadas.length} size="small" color="success"
                      sx={{ height: 18, fontSize: 11, fontWeight: 700 }} />
                  )}
                </Box>
              } />
            </Tabs>
          </Box>

          {/* Contenido por tab */}
          {actas.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
              <FormOutlined style={{ fontSize: 48, marginBottom: 12 }} />
              <Typography>No hay actas activas en las que estés asignado como jurado.</Typography>
            </Box>
          ) : actasFiltradas.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
              <SearchOutlined style={{ fontSize: 48, marginBottom: 12 }} />
              <Typography>No se encontraron proyectos con <strong>"{busqueda}"</strong>.</Typography>
            </Box>
          ) : tabActual === 'todos' ? (
            renderAreaGroups(actasFiltradas, 'todos', true)
          ) : tabActual === 'pendientes' ? (
            actasPendientes.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                <CheckOutlined style={{ fontSize: 48, marginBottom: 12, color: '#52c41a' }} />
                <Typography fontWeight={600} color="#52c41a">¡Todo al día!</Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>No tienes actas pendientes de calificar.</Typography>
              </Box>
            ) : renderAreaGroups(actasPendientes, 'pendientes')
          ) : (
            actasCalificadas.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                <FormOutlined style={{ fontSize: 48, marginBottom: 12 }} />
                <Typography>Aún no has calificado ninguna acta.</Typography>
              </Box>
            ) : renderAreaGroups(actasCalificadas, 'calificadas')
          )}
        </>
      )}

      <ScoringDialog
        open={scoringDialog.open}
        onClose={() => setScoringDialog({ open: false, acta: null, detalle: null })}
        acta={scoringDialog.acta}
        detalle={scoringDialog.detalle}
        onSave={handleSaveScores}
        saving={saving}
      />

      {/* Alerta de bloqueo animada */}
      <BlockAlert
        open={blockAlert.open}
        message={blockAlert.message}
        onClose={() => setBlockAlert({ open: false, message: '' })}
      />

      <Snackbar open={notif.open} autoHideDuration={4000}
        onClose={() => setNotif(p => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={notif.sev} variant="filled">{notif.msg}</Alert>
      </Snackbar>
    </MainCard>
  );
}
