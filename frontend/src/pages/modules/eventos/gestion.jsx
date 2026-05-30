import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
  Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Switch, FormControlLabel,
  Snackbar, Alert, CircularProgress, Tabs, Tab, Chip, Select, MenuItem, FormControl, InputLabel, Typography, Grid, Divider, Avatar, Tooltip
} from '@mui/material';
import { 
  EditOutlined, DeleteOutlined, PlusOutlined, EyeOutlined, 
  CalendarOutlined, AppstoreOutlined, TagsOutlined, FileTextOutlined, InfoCircleOutlined, TrophyOutlined,
  StopOutlined, RedoOutlined, ExclamationCircleOutlined, LeftOutlined, RightOutlined,
  SearchOutlined, FilterOutlined, CloseOutlined
} from '@ant-design/icons';
import MainCard from 'components/MainCard';

const GET_ALL = gql`
  query {
    todosLosEventos {
      idEvento nombre version gestion estado
      tipoEvento { idTipoEvento nombre }
      nivelEvento { idNivelEvento nombre }
      membrete { idMembrete titulo }
    }
    todosLosTiposEventos { idTipoEvento nombre estado }
    todosLosNivelesEventos { idNivelEvento nombre estado }
    todosLosMembretes { idMembrete titulo estado }
  }
`;

const CREATE_TIPO  = gql`mutation($nombre: String!) { crearTipoEvento(nombre: $nombre) { ok error } }`;
const EDIT_TIPO    = gql`mutation($idTipoEvento: ID!, $nombre: String, $estado: Boolean) { editarTipoEvento(idTipoEvento: $idTipoEvento, nombre: $nombre, estado: $estado) { ok error } }`;
const DELETE_TIPO  = gql`mutation($idTipoEvento: ID!) { eliminarTipoEvento(idTipoEvento: $idTipoEvento) { ok error } }`;

const CREATE_NIVEL = gql`mutation($nombre: String!) { crearNivelEvento(nombre: $nombre) { ok error } }`;
const EDIT_NIVEL   = gql`mutation($idNivelEvento: ID!, $nombre: String, $estado: Boolean) { editarNivelEvento(idNivelEvento: $idNivelEvento, nombre: $nombre, estado: $estado) { ok error } }`;
const DELETE_NIVEL = gql`mutation($idNivelEvento: ID!) { eliminarNivelEvento(idNivelEvento: $idNivelEvento) { ok error } }`;

const CREATE_EVENTO = gql`
  mutation($idTipoEvento: ID!, $idNivelEvento: ID!, $idMembrete: ID!, $nombre: String!, $version: Int!, $gestion: Int!) {
    crearEvento(idTipoEvento: $idTipoEvento, idNivelEvento: $idNivelEvento, idMembrete: $idMembrete, nombre: $nombre, version: $version, gestion: $gestion) { ok error }
  }
`;
const EDIT_EVENTO = gql`
  mutation($idEvento: ID!, $idTipoEvento: ID, $idNivelEvento: ID, $idMembrete: ID, $nombre: String, $version: Int, $gestion: Int, $estado: Boolean) {
    editarEvento(idEvento: $idEvento, idTipoEvento: $idTipoEvento, idNivelEvento: $idNivelEvento, idMembrete: $idMembrete, nombre: $nombre, version: $version, gestion: $gestion, estado: $estado) { ok error }
  }
`;
const DELETE_EVENTO = gql`mutation($idEvento: ID!) { eliminarEvento(idEvento: $idEvento) { ok error } }`;

