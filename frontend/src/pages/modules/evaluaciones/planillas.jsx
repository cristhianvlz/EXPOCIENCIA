import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
  Box, Button, Typography, CircularProgress, Alert, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Accordion, AccordionSummary, AccordionDetails, Divider,
  Snackbar, Tooltip, Stack, Grid
} from '@mui/material';
import { useColorScheme } from '@mui/material/styles';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  DownOutlined, FileTextOutlined, UnorderedListOutlined, CheckCircleOutlined,
  StopOutlined, RedoOutlined, SearchOutlined, ClearOutlined
} from '@ant-design/icons';
import MainCard from 'components/MainCard';

// ── GQL ──────────────────────────────────────────────────────────────────────
const GET_PLANILLAS = gql`
  query {
    todasLasPlanillas {
      idPlanillaEvaluativa
      nombre
      notaMaxima
      estado
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
  }
`;

const CREATE_PLANILLA = gql`mutation($nombre: String!, $notaMaxima: Decimal!) {
  crearPlanillaEvaluativa(nombre: $nombre, notaMaxima: $notaMaxima) { ok error }
}`;
const EDIT_PLANILLA = gql`mutation($idPlanillaEvaluativa: ID!, $nombre: String, $notaMaxima: Decimal, $estado: Boolean) {
  editarPlanillaEvaluativa(idPlanillaEvaluativa: $idPlanillaEvaluativa, nombre: $nombre, notaMaxima: $notaMaxima, estado: $estado) { ok error }
}`;
const DELETE_PLANILLA = gql`mutation($idPlanillaEvaluativa: ID!) {
  eliminarPlanillaEvaluativa(idPlanillaEvaluativa: $idPlanillaEvaluativa) { ok error }
}`;

const CREATE_SECCION = gql`mutation($idPlanillaEvaluativa: ID!, $nombre: String!, $ponderacion: Decimal!) {
  crearSeccion(idPlanillaEvaluativa: $idPlanillaEvaluativa, nombre: $nombre, ponderacion: $ponderacion) { ok error }
}`;
const EDIT_SECCION = gql`mutation($idSeccion: ID!, $nombre: String, $ponderacion: Decimal, $estado: Boolean) {
  editarSeccion(idSeccion: $idSeccion, nombre: $nombre, ponderacion: $ponderacion, estado: $estado) { ok error }
}`;
const DELETE_SECCION = gql`mutation($idSeccion: ID!) {
  borrarSeccion(idSeccion: $idSeccion) { ok error }
}`;

const CREATE_CRITERIO = gql`mutation($idSeccion: ID!, $nombre: String!, $puntaje: Decimal!) {
  crearCriterio(idSeccion: $idSeccion, nombre: $nombre, puntaje: $puntaje) { ok error }
}`;
const EDIT_CRITERIO = gql`mutation($idCriterio: ID!, $nombre: String, $puntaje: Decimal) {
  editarCriterio(idCriterio: $idCriterio, nombre: $nombre, puntaje: $puntaje) { ok error }
}`;
const DELETE_CRITERIO = gql`mutation($idCriterio: ID!) {
  borrarCriterio(idCriterio: $idCriterio) { ok error }
}`;

