import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
  Box, Button, Card, CardContent, CardActions, Typography, CircularProgress,
  Alert, Chip, Grid, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Divider, Stack, LinearProgress, Snackbar, Tooltip
} from '@mui/material';
import {
  ClockCircleOutlined, CheckOutlined, FormOutlined, TrophyOutlined
} from '@ant-design/icons';
import MainCard from 'components/MainCard';

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
      proyecto { idProyecto titulo estado }
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
        tribunal { idTribunal nombre apellido }
        puntuacionesCriterio {
          id
          puntuacionCriterio
          criterio { idCriterio nombre puntaje }
        }
      }
    }
    todosLosTribunales { idTribunal nombre apellido especialidad }
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
function ScoringDialog({ open, onClose, acta, detalle, onSave, saving }) {
  const planilla = acta?.planillaEvaluativa;
  const existingMap = {};
  (detalle?.puntuacionesCriterio || []).forEach(p => {
    existingMap[p.criterio.idCriterio] = p;
  });

  const allCriterios = (planilla?.secciones || []).flatMap(s => s.criterios || []);
  const [scores, setScores] = useState(() => {
    const init = {};
    allCriterios.forEach(c => {
      init[c.idCriterio] = existingMap[c.idCriterio]?.puntuacionCriterio ?? '';
    });
    return init;
  });

  const handleEnter = () => {
    const init = {};
    allCriterios.forEach(c => {
      init[c.idCriterio] = existingMap[c.idCriterio]?.puntuacionCriterio ?? '';
    });
    setScores(init);
  };

  const totalPuntuacion = allCriterios.reduce((sum, c) => {
    const v = parseFloat(scores[c.idCriterio]);
    return sum + (isNaN(v) ? 0 : v);
  }, 0);

  const notaMaxima = parseFloat(planilla?.notaMaxima || 100);
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
          const seccionMax = (seccion.criterios || []).reduce((s, c) => s + parseFloat(c.puntaje || 0), 0);

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
function ActaCard({ acta, onCalificar }) {
  const detalles = acta.detallesEvaluacion || [];
  const totalJurados = detalles.length;
  const completados = detalles.filter(d => (d.puntuacionesCriterio || []).length > 0).length;

  return (
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={1}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ flex: 1, mr: 1 }}>
            {acta.proyecto.titulo}
          </Typography>
          <Chip label={acta.proyecto.estado} size="small"
            color={{ aprobado: 'success', inscrito: 'info', revision: 'warning', rechazado: 'error' }[acta.proyecto.estado] || 'default'} />
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
        {detalles.map(d => (
          <Tooltip key={d.id}
            title={`Calificar como: ${d.tribunal.nombre} ${d.tribunal.apellido}`}>
            <Button size="small" variant={d.puntuacionesCriterio?.length > 0 ? 'outlined' : 'contained'}
              color={d.puntuacionesCriterio?.length > 0 ? 'success' : 'primary'}
              startIcon={d.puntuacionesCriterio?.length > 0 ? <CheckOutlined /> : <FormOutlined />}
              onClick={() => onCalificar(acta, d)}>
              {d.tribunal.nombre}
            </Button>
          </Tooltip>
        ))}
        {detalles.length === 0 && (
          <Typography variant="caption" color="text.secondary">Sin jurados asignados.</Typography>
        )}
      </CardActions>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PanelCalificacionPage() {
  const { data, loading, error, refetch } = useQuery(GET_DATA, { fetchPolicy: 'network-only' });

  const [crearPuntuacion] = useMutation(CREATE_PUNTUACION);
  const [editarPuntuacion] = useMutation(EDIT_PUNTUACION);
  const [editarDetalle]   = useMutation(EDIT_DETALLE);

  const [saving, setSaving] = useState(false);
  const [notif, setNotif] = useState({ open: false, msg: '', sev: 'success' });
  const showNotif = (msg, sev = 'success') => setNotif({ open: true, msg, sev });

  const [scoringDialog, setScoringDialog] = useState({ open: false, acta: null, detalle: null });

  const actas = (data?.todasLasActas || []).filter(a => a.estado);

  const handleCalificar = (acta, detalle) => {
    setScoringDialog({ open: true, acta, detalle });
  };

  const handleSaveScores = async (scores, totalPuntuacion, existingMap) => {
    setSaving(true);
    const { detalle } = scoringDialog;
    try {
      const allCriterioIds = Object.keys(scores);
      for (const idCriterio of allCriterioIds) {
        const val = parseFloat(scores[idCriterio]);
        if (isNaN(val)) continue;
        const existing = existingMap[idCriterio];
        if (existing) {
          await editarPuntuacion({ variables: {
            idPuntuacionCriterio: existing.id,
            puntuacionCriterio: val
          } });
        } else {
          await crearPuntuacion({ variables: {
            idDetalleEvaluacion: detalle.id,
            idCriterio,
            puntuacionCriterio: val
          } });
        }
      }
      await editarDetalle({ variables: {
        idDetalleEvaluacion: detalle.id,
        puntuacion: totalPuntuacion
      } });

      showNotif('Calificación guardada exitosamente');
      refetch();
      setScoringDialog({ open: false, acta: null, detalle: null });
    } catch { showNotif('Error al guardar calificación', 'error'); }
    setSaving(false);
  };

  return (
    <MainCard title="Panel de Calificación">
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error">Error al cargar: {error.message}</Alert>
      ) : actas.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
          <FormOutlined style={{ fontSize: 48, marginBottom: 12 }} />
          <Typography>No hay actas activas para calificar.</Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {actas.map(acta => (
            <Grid item xs={12} sm={6} lg={4} key={acta.idActaEvaluacion}>
              <ActaCard acta={acta} onCalificar={handleCalificar} />
            </Grid>
          ))}
        </Grid>
      )}

      <ScoringDialog
        open={scoringDialog.open}
        onClose={() => setScoringDialog({ open: false, acta: null, detalle: null })}
        acta={scoringDialog.acta}
        detalle={scoringDialog.detalle}
        onSave={handleSaveScores}
        saving={saving}
      />

      <Snackbar open={notif.open} autoHideDuration={4000}
        onClose={() => setNotif(p => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={notif.sev} variant="filled">{notif.msg}</Alert>
      </Snackbar>
    </MainCard>
  );
}