const INIT_EVENTO = { nombre: '', version: 1, gestion: new Date().getFullYear(), idTipoEvento: '', idNivelEvento: '', idMembrete: '', estado: true };
const INIT_TIPO   = { nombre: '', estado: true };
const INIT_NIVEL  = { nombre: '', estado: true };

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
  
  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage);
    }
  };

  // Generar array de páginas
  const pages = Array.from({ length: totalPages }, (_, i) => i);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
      {/* Izquierda: Selector de registros */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" color="text.secondary">Mostrar</Typography>
        <Select 
          size="small" 
          value={rowsPerPage} 
          onChange={e => { setRowsPerPage(e.target.value); setPage(0); }} 
          sx={{ 
            height: 32, 
            borderRadius: 1.5,
            '& .MuiSelect-select': { py: 0.5, fontSize: '0.875rem', px: 1.5 } 
          }}
        >
          {[5, 10, 15].map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
        </Select>
        <Typography variant="body2" color="text.secondary">registros</Typography>
      </Box>

      {/* Derecha: Botones de página numerados */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Flecha Izquierda */}
        <IconButton 
          size="small" 
          disabled={page === 0} 
          onClick={() => handlePageChange(page - 1)}
          sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, width: 32, height: 32 }}
        >
          <LeftOutlined style={{ fontSize: 12 }} />
        </IconButton>

        {/* Números de Página */}
        {pages.map((p) => (
          <Button
            key={p}
            onClick={() => setPage(p)}
            sx={{
              minWidth: 32,
              height: 32,
              p: 0,
              borderRadius: 1.5,
              fontSize: '0.875rem',
              fontWeight: page === p ? 700 : 400,
              bgcolor: page === p ? 'primary.main' : 'transparent',
              color: page === p ? 'white' : 'text.primary',
              border: '1px solid',
              borderColor: page === p ? 'primary.main' : 'divider',
              '&:hover': {
                bgcolor: page === p ? 'primary.dark' : 'action.hover',
                borderColor: page === p ? 'primary.dark' : 'divider',
              }
            }}
          >
            {p + 1}
          </Button>
        ))}

        {/* Flecha Derecha */}
        <IconButton 
          size="small" 
          disabled={page >= totalPages - 1 || count === 0} 
          onClick={() => handlePageChange(page + 1)}
          sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, width: 32, height: 32 }}
        >
          <RightOutlined style={{ fontSize: 12 }} />
        </IconButton>
      </Box>
    </Box>
  );
}