// ── Dialogs ───────────────────────────────────────────────────────────────────
function PlanillaDialog({ open, onClose, onSave, saving, initial }) {
  const editing = !!initial;
  const [form, setForm] = useState(initial || { nombre: '', notaMaxima: '' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs"
      TransitionProps={{ onEnter: () => setForm(initial || { nombre: '', notaMaxima: '' }) }}>
      <DialogTitle>{editing ? 'Editar Planilla' : 'Nueva Planilla Evaluativa'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField label="Nombre" value={form.nombre} fullWidth required autoFocus
            onChange={e => set('nombre', e.target.value)} />
          <TextField label="Nota máxima" type="number" value={form.notaMaxima} fullWidth required
            inputProps={{ min: 1, max: 1000, step: 0.01 }}
            onChange={e => set('notaMaxima', e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">Cancelar</Button>
        <Button variant="contained" disabled={!form.nombre.trim() || !form.notaMaxima || saving}
          onClick={() => onSave(form)}>
          {saving ? <CircularProgress size={22} color="inherit" /> : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function SeccionDialog({ open, onClose, onSave, saving, initial, usedPonderacion }) {
  const editing = !!initial;
  const [form, setForm] = useState({ nombre: '', ponderacion: '' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Porcentaje ya usado excluyendo la sección que se edita
  const ownPct = editing ? parseFloat(initial.ponderacion || 0) : 0;
  const otherUsed = (usedPonderacion || 0) - ownPct;
  const disponible = Math.max(0, 100 - otherUsed);

  const pctValue = parseFloat(form.ponderacion) || 0;
  const excede = pctValue > disponible;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs"
      TransitionProps={{ onEnter: () => setForm(initial ? { nombre: initial.nombre, ponderacion: String(initial.ponderacion) } : { nombre: '', ponderacion: '' }) }}>
      <DialogTitle>{editing ? 'Editar Sección' : 'Nueva Sección'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField label="Nombre de la sección" value={form.nombre} fullWidth required autoFocus
            onChange={e => set('nombre', e.target.value)} />

          {/* Barra de porcentaje disponible */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">Porcentaje disponible</Typography>
              <Typography variant="caption" fontWeight={700}
                color={otherUsed >= 100 ? 'error.main' : 'success.main'}>
                {disponible.toFixed(1)}% restante
              </Typography>
            </Box>
            <Box sx={{ height: 6, borderRadius: 3, bgcolor: 'grey.200', overflow: 'hidden' }}>
              <Box sx={{
                height: '100%', borderRadius: 3,
                width: `${Math.min(100, otherUsed + (excede ? disponible : pctValue))}%`,
                bgcolor: excede ? 'error.main' : otherUsed + pctValue >= 100 ? 'success.main' : 'primary.main',
                transition: 'width 0.2s, background-color 0.2s',
              }} />
            </Box>
          </Box>

          <TextField label="Ponderación (%)" type="number" value={form.ponderacion} fullWidth required
            inputProps={{ min: 0.01, max: disponible, step: 0.01 }}
            error={excede}
            helperText={excede ? `Máximo permitido: ${disponible.toFixed(2)}%` : `Máx. ${disponible.toFixed(2)}%`}
            onChange={e => set('ponderacion', e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">Cancelar</Button>
        <Button variant="contained"
          disabled={!form.nombre.trim() || !form.ponderacion || pctValue <= 0 || excede || saving}
          onClick={() => onSave(form)}>
          {saving ? <CircularProgress size={22} color="inherit" /> : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function CriterioDialog({ open, onClose, onSave, saving, initial, seccionMaxPts, usedPuntaje }) {
  const editing = !!initial;
  const [form, setForm] = useState({ nombre: '', puntaje: '' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const ownPts   = editing ? parseFloat(initial.puntaje || 0) : 0;
  const otherUsed = (usedPuntaje || 0) - ownPts;
  const disponible = Math.max(0, (seccionMaxPts || 0) - otherUsed);

  const ptsValue = parseFloat(form.puntaje) || 0;
  const excede   = ptsValue > disponible;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs"
      TransitionProps={{ onEnter: () => setForm(initial ? { nombre: initial.nombre, puntaje: String(initial.puntaje) } : { nombre: '', puntaje: '' }) }}>
      <DialogTitle>{editing ? 'Editar Criterio' : 'Nuevo Criterio'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField label="Nombre del criterio" value={form.nombre} fullWidth required autoFocus
            onChange={e => set('nombre', e.target.value)} />

          {/* Barra de puntos disponibles */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">Puntaje disponible en la sección</Typography>
              <Typography variant="caption" fontWeight={700}
                color={otherUsed >= (seccionMaxPts || 0) ? 'error.main' : 'success.main'}>
                {disponible.toFixed(2)} pts restantes
              </Typography>
            </Box>
            <Box sx={{ height: 6, borderRadius: 3, bgcolor: 'grey.200', overflow: 'hidden' }}>
              <Box sx={{
                height: '100%', borderRadius: 3,
                width: `${seccionMaxPts ? Math.min(100, ((otherUsed + (excede ? disponible : ptsValue)) / seccionMaxPts) * 100) : 0}%`,
                bgcolor: excede ? 'error.main' : otherUsed + ptsValue >= (seccionMaxPts || 0) ? 'success.main' : 'primary.main',
                transition: 'width 0.2s, background-color 0.2s',
              }} />
            </Box>
          </Box>

          <TextField label="Puntaje" type="number" value={form.puntaje} fullWidth required
            inputProps={{ min: 0.01, max: disponible, step: 0.01 }}
            error={excede}
            helperText={excede ? `Máximo permitido: ${disponible.toFixed(2)} pts` : `Máx. ${disponible.toFixed(2)} pts`}
            onChange={e => set('puntaje', e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">Cancelar</Button>
        <Button variant="contained"
          disabled={!form.nombre.trim() || !form.puntaje || ptsValue <= 0 || excede || saving}
          onClick={() => onSave(form)}>
          {saving ? <CircularProgress size={22} color="inherit" /> : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Animated trash bin SVG ────────────────────────────────────────────────────
function StatusIcon({ type }) {
  if (type === 'error') {
    return <StopOutlined style={{ fontSize: 50, color: '#ff4d4f' }} />;
  }
  return <RedoOutlined style={{ fontSize: 50, color: '#52c41a' }} />;
}

// ── Confirm dialog ────────────────────────────────────────────────────────────
function ConfirmDialog({ open, title, message, onConfirm, onClose, loading, type = 'error', confirmLabel }) {
  const { mode } = useColorScheme();
  const dark = mode === 'dark';
  const isError = type === 'error';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{
        elevation: 0,
        sx: {
          borderRadius: '16px',
          overflow: 'hidden',
          backgroundColor: dark ? '#0d1b2a' : '#ffffff',
          backgroundImage: dark
            ? 'linear-gradient(150deg, #0d1b2a 0%, #162237 55%, #1d2d50 100%)'
            : 'linear-gradient(150deg, #ffffff 0%, #f4f7ff 100%)',
          border: dark ? '1px solid rgba(24,144,255,0.18)' : '1px solid rgba(0,0,0,0.07)',
          boxShadow: dark ? '0 24px 644px rgba(0,0,0,0.7)' : '0 24px 64px rgba(0,0,0,0.12)',
        },
      }}>

      {/* Icon area */}
      <Box sx={{ pt: 5, pb: 1, textAlign: 'center', position: 'relative' }}>
        <Box sx={{
          position: 'absolute', left: '50%', top: 16,
          transform: 'translateX(-50%)',
          width: 130, height: 130, borderRadius: '50%',
          background: isError 
            ? 'radial-gradient(circle, rgba(255,77,79,0.18) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(82,196,26,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <StatusIcon type={type} />
      </Box>

      {/* Text */}
      <Box sx={{ px: 4, pt: 1.5, pb: 0.5, textAlign: 'center' }}>
        <Typography variant="h6" fontWeight={700}
          sx={{ color: dark ? '#ffffff' : 'text.primary', mb: 0.75, letterSpacing: '-0.01em' }}>
          {title}
        </Typography>
        <Typography variant="body2"
          sx={{ color: dark ? 'rgba(255,255,255,0.55)' : 'text.secondary', lineHeight: 1.7 }}>
          {message}
        </Typography>
      </Box>

      <Box sx={{ mt: 3, mx: 3, borderTop: '1px solid', borderColor: dark ? 'rgba(255,255,255,0.08)' : 'divider' }} />

      {/* Buttons */}
      <Box sx={{ px: 3.5, py: 3, display: 'flex', gap: 1.5, justifyContent: 'center' }}>
        <Button onClick={onClose} disabled={loading} variant="outlined"
          sx={{
            minWidth: 122, borderRadius: 2,
            ...(dark && {
              borderColor: 'rgba(255,255,255,0.25)',
              color: 'rgba(255,255,255,0.82)',
              '&:hover': { borderColor: 'rgba(255,255,255,0.45)', bgcolor: 'rgba(255,255,255,0.06)' },
            }),
          }}>
          Cancelar
        </Button>
        <Button onClick={onConfirm} disabled={loading} variant="contained"
          sx={{
            minWidth: 122, borderRadius: 2,
            background: isError 
              ? 'linear-gradient(135deg, #ff4d4f 0%, #b91c1c 100%)'
              : 'linear-gradient(135deg, #52c41a 0%, #237804 100%)',
            boxShadow: isError 
              ? '0 4px 18px rgba(255,77,79,0.4)'
              : '0 4px 18px rgba(82,196,26,0.4)',
            '&:hover': {
              background: isError 
                ? 'linear-gradient(135deg, #ff7875 0%, #991b1b 100%)'
                : 'linear-gradient(135deg, #73d13d 0%, #135200 100%)',
              boxShadow: isError 
                ? '0 6px 24px rgba(255,77,79,0.6)'
                : '0 6px 24px rgba(82,196,26,0.6)',
            },
          }}>
          {loading ? <CircularProgress size={20} color="inherit" /> : (confirmLabel || (isError ? 'Desactivar' : 'Restaurar'))}
        </Button>
      </Box>
    </Dialog>
  );
}

// ── Criterios list inside a section ──────────────────────────────────────────
function CriterioRow({ criterio, onEdit, onDelete }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5, pl: 2,
      borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}>
      <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 14 }} />
      <Typography variant="body2" sx={{ flex: 1 }}>{criterio.nombre}</Typography>
      <Chip label={`${criterio.puntaje} pts`} size="small" color="primary" variant="outlined" />
      <Tooltip title="Editar criterio">
        <IconButton size="small" color="primary" onClick={() => onEdit(criterio)}>
          <EditOutlined style={{ fontSize: 13 }} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Eliminar criterio">
        <IconButton size="small" color="error" onClick={() => onDelete(criterio.idCriterio)}>
          <DeleteOutlined style={{ fontSize: 13 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PlanillasRubricasPage() {
  const { data, loading, error, refetch } = useQuery(GET_PLANILLAS, { fetchPolicy: 'network-only' });

  const [crearPlanilla]  = useMutation(CREATE_PLANILLA);
  const [editarPlanilla] = useMutation(EDIT_PLANILLA);
  const [eliminarPlanilla] = useMutation(DELETE_PLANILLA);
  const [crearSeccion]   = useMutation(CREATE_SECCION);
  const [editarSeccion]  = useMutation(EDIT_SECCION);
  const [eliminarSeccion] = useMutation(DELETE_SECCION);
  const [crearCriterio]  = useMutation(CREATE_CRITERIO);
  const [editarCriterio] = useMutation(EDIT_CRITERIO);
  const [eliminarCriterio] = useMutation(DELETE_CRITERIO);

  const [saving, setSaving] = useState(false);
  const [notif, setNotif] = useState({ open: false, msg: '', sev: 'success' });
  const showNotif = (msg, sev = 'success') => setNotif({ open: true, msg, sev });

  // Confirm dialog state
  const [confirmDlg, setConfirmDlg] = useState({ open: false, title: '', message: '', onConfirm: null, type: 'error', confirmLabel: undefined });
  const [confirming, setConfirming] = useState(false);
  const showConfirm = (title, message, onConfirm, type = 'error', confirmLabel = undefined) =>
    setConfirmDlg({ open: true, title, message, onConfirm, type, confirmLabel });
  const closeConfirm = () => setConfirmDlg({ open: false, title: '', message: '', onConfirm: null, type: 'error', confirmLabel: undefined });

  const handleConfirm = async () => {
    if (!confirmDlg.onConfirm) return;
    setConfirming(true);
    await confirmDlg.onConfirm();
    setConfirming(false);
    closeConfirm();
  };

  // Dialog states
  const [planillaDialog, setPlanillaDialog] = useState({ open: false, initial: null });
  const [seccionDialog, setSeccionDialog]   = useState({ open: false, initial: null, planillaId: null, usedPonderacion: 0 });
  const [criterioDialog, setCriterioDialog] = useState({ open: false, initial: null, seccionId: null, seccionMaxPts: 0, usedPuntaje: 0 });

  const planillas = data?.todasLasPlanillas || [];

  const [busqueda, setBusqueda] = useState('');
  const planillasFiltradas = planillas.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  // ── Planilla handlers ──────────────────────────────────────────────────────
  const handleSavePlanilla = async (form) => {
    setSaving(true);
    try {
      let res;
      if (planillaDialog.initial) {
        res = (await editarPlanilla({ variables: {
          idPlanillaEvaluativa: planillaDialog.initial.idPlanillaEvaluativa,
          nombre: form.nombre, notaMaxima: parseFloat(form.notaMaxima)
        } })).data?.editarPlanillaEvaluativa;
      } else {
        res = (await crearPlanilla({ variables: {
          nombre: form.nombre, notaMaxima: parseFloat(form.notaMaxima)
        } })).data?.crearPlanillaEvaluativa;
      }
      if (res?.ok) { showNotif('Planilla guardada'); refetch(); setPlanillaDialog({ open: false, initial: null }); }
      else showNotif(res?.error || 'Error al guardar', 'error');
    } catch { showNotif('Error de conexión', 'error'); }
    setSaving(false);
  };

  const handleDeletePlanilla = (planilla) => {
    showConfirm(
      'Eliminar planilla',
      `Se eliminará permanentemente la planilla "${planilla.nombre}" junto con todas sus secciones y criterios. Esta acción no se puede deshacer.`,
      async () => {
        try {
          const res = (await eliminarPlanilla({ variables: { idPlanillaEvaluativa: planilla.idPlanillaEvaluativa } })).data?.eliminarPlanillaEvaluativa;
          if (res?.ok) { showNotif('Planilla eliminada'); refetch(); }
          else showNotif(res?.error || 'Error al eliminar', 'error');
        } catch { showNotif('Error de conexión', 'error'); }
      },
      'error',
      'Eliminar'
    );
  };

  const handleTogglePlanilla = (planilla) => {
    const isActiva = planilla.estado;
    showConfirm(
      isActiva ? 'Desactivar planilla' : 'Restaurar planilla',
      isActiva ? `La planilla "${planilla.nombre}" quedará inactiva.` : `La planilla "${planilla.nombre}" volverá a estar activa.`,
      async () => {
        try {
          const res = (await editarPlanilla({ variables: { idPlanillaEvaluativa: planilla.idPlanillaEvaluativa, estado: !isActiva } })).data?.editarPlanillaEvaluativa;
          if (res?.ok) { 
            showNotif(isActiva ? 'Planilla desactivada' : 'Planilla restaurada', isActiva ? 'warning' : 'success'); 
            refetch(); 
          }
          else showNotif(res?.error || 'Error', 'error');
        } catch { showNotif('Error de conexión', 'error'); }
      },
      isActiva ? 'error' : 'success'
    );
  };

  // ── Sección handlers ───────────────────────────────────────────────────────
  const handleSaveSeccion = async (form) => {
    setSaving(true);
    try {
      let res;
      if (seccionDialog.initial) {
        res = (await editarSeccion({ variables: {
          idSeccion: seccionDialog.initial.idSeccion,
          nombre: form.nombre, ponderacion: parseFloat(form.ponderacion)
        } })).data?.editarSeccion;
      } else {
        res = (await crearSeccion({ variables: {
          idPlanillaEvaluativa: seccionDialog.planillaId,
          nombre: form.nombre, ponderacion: parseFloat(form.ponderacion)
        } })).data?.crearSeccion;
      }
      if (res?.ok) { showNotif('Sección guardada'); refetch(); setSeccionDialog({ open: false, initial: null, planillaId: null }); }
      else showNotif(res?.error || 'Error al guardar', 'error');
    } catch { showNotif('Error de conexión', 'error'); }
    setSaving(false);
  };

  const handleDeleteSeccion = (id) => {
    showConfirm(
      'Eliminar sección',
      'Se eliminarán permanentemente esta sección y todos sus criterios. Esta acción no se puede deshacer.',
      async () => {
        try {
          const res = (await eliminarSeccion({ variables: { idSeccion: id } })).data?.borrarSeccion;
          if (res?.ok) { showNotif('Sección eliminada'); refetch(); }
          else showNotif(res?.error || 'Error', 'error');
        } catch { showNotif('Error de conexión', 'error'); }
      }
    );
  };

  // ── Criterio handlers ──────────────────────────────────────────────────────
  const handleSaveCriterio = async (form) => {
    setSaving(true);
    try {
      let res;
      if (criterioDialog.initial) {
        res = (await editarCriterio({ variables: {
          idCriterio: criterioDialog.initial.idCriterio,
          nombre: form.nombre, puntaje: parseFloat(form.puntaje)
        } })).data?.editarCriterio;
      } else {
        res = (await crearCriterio({ variables: {
          idSeccion: criterioDialog.seccionId,
          nombre: form.nombre, puntaje: parseFloat(form.puntaje)
        } })).data?.crearCriterio;
      }
      if (res?.ok) { showNotif('Criterio guardado'); refetch(); setCriterioDialog({ open: false, initial: null, seccionId: null }); }
      else showNotif(res?.error || 'Error al guardar', 'error');
    } catch { showNotif('Error de conexión', 'error'); }
    setSaving(false);
  };

  const handleDeleteCriterio = (id) => {
    showConfirm(
      'Eliminar criterio',
      'Este criterio se eliminará permanentemente de la sección. Esta acción no se puede deshacer.',
      async () => {
        try {
          const res = (await eliminarCriterio({ variables: { idCriterio: id } })).data?.borrarCriterio;
          if (res?.ok) { showNotif('Criterio eliminado'); refetch(); }
          else showNotif(res?.error || 'Error', 'error');
        } catch { showNotif('Error de conexión', 'error'); }
      }
    );
  };

  return (
    <MainCard
      title="Planillas y Rúbricas"
      secondary={
        <Button variant="contained" startIcon={<PlusOutlined />}
          onClick={() => setPlanillaDialog({ open: true, initial: null })}>
          Nueva Planilla
        </Button>
      }
    >
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error">Error al cargar: {error.message}</Alert>
      ) : (
        <>
          {/* ── Filtro de búsqueda ── */}
          <Box sx={{
            mb: 3, p: 2,
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={11}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Buscar por nombre de planilla..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchOutlined style={{ color: '#bfbfbf', marginRight: 8 }} />
                  }}
                  sx={{ bgcolor: 'background.paper' }}
                />
              </Grid>
              <Grid item xs={12} md={1} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Tooltip title="Limpiar Filtros">
                  <IconButton
                    onClick={() => setBusqueda('')}
                    color="secondary"
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: '8px',
                      visibility: busqueda !== '' ? 'visible' : 'hidden'
                    }}
                  >
                    <ClearOutlined />
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>
          </Box>

          {planillas.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
              <FileTextOutlined style={{ fontSize: 48, marginBottom: 12 }} />
              <Typography>No hay planillas creadas. Crea la primera.</Typography>
            </Box>
          ) : planillasFiltradas.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
              <SearchOutlined style={{ fontSize: 48, marginBottom: 12 }} />
              <Typography>No se encontraron planillas con el nombre <strong>"{busqueda}"</strong>.</Typography>
            </Box>
          ) : (
        <Stack spacing={2}>
          {planillasFiltradas.map(planilla => {
            const totalPonderacion = (planilla.secciones || []).reduce((s, sec) => s + parseFloat(sec.ponderacion || 0), 0);
            return (
              <Box key={planilla.idPlanillaEvaluativa} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                {/* Planilla header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2, bgcolor: 'primary.lighter' }}>
                  <FileTextOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600}>{planilla.nombre}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Nota máxima: {planilla.notaMaxima} pts &nbsp;·&nbsp; {(planilla.secciones || []).length} sección(es)
                      &nbsp;·&nbsp; Ponderación total:&nbsp;
                      <Box component="span" sx={{
                        fontWeight: 700,
                        color: totalPonderacion > 100 ? 'error.main' : totalPonderacion === 100 ? 'success.main' : 'warning.main'
                      }}>
                        {totalPonderacion.toFixed(1)}% / 100%
                      </Box>
                    </Typography>
                  </Box>
                  <Chip label={planilla.estado ? 'Activa' : 'Inactiva'}
                    color={planilla.estado ? 'success' : 'default'} size="small" />
                  <Tooltip title="Agregar sección">
                    <Button size="small" startIcon={<PlusOutlined />} variant="outlined"
                      onClick={() => setSeccionDialog({ open: true, initial: null, planillaId: planilla.idPlanillaEvaluativa, usedPonderacion: totalPonderacion })}>
                      Sección
                    </Button>
                  </Tooltip>
                  <Tooltip title="Editar planilla">
                    <IconButton size="small" color="primary"
                      onClick={() => setPlanillaDialog({ open: true, initial: planilla })}>
                      <EditOutlined />
                    </IconButton>
                  </Tooltip>
                  {planilla.estado ? (
                    <Tooltip title="Desactivar planilla">
                      <IconButton size="small" color="error"
                        onClick={() => handleTogglePlanilla(planilla)}>
                        <StopOutlined />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Restaurar planilla">
                      <IconButton size="small" sx={{ color: 'success.main' }}
                        onClick={() => handleTogglePlanilla(planilla)}>
                        <RedoOutlined />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Eliminar planilla permanentemente">
                    <IconButton size="small" color="error"
                      onClick={() => handleDeletePlanilla(planilla)}>
                      <DeleteOutlined />
                    </IconButton>
                  </Tooltip>
                </Box>

                {/* Secciones (accordion) */}
                {(planilla.secciones || []).length === 0 ? (
                  <Box sx={{ p: 2, pl: 3, color: 'text.secondary' }}>
                    <Typography variant="body2">Sin secciones. Agrega una sección para definir criterios.</Typography>
                  </Box>
                ) : (
                  (planilla.secciones || []).map((seccion, idx) => (
                    <Accordion key={seccion.idSeccion} disableGutters elevation={0}
                      sx={{ '&:before': { display: 'none' }, borderTop: idx === 0 ? 'none' : '1px solid', borderColor: 'divider' }}>
                      <AccordionSummary expandIcon={<DownOutlined style={{ fontSize: 12 }} />}
                        sx={{ pl: 3, minHeight: 48, '& .MuiAccordionSummary-content': { alignItems: 'center', gap: 1.5 } }}>
                        <UnorderedListOutlined style={{ fontSize: 16, color: '#722ed1' }} />
                        <Typography variant="body2" fontWeight={500} sx={{ flex: 1 }}>{seccion.nombre}</Typography>
                        <Chip label={`${seccion.ponderacion}%`} size="small" color="secondary" variant="outlined" sx={{ mr: 1 }} />
                        <Chip label={`${(seccion.criterios || []).length} criterios`} size="small" variant="outlined" sx={{ mr: 1 }} />
                        <Tooltip title="Agregar criterio">
                          <Button component="div" size="small" startIcon={<PlusOutlined />}
                            onClick={e => {
                              e.stopPropagation();
                              const maxPts = parseFloat(planilla.notaMaxima) * parseFloat(seccion.ponderacion) / 100;
                              const used   = (seccion.criterios || []).reduce((s, c) => s + parseFloat(c.puntaje || 0), 0);
                              setCriterioDialog({ open: true, initial: null, seccionId: seccion.idSeccion, seccionMaxPts: maxPts, usedPuntaje: used });
                            }}>
                            Criterio
                          </Button>
                        </Tooltip>
                        <IconButton component="div" size="small" color="primary"
                          onClick={e => { e.stopPropagation(); setSeccionDialog({ open: true, initial: seccion, planillaId: planilla.idPlanillaEvaluativa, usedPonderacion: totalPonderacion }); }}>
                          <EditOutlined style={{ fontSize: 13 }} />
                        </IconButton>
                        <IconButton component="div" size="small" color="error"
                          onClick={e => { e.stopPropagation(); handleDeleteSeccion(seccion.idSeccion); }}>
                          <DeleteOutlined style={{ fontSize: 13 }} />
                        </IconButton>
                      </AccordionSummary>
                      <AccordionDetails sx={{ pl: 4, pr: 2, pb: 1.5 }}>
                        {(seccion.criterios || []).length === 0 ? (
                          <Typography variant="body2" color="text.secondary">Sin criterios.</Typography>
                        ) : (
                          <Stack spacing={0.5}>
                            {seccion.criterios.map(criterio => (
                              <CriterioRow key={criterio.idCriterio} criterio={criterio}
                                onEdit={c => {
                                const maxPts = parseFloat(planilla.notaMaxima) * parseFloat(seccion.ponderacion) / 100;
                                const used   = (seccion.criterios || []).reduce((s, cr) => s + parseFloat(cr.puntaje || 0), 0);
                                setCriterioDialog({ open: true, initial: c, seccionId: seccion.idSeccion, seccionMaxPts: maxPts, usedPuntaje: used });
                              }}
                                onDelete={handleDeleteCriterio} />
                            ))}
                          </Stack>
                        )}
                        <Divider sx={{ mt: 1.5, mb: 0.5 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          {(() => {
                            const used   = (seccion.criterios || []).reduce((s, c) => s + parseFloat(c.puntaje || 0), 0);
                            const maxPts = parseFloat(planilla.notaMaxima) * parseFloat(seccion.ponderacion) / 100;
                            const color  = used > maxPts ? 'error.main' : used === maxPts ? 'success.main' : 'text.secondary';
                            return (
                              <Typography variant="caption" sx={{ color }}>
                                Subtotal: {used.toFixed(1)} / {maxPts.toFixed(1)} pts
                              </Typography>
                            );
                          })()}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  ))
                )}
              </Box>
            );
          })}
        </Stack>
          )}
        </>
      )}

      {/* Dialogs */}
      <PlanillaDialog
        open={planillaDialog.open}
        onClose={() => setPlanillaDialog({ open: false, initial: null })}
        onSave={handleSavePlanilla}
        saving={saving}
        initial={planillaDialog.initial}
      />
      <SeccionDialog
        open={seccionDialog.open}
        onClose={() => setSeccionDialog({ open: false, initial: null, planillaId: null, usedPonderacion: 0 })}
        onSave={handleSaveSeccion}
        saving={saving}
        initial={seccionDialog.initial}
        usedPonderacion={seccionDialog.usedPonderacion}
      />
      <CriterioDialog
        open={criterioDialog.open}
        onClose={() => setCriterioDialog({ open: false, initial: null, seccionId: null, seccionMaxPts: 0, usedPuntaje: 0 })}
        onSave={handleSaveCriterio}
        saving={saving}
        initial={criterioDialog.initial}
        seccionMaxPts={criterioDialog.seccionMaxPts}
        usedPuntaje={criterioDialog.usedPuntaje}
      />

      <ConfirmDialog
        open={confirmDlg.open}
        title={confirmDlg.title}
        message={confirmDlg.message}
        onConfirm={handleConfirm}
        onClose={closeConfirm}
        loading={confirming}
        type={confirmDlg.type}
        confirmLabel={confirmDlg.confirmLabel}
      />

      <Snackbar open={notif.open} autoHideDuration={4000}
        onClose={() => setNotif(p => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={notif.sev} variant="filled">{notif.msg}</Alert>
      </Snackbar>
    </MainCard>
  );
}
