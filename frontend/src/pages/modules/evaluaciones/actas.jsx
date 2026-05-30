import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
  Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Snackbar, Alert, CircularProgress, Chip, Typography, Stack, Divider,
  FormControl, InputLabel, Select, MenuItem, Tooltip, Pagination
} from '@mui/material';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, TeamOutlined, UserAddOutlined,
  StopOutlined, RedoOutlined, ReloadOutlined, BankOutlined
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
      proyecto {
        idProyecto titulo estado
        ofertaEaCarrera { oferta { idOferta nombre } }
      }
      planillaEvaluativa { idPlanillaEvaluativa nombre notaMaxima }
      detallesEvaluacion {
        id
        puntuacion
        estado
        tribunal { idTribunal nombre apellido especialidad }
      }
    }
    todosLosProyectos {
      idProyecto titulo estado
      ofertaEaCarrera { oferta { idOferta nombre estado } }
    }
    todasLasPlanillas { idPlanillaEvaluativa nombre notaMaxima }
    todosLosTribunales { idTribunal nombre apellido especialidad }
  }
`;

const CREATE_ACTA = gql`mutation($idPlanillaEvaluativa: ID!, $idProyecto: ID!, $notaFinal: Decimal!, $fecha: Date!, $horaInicio: Time!, $horaFin: Time!) {
  crearActaEvaluacion(idPlanillaEvaluativa: $idPlanillaEvaluativa, idProyecto: $idProyecto, notaFinal: $notaFinal, fecha: $fecha, horaInicio: $horaInicio, horaFin: $horaFin) { ok error }
}`;
const EDIT_ACTA = gql`mutation($idActaEvaluacion: ID!, $idPlanillaEvaluativa: ID, $idProyecto: ID, $notaFinal: Decimal, $fecha: Date, $horaInicio: Time, $horaFin: Time, $estado: Boolean) {
  editarActaEvaluacion(idActaEvaluacion: $idActaEvaluacion, idPlanillaEvaluativa: $idPlanillaEvaluativa, idProyecto: $idProyecto, notaFinal: $notaFinal, fecha: $fecha, horaInicio: $horaInicio, horaFin: $horaFin, estado: $estado) { ok error }
}`;
const DELETE_ACTA = gql`mutation($idActaEvaluacion: ID!) {
  eliminarActaEvaluacion(idActaEvaluacion: $idActaEvaluacion) { ok error }
}`;

const CREATE_DETALLE = gql`mutation($idActaEvaluacion: ID!, $idTribunal: ID!, $puntuacion: Decimal!) {
  crearDetalleEvaluacion(idActaEvaluacion: $idActaEvaluacion, idTribunal: $idTribunal, puntuacion: $puntuacion) { ok error }
}`;
const DELETE_DETALLE = gql`mutation($idDetalleEvaluacion: ID!) {
  eliminarDetalleEvaluacion(idDetalleEvaluacion: $idDetalleEvaluacion) { ok error }
}`;

// ── Estado chip helper ────────────────────────────────────────────────────────
const estadoColor = { aprobado: 'success', inscrito: 'info', revision: 'warning', rechazado: 'error' };

// ── Acta dialog ───────────────────────────────────────────────────────────────
const INIT_ACTA = { idProyecto: '', idPlanillaEvaluativa: '', fecha: '', horaInicio: '', horaFin: '', notaFinal: '0' };

function ActaDialog({ open, onClose, onSave, saving, initial, proyectos, planillas, evaluatedIds }) {
  const editing = !!initial;
  const [form, setForm] = useState(INIT_ACTA);
  const [filtroOferta, setFiltroOferta] = useState('');
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleEnter = () => {
    if (editing) {
      setForm({
        idProyecto: initial.proyecto.idProyecto,
        idPlanillaEvaluativa: initial.planillaEvaluativa.idPlanillaEvaluativa,
        fecha: initial.fecha,
        horaInicio: initial.horaInicio,
        horaFin: initial.horaFin,
        notaFinal: initial.notaFinal,
      });
      setFiltroOferta(initial.proyecto?.ofertaEaCarrera?.oferta?.idOferta || '');
    } else {
      setForm(INIT_ACTA);
      setFiltroOferta('');
    }
  };

  // Ofertas únicas activas de los proyectos aprobados
  const ofertasUnicas = [...new Map(
    proyectos
      .map(p => [p.ofertaEaCarrera?.oferta?.idOferta, p.ofertaEaCarrera?.oferta])
      .filter(([id, oferta]) => id && oferta?.estado === true)
  ).values()];

  // Proyectos filtrados por oferta seleccionada
  const proyectosFiltrados = filtroOferta
    ? proyectos.filter(p => p.ofertaEaCarrera?.oferta?.idOferta === filtroOferta)
    : proyectos;

  const valid = form.idProyecto && form.idPlanillaEvaluativa && form.fecha && form.horaInicio && form.horaFin;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" TransitionProps={{ onEnter: handleEnter }}>
      <DialogTitle>{editing ? 'Editar Acta' : 'Nueva Acta de Evaluación'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>

          {/* Paso 1: Filtrar por oferta (solo en creación) */}
          {!editing && (
            <FormControl fullWidth>
              <InputLabel>Filtrar por Oferta</InputLabel>
              <Select
                value={filtroOferta}
                label="Filtrar por Oferta"
                onChange={e => { setFiltroOferta(e.target.value); set('idProyecto', ''); }}
              >
                <MenuItem value=""><em>Todas las ofertas</em></MenuItem>
                {ofertasUnicas.map(o => (
                  <MenuItem key={o.idOferta} value={o.idOferta}>{o.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Paso 2: Seleccionar proyecto */}
          <FormControl fullWidth required>
            <InputLabel>Proyecto</InputLabel>
            <Select value={form.idProyecto} label="Proyecto" onChange={e => set('idProyecto', e.target.value)}>
              {proyectosFiltrados.length === 0 && (
                <MenuItem disabled>
                  {filtroOferta ? 'Sin proyectos aprobados en esta oferta' : 'No hay proyectos aprobados disponibles'}
                </MenuItem>
              )}
              {proyectosFiltrados.map(p => {
                const isEvaluated = evaluatedIds.has(p.idProyecto);
                const isCurrent = initial && initial.proyecto.idProyecto === p.idProyecto;
                return (
                  <MenuItem key={p.idProyecto} value={p.idProyecto} disabled={isEvaluated && !isCurrent}>
                    <Box>
                      <Typography variant="body2">{p.titulo}</Typography>
                      {isEvaluated && !isCurrent && (
                        <Typography variant="caption" color="text.secondary">Ya tiene acta registrada</Typography>
                      )}
                    </Box>
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          <FormControl fullWidth required>
            <InputLabel>Planilla Evaluativa</InputLabel>
            <Select value={form.idPlanillaEvaluativa} label="Planilla Evaluativa"
              onChange={e => set('idPlanillaEvaluativa', e.target.value)}>
              {planillas.map(pl => (
                <MenuItem key={pl.idPlanillaEvaluativa} value={pl.idPlanillaEvaluativa}>
                  {pl.nombre} (máx. {pl.notaMaxima} pts)
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField label="Fecha de defensa" type="date" value={form.fecha} fullWidth required
            InputLabelProps={{ shrink: true }} onChange={e => set('fecha', e.target.value)} />
          <Stack direction="row" spacing={2}>
            <TextField label="Hora inicio" type="time" value={form.horaInicio} fullWidth required
              InputLabelProps={{ shrink: true }} onChange={e => set('horaInicio', e.target.value)} />
            <TextField label="Hora fin" type="time" value={form.horaFin} fullWidth required
              InputLabelProps={{ shrink: true }} onChange={e => set('horaFin', e.target.value)} />
          </Stack>
          {editing && (
            <TextField label="Nota final" type="number" value={form.notaFinal} fullWidth
              inputProps={{ min: 0, step: 0.01 }} onChange={e => set('notaFinal', e.target.value)} />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">Cancelar</Button>
        <Button variant="contained" disabled={!valid || saving} onClick={() => onSave(form)}>
          {saving ? <CircularProgress size={22} color="inherit" /> : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Jurados dialog ────────────────────────────────────────────────────────────
function JuradosDialog({ open, onClose, acta, tribunales, onAdd, onRemove, saving }) {
  const [selectedTribunal, setSelectedTribunal] = useState('');

  const asignados = acta?.detallesEvaluacion || [];
  const asignadosIds = new Set(asignados.map(d => d.tribunal.idTribunal));
  const disponibles = tribunales.filter(t => !asignadosIds.has(t.idTribunal));

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Stack direction="row" alignItems="center" gap={1}>
          <TeamOutlined />
          Jurados — {acta?.proyecto?.titulo}
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="subtitle2" gutterBottom>Jurados asignados</Typography>
        {asignados.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Sin jurados asignados.</Typography>
        ) : (
          <Stack spacing={1} sx={{ mb: 2 }}>
            {asignados.map(d => (
              <Box key={d.id} sx={{ display: 'flex', alignItems: 'center', gap: 1,
                p: 1, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={500}>
                    {d.tribunal.nombre} {d.tribunal.apellido}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">{d.tribunal.especialidad}</Typography>
                </Box>
                <Chip label={d.estado ? 'Activo' : 'Inactivo'} size="small"
                  color={d.estado ? 'success' : 'error'} variant="outlined" />
                <Tooltip title="Quitar jurado">
                  <IconButton size="small" color="error" onClick={() => onRemove(d.id)}>
                    <DeleteOutlined style={{ fontSize: 13 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
          </Stack>
        )}

        <Divider sx={{ mb: 2 }} />
        <Typography variant="subtitle2" gutterBottom>Agregar jurado</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <FormControl fullWidth size="small">
            <InputLabel>Seleccionar jurado</InputLabel>
            <Select value={selectedTribunal} label="Seleccionar jurado"
              onChange={e => setSelectedTribunal(e.target.value)}>
              {disponibles.map(t => (
                <MenuItem key={t.idTribunal} value={t.idTribunal}>
                  {t.nombre} {t.apellido} — {t.especialidad}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="contained" startIcon={<UserAddOutlined />}
            disabled={!selectedTribunal || saving}
            onClick={() => { onAdd(selectedTribunal); setSelectedTribunal(''); }}>
            Asignar
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ActasEvaluacionPage() {
  const { data, loading, error, refetch } = useQuery(GET_DATA, { fetchPolicy: 'network-only' });

  const [crearActa]   = useMutation(CREATE_ACTA);
  const [editarActa]  = useMutation(EDIT_ACTA);
  const [eliminarActa] = useMutation(DELETE_ACTA);
  const [crearDetalle]   = useMutation(CREATE_DETALLE);
  const [eliminarDetalle] = useMutation(DELETE_DETALLE);

  const [saving, setSaving] = useState(false);
  const [notif, setNotif] = useState({ open: false, msg: '', sev: 'success' });
  const showNotif = (msg, sev = 'success') => setNotif({ open: true, msg, sev });

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [confirmDlg, setConfirmDlg] = useState({ open: false, title: '', message: '', onConfirm: async () => {}, type: 'error' });
  const [confirming, setConfirming] = useState(false);

  const [actaDialog, setActaDialog]     = useState({ open: false, initial: null });
  const [juradosDialog, setJuradosDialog] = useState({ open: false, acta: null });
  const [expandidos, setExpandidos] = useState(new Set());
  const toggleExpandido = (key) => setExpandidos(prev => {
    const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next;
  });

  const actas      = data?.todasLasActas || [];
  const proyectos  = (data?.todosLosProyectos || []).filter(p => p.estado?.toLowerCase() === 'aprobado');
  const planillas  = data?.todasLasPlanillas || [];
  const tribunales = data?.todosLosTribunales || [];
  const evaluatedIds = new Set(actas.map(a => a.proyecto.idProyecto));

  const handleSaveActa = async (form) => {
    setSaving(true);
    try {
      let res;
      if (actaDialog.initial) {
        res = (await editarActa({ variables: {
          idActaEvaluacion: actaDialog.initial.idActaEvaluacion,
          idProyecto: form.idProyecto,
          idPlanillaEvaluativa: form.idPlanillaEvaluativa,
          fecha: form.fecha,
          horaInicio: form.horaInicio,
          horaFin: form.horaFin,
          notaFinal: parseFloat(form.notaFinal),
        } })).data?.editarActaEvaluacion;
      } else {
        res = (await crearActa({ variables: {
          idProyecto: form.idProyecto,
          idPlanillaEvaluativa: form.idPlanillaEvaluativa,
          fecha: form.fecha,
          horaInicio: form.horaInicio,
          horaFin: form.horaFin,
          notaFinal: 0,
        } })).data?.crearActaEvaluacion;
      }
      if (res?.ok) { showNotif('Acta guardada'); refetch(); setActaDialog({ open: false, initial: null }); }
      else showNotif(res?.error || 'Error al guardar', 'error');
    } catch { showNotif('Error de conexión', 'error'); }
    setSaving(false);
  };

  const handleToggleEstadoActa = (acta) => {
    const isActiva = acta.estado;
    setConfirmDlg({
      open: true,
      title: isActiva ? '¿Desactivar Acta?' : '¿Restaurar Acta?',
      message: isActiva
        ? `¿Deseas desactivar el acta del proyecto "${acta.proyecto.titulo}"?`
        : `¿Deseas restaurar el acta del proyecto "${acta.proyecto.titulo}"?`,
      type: isActiva ? 'error' : 'success',
      onConfirm: async () => {
        setConfirming(true);
        try {
          let res;
          if (isActiva) {
            res = (await eliminarActa({ variables: { idActaEvaluacion: acta.idActaEvaluacion } })).data?.eliminarActaEvaluacion;
          } else {
            res = (await editarActa({ variables: { idActaEvaluacion: acta.idActaEvaluacion, estado: true } })).data?.editarActaEvaluacion;
          }
          if (res?.ok) { showNotif(`Acta ${isActiva ? 'desactivada' : 'restaurada'}`); refetch(); }
          else showNotif(res?.error || 'Error', 'error');
        } catch { showNotif('Error de conexión', 'error'); }
        setConfirming(false);
        setConfirmDlg(p => ({ ...p, open: false }));
      }
    });
  };

  const handleAddJurado = async (idTribunal) => {
    setSaving(true);
    try {
      const res = (await crearDetalle({ variables: {
        idActaEvaluacion: juradosDialog.acta.idActaEvaluacion,
        idTribunal, puntuacion: 0
      } })).data?.crearDetalleEvaluacion;
      if (res?.ok) {
        showNotif('Jurado asignado');
        const updated = await refetch();
        const updatedActa = updated.data?.todasLasActas?.find(a => a.idActaEvaluacion === juradosDialog.acta.idActaEvaluacion);
        if (updatedActa) setJuradosDialog(p => ({ ...p, acta: updatedActa }));
      } else showNotif(res?.error || 'Error', 'error');
    } catch { showNotif('Error de conexión', 'error'); }
    setSaving(false);
  };

  const handleRemoveJurado = async (idDetalle) => {
    if (!window.confirm('¿Quitar este jurado del acta?')) return;
    setSaving(true);
    try {
      const res = (await eliminarDetalle({ variables: { idDetalleEvaluacion: idDetalle } })).data?.eliminarDetalleEvaluacion;
      if (res?.ok) {
        showNotif('Jurado removido');
        const updated = await refetch();
        const updatedActa = updated.data?.todasLasActas?.find(a => a.idActaEvaluacion === juradosDialog.acta.idActaEvaluacion);
        if (updatedActa) setJuradosDialog(p => ({ ...p, acta: updatedActa }));
      } else showNotif(res?.error || 'Error', 'error');
    } catch { showNotif('Error de conexión', 'error'); }
    setSaving(false);
  };

  return (
    <MainCard
      title="Actas de Evaluación"
      secondary={
        <Button variant="contained" startIcon={<PlusOutlined />}
          onClick={() => setActaDialog({ open: true, initial: null })}>
          Nueva Acta
        </Button>
      }
    >
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error">Error al cargar: {error.message}</Alert>
      ) : (
        <>
        {actas.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>Sin actas registradas.</Box>
        ) : (() => {
          // Agrupar por oferta
          const grupos = actas.reduce((acc, acta) => {
            const oferta = acta.proyecto?.ofertaEaCarrera?.oferta;
            const key = oferta?.idOferta || 'sin_oferta';
            if (!acc[key]) acc[key] = { oferta, actas: [] };
            acc[key].actas.push(acta);
            return acc;
          }, {});

          return Object.entries(grupos).map(([key, grupo]) => {
            const isOpen = expandidos.has(key);
            return (
              <Box key={key} sx={{ mb: 2 }}>
                {/* Cabecera colapsable */}
                <Box sx={{
                  px: 2, py: 1.25,
                  borderRadius: isOpen ? '8px 8px 0 0' : 1.5,
                  background: 'linear-gradient(135deg, rgba(24,144,255,0.08), rgba(24,144,255,0.02))',
                  border: '1px solid rgba(24,144,255,0.25)',
                  display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'default',
                }}>
                  <BankOutlined style={{ color: '#1890ff', fontSize: 16 }} />
                  <Typography variant="subtitle2" fontWeight={700} color="primary.main" sx={{ flex: 1 }}>
                    {grupo.oferta?.nombre || 'Sin Oferta'}
                  </Typography>
                  <Chip
                    label={isOpen ? `▲ ${grupo.actas.length} acta(s)` : `▼ ${grupo.actas.length} acta(s)`}
                    size="small" color="primary"
                    variant={isOpen ? 'filled' : 'outlined'}
                    onClick={() => toggleExpandido(key)}
                    sx={{ cursor: 'pointer', fontWeight: 600, userSelect: 'none' }}
                  />
                </Box>

                {/* Tabla colapsable */}
                {isOpen && (
                  <TableContainer component={Paper} elevation={0}
                    sx={{ border: '1px solid rgba(24,144,255,0.25)', borderTop: 'none', borderRadius: '0 0 8px 8px' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell width={60}>ID</TableCell>
                          <TableCell>Proyecto</TableCell>
                          <TableCell>Planilla</TableCell>
                          <TableCell>Fecha</TableCell>
                          <TableCell>Horario</TableCell>
                          <TableCell align="center">Jurados</TableCell>
                          <TableCell align="center">Nota Final</TableCell>
                          <TableCell width={80}>Estado</TableCell>
                          <TableCell align="right" width={130}>Acciones</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {grupo.actas.map(acta => (
                          <TableRow key={acta.idActaEvaluacion} hover>
                            <TableCell>{acta.idActaEvaluacion}</TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={500}>{acta.proyecto.titulo}</Typography>
                              <Chip label={acta.proyecto.estado} size="small"
                                color={estadoColor[acta.proyecto.estado] || 'default'} variant="outlined" sx={{ mt: 0.3 }} />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{acta.planillaEvaluativa.nombre}</Typography>
                              <Typography variant="caption" color="text.secondary">máx. {acta.planillaEvaluativa.notaMaxima}</Typography>
                            </TableCell>
                            <TableCell>{acta.fecha}</TableCell>
                            <TableCell>
                              <Typography variant="caption">{acta.horaInicio} – {acta.horaFin}</Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip label={(acta.detallesEvaluacion || []).length} size="small" color="secondary"
                                icon={<TeamOutlined style={{ fontSize: 12 }} />} />
                            </TableCell>
                            <TableCell align="center">
                              <Typography fontWeight={600}>{acta.notaFinal}</Typography>
                            </TableCell>
                            <TableCell>
                              <Chip label={acta.estado ? 'Activa' : 'Inactiva'}
                                color={acta.estado ? 'success' : 'error'} size="small" variant="outlined" />
                            </TableCell>
                            <TableCell align="right">
                              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                                <Tooltip title="Gestionar jurados">
                                  <IconButton size="small" color="secondary"
                                    onClick={() => setJuradosDialog({ open: true, acta })}>
                                    <TeamOutlined />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Editar acta">
                                  <IconButton size="small" color="primary"
                                    onClick={() => setActaDialog({ open: true, initial: acta })}>
                                    <EditOutlined />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title={acta.estado ? 'Desactivar acta' : 'Restaurar acta'}>
                                  <IconButton size="small" color={acta.estado ? 'error' : 'success'}
                                    onClick={() => handleToggleEstadoActa(acta)}>
                                    {acta.estado ? <DeleteOutlined /> : <ReloadOutlined />}
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            );
          });
        })()}
        </>
      )}

      <ActaDialog
        open={actaDialog.open}
        onClose={() => setActaDialog({ open: false, initial: null })}
        onSave={handleSaveActa}
        saving={saving}
        initial={actaDialog.initial}
        proyectos={proyectos}
        planillas={planillas}
        evaluatedIds={evaluatedIds}
      />

      <JuradosDialog
        open={juradosDialog.open}
        onClose={() => setJuradosDialog({ open: false, acta: null })}
        acta={juradosDialog.acta}
        tribunales={tribunales}
        onAdd={handleAddJurado}
        onRemove={handleRemoveJurado}
        saving={saving}
      />

      {/* ConfirmDialog para desactivar/restaurar */}
      <Dialog open={confirmDlg.open} onClose={() => setConfirmDlg(p => ({ ...p, open: false }))} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}>
        <Box sx={{ pt: 5, pb: 1, textAlign: 'center', position: 'relative' }}>
          <Box sx={{
            position: 'absolute', left: '50%', top: 16, transform: 'translateX(-50%)',
            width: 130, height: 130, borderRadius: '50%',
            background: confirmDlg.type === 'error' ? 'radial-gradient(circle, rgba(255,77,79,0.1) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(82,196,26,0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          {confirmDlg.type === 'error'
            ? <StopOutlined style={{ fontSize: 50, color: '#ff4d4f' }} />
            : <RedoOutlined style={{ fontSize: 50, color: '#52c41a' }} />}
        </Box>
        <Box sx={{ px: 4, pt: 1.5, pb: 0.5, textAlign: 'center' }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 0.75 }}>{confirmDlg.title}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{confirmDlg.message}</Typography>
        </Box>
        <Box sx={{ px: 3.5, py: 3, display: 'flex', gap: 1.5, justifyContent: 'center' }}>
          <Button onClick={() => setConfirmDlg(p => ({ ...p, open: false }))} disabled={confirming} variant="outlined" sx={{ minWidth: 100, borderRadius: 2 }}>Cancelar</Button>
          <Button onClick={confirmDlg.onConfirm} disabled={confirming} variant="contained"
            sx={{
              minWidth: 100, borderRadius: 2,
              background: confirmDlg.type === 'error' ? 'linear-gradient(135deg, #ff4d4f, #b91c1c)' : 'linear-gradient(135deg, #52c41a, #237804)',
              boxShadow: confirmDlg.type === 'error' ? '0 4px 14px rgba(255,77,79,0.4)' : '0 4px 14px rgba(82,196,26,0.4)',
            }}>
            {confirming ? <CircularProgress size={20} color="inherit" /> : (confirmDlg.type === 'error' ? 'Desactivar' : 'Restaurar')}
          </Button>
        </Box>
      </Dialog>

      <Snackbar open={notif.open} autoHideDuration={4000}
        onClose={() => setNotif(p => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={notif.sev} variant="filled">{notif.msg}</Alert>
      </Snackbar>
    </MainCard>
  );
}
