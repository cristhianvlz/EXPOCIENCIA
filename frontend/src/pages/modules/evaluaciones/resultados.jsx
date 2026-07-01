import { useQuery, useMutation, gql } from '@apollo/client';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Typography, CircularProgress, Alert, Chip, LinearProgress, Stack, Button,
  Snackbar, Tooltip, Card, CardContent, Grid, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions, IconButton
} from '@mui/material';
import {
  CheckCircleOutlined, ClockCircleOutlined, TrophyOutlined, FileTextOutlined,
  ScheduleOutlined, LockOutlined, UnlockOutlined, KeyOutlined
} from '@ant-design/icons';
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
      consolidada
      proyecto {
        idProyecto
        titulo
        estado
        ofertaEaCarrera {
          oferta { idOferta categoriaEvento { evento { nombre version } categoria { nombre } } }
        }
      }
      planillaEvaluativa { idPlanillaEvaluativa nombre notaMaxima }
      detallesEvaluacion {
        id
        puntuacion
        estado
        permisoCalificacionTardia
        tribunal { idTribunal nombre apellido }
        puntuacionesCriterio { id puntuacionCriterio }
      }
    }
  }
`;

const CONSOLIDAR_ACTA = gql`
  mutation($idActaEvaluacion: ID!) {
    consolidarActa(idActaEvaluacion: $idActaEvaluacion) { ok error acta { notaFinal consolidada } }
  }
`;

const CONCEDER_PERMISO = gql`
  mutation($idDetalleEvaluacion: ID!, $conceder: Boolean!) {
    concederPermisoCalificacion(idDetalleEvaluacion: $idDetalleEvaluacion, conceder: $conceder) {
      ok error detalle { id permisoCalificacionTardia }
    }
  }
`;

const estadoColor = { aprobado: 'success', inscrito: 'info', revision: 'warning', rechazado: 'error' };

// ── Summary cards ─────────────────────────────────────────────────────────────
function SummaryCards({ actas, activeFilter, onFilter }) {
  const total      = actas.length;
  const consolidadas = actas.filter(a => a.consolidada).length;
  const pendientes = total - consolidadas;
  const notaPromedio = actas.length > 0
    ? (actas.reduce((s, a) => s + parseFloat(a.notaFinal || 0), 0) / actas.length).toFixed(1)
    : '—';

  const cards = [
    { icon: <FileTextOutlined style={{ fontSize: 28, color: '#1890ff' }} />,
      label: 'Total Actas', value: total,
      bgColor: 'primary.lighter', accentColor: '#1890ff',
      filtro: null, isActive: activeFilter === null, tooltip: 'Mostrar todas las actas' },
    { icon: <LockOutlined style={{ fontSize: 28, color: '#52c41a' }} />,
      label: 'Consolidadas', value: consolidadas,
      bgColor: 'success.lighter', accentColor: '#52c41a',
      filtro: 'consolidadas', isActive: activeFilter === 'consolidadas',
      tooltip: 'Filtrar actas consolidadas (bloqueadas)' },
    { icon: <ClockCircleOutlined style={{ fontSize: 28, color: '#faad14' }} />,
      label: 'Sin consolidar', value: pendientes,
      bgColor: 'warning.lighter', accentColor: '#faad14',
      filtro: 'pendientes', isActive: activeFilter === 'pendientes',
      tooltip: 'Filtrar actas pendientes de consolidación' },
    { icon: <TrophyOutlined style={{ fontSize: 28, color: '#722ed1' }} />,
      label: 'Promedio General', value: notaPromedio,
      bgColor: 'secondary.lighter', accentColor: '#722ed1',
      filtro: null, isActive: false, tooltip: 'Promedio de notas finales consolidadas' },
  ];

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {cards.map(c => (
        <Grid item xs={6} sm={3} key={c.label}>
          <Tooltip title={c.tooltip} arrow>
            <Card variant="outlined"
              onClick={() => onFilter(c.filtro !== null && activeFilter === c.filtro ? null : c.filtro)}
              sx={{
                bgcolor: c.bgColor, cursor: 'pointer',
                border: c.isActive ? `2px solid ${c.accentColor}` : '1px solid transparent',
                borderColor: c.isActive ? c.accentColor : 'divider',
                transition: 'all 0.2s ease',
                boxShadow: c.isActive ? `0 0 0 3px ${c.accentColor}22` : 0,
                '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 6px 20px ${c.accentColor}33`, borderColor: c.accentColor },
              }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '16px !important' }}>
                {c.icon}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" fontWeight={700}>{c.value}</Typography>
                  <Typography variant="caption" color="text.secondary">{c.label}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Tooltip>
        </Grid>
      ))}
    </Grid>
  );
}

