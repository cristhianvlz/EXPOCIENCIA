import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
  Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Switch, FormControlLabel,
  Snackbar, Alert, CircularProgress, Tabs, Tab, Chip, Select, MenuItem, FormControl, InputLabel, Typography, Grid, Divider, Avatar, Checkbox, ListItemText
} from '@mui/material';
import { 
  EditOutlined, DeleteOutlined, PlusOutlined, EyeOutlined,
  CalendarOutlined, ClockCircleOutlined, TeamOutlined, PushpinOutlined, TrophyOutlined, ScheduleOutlined,
  StopOutlined, RedoOutlined, LeftOutlined, RightOutlined,
  ClearOutlined, FilterOutlined
} from '@ant-design/icons';
import { Tooltip } from '@mui/material';
import MainCard from 'components/MainCard';

const GET_ALL = gql`
  query {
    todosLosCronogramas {
      idCronograma fechaInicio fechaFin estado
      evento { idEvento nombre version gestion }
      actividad { idActividad nombreActividad grupo { idGrupo descripcion } }
    }
    todasLasActividades { idActividad nombreActividad estado grupo { idGrupo descripcion } }
    todosLosGrupos { idGrupo descripcion estado }
    todosLosEventos { idEvento nombre version gestion estado }
  }
`;

const CREATE_GRUPO  = gql`mutation($descripcion: String!) { crearGrupo(descripcion: $descripcion) { ok error } }`;
const EDIT_GRUPO    = gql`mutation($idGrupo: ID!, $descripcion: String, $estado: Boolean) { editarGrupo(idGrupo: $idGrupo, descripcion: $descripcion, estado: $estado) { ok error } }`;
const DELETE_GRUPO  = gql`mutation($idGrupo: ID!) { eliminarGrupo(idGrupo: $idGrupo) { ok error } }`;

const CREATE_ACTIVIDAD = gql`mutation($idGrupo: ID!, $nombreActividad: String!) { crearActividad(idGrupo: $idGrupo, nombreActividad: $nombreActividad) { ok error } }`;
const EDIT_ACTIVIDAD   = gql`mutation($idActividad: ID!, $idGrupo: ID, $nombreActividad: String, $estado: Boolean) { editarActividad(idActividad: $idActividad, idGrupo: $idGrupo, nombreActividad: $nombreActividad, estado: $estado) { ok error } }`;
const DELETE_ACTIVIDAD = gql`mutation($idActividad: ID!) { eliminarActividad(idActividad: $idActividad) { ok error } }`;

const CREATE_CRONOGRAMA = gql`
  mutation($idEvento: ID!, $idActividad: ID!, $fechaInicio: DateTime!, $fechaFin: DateTime!) {
    crearCronograma(idEvento: $idEvento, idActividad: $idActividad, fechaInicio: $fechaInicio, fechaFin: $fechaFin) { ok error }
  }
`;
const EDIT_CRONOGRAMA = gql`
  mutation($idCronograma: ID!, $idEvento: ID, $idActividad: ID, $fechaInicio: DateTime, $fechaFin: DateTime, $estado: Boolean) {
    editarCronograma(idCronograma: $idCronograma, idEvento: $idEvento, idActividad: $idActividad, fechaInicio: $fechaInicio, fechaFin: $fechaFin, estado: $estado) { ok error }
  }
`;
const DELETE_CRONOGRAMA = gql`mutation($idCronograma: ID!) { eliminarCronograma(idCronograma: $idCronograma) { ok error } }`;

const toInputDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const formatDate  = (iso) => iso ? new Date(iso).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' }) : '-';

const INIT_CRONOGRAMA = { idEvento: '', idActividad: '', fechaInicio: '', fechaFin: '', estado: true };
const INIT_ACTIVIDAD  = { nombreActividad: '', idGrupo: '', estado: true };
const INIT_GRUPO      = { descripcion: '', estado: true };

function StatusIcon({ type }) {
  if (type === 'error') return <StopOutlined style={{ fontSize: 50, color: '#ff4d4f' }} />;
  return <RedoOutlined style={{ fontSize: 50, color: '#52c41a' }} />;
}

function ConfirmDialog({ open, title, message, onConfirm, onClose, loading, type = 'error' }) {
  const isError = type === 'error';
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.12)' } }}>
      <Box sx={{ pt: 5, pb: 1, textAlign: 'center', position: 'relative' }}>
        <Box sx={{
          position: 'absolute', left: '50%', top: 16, transform: 'translateX(-50%)',
          width: 130, height: 130, borderRadius: '50%',
          background: isError 
            ? 'radial-gradient(circle, rgba(255,77,79,0.1) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(82,196,26,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <StatusIcon type={type} />
      </Box>
      <Box sx={{ px: 4, pt: 1.5, pb: 0.5, textAlign: 'center' }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 0.75 }}>{title}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{message}</Typography>
      </Box>
      <Box sx={{ px: 3.5, py: 3, display: 'flex', gap: 1.5, justifyContent: 'center' }}>
        <Button onClick={onClose} disabled={loading} variant="outlined" sx={{ minWidth: 100, borderRadius: 2 }}>Cancelar</Button>
        <Button onClick={onConfirm} disabled={loading} variant="contained"
          sx={{
            minWidth: 100, borderRadius: 2,
            background: isError ? 'linear-gradient(135deg, #ff4d4f, #b91c1c)' : 'linear-gradient(135deg, #52c41a, #237804)',
            boxShadow: isError ? '0 4px 14px rgba(255,77,79,0.4)' : '0 4px 14px rgba(82,196,26,0.4)',
          }}>
          {loading ? <CircularProgress size={20} color="inherit" /> : (isError ? 'Desactivar' : 'Restaurar')}
        </Button>
      </Box>
    </Dialog>
  );
}

