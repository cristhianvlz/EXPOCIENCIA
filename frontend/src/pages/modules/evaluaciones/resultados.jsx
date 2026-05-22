import { useQuery, useMutation, gql } from '@apollo/client';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Typography, CircularProgress, Alert, Chip, LinearProgress, Stack, Button,
  Snackbar, Tooltip, Card, CardContent, Grid
} from '@mui/material';
import { CheckCircleOutlined, ClockCircleOutlined, TrophyOutlined, FileTextOutlined } from '@ant-design/icons';
import { useState } from 'react';
import MainCard from 'components/MainCard';

// ── GQL ──────────────────────────────────────────────────────────────────────
const GET_ACTAS = gql`
  query {
    todasLasActas {
      idActaEvaluacion
      fecha
      horaInicio
      horaFin
      notaFinal
      estado
      proyecto { idProyecto titulo estado }
      planillaEvaluativa { idPlanillaEvaluativa nombre notaMaxima }
      detallesEvaluacion {
        id
        puntuacion
        estado
        tribunal { idTribunal nombre apellido }
        puntuacionesCriterio { id puntuacionCriterio }
      }
    }
  }
`;

const EDIT_ACTA = gql`mutation($idActaEvaluacion: ID!, $notaFinal: Decimal) {
  editarActaEvaluacion(idActaEvaluacion: $idActaEvaluacion, notaFinal: $notaFinal) { ok error }
}`;

const estadoColor = { aprobado: 'success', inscrito: 'info', revision: 'warning', rechazado: 'error' };

function calcularNotaFinal(detalles) {
  const completados = detalles.filter(d => (d.puntuacionesCriterio || []).length > 0);
  if (completados.length === 0) return null;
  const suma = completados.reduce((s, d) => s + parseFloat(d.puntuacion || 0), 0);
  return (suma / completados.length).toFixed(2);
}