export default function GestionEventosPage() {
  const [tab, setTab] = useState(0);
  const { data, loading, error, refetch } = useQuery(GET_ALL, { fetchPolicy: 'network-only' });

  const [crearEvento]    = useMutation(CREATE_EVENTO);
  const [editarEvento]   = useMutation(EDIT_EVENTO);
  const [eliminarEvento] = useMutation(DELETE_EVENTO);
  const [crearTipo]      = useMutation(CREATE_TIPO);
  const [editarTipo]     = useMutation(EDIT_TIPO);
  const [eliminarTipo]   = useMutation(DELETE_TIPO);
  const [crearNivel]     = useMutation(CREATE_NIVEL);
  const [editarNivel]    = useMutation(EDIT_NIVEL);
  const [eliminarNivel]  = useMutation(DELETE_NIVEL);

  const [openEvento,    setOpenEvento]    = useState(false);
  const [editingEvento, setEditingEvento] = useState(null);
  const [formEvento,    setFormEvento]    = useState(INIT_EVENTO);

  const [openTipo,    setOpenTipo]    = useState(false);
  const [editingTipo, setEditingTipo] = useState(null);
  const [formTipo,    setFormTipo]    = useState(INIT_TIPO);

  const [openNivel,    setOpenNivel]    = useState(false);
  const [editingNivel, setEditingNivel] = useState(null);
  const [formNivel,    setFormNivel]    = useState(INIT_NIVEL);

  // View states
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [viewType, setViewType] = useState('');

  // Paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Filtros (Solo para Eventos)
  const [filterTipo, setFilterTipo] = useState('all');
  const [filterNivel, setFilterNivel] = useState('all');
  const [searchName, setSearchName] = useState('');

  const [confirmDlg, setConfirmDlg] = useState({ open: false, title: '', message: '', onConfirm: null, type: 'error' });
  const [confirming, setConfirming] = useState(false);

  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [saving, setSaving] = useState(false);

  const eventos   = data?.todosLosEventos        || [];
  const tipos     = data?.todosLosTiposEventos   || [];
  const niveles   = data?.todosLosNivelesEventos || [];
  const membretes = data?.todosLosMembretes      || [];

  const showNotification = (message, severity) => setNotification({ open: true, message, severity });

  // ── Evento ──
  const handleOpenEvento = (ev = null) => {
    setEditingEvento(ev);
    setFormEvento(ev ? {
      nombre: ev.nombre,
      version: ev.version,
      gestion: ev.gestion,
      idTipoEvento:  ev.tipoEvento?.idTipoEvento  || '',
      idNivelEvento: ev.nivelEvento?.idNivelEvento || '',
      idMembrete:    ev.membrete?.idMembrete       || '',
      estado: ev.estado,
    } : INIT_EVENTO);
    setOpenEvento(true);
  };

  const handleSubmitEvento = async () => {
    setSaving(true);
    try {
      const base = { ...formEvento, version: parseInt(formEvento.version), gestion: parseInt(formEvento.gestion) };
      const vars = editingEvento ? { idEvento: editingEvento.idEvento, ...base } : base;
      const res = editingEvento
        ? await editarEvento({ variables: vars })
        : await crearEvento({ variables: vars });
      const result = editingEvento ? res.data?.editarEvento : res.data?.crearEvento;
      if (result?.ok) {
        showNotification(editingEvento ? 'Evento actualizado' : 'Evento creado', 'success');
        refetch();
        setOpenEvento(false);
      } else {
        showNotification(result?.error || 'Error al guardar', 'error');
      }
    } catch { showNotification('Error de conexión', 'error'); }
    setSaving(false);
  };

  const handleToggleEvento = (ev) => {
    const isActiva = ev.estado;
    setConfirmDlg({
      open: true,
      title: isActiva ? 'Desactivar evento' : 'Restaurar evento',
      message: isActiva ? `¿Deseas desactivar el evento "${ev.nombre}"?` : `¿Deseas restaurar el evento "${ev.nombre}"?`,
      type: isActiva ? 'error' : 'success',
      onConfirm: async () => {
        setConfirming(true);
        try {
          const res = await editarEvento({ variables: { idEvento: ev.idEvento, estado: !isActiva } });
          if (res.data?.editarEvento?.ok) { showNotification(isActiva ? 'Evento desactivado' : 'Evento restaurado', isActiva ? 'warning' : 'success'); refetch(); }
          else showNotification(res.data?.editarEvento?.error || 'Error', 'error');
        } catch { showNotification('Error de conexión', 'error'); }
        setConfirming(false);
        setConfirmDlg(p => ({ ...p, open: false }));
      }
    });
  };

  // ── Tipo ──
  const handleOpenTipo = (t = null) => {
    setEditingTipo(t);
    setFormTipo(t ? { nombre: t.nombre, estado: t.estado } : INIT_TIPO);
    setOpenTipo(true);
  };

  const handleSubmitTipo = async () => {
    setSaving(true);
    try {
      const res = editingTipo
        ? await editarTipo({ variables: { idTipoEvento: editingTipo.idTipoEvento, ...formTipo } })
        : await crearTipo({ variables: { nombre: formTipo.nombre } });
      const result = editingTipo ? res.data?.editarTipoEvento : res.data?.crearTipoEvento;
      if (result?.ok) {
        showNotification(editingTipo ? 'Tipo actualizado' : 'Tipo creado', 'success');
        refetch();
        setOpenTipo(false);
      } else {
        showNotification(result?.error || 'Error al guardar', 'error');
      }
    } catch { showNotification('Error de conexión', 'error'); }
    setSaving(false);
  };

  const handleToggleTipo = (t) => {
    const isActiva = t.estado;
    setConfirmDlg({
      open: true,
      title: isActiva ? 'Desactivar tipo' : 'Restaurar tipo',
      message: isActiva ? `¿Deseas desactivar el tipo "${t.nombre}"?` : `¿Deseas restaurar el tipo "${t.nombre}"?`,
      type: isActiva ? 'error' : 'success',
      onConfirm: async () => {
        setConfirming(true);
        try {
          const res = await editarTipo({ variables: { idTipoEvento: t.idTipoEvento, estado: !isActiva } });
          if (res.data?.editarTipoEvento?.ok) { showNotification(isActiva ? 'Tipo desactivado' : 'Tipo restaurado', isActiva ? 'warning' : 'success'); refetch(); }
          else showNotification(res.data?.editarTipoEvento?.error || 'Error', 'error');
        } catch { showNotification('Error de conexión', 'error'); }
        setConfirming(false);
        setConfirmDlg(p => ({ ...p, open: false }));
      }
    });
  };

  // ── Nivel ──
  const handleOpenNivel = (n = null) => {
    setEditingNivel(n);
    setFormNivel(n ? { nombre: n.nombre, estado: n.estado } : INIT_NIVEL);
    setOpenNivel(true);
  };

  const handleSubmitNivel = async () => {
    setSaving(true);
    try {
      const res = editingNivel
        ? await editarNivel({ variables: { idNivelEvento: editingNivel.idNivelEvento, ...formNivel } })
        : await crearNivel({ variables: { nombre: formNivel.nombre } });
      const result = editingNivel ? res.data?.editarNivelEvento : res.data?.crearNivelEvento;
      if (result?.ok) {
        showNotification(editingNivel ? 'Nivel actualizado' : 'Nivel creado', 'success');
        refetch();
        setOpenNivel(false);
      } else {
        showNotification(result?.error || 'Error al guardar', 'error');
      }
    } catch { showNotification('Error de conexión', 'error'); }
    setSaving(false);
  };

  const handleToggleNivel = (n) => {
    const isActiva = n.estado;
    setConfirmDlg({
      open: true,
      title: isActiva ? 'Desactivar nivel' : 'Restaurar nivel',
      message: isActiva ? `¿Deseas desactivar el nivel "${n.nombre}"?` : `¿Deseas restaurar el nivel "${n.nombre}"?`,
      type: isActiva ? 'error' : 'success',
      onConfirm: async () => {
        setConfirming(true);
        try {
          const res = await editarNivel({ variables: { idNivelEvento: n.idNivelEvento, estado: !isActiva } });
          if (res.data?.editarNivelEvento?.ok) { showNotification(isActiva ? 'Nivel desactivado' : 'Nivel restaurado', isActiva ? 'warning' : 'success'); refetch(); }
          else showNotification(res.data?.editarNivelEvento?.error || 'Error', 'error');
        } catch { showNotification('Error de conexión', 'error'); }
        setConfirming(false);
        setConfirmDlg(p => ({ ...p, open: false }));
      }
    });
  };

  const eventoFormValid = formEvento.nombre && formEvento.version && formEvento.gestion
    && formEvento.idTipoEvento && formEvento.idNivelEvento && formEvento.idMembrete;

  const handleOpenView = (item, type) => {
    setViewItem(item);
    setViewType(type);
    setOpenViewDialog(true);
  };

  const tabActions = [
    <Button key="ev"  variant="contained" startIcon={<PlusOutlined />} onClick={() => handleOpenEvento()}>Nuevo Evento</Button>,
    <Button key="tip" variant="contained" startIcon={<PlusOutlined />} onClick={() => handleOpenTipo()}>Nuevo Tipo</Button>,
    <Button key="niv" variant="contained" startIcon={<PlusOutlined />} onClick={() => handleOpenNivel()}>Nuevo Nivel</Button>,
  ];

  const eventosFiltrados = eventos.filter(ev => {
    const matchTipo  = filterTipo  === 'all' || ev.tipoEvento?.idTipoEvento === filterTipo;
    const matchNivel = filterNivel === 'all' || ev.nivelEvento?.idNivelEvento === filterNivel;
    const matchName  = ev.nombre.toLowerCase().includes(searchName.toLowerCase());
    return matchTipo && matchNivel && matchName;
  });

  return (
    <MainCard title="Gestión de Eventos" secondary={tabActions[tab]}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => { setTab(v); setPage(0); }}>
          <Tab label="Eventos" />
          <Tab label="Tipos de Evento" />
          <Tab label="Niveles de Evento" />
        </Tabs>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>
      ) : error ? (
        <Box sx={{ p: 2 }}><Alert severity="error">Error al cargar datos: {error.message}</Alert></Box>
      ) : (
        <>
          {/* ── Tab 0: Eventos ── */}
          {tab === 0 && (
            <>
              {/* Sección de Filtros Optimizada */}
              <Box sx={{
                mb: 3, p: 2,
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider'
              }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Buscar por nombre de evento..."
                      value={searchName}
                      onChange={(e) => { setSearchName(e.target.value); setPage(0); }}
                      InputProps={{
                        startAdornment: <SearchOutlined style={{ color: '#bfbfbf', marginRight: 8 }} />
                      }}
                      sx={{ bgcolor: 'background.paper' }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Tipo de Evento</InputLabel>
                      <Select
                        value={filterTipo}
                        label="Tipo de Evento"
                        onChange={(e) => { setFilterTipo(e.target.value); setPage(0); }}
                        sx={{ bgcolor: 'background.paper' }}
                        startAdornment={<FilterOutlined style={{ color: '#bfbfbf', marginRight: 8 }} />}
                      >
                        <MenuItem value="all">Todos los Tipos</MenuItem>
                        {tipos.map(t => <MenuItem key={t.idTipoEvento} value={t.idTipoEvento}>{t.nombre}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Nivel de Evento</InputLabel>
                      <Select
                        value={filterNivel}
                        label="Nivel de Evento"
                        onChange={(e) => { setFilterNivel(e.target.value); setPage(0); }}
                        sx={{ bgcolor: 'background.paper' }}
                        startAdornment={<FilterOutlined style={{ color: '#bfbfbf', marginRight: 8 }} />}
                      >
                        <MenuItem value="all">Todos los Niveles</MenuItem>
                        {niveles.map(n => <MenuItem key={n.idNivelEvento} value={n.idNivelEvento}>{n.nombre}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    {(filterTipo !== 'all' || filterNivel !== 'all' || searchName !== '') && (
                      <Button 
                        fullWidth
                        size="medium" 
                        variant="outlined" 
                        color="error"
                        startIcon={<CloseOutlined />}
                        onClick={() => { setFilterTipo('all'); setFilterNivel('all'); setSearchName(''); setPage(0); }}
                        sx={{ borderRadius: 1.5 }}
                      >
                        Limpiar
                      </Button>
                    )}
                  </Grid>
                </Grid>
              </Box>

              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Nombre</TableCell>
                      <TableCell>Versión</TableCell>
                      <TableCell>Gestión</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Nivel</TableCell>
                      <TableCell>Membrete</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {eventosFiltrados.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(ev => (
                      <TableRow key={ev.idEvento}>
                        <TableCell>{ev.idEvento}</TableCell>
                        <TableCell>{ev.nombre}</TableCell>
                        <TableCell>{ev.version}</TableCell>
                        <TableCell>{ev.gestion}</TableCell>
                        <TableCell>{ev.tipoEvento?.nombre}</TableCell>
                        <TableCell>{ev.nivelEvento?.nombre}</TableCell>
                        <TableCell>{ev.membrete?.titulo}</TableCell>
                        <TableCell>
                          <Chip label={ev.estado ? 'Activo' : 'Inactivo'} color={ev.estado ? 'success' : 'error'} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                            <Tooltip title="Ver"><IconButton size="small" color="info" onClick={() => handleOpenView(ev, 'Evento')}><EyeOutlined /></IconButton></Tooltip>
                            <Tooltip title="Editar"><IconButton size="small" color="primary" onClick={() => handleOpenEvento(ev)}><EditOutlined /></IconButton></Tooltip>
                            <Tooltip title={ev.estado ? "Desactivar" : "Restaurar"}>
                              <IconButton size="small" color={ev.estado ? "error" : "success"} onClick={() => handleToggleEvento(ev)}>
                                {ev.estado ? <StopOutlined /> : <RedoOutlined />}
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                    {eventos.length === 0 && (
                      <TableRow><TableCell colSpan={9} align="center">No hay eventos registrados.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination count={eventosFiltrados.length} page={page} setPage={setPage} rowsPerPage={rowsPerPage} setRowsPerPage={setRowsPerPage} />
            </>
          )}

          {/* ── Tab 1: Tipos de Evento ── */}
          {tab === 1 && (
            <>
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Nombre</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tipos.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(t => (
                      <TableRow key={t.idTipoEvento}>
                        <TableCell>{t.idTipoEvento}</TableCell>
                        <TableCell>{t.nombre}</TableCell>
                        <TableCell>
                          <Chip label={t.estado ? 'Activo' : 'Inactivo'} color={t.estado ? 'success' : 'error'} size="small" variant="outlined" />
                        </TableCell>
                         <TableCell align="right">
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                            <Tooltip title="Ver"><IconButton size="small" color="info" onClick={() => handleOpenView(t, 'Tipo de Evento')}><EyeOutlined /></IconButton></Tooltip>
                            <Tooltip title="Editar"><IconButton size="small" color="primary" onClick={() => handleOpenTipo(t)}><EditOutlined /></IconButton></Tooltip>
                            <Tooltip title={t.estado ? "Desactivar" : "Restaurar"}>
                              <IconButton size="small" color={t.estado ? "error" : "success"} onClick={() => handleToggleTipo(t)}>
                                {t.estado ? <StopOutlined /> : <RedoOutlined />}
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                    {tipos.length === 0 && (
                      <TableRow><TableCell colSpan={4} align="center">No hay tipos registrados.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination count={tipos.length} page={page} setPage={setPage} rowsPerPage={rowsPerPage} setRowsPerPage={setRowsPerPage} />
            </>
          )}

          {/* ── Tab 2: Niveles de Evento ── */}
          {tab === 2 && (
            <>
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Nombre</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {niveles.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(n => (
                      <TableRow key={n.idNivelEvento}>
                        <TableCell>{n.idNivelEvento}</TableCell>
                        <TableCell>{n.nombre}</TableCell>
                        <TableCell>
                          <Chip label={n.estado ? 'Activo' : 'Inactivo'} color={n.estado ? 'success' : 'error'} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                            <Tooltip title="Ver"><IconButton size="small" color="info" onClick={() => handleOpenView(n, 'Nivel de Evento')}><EyeOutlined /></IconButton></Tooltip>
                            <Tooltip title="Editar"><IconButton size="small" color="primary" onClick={() => handleOpenNivel(n)}><EditOutlined /></IconButton></Tooltip>
                            <Tooltip title={n.estado ? "Desactivar" : "Restaurar"}>
                              <IconButton size="small" color={n.estado ? "error" : "success"} onClick={() => handleToggleNivel(n)}>
                                {n.estado ? <StopOutlined /> : <RedoOutlined />}
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                    {niveles.length === 0 && (
                      <TableRow><TableCell colSpan={4} align="center">No hay niveles registrados.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination count={niveles.length} page={page} setPage={setPage} rowsPerPage={rowsPerPage} setRowsPerPage={setRowsPerPage} />
            </>
          )}
        </>
      )}

      {/* ── Dialog: Evento ── */}
      <Dialog open={openEvento} onClose={() => setOpenEvento(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingEvento ? 'Editar Evento' : 'Nuevo Evento'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Nombre" value={formEvento.nombre} fullWidth required
              onChange={e => setFormEvento(p => ({ ...p, nombre: e.target.value }))}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Versión" type="number" value={formEvento.version} fullWidth required
                inputProps={{ min: 1 }}
                onChange={e => setFormEvento(p => ({ ...p, version: e.target.value }))}
              />
              <TextField
                label="Gestión (año)" type="number" value={formEvento.gestion} fullWidth required
                inputProps={{ min: 2000, max: 2100 }}
                onChange={e => setFormEvento(p => ({ ...p, gestion: e.target.value }))}
              />
            </Box>
            <FormControl fullWidth required>
              <InputLabel>Tipo de Evento</InputLabel>
              <Select value={formEvento.idTipoEvento} label="Tipo de Evento"
                onChange={e => setFormEvento(p => ({ ...p, idTipoEvento: e.target.value }))}>
                {tipos.filter(t => t.estado).map(t => (
                  <MenuItem key={t.idTipoEvento} value={t.idTipoEvento}>{t.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel>Nivel de Evento</InputLabel>
              <Select value={formEvento.idNivelEvento} label="Nivel de Evento"
                onChange={e => setFormEvento(p => ({ ...p, idNivelEvento: e.target.value }))}>
                {niveles.filter(n => n.estado).map(n => (
                  <MenuItem key={n.idNivelEvento} value={n.idNivelEvento}>{n.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel>Membrete</InputLabel>
              <Select value={formEvento.idMembrete} label="Membrete"
                onChange={e => setFormEvento(p => ({ ...p, idMembrete: e.target.value }))}>
                {membretes.filter(m => m.estado).map(m => (
                  <MenuItem key={m.idMembrete} value={m.idMembrete}>{m.titulo}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {editingEvento && (
              <FormControlLabel
                control={<Switch checked={formEvento.estado} onChange={e => setFormEvento(p => ({ ...p, estado: e.target.checked }))} />}
                label={formEvento.estado ? 'Activo' : 'Inactivo'}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEvento(false)} color="secondary">Cancelar</Button>
          <Button onClick={handleSubmitEvento} variant="contained" disabled={!eventoFormValid || saving}>
            {saving ? <CircularProgress size={24} color="inherit" /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog: Tipo de Evento ── */}
      <Dialog open={openTipo} onClose={() => setOpenTipo(false)} fullWidth maxWidth="xs">
        <DialogTitle>{editingTipo ? 'Editar Tipo de Evento' : 'Nuevo Tipo de Evento'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Nombre" value={formTipo.nombre} fullWidth required
              onChange={e => setFormTipo(p => ({ ...p, nombre: e.target.value }))}
            />
            {editingTipo && (
              <FormControlLabel
                control={<Switch checked={formTipo.estado} onChange={e => setFormTipo(p => ({ ...p, estado: e.target.checked }))} />}
                label={formTipo.estado ? 'Activo' : 'Inactivo'}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTipo(false)} color="secondary">Cancelar</Button>
          <Button onClick={handleSubmitTipo} variant="contained" disabled={!formTipo.nombre || saving}>
            {saving ? <CircularProgress size={24} color="inherit" /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog: Nivel de Evento ── */}
      <Dialog open={openNivel} onClose={() => setOpenNivel(false)} fullWidth maxWidth="xs">
        <DialogTitle>{editingNivel ? 'Editar Nivel de Evento' : 'Nuevo Nivel de Evento'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Nombre" value={formNivel.nombre} fullWidth required
              onChange={e => setFormNivel(p => ({ ...p, nombre: e.target.value }))}
            />
            {editingNivel && (
              <FormControlLabel
                control={<Switch checked={formNivel.estado} onChange={e => setFormNivel(p => ({ ...p, estado: e.target.checked }))} />}
                label={formNivel.estado ? 'Activo' : 'Inactivo'}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNivel(false)} color="secondary">Cancelar</Button>
          <Button onClick={handleSubmitNivel} variant="contained" disabled={!formNivel.nombre || saving}>
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
          <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', width: 48, height: 48 }}>
            <TrophyOutlined style={{ fontSize: 24 }} />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {viewItem?.nombre || 'Detalles'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {viewType} • ID: {viewItem?.idEvento || viewItem?.idTipoEvento || viewItem?.idNivelEvento}
            </Typography>
          </Box>
          {viewItem?.estado !== undefined && (
            <Chip 
              label={viewItem.estado ? 'ACTIVO' : 'INACTIVO'} 
              color={viewItem.estado ? 'success' : 'error'} variant="outlined"
              variant="outlined"
            />
          )}
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3, bgcolor: 'background.default' }}>
          {viewItem && viewType === 'Evento' && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'action.hover', color: 'primary.main' }}><InfoCircleOutlined /></Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>Versión</Typography>
                    <Typography variant="subtitle1" color="text.primary" sx={{ mt: 0.5, fontWeight: 500 }}>{viewItem.version}</Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'action.hover', color: 'secondary.main' }}><CalendarOutlined /></Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>Gestión</Typography>
                    <Typography variant="subtitle1" color="text.primary" sx={{ mt: 0.5, fontWeight: 500 }}>{viewItem.gestion}</Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'flex-start', gap: 2, height: '100%' }}>
                  <Avatar sx={{ bgcolor: 'action.hover', color: 'warning.main' }}><TagsOutlined /></Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>Tipo de Evento</Typography>
                    <Typography variant="subtitle1" color="text.primary" sx={{ mt: 0.5, fontWeight: 500 }}>{viewItem.tipoEvento?.nombre}</Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'flex-start', gap: 2, height: '100%' }}>
                  <Avatar sx={{ bgcolor: 'action.hover', color: 'success.main' }}><AppstoreOutlined /></Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>Nivel de Evento</Typography>
                    <Typography variant="subtitle1" color="text.primary" sx={{ mt: 0.5, fontWeight: 500 }}>{viewItem.nivelEvento?.nombre}</Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'action.hover', color: 'info.main' }}><FileTextOutlined /></Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>Membrete Asignado</Typography>
                    <Typography variant="subtitle1" color="text.primary" sx={{ mt: 0.5, fontWeight: 500 }}>{viewItem.membrete?.titulo || 'Ninguno'}</Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          )}

          {viewItem && (viewType === 'Tipo de Evento' || viewType === 'Nivel de Evento') && (
            <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase' }}>Nombre registrado</Typography>
              <Typography variant="h5" color="text.primary">{viewItem.nombre}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, px: 3 }}>
          <Button onClick={() => setOpenViewDialog(false)} color="primary" variant="outlined">
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