function TablePagination({ count, page, setPage, rowsPerPage, setRowsPerPage }) {
  const totalPages = Math.ceil(count / rowsPerPage);
  const handlePageChange = (newPage) => { if (newPage >= 0 && newPage < totalPages) setPage(newPage); };
  const pages = Array.from({ length: totalPages }, (_, i) => i);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" color="text.secondary">Mostrar</Typography>
        <Select size="small" value={rowsPerPage} onChange={e => { setRowsPerPage(e.target.value); setPage(0); }} sx={{ height: 32, borderRadius: 1.5, '& .MuiSelect-select': { py: 0.5, fontSize: '0.875rem', px: 1.5 } }}>
          {[5, 10, 15].map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
        </Select>
        <Typography variant="body2" color="text.secondary">registros</Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <IconButton size="small" disabled={page === 0} onClick={() => handlePageChange(page - 1)} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, width: 32, height: 32 }}>
          <LeftOutlined style={{ fontSize: 12 }} />
        </IconButton>
        {pages.map((p) => (
          <Button key={p} onClick={() => setPage(p)} sx={{ minWidth: 32, height: 32, p: 0, borderRadius: 1.5, fontSize: '0.875rem', fontWeight: page === p ? 700 : 400, bgcolor: page === p ? 'primary.main' : 'transparent', color: page === p ? 'white' : 'text.primary', border: '1px solid', borderColor: page === p ? 'primary.main' : 'divider', '&:hover': { bgcolor: page === p ? 'primary.dark' : 'action.hover', borderColor: page === p ? 'primary.dark' : 'divider' } }}>
            {p + 1}
          </Button>
        ))}
        <IconButton size="small" disabled={page >= totalPages - 1 || count === 0} onClick={() => handlePageChange(page + 1)} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, width: 32, height: 32 }}>
          <RightOutlined style={{ fontSize: 12 }} />
        </IconButton>
      </Box>
    </Box>
  );
}