// ── Summary cards ─────────────────────────────────────────────────────────────
function SummaryCards({ actas }) {
  const total = actas.length;
  const completas = actas.filter(a => {
    const detalles = a.detallesEvaluacion || [];
    return detalles.length > 0 && detalles.every(d => (d.puntuacionesCriterio || []).length > 0);
  }).length;
  const pendientes = total - completas;
  const notaPromedio = actas.length > 0
    ? (actas.reduce((s, a) => s + parseFloat(a.notaFinal || 0), 0) / actas.length).toFixed(1)
    : '—';

  const cards = [
    { icon: <FileTextOutlined style={{ fontSize: 28, color: '#1890ff' }} />, label: 'Total Actas', value: total, color: 'primary.lighter' },
    { icon: <CheckCircleOutlined style={{ fontSize: 28, color: '#52c41a' }} />, label: 'Evaluadas', value: completas, color: 'success.lighter' },
    { icon: <ClockCircleOutlined style={{ fontSize: 28, color: '#faad14' }} />, label: 'Pendientes', value: pendientes, color: 'warning.lighter' },
    { icon: <TrophyOutlined style={{ fontSize: 28, color: '#722ed1' }} />, label: 'Promedio General', value: notaPromedio, color: 'secondary.lighter' },
  ];

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {cards.map(c => (
        <Grid item xs={6} sm={3} key={c.label}>
          <Card variant="outlined" sx={{ bgcolor: c.color }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '16px !important' }}>
              {c.icon}
              <Box>
                <Typography variant="h5" fontWeight={700}>{c.value}</Typography>
                <Typography variant="caption" color="text.secondary">{c.label}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ResultadosNotasPage() {
  const { data, loading, error, refetch } = useQuery(GET_ACTAS, { fetchPolicy: 'network-only' });
  const [editarActa] = useMutation(EDIT_ACTA);
  const [notif, setNotif] = useState({ open: false, msg: '', sev: 'success' });
  const showNotif = (msg, sev = 'success') => setNotif({ open: true, msg, sev });

  const actas = data?.todasLasActas || [];

  const handleConsolidar = async (acta) => {
    const detalles = acta.detallesEvaluacion || [];
    const notaCalculada = calcularNotaFinal(detalles);
    if (notaCalculada === null) {
      showNotif('No hay calificaciones registradas para calcular la nota', 'warning');
      return;
    }
    try {
      const res = (await editarActa({ variables: {
        idActaEvaluacion: acta.idActaEvaluacion,
        notaFinal: parseFloat(notaCalculada)
      } })).data?.editarActaEvaluacion;
      if (res?.ok) { showNotif(`Nota consolidada: ${notaCalculada} pts`); refetch(); }
      else showNotif(res?.error || 'Error', 'error');
    } catch { showNotif('Error de conexión', 'error'); }
  };

  return (
    <MainCard title="Resultados y Notas">
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error">Error al cargar: {error.message}</Alert>
      ) : (
        <>
          <SummaryCards actas={actas} />

          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell width={60}>ID</TableCell>
                  <TableCell>Proyecto</TableCell>
                  <TableCell>Planilla</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell align="center">Progreso Jurados</TableCell>
                  <TableCell align="center">Nota Calculada</TableCell>
                  <TableCell align="center">Nota Final</TableCell>
                  <TableCell align="center">Acción</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {actas.map(acta => {
                  const detalles = acta.detallesEvaluacion || [];
                  const totalJurados = detalles.length;
                  const calificados = detalles.filter(d => (d.puntuacionesCriterio || []).length > 0).length;
                  const progreso = totalJurados > 0 ? Math.round((calificados / totalJurados) * 100) : 0;
                  const completa = totalJurados > 0 && calificados === totalJurados;
                  const notaCalculada = calcularNotaFinal(detalles);
                  const notaMax = parseFloat(acta.planillaEvaluativa.notaMaxima);

                  return (
                    <TableRow key={acta.idActaEvaluacion} hover>
                      <TableCell>{acta.idActaEvaluacion}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>{acta.proyecto.titulo}</Typography>
                        <Chip label={acta.proyecto.estado} size="small"
                          color={estadoColor[acta.proyecto.estado] || 'default'} sx={{ mt: 0.3 }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{acta.planillaEvaluativa.nombre}</Typography>
                        <Typography variant="caption" color="text.secondary">máx. {notaMax}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{acta.fecha}</Typography>
                        <Typography variant="caption" color="text.secondary">{acta.horaInicio} – {acta.horaFin}</Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ minWidth: 160 }}>
                        <Stack spacing={0.5} alignItems="center">
                          <Typography variant="caption">{calificados}/{totalJurados} jurados</Typography>
                          <LinearProgress variant="determinate" value={progreso}
                            sx={{ width: 120, height: 6, borderRadius: 3 }}
                            color={completa ? 'success' : 'primary'} />
                          {detalles.map(d => {
                            const ok = (d.puntuacionesCriterio || []).length > 0;
                            return (
                              <Chip key={d.id} size="small"
                                icon={ok ? <CheckCircleOutlined style={{ fontSize: 11 }} /> : <ClockCircleOutlined style={{ fontSize: 11 }} />}
                                label={`${d.tribunal.nombre}: ${ok ? d.puntuacion + ' pts' : 'pendiente'}`}
                                color={ok ? 'success' : 'default'} variant="outlined" />
                            );
                          })}
                        </Stack>
                      </TableCell>
                      <TableCell align="center">
                        {notaCalculada !== null ? (
                          <Typography fontWeight={600} color="primary.main">{notaCalculada}</Typography>
                        ) : (
                          <Typography variant="caption" color="text.secondary">—</Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Typography fontWeight={700}
                          color={parseFloat(acta.notaFinal) > 0 ? 'success.main' : 'text.secondary'}>
                          {acta.notaFinal}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title={completa ? 'Promediar y guardar nota final' : 'Faltan calificaciones de jurados'}>
                          <span>
                            <Button size="small" variant="contained" color="success"
                              disabled={!completa || notaCalculada === null}
                              onClick={() => handleConsolidar(acta)}>
                              Consolidar
                            </Button>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {actas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      Sin actas registradas.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      <Snackbar open={notif.open} autoHideDuration={4000}
        onClose={() => setNotif(p => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={notif.sev} variant="filled">{notif.msg}</Alert>
      </Snackbar>
    </MainCard>
  );
}