// ── Dialog conceder permiso ────────────────────────────────────────────────────
function PermisoDialog({ open, detalle, acta, onClose, onConfirm, loading }) {
  if (!detalle) return null;
  const nombre = `${detalle.tribunal.nombre} ${detalle.tribunal.apellido}`;
  const yaEvaluo = (detalle.puntuacionesCriterio || []).length > 0;
  const tienePermiso = detalle.permisoCalificacionTardia;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <KeyOutlined style={{ color: tienePermiso ? '#f5222d' : '#1890ff' }} />
        {tienePermiso ? 'Revocar permiso de calificación' : 'Conceder permiso de calificación'}
      </DialogTitle>
      <DialogContent>
        <DialogContentText component="div">
          <Alert severity={tienePermiso ? 'warning' : 'info'} sx={{ mb: 2 }}>
            {tienePermiso
              ? `Al revocar el permiso, "${nombre}" ya no podrá registrar calificaciones.`
              : `Al conceder el permiso, "${nombre}" podrá ingresar su nota desde la web o la app móvil. Una vez que registre su nota, el permiso se revocará automáticamente y el acta quedará desbloqueada para que puedas re-consolidar.`
            }
          </Alert>
          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="body2"><strong>Jurado:</strong> {nombre}</Typography>
            <Typography variant="body2"><strong>Proyecto:</strong> {acta?.proyecto?.titulo}</Typography>
            <Typography variant="body2">
              <strong>Estado:</strong>{' '}
              {yaEvaluo
                ? <Chip label="Ya calificó" color="success" size="small" sx={{ ml: 1 }} />
                : <Chip label="Sin calificar" color="warning" size="small" sx={{ ml: 1 }} />
              }
            </Typography>
          </Box>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button
          variant="contained"
          color={tienePermiso ? 'error' : 'primary'}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : (tienePermiso ? <LockOutlined /> : <UnlockOutlined />)}
          onClick={() => onConfirm(!tienePermiso)}
        >
          {tienePermiso ? 'Revocar permiso' : 'Conceder permiso'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ResultadosNotasPage() {
  const { data, loading, error, refetch } = useQuery(GET_ACTAS, { fetchPolicy: 'network-only' });
  const [consolidarActa] = useMutation(CONSOLIDAR_ACTA);
  const [concederPermiso] = useMutation(CONCEDER_PERMISO);

  const [notif, setNotif] = useState({ open: false, msg: '', sev: 'success' });
  const showNotif = (msg, sev = 'success') => setNotif({ open: true, msg, sev });

  const [activeFilter, setActiveFilter] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  // Dialog de permiso
  const [permisoDialog, setPermisoDialog] = useState({ open: false, detalle: null, acta: null });
  const [permisoLoading, setPermisoLoading] = useState(false);

  const actas = data?.todasLasActas || [];

  const toggleGroup = (id) => setExpandedGroups(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
  });

  const actasFiltradas = (() => {
    if (!activeFilter) return actas;
    if (activeFilter === 'consolidadas') return actas.filter(a => a.consolidada);
    if (activeFilter === 'pendientes')   return actas.filter(a => !a.consolidada);
    return actas;
  })();

  // ── Consolidar ─────────────────────────────────────────────────────────────
  const handleConsolidar = async (acta) => {
    const detalles = acta.detallesEvaluacion || [];
    const calificados = detalles.filter(d => (d.puntuacionesCriterio || []).length > 0);
    if (calificados.length === 0) {
      showNotif('Ningún jurado ha registrado calificaciones aún', 'warning'); return;
    }
    try {
      const res = (await consolidarActa({ variables: { idActaEvaluacion: acta.idActaEvaluacion } }))
        .data?.consolidarActa;
      if (res?.ok) {
        showNotif(`✅ Acta consolidada. Nota final: ${res.acta.notaFinal} pts. El acta queda bloqueada.`);
        refetch();
      } else showNotif(res?.error || 'Error al consolidar', 'error');
    } catch { showNotif('Error de conexión', 'error'); }
  };

  // ── Conceder / revocar permiso ──────────────────────────────────────────────
  const handlePermiso = async (conceder) => {
    setPermisoLoading(true);
    try {
      const res = (await concederPermiso({
        variables: { idDetalleEvaluacion: permisoDialog.detalle.id, conceder }
      })).data?.concederPermisoCalificacion;
      if (res?.ok) {
        showNotif(conceder
          ? '🔓 Permiso concedido. El jurado ya puede ingresar su nota.'
          : '🔒 Permiso revocado.');
        setPermisoDialog({ open: false, detalle: null, acta: null });
        refetch();
      } else showNotif(res?.error || 'Error', 'error');
    } catch { showNotif('Error de conexión', 'error'); }
    setPermisoLoading(false);
  };

  const actasMap = actasFiltradas.reduce((acc, a) => {
    const oferta = a.proyecto?.ofertaEaCarrera?.oferta;
    const key = oferta?.idOferta || 'sin-oferta';
    if (!acc[key]) acc[key] = { oferta, items: [] };
    acc[key].items.push(a);
    return acc;
  }, {});

  const ofertaGroups = Object.values(actasMap).sort((a, b) =>
    parseInt(b.oferta?.idOferta || 0) - parseInt(a.oferta?.idOferta || 0)
  );

  const FILTER_LABELS = {
    consolidadas: { label: 'Consolidadas', color: '#52c41a' },
    pendientes:   { label: 'Sin consolidar', color: '#faad14' },
  };

  return (
    <MainCard title="Resultados y Notas">
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error">Error al cargar: {error.message}</Alert>
      ) : (
        <>
          <SummaryCards actas={actas} activeFilter={activeFilter} onFilter={setActiveFilter} />

          {activeFilter && (
            <Box sx={{
              display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, px: 1.5, py: 1,
              borderRadius: 1.5,
              bgcolor: theme => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
              border: '1px dashed', borderColor: FILTER_LABELS[activeFilter]?.color,
            }}>
              <Typography variant="body2" color="text.secondary">
                Mostrando:{' '}
                <strong style={{ color: FILTER_LABELS[activeFilter]?.color }}>
                  {FILTER_LABELS[activeFilter]?.label}
                </strong>
                {' '}— {actasFiltradas.length} acta{actasFiltradas.length !== 1 ? 's' : ''}
              </Typography>
              <Chip label="Ver todas" size="small" variant="outlined"
                onClick={() => setActiveFilter(null)} onDelete={() => setActiveFilter(null)}
                sx={{ ml: 'auto', borderColor: FILTER_LABELS[activeFilter]?.color, color: FILTER_LABELS[activeFilter]?.color }} />
            </Box>
          )}

          {actas.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>Sin actas registradas.</Box>
          ) : ofertaGroups.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
              <CheckCircleOutlined style={{ fontSize: 40, marginBottom: 8, color: '#52c41a' }} />
              <Typography>No hay actas {activeFilter === 'pendientes' ? 'pendientes' : 'en este filtro'}.</Typography>
            </Box>
          ) : (
            <Box>
              {ofertaGroups.map(grupo => {
                const key = grupo.oferta?.idOferta || 'sin-oferta';
                const isOpen = activeFilter !== null ? true : expandedGroups.has(key);
                return (
                  <Box key={key} sx={{ mb: 2 }}>
                    {/* Cabecera de oferta */}
                    <Box sx={{
                      px: 2, py: 1.25, borderRadius: isOpen ? '8px 8px 0 0' : 1.5,
                      background: 'linear-gradient(135deg, rgba(24,144,255,0.08), rgba(24,144,255,0.02))',
                      border: '1px solid rgba(24,144,255,0.25)',
                      display: 'flex', alignItems: 'center', gap: 1.5,
                    }}>
                      <ScheduleOutlined style={{ color: '#1890ff', fontSize: 17 }} />
                      <Typography variant="subtitle2" fontWeight={700} color="primary.main" sx={{ flex: 1 }}>
                        {grupo.oferta
                          ? `${grupo.oferta.categoriaEvento?.evento?.nombre || ''} v${grupo.oferta.categoriaEvento?.evento?.version || ''} · ${grupo.oferta.categoriaEvento?.categoria?.nombre || ''}`
                          : 'Sin oferta asignada'}
                      </Typography>
                      {activeFilter !== null ? (
                        <Chip label={`${grupo.items.length} acta${grupo.items.length !== 1 ? 's' : ''}`}
                          size="small" color="primary" variant="outlined" sx={{ fontWeight: 600 }} />
                      ) : (
                        <Chip
                          label={isOpen ? `▲ ${grupo.items.length} actas` : `▼ ${grupo.items.length} actas`}
                          size="small" color="primary" variant={isOpen ? 'filled' : 'outlined'}
                          onClick={() => toggleGroup(key)}
                          sx={{ cursor: 'pointer', fontWeight: 600, userSelect: 'none' }} />
                      )}
                    </Box>

                    {isOpen && (
                      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid rgba(24,144,255,0.25)', borderTop: 'none', borderRadius: '0 0 8px 8px' }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell width={60}>ID</TableCell>
                              <TableCell>Proyecto</TableCell>
                              <TableCell>Planilla</TableCell>
                              <TableCell>Fecha</TableCell>
                              <TableCell align="center">Jurados</TableCell>
                              <TableCell align="center">Nota Final</TableCell>
                              <TableCell align="center">Estado</TableCell>
                              <TableCell align="center">Acciones</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {grupo.items.map(acta => {
                              const detalles = acta.detallesEvaluacion || [];
                              const totalJurados = detalles.length;
                              const calificados = detalles.filter(d => (d.puntuacionesCriterio || []).length > 0).length;
                              const progreso = totalJurados > 0 ? Math.round((calificados / totalJurados) * 100) : 0;
                              const consolidada = acta.consolidada;
                              // Jurados con permiso de calificación tardía
                              const conPermiso = detalles.filter(d => d.permisoCalificacionTardia);

                              return (
                                <TableRow key={acta.idActaEvaluacion}
                                  sx={{
                                    '&:hover': {
                                      bgcolor: theme => theme.palette.mode === 'dark'
                                        ? 'rgba(255,255,255,0.04)'
                                        : 'rgba(0,0,0,0.02)',
                                    },
                                    transition: 'background-color 0.15s ease',
                                  }}>
                                  <TableCell>{acta.idActaEvaluacion}</TableCell>
                                  <TableCell>
                                    <Typography variant="body2" fontWeight={500}>{acta.proyecto.titulo}</Typography>
                                    <Chip label={acta.proyecto.estado} size="small"
                                      color={estadoColor[acta.proyecto.estado] || 'default'} sx={{ mt: 0.3 }} />
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2">{acta.planillaEvaluativa.nombre}</Typography>
                                    <Typography variant="caption" color="text.secondary">máx. {acta.planillaEvaluativa.notaMaxima}</Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2">{acta.fecha}</Typography>
                                    <Typography variant="caption" color="text.secondary">{acta.horaInicio} – {acta.horaFin}</Typography>
                                  </TableCell>

                                  {/* Columna Jurados */}
                                  <TableCell align="center" sx={{ minWidth: 190 }}>
                                    <Stack spacing={0.5} alignItems="center">
                                      <Typography variant="caption">{calificados}/{totalJurados} calificaron</Typography>
                                      <LinearProgress variant="determinate" value={progreso}
                                        sx={{ width: 120, height: 6, borderRadius: 3 }}
                                        color={calificados === totalJurados ? 'success' : 'primary'} />
                                      {detalles.map(d => {
                                        const ok = (d.puntuacionesCriterio || []).length > 0;
                                        const tienePermiso = d.permisoCalificacionTardia;
                                        return (
                                          <Box key={d.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Chip size="small"
                                              icon={ok
                                                ? <CheckCircleOutlined style={{ fontSize: 11 }} />
                                                : tienePermiso
                                                  ? <KeyOutlined style={{ fontSize: 11, color: '#1890ff' }} />
                                                  : <ClockCircleOutlined style={{ fontSize: 11 }} />
                                              }
                                              label={`${d.tribunal.nombre}: ${ok ? d.puntuacion + ' pts' : tienePermiso ? 'con permiso' : 'pendiente'}`}
                                              color={ok ? 'success' : tienePermiso ? 'info' : 'default'}
                                              variant="outlined" />
                                            {/* Botón de permiso (solo si no calificó aún) */}
                                            {consolidada && !ok && (
                                              <Tooltip title={tienePermiso ? 'Revocar permiso' : 'Conceder permiso para calificar'}>
                                                <IconButton size="small"
                                                  color={tienePermiso ? 'error' : 'primary'}
                                                  onClick={() => setPermisoDialog({ open: true, detalle: d, acta })}>
                                                  {tienePermiso ? <LockOutlined style={{ fontSize: 14 }} /> : <KeyOutlined style={{ fontSize: 14 }} />}
                                                </IconButton>
                                              </Tooltip>
                                            )}
                                          </Box>
                                        );
                                      })}
                                      {/* Aviso si hay permisos activos esperando nota */}
                                      {conPermiso.length > 0 && (
                                        <Alert severity="info" sx={{ py: 0, px: 1, fontSize: 11, mt: 0.5 }}>
                                          Esperando {conPermiso.length} nota{conPermiso.length > 1 ? 's' : ''} tardía{conPermiso.length > 1 ? 's' : ''}
                                        </Alert>
                                      )}
                                    </Stack>
                                  </TableCell>

                                  {/* Nota final */}
                                  <TableCell align="center">
                                    <Typography fontWeight={700}
                                      color={parseFloat(acta.notaFinal) > 0 ? 'success.main' : 'text.secondary'}>
                                      {acta.notaFinal}
                                    </Typography>
                                  </TableCell>

                                  {/* Estado de consolidación */}
                                  <TableCell align="center">
                                    {consolidada ? (
                                      <Chip
                                        icon={<LockOutlined style={{ fontSize: 12 }} />}
                                        label="Consolidada"
                                        color="success" size="small" variant="filled" />
                                    ) : (
                                      <Chip
                                        icon={<UnlockOutlined style={{ fontSize: 12 }} />}
                                        label={conPermiso.length > 0 ? 'Esperando nota' : 'Sin consolidar'}
                                        color={conPermiso.length > 0 ? 'warning' : 'default'}
                                        size="small" variant="outlined" />
                                    )}
                                  </TableCell>

                                  {/* Acción */}
                                  <TableCell align="center">
                                    <Tooltip title={
                                      consolidada
                                        ? conPermiso.length > 0
                                          ? 'Esperando que el jurado con permiso registre su nota'
                                          : 'Acta bloqueada. Concede permiso a un jurado ausente si necesitas su nota'
                                        : calificados === 0
                                          ? 'Sin calificaciones para consolidar'
                                          : `Consolidar con ${calificados} de ${totalJurados} jurados`
                                    }>
                                      <span>
                                        <Button size="small"
                                          variant={consolidada ? 'outlined' : 'contained'}
                                          color={consolidada ? 'inherit' : 'success'}
                                          disabled={consolidada || calificados === 0 || conPermiso.length > 0}
                                          startIcon={consolidada ? <LockOutlined /> : null}
                                          onClick={() => handleConsolidar(acta)}>
                                          {consolidada ? 'Bloqueada' : 'Consolidar'}
                                        </Button>
                                      </span>
                                    </Tooltip>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Box>
                );
              })}
            </Box>
          )}
        </>
      )}

      {/* Dialog conceder/revocar permiso */}
      <PermisoDialog
        open={permisoDialog.open}
        detalle={permisoDialog.detalle}
        acta={permisoDialog.acta}
        loading={permisoLoading}
        onClose={() => setPermisoDialog({ open: false, detalle: null, acta: null })}
        onConfirm={handlePermiso}
      />

      <Snackbar open={notif.open} autoHideDuration={5000}
        onClose={() => setNotif(p => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={notif.sev} variant="filled">{notif.msg}</Alert>
      </Snackbar>
    </MainCard>
  );
}