export default function CronogramaPage() {
  const [tab, setTab] = useState(0);
  const { data, loading, error, refetch } = useQuery(GET_ALL, { fetchPolicy: 'network-only' });

  const [crearCronograma]    = useMutation(CREATE_CRONOGRAMA);
  const [editarCronograma]   = useMutation(EDIT_CRONOGRAMA);
  const [eliminarCronograma] = useMutation(DELETE_CRONOGRAMA);
  const [crearActividad]     = useMutation(CREATE_ACTIVIDAD);
  const [editarActividad]    = useMutation(EDIT_ACTIVIDAD);
  const [eliminarActividad]  = useMutation(DELETE_ACTIVIDAD);
  const [crearGrupo]         = useMutation(CREATE_GRUPO);
  const [editarGrupo]        = useMutation(EDIT_GRUPO);
  const [eliminarGrupo]      = useMutation(DELETE_GRUPO);

  const [openCronograma,    setOpenCronograma]    = useState(false);
  const [editingCronograma, setEditingCronograma] = useState(null);
  const [formCronograma,    setFormCronograma]    = useState(INIT_CRONOGRAMA);

  const [openActividad,    setOpenActividad]    = useState(false);
  const [editingActividad, setEditingActividad] = useState(null);
  const [formActividad,    setFormActividad]    = useState(INIT_ACTIVIDAD);

  const [openGrupo,    setOpenGrupo]    = useState(false);
  const [editingGrupo, setEditingGrupo] = useState(null);
  const [formGrupo,    setFormGrupo]    = useState(INIT_GRUPO);

  // View states
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [viewType, setViewType] = useState('');

  // Grupos expandidos en el cronograma (Set de idEvento)
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const toggleGroup = (id) => setExpandedGroups(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  // Paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [filterEvento, setFilterEvento] = useState('Todos');

  const [confirmDlg, setConfirmDlg] = useState({ open: false, title: '', message: '', onConfirm: null, type: 'error' });
  const [confirming, setConfirming] = useState(false);

  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [saving, setSaving] = useState(false);

  const cronogramas = data?.todosLosCronogramas  || [];
  const actividades = data?.todasLasActividades  || [];
  const grupos      = data?.todosLosGrupos       || [];
  const eventos     = data?.todosLosEventos      || [];

  const showNotification = (message, severity) => setNotification({ open: true, message, severity });

  // ── Cronograma ──
  const handleOpenCronograma = (c = null) => {
    setEditingCronograma(c);
    setFormCronograma(c ? {
      idEvento:    c.evento?.idEvento       || '',
      idActividad: c.actividad?.idActividad || '',
      fechaInicio: toInputDate(c.fechaInicio),
      fechaFin:    toInputDate(c.fechaFin),
      estado: c.estado,
    } : { ...INIT_CRONOGRAMA, idActividad: [] });
    setOpenCronograma(true);
  };

  const handleSubmitCronograma = async () => {
    if (formCronograma.fechaInicio >= formCronograma.fechaFin) {
      showNotification('La fecha de inicio debe ser anterior a la fecha de fin', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editingCronograma) {
        const res = await editarCronograma({
          variables: {
            idCronograma: editingCronograma.idCronograma,
            idEvento: formCronograma.idEvento,
            idActividad: formCronograma.idActividad,
            fechaInicio: formCronograma.fechaInicio,
            fechaFin: formCronograma.fechaFin,
            estado: formCronograma.estado
          }
        });
        const result = res.data?.editarCronograma;
        if (result?.ok) {
          showNotification('Cronograma actualizado', 'success');
          refetch();
          setOpenCronograma(false);
        } else {
          showNotification(result?.error || 'Error al guardar', 'error');
        }
      } else {
        const ids = formCronograma.idActividad;
        let successCount = 0;
        let lastError = null;

        for (const idAct of ids) {
          const res = await crearCronograma({
            variables: {
              idEvento: formCronograma.idEvento,
              idActividad: idAct,
              fechaInicio: formCronograma.fechaInicio,
              fechaFin: formCronograma.fechaFin
            }
          });
          if (res.data?.crearCronograma?.ok) {
            successCount++;
          } else {
            lastError = res.data?.crearCronograma?.error || 'Error desconocido';
          }
        }

        if (successCount === ids.length) {
          showNotification(`${successCount} entrada(s) de cronograma creada(s)`, 'success');
          refetch();
          setOpenCronograma(false);
        } else if (successCount > 0) {
          showNotification(`Se crearon ${successCount} entradas, pero hubo error en algunas: ${lastError}`, 'warning');
          refetch();
          setOpenCronograma(false);
        } else {
          showNotification(`Error al crear entradas: ${lastError}`, 'error');
        }
      }
    } catch (e) {
      showNotification('Error de conexión: ' + e.message, 'error');
    }
    setSaving(false);
  };

  const handleToggleCronograma = (c) => {
    const isActiva = c.estado;
    setConfirmDlg({
      open: true,
      title: isActiva ? 'Desactivar entrada' : 'Restaurar entrada',
      message: isActiva ? '¿Deseas desactivar esta entrada del cronograma?' : '¿Deseas restaurar esta entrada del cronograma?',
      type: isActiva ? 'error' : 'success',
      onConfirm: async () => {
        setConfirming(true);
        try {
          const res = await editarCronograma({ variables: { idCronograma: c.idCronograma, estado: !isActiva } });
          if (res.data?.editarCronograma?.ok) { showNotification(isActiva ? 'Entrada desactivada' : 'Entrada restaurada', isActiva ? 'warning' : 'success'); refetch(); }
          else showNotification(res.data?.editarCronograma?.error || 'Error', 'error');
        } catch { showNotification('Error de conexión', 'error'); }
        setConfirming(false);
        setConfirmDlg(p => ({ ...p, open: false }));
      }
    });
  };

  // ── Actividad ──
  const handleOpenActividad = (a = null) => {
    setEditingActividad(a);
    setFormActividad(a ? {
      nombreActividad: a.nombreActividad,
      idGrupo: a.grupo?.idGrupo || '',
      estado: a.estado,
    } : INIT_ACTIVIDAD);
    setOpenActividad(true);
  };

  const handleSubmitActividad = async () => {
    setSaving(true);
    try {
      const res = editingActividad
        ? await editarActividad({ variables: { idActividad: editingActividad.idActividad, ...formActividad } })
        : await crearActividad({ variables: { idGrupo: formActividad.idGrupo, nombreActividad: formActividad.nombreActividad } });
      const result = editingActividad ? res.data?.editarActividad : res.data?.crearActividad;
      if (result?.ok) {
        showNotification(editingActividad ? 'Actividad actualizada' : 'Actividad creada', 'success');
        refetch();
        setOpenActividad(false);
      } else {
        showNotification(result?.error || 'Error al guardar', 'error');
      }
    } catch { showNotification('Error de conexión', 'error'); }
    setSaving(false);
  };

  const handleToggleActividad = (a) => {
    const isActiva = a.estado;
    setConfirmDlg({
      open: true,
      title: isActiva ? 'Desactivar actividad' : 'Restaurar actividad',
      message: isActiva ? `¿Deseas desactivar la actividad "${a.nombreActividad}"?` : `¿Deseas restaurar la actividad "${a.nombreActividad}"?`,
      type: isActiva ? 'error' : 'success',
      onConfirm: async () => {
        setConfirming(true);
        try {
          const res = await editarActividad({ variables: { idActividad: a.idActividad, estado: !isActiva } });
          if (res.data?.editarActividad?.ok) { showNotification(isActiva ? 'Actividad desactivada' : 'Actividad restaurada', isActiva ? 'warning' : 'success'); refetch(); }
          else showNotification(res.data?.editarActividad?.error || 'Error', 'error');
        } catch { showNotification('Error de conexión', 'error'); }
        setConfirming(false);
        setConfirmDlg(p => ({ ...p, open: false }));
      }
    });
  };

  // ── Grupo ──
  const handleOpenGrupo = (g = null) => {
    setEditingGrupo(g);
    setFormGrupo(g ? { descripcion: g.descripcion, estado: g.estado } : INIT_GRUPO);
    setOpenGrupo(true);
  };

  const handleSubmitGrupo = async () => {
    setSaving(true);
    try {
      const res = editingGrupo
        ? await editarGrupo({ variables: { idGrupo: editingGrupo.idGrupo, ...formGrupo } })
        : await crearGrupo({ variables: { descripcion: formGrupo.descripcion } });
      const result = editingGrupo ? res.data?.editarGrupo : res.data?.crearGrupo;
      if (result?.ok) {
        showNotification(editingGrupo ? 'Grupo actualizado' : 'Grupo creado', 'success');
        refetch();
        setOpenGrupo(false);
      } else {
        showNotification(result?.error || 'Error al guardar', 'error');
      }
    } catch { showNotification('Error de conexión', 'error'); }
    setSaving(false);
  };

  const handleToggleGrupo = (g) => {
    const isActiva = g.estado;
    setConfirmDlg({
      open: true,
      title: isActiva ? 'Desactivar grupo' : 'Restaurar grupo',
      message: isActiva ? `¿Deseas desactivar el grupo "${g.descripcion}"?` : `¿Deseas restaurar el grupo "${g.descripcion}"?`,
      type: isActiva ? 'error' : 'success',
      onConfirm: async () => {
        setConfirming(true);
        try {
          const res = await editarGrupo({ variables: { idGrupo: g.idGrupo, estado: !isActiva } });
          if (res.data?.editarGrupo?.ok) { showNotification(isActiva ? 'Grupo desactivado' : 'Grupo restaurado', isActiva ? 'warning' : 'success'); refetch(); }
          else showNotification(res.data?.editarGrupo?.error || 'Error', 'error');
        } catch { showNotification('Error de conexión', 'error'); }
        setConfirming(false);
        setConfirmDlg(p => ({ ...p, open: false }));
      }
    });
  };

  const cronogramaValid = formCronograma.idEvento 
    && (editingCronograma ? formCronograma.idActividad : (Array.isArray(formCronograma.idActividad) && formCronograma.idActividad.length > 0))
    && formCronograma.fechaInicio && formCronograma.fechaFin;
  const actividadValid = formActividad.nombreActividad && formActividad.idGrupo;

  const handleOpenView = (item, type) => {
    setViewItem(item);
    setViewType(type);
    setOpenViewDialog(true);
  };

  const tabActions = [
    <Button key="cron" variant="contained" startIcon={<PlusOutlined />} onClick={() => handleOpenCronograma()}>Nueva Entrada</Button>,
    <Button key="act"  variant="contained" startIcon={<PlusOutlined />} onClick={() => handleOpenActividad()}>Nueva Actividad</Button>,
    <Button key="grp"  variant="contained" startIcon={<PlusOutlined />} onClick={() => handleOpenGrupo()}>Nuevo Grupo</Button>,
  ];

  return (
    <MainCard title="Cronograma y Actividades" secondary={tabActions[tab]}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => { setTab(v); setPage(0); setFilterEvento('Todos'); }}>
          <Tab label="Cronograma" />
          <Tab label="Actividades" />
          <Tab label="Grupos" />
        </Tabs>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>
      ) : error ? (
        <Box sx={{ p: 2 }}><Alert severity="error">Error al cargar datos: {error.message}</Alert></Box>
      ) : (
        <>
          {/* ── Tab 0: Cronograma (agrupado por evento) ── */}
          {tab === 0 && (() => {
            const now = new Date();

            // Estado a mostrar en el chip (3 variantes)
            const getStatusInfo = (c) => {
              const inicio = new Date(c.fechaInicio);
              const fin    = new Date(c.fechaFin);
              if (!c.estado) return { label: 'Inactivo', color: 'error' };
              if (now < inicio) return { label: 'Muy pronto', color: 'info' };
              return { label: 'Activo', color: 'success' };
            };

            // Filtro por evento
            const cronogramasFiltrados = cronogramas.filter(c => {
               if (filterEvento === 'Todos') return true;
               return c.evento?.idEvento === filterEvento;
            });

            // Agrupar por evento
            const gruposMap = cronogramasFiltrados.reduce((acc, c) => {
              const key = c.evento?.idEvento || 'sin-evento';
              if (!acc[key]) acc[key] = { evento: c.evento, items: [] };
              acc[key].items.push(c);
              return acc;
            }, {});

            // Ordenar grupos: eventos más recientes (mayor idEvento) primero
            const eventGroups = Object.values(gruposMap).sort((a, b) => {
              const idA = parseInt(a.evento?.idEvento || 0);
              const idB = parseInt(b.evento?.idEvento || 0);
              return idB - idA;
            });

            // Ordenar ítems dentro de cada grupo por idCronograma ascendente (orden original)
            eventGroups.forEach(g => {
              g.items.sort((a, b) => parseInt(a.idCronograma) - parseInt(b.idCronograma));
            });

            return (
              <Box>
                {/* ── Barra de Filtros ── */}
                <Box sx={{
                  mb: 3, p: 2,
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider'
                }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Evento</InputLabel>
                        <Select
                          value={filterEvento}
                          label="Evento"
                          onChange={(e) => setFilterEvento(e.target.value)}
                          sx={{ bgcolor: 'background.paper' }}
                          startAdornment={<FilterOutlined style={{ color: '#bfbfbf', marginRight: 8 }} />}
                        >
                          <MenuItem value="Todos">Todos los Eventos</MenuItem>
                          {eventos.map(ev => <MenuItem key={ev.idEvento} value={ev.idEvento}>{ev.nombre} (v{ev.version} - {ev.gestion})</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={1} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Tooltip title="Limpiar Filtros">
                        <IconButton 
                          onClick={() => setFilterEvento('Todos')} 
                          color="secondary" 
                          sx={{ 
                            border: '1px solid', 
                            borderColor: 'divider', 
                            borderRadius: '8px',
                            visibility: filterEvento !== 'Todos' ? 'visible' : 'hidden'
                          }}
                        >
                          <ClearOutlined />
                        </IconButton>
                      </Tooltip>
                    </Grid>
                  </Grid>
                </Box>

                {eventGroups.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                    No hay entradas en el cronograma.
                  </Box>
                )}

                {eventGroups.map((grupo) => {
                  const key = grupo.evento?.idEvento || 'sin-evento';
                  const isOpen = expandedGroups.has(key);
                  return (
                    <Box key={key} sx={{ mb: 2 }}>
                      {/* ── Cabecera colapsable del evento ── */}
                      <Box sx={{
                        px: 2, py: 1.25, borderRadius: isOpen ? '8px 8px 0 0' : 1.5,
                        background: 'linear-gradient(135deg, rgba(24,144,255,0.08), rgba(24,144,255,0.02))',
                        border: '1px solid rgba(24,144,255,0.25)',
                        display: 'flex', alignItems: 'center', gap: 1.5,
                        cursor: 'default',
                      }}>
                        <ScheduleOutlined style={{ color: '#1890ff', fontSize: 17 }} />
                        <Typography variant="subtitle2" fontWeight={700} color="primary.main" sx={{ flex: 1 }}>
                          {grupo.evento
                            ? `${grupo.evento.nombre} v${grupo.evento.version} (${grupo.evento.gestion})`
                            : 'Sin evento asignado'}
                        </Typography>
                        {/* Chip-botón que colapsa/expande la tabla */}
                        <Chip
                          label={
                            isOpen
                              ? `▲ ${grupo.items.length} ${grupo.items.length === 1 ? 'actividad' : 'actividades'}`
                              : `▼ ${grupo.items.length} ${grupo.items.length === 1 ? 'actividad' : 'actividades'}`
                          }
                          size="small" color="primary"
                          variant={isOpen ? 'filled' : 'outlined'}
                          onClick={() => toggleGroup(key)}
                          sx={{ cursor: 'pointer', fontWeight: 600, userSelect: 'none' }}
                        />
                      </Box>

                      {/* ── Tabla colapsable ── */}
                      {isOpen && (
                        <TableContainer component={Paper} elevation={0}
                          sx={{ border: '1px solid rgba(24,144,255,0.25)', borderTop: 'none', borderRadius: '0 0 8px 8px' }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell width={50}>ID</TableCell>
                                <TableCell>Actividad</TableCell>
                                <TableCell>Grupo</TableCell>
                                <TableCell>Fecha Inicio</TableCell>
                                <TableCell>Fecha Fin</TableCell>
                                <TableCell>Estado</TableCell>
                                <TableCell align="right">Acciones</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {grupo.items.map(c => {
                                const status = getStatusInfo(c);
                                return (
                                  <TableRow key={c.idCronograma} hover>
                                    <TableCell>{c.idCronograma}</TableCell>
                                    <TableCell>{c.actividad?.nombreActividad || '-'}</TableCell>
                                    <TableCell>{c.actividad?.grupo?.descripcion || '-'}</TableCell>
                                    <TableCell>{formatDate(c.fechaInicio)}</TableCell>
                                    <TableCell>{formatDate(c.fechaFin)}</TableCell>
                                    <TableCell>
                                      <Chip label={status.label} color={status.color} size="small" variant="outlined" />
                                    </TableCell>
                                    <TableCell align="right">
                                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                                        <Tooltip title="Ver">
                                          <IconButton size="small" color="info" onClick={() => handleOpenView(c, 'Entrada de Cronograma')}>
                                            <EyeOutlined />
                                          </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Editar">
                                          <IconButton size="small" color="primary" onClick={() => handleOpenCronograma(c)}>
                                            <EditOutlined />
                                          </IconButton>
                                        </Tooltip>
                                        <Tooltip title={c.estado ? 'Desactivar' : 'Restaurar'}>
                                          <IconButton size="small" color={c.estado ? 'error' : 'success'} onClick={() => handleToggleCronograma(c)}>
                                            {c.estado ? <StopOutlined /> : <RedoOutlined />}
                                          </IconButton>
                                        </Tooltip>
                                      </Box>
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
            );
          })()}

          {/* ── Tab 1: Actividades ── */}
          {tab === 1 && (
            <>
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Actividad</TableCell>
                      <TableCell>Grupo</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {actividades.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(a => (
                      <TableRow key={a.idActividad}>
                        <TableCell>{a.idActividad}</TableCell>
                        <TableCell>{a.nombreActividad}</TableCell>
                        <TableCell>{a.grupo?.descripcion || '-'}</TableCell>
                        <TableCell>
                          <Chip label={a.estado ? 'Activo' : 'Inactivo'} color={a.estado ? 'success' : 'error'} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                            <Tooltip title="Ver"><IconButton size="small" color="info" onClick={() => handleOpenView(a, 'Actividad')}><EyeOutlined /></IconButton></Tooltip>
                            <Tooltip title="Editar"><IconButton size="small" color="primary" onClick={() => handleOpenActividad(a)}><EditOutlined /></IconButton></Tooltip>
                            <Tooltip title={a.estado ? "Desactivar" : "Restaurar"}>
                              <IconButton size="small" color={a.estado ? "error" : "success"} onClick={() => handleToggleActividad(a)}>
                                {a.estado ? <StopOutlined /> : <RedoOutlined />}
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                    {actividades.length === 0 && (
                      <TableRow><TableCell colSpan={5} align="center">No hay actividades registradas.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination count={actividades.length} page={page} setPage={setPage} rowsPerPage={rowsPerPage} setRowsPerPage={setRowsPerPage} />
            </>
          )}

          {/* ── Tab 2: Grupos ── */}
          {tab === 2 && (
            <>
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Descripción</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {grupos.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(g => (
                      <TableRow key={g.idGrupo}>
                        <TableCell>{g.idGrupo}</TableCell>
                        <TableCell>{g.descripcion}</TableCell>
                        <TableCell>
                          <Chip label={g.estado ? 'Activo' : 'Inactivo'} color={g.estado ? 'success' : 'error'} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                            <Tooltip title="Ver"><IconButton size="small" color="info" onClick={() => handleOpenView(g, 'Grupo')}><EyeOutlined /></IconButton></Tooltip>
                            <Tooltip title="Editar"><IconButton size="small" color="primary" onClick={() => handleOpenGrupo(g)}><EditOutlined /></IconButton></Tooltip>
                            <Tooltip title={g.estado ? "Desactivar" : "Restaurar"}>
                              <IconButton size="small" color={g.estado ? "error" : "success"} onClick={() => handleToggleGrupo(g)}>
                                {g.estado ? <StopOutlined /> : <RedoOutlined />}
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                    {grupos.length === 0 && (
                      <TableRow><TableCell colSpan={4} align="center">No hay grupos registrados.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination count={grupos.length} page={page} setPage={setPage} rowsPerPage={rowsPerPage} setRowsPerPage={setRowsPerPage} />
            </>
          )}
        </>
      )}

      {/* ── Dialog: Cronograma ── */}
      <Dialog open={openCronograma} onClose={() => setOpenCronograma(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingCronograma ? 'Editar Entrada de Cronograma' : 'Nueva Entrada de Cronograma'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel>Evento</InputLabel>
              <Select value={formCronograma.idEvento} label="Evento"
                onChange={e => setFormCronograma(p => ({ ...p, idEvento: e.target.value, idActividad: editingCronograma ? '' : [] }))}>
                {eventos.filter(ev => ev.estado).map(ev => (
                  <MenuItem key={ev.idEvento} value={ev.idEvento}>
                    {ev.nombre} v{ev.version} ({ev.gestion})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {/* Actividades: excluir las ya asignadas al evento seleccionado (solo al crear) */}
            {(() => {
              const yaAsignadas = new Set(
                cronogramas
                  .filter(c => c.evento?.idEvento === formCronograma.idEvento)
                  .map(c => c.actividad?.idActividad)
                  .filter(Boolean)
              );

              const disponibles = actividades.filter(a => {
                if (!a.estado) return false;
                if (editingCronograma) return true; // al editar, mostrar todas
                if (!formCronograma.idEvento) return true; // sin evento seleccionado, mostrar todas
                return !yaAsignadas.has(a.idActividad);
              });

              return (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {formCronograma.idEvento && !editingCronograma && disponibles.length > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: -0.5 }}>
                      <Button
                        size="small"
                        onClick={() => {
                          const allIds = disponibles.map(a => a.idActividad);
                          const isAllSelected = formCronograma.idActividad.length === allIds.length;
                          setFormCronograma(p => ({
                            ...p,
                            idActividad: isAllSelected ? [] : allIds
                          }));
                        }}
                        sx={{ fontSize: '0.75rem', fontWeight: 600, py: 0 }}
                      >
                        {formCronograma.idActividad.length === disponibles.length
                          ? 'Deseleccionar todas'
                          : 'Seleccionar todas las disponibles'}
                      </Button>
                    </Box>
                  )}
                  <FormControl fullWidth required>
                    <InputLabel>Actividad</InputLabel>
                    {editingCronograma ? (
                      <Select
                        value={formCronograma.idActividad}
                        label="Actividad"
                        onChange={e => setFormCronograma(p => ({ ...p, idActividad: e.target.value }))}
                      >
                        {disponibles.map(a => (
                          <MenuItem key={a.idActividad} value={a.idActividad}>
                            {a.nombreActividad} ({a.grupo?.descripcion})
                          </MenuItem>
                        ))}
                      </Select>
                    ) : (
                      <Select
                        multiple
                        value={formCronograma.idActividad}
                        label="Actividad"
                        disabled={!formCronograma.idEvento}
                        onChange={e => {
                          const val = e.target.value;
                          setFormCronograma(p => ({ ...p, idActividad: typeof val === 'string' ? val.split(',') : val }));
                        }}
                        renderValue={selected => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map(value => {
                              const act = disponibles.find(a => a.idActividad === value);
                              return <Chip key={value} label={act?.nombreActividad || value} size="small" />;
                            })}
                          </Box>
                        )}
                      >
                        {!formCronograma.idEvento && (
                          <MenuItem disabled value="">
                            <em>Primero selecciona un evento</em>
                          </MenuItem>
                        )}
                        {formCronograma.idEvento && disponibles.length === 0 && (
                          <MenuItem disabled value="">
                            <em>Todas las actividades ya están asignadas a este evento</em>
                          </MenuItem>
                        )}
                        {disponibles.map(a => (
                          <MenuItem key={a.idActividad} value={a.idActividad}>
                            <Checkbox checked={formCronograma.idActividad.includes(a.idActividad)} />
                            <ListItemText primary={`${a.nombreActividad} (${a.grupo?.descripcion})`} />
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  </FormControl>
                </Box>
              );
            })()}
            <TextField
              label="Fecha de Inicio" type="datetime-local" fullWidth required
              value={formCronograma.fechaInicio}
              onChange={e => setFormCronograma(p => ({ ...p, fechaInicio: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Fecha de Fin" type="datetime-local" fullWidth required
              value={formCronograma.fechaFin}
              onChange={e => setFormCronograma(p => ({ ...p, fechaFin: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
            {editingCronograma && (
              <FormControlLabel
                control={<Switch checked={formCronograma.estado} onChange={e => setFormCronograma(p => ({ ...p, estado: e.target.checked }))} />}
                label={formCronograma.estado ? 'Activo' : 'Inactivo'}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCronograma(false)} color="secondary">Cancelar</Button>
          <Button onClick={handleSubmitCronograma} variant="contained" disabled={!cronogramaValid || saving}>
            {saving ? <CircularProgress size={24} color="inherit" /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog: Actividad ── */}
      <Dialog open={openActividad} onClose={() => setOpenActividad(false)} fullWidth maxWidth="xs">
        <DialogTitle>{editingActividad ? 'Editar Actividad' : 'Nueva Actividad'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Nombre de Actividad" value={formActividad.nombreActividad} fullWidth required
              onChange={e => setFormActividad(p => ({ ...p, nombreActividad: e.target.value }))}
            />
            <FormControl fullWidth required>
              <InputLabel>Grupo</InputLabel>
              <Select value={formActividad.idGrupo} label="Grupo"
                onChange={e => setFormActividad(p => ({ ...p, idGrupo: e.target.value }))}>
                {grupos.filter(g => g.estado).map(g => (
                  <MenuItem key={g.idGrupo} value={g.idGrupo}>{g.descripcion}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {editingActividad && (
              <FormControlLabel
                control={<Switch checked={formActividad.estado} onChange={e => setFormActividad(p => ({ ...p, estado: e.target.checked }))} />}
                label={formActividad.estado ? 'Activo' : 'Inactivo'}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenActividad(false)} color="secondary">Cancelar</Button>
          <Button onClick={handleSubmitActividad} variant="contained" disabled={!actividadValid || saving}>
            {saving ? <CircularProgress size={24} color="inherit" /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog: Grupo ── */}
      <Dialog open={openGrupo} onClose={() => setOpenGrupo(false)} fullWidth maxWidth="xs">
        <DialogTitle>{editingGrupo ? 'Editar Grupo' : 'Nuevo Grupo'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Descripción" value={formGrupo.descripcion} fullWidth required
              onChange={e => setFormGrupo(p => ({ ...p, descripcion: e.target.value }))}
            />
            {editingGrupo && (
              <FormControlLabel
                control={<Switch checked={formGrupo.estado} onChange={e => setFormGrupo(p => ({ ...p, estado: e.target.checked }))} />}
                label={formGrupo.estado ? 'Activo' : 'Inactivo'}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenGrupo(false)} color="secondary">Cancelar</Button>
          <Button onClick={handleSubmitGrupo} variant="contained" disabled={!formGrupo.descripcion || saving}>
            {saving ? <CircularProgress size={24} color="inherit" /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog: View Details (Dynamic Premium Design) ── */}
      <Dialog 
        open={openViewDialog} 
        onClose={() => setOpenViewDialog(false)} 
        fullWidth 
        maxWidth="sm"
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3, pb: 2 }}>
          <Avatar sx={{ bgcolor: 'secondary.main', color: 'secondary.contrastText', width: 48, height: 48 }}>
            <ScheduleOutlined style={{ fontSize: 24 }} />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {viewType === 'Entrada de Cronograma' ? 'Programación' : (viewItem?.nombreActividad || viewItem?.descripcion || 'Detalles')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {viewType} • ID: {viewItem?.idCronograma || viewItem?.idActividad || viewItem?.idGrupo}
            </Typography>
          </Box>
          {viewItem?.estado !== undefined && (
            <Chip 
              label={viewItem.estado ? 'ACTIVO' : 'INACTIVO'} 
              color={viewItem.estado ? 'success' : 'error'}
              variant="outlined"
            />
          )}
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3, bgcolor: 'background.default' }}>
          {viewItem && viewType === 'Entrada de Cronograma' && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'action.hover', color: 'info.main' }}><TrophyOutlined /></Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>Evento Asociado</Typography>
                    <Typography variant="subtitle1" color="text.primary" sx={{ mt: 0.5, fontWeight: 500 }}>
                      {viewItem.evento ? `${viewItem.evento.nombre} v${viewItem.evento.version} (${viewItem.evento.gestion})` : 'Sin asignar'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'flex-start', gap: 2, height: '100%' }}>
                  <Avatar sx={{ bgcolor: 'action.hover', color: 'primary.main' }}><PushpinOutlined /></Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>Actividad</Typography>
                    <Typography variant="subtitle1" color="text.primary" sx={{ mt: 0.5, fontWeight: 500 }}>{viewItem.actividad?.nombreActividad || '—'}</Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'flex-start', gap: 2, height: '100%' }}>
                  <Avatar sx={{ bgcolor: 'action.hover', color: 'secondary.main' }}><TeamOutlined /></Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>Grupo / Categoría</Typography>
                    <Typography variant="subtitle1" color="text.primary" sx={{ mt: 0.5, fontWeight: 500 }}>{viewItem.actividad?.grupo?.descripcion || '—'}</Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'action.hover', color: 'success.main' }}><CalendarOutlined /></Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>Fecha Inicio</Typography>
                    <Typography variant="subtitle1" color="text.primary" sx={{ mt: 0.5, fontWeight: 500 }}>{formatDate(viewItem.fechaInicio)}</Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'action.hover', color: 'error.main' }}><ClockCircleOutlined /></Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>Fecha Fin</Typography>
                    <Typography variant="subtitle1" color="text.primary" sx={{ mt: 0.5, fontWeight: 500 }}>{formatDate(viewItem.fechaFin)}</Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          )}

          {viewItem && viewType === 'Actividad' && (
            <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
              <TeamOutlined style={{ fontSize: 32, color: '#1890ff', marginBottom: 16 }} />
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase' }}>Grupo asociado</Typography>
              <Typography variant="h5" color="text.primary">{viewItem.grupo?.descripcion || 'Sin asignar'}</Typography>
            </Box>
          )}
          
          {viewItem && viewType === 'Grupo' && (
             <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
               <Typography variant="body1" color="text.secondary">Este es un grupo base para organizar actividades.</Typography>
             </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, px: 3 }}>
          <Button onClick={() => setOpenViewDialog(false)} color="secondary" variant="outlined">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmDlg.open}
        title={confirmDlg.title}
        message={confirmDlg.message}
        type={confirmDlg.type}
        loading={confirming}
        onConfirm={confirmDlg.onConfirm}
        onClose={() => setConfirmDlg(p => ({ ...p, open: false }))}
      />

      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification(p => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={notification.severity} variant="filled">{notification.message}</Alert>
      </Snackbar>
    </MainCard>
  );
}
