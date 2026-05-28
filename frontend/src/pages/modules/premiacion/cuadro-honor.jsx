import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
  Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Snackbar, Alert, CircularProgress, Chip, Typography, Stack, Divider,
  FormControl, InputLabel, Select, MenuItem, Tooltip, Tabs, Tab, Grid, Card, CardContent
} from '@mui/material';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, TrophyOutlined,
  TagOutlined, GoldOutlined, TeamOutlined, CheckCircleOutlined, CloseCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import MainCard from 'components/MainCard';

// Diálogo de confirmación reutilizable (reemplaza window.confirm)
function ConfirmDialog({ open, title, message, confirmLabel = 'Confirmar', confirmColor = 'error', onConfirm, onCancel }) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" gap={1}>
          <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: 20 }} />
          {title}
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ pt: 1 }}>{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="secondary">Cancelar</Button>
        <Button variant="contained" color={confirmColor} onClick={onConfirm}>{confirmLabel}</Button>
      </DialogActions>
    </Dialog>
  );
}

// ── GQL ──────────────────────────────────────────────────────────────────────
const GET_DATA = gql`
  query {
    todosSLosTiposDescriptores: todosLosTiposDescriptores { idTipoDescriptor nombre estado }
    todosLosDescriptores { idDescriptor descripcion estado tipoDescriptor { idTipoDescriptor nombre } }
    todosLosPremios {
      idPremio monto numeroGanadores estado
      evento { idEvento nombre }
      area { idArea nombre }
      premioDescriptores { id descriptor { idDescriptor descripcion tipoDescriptor { nombre } } }
      candidatos { idCandidatoPremio estado activo }
    }
    todosLosCandidatosPremios {
      idCandidatoPremio nota observacion estado activo
      premio { idPremio monto evento { nombre } area { nombre }
        premioDescriptores { descriptor { descripcion } }
      }
      proyecto { idProyecto titulo }
      actaEvaluacion { idActaEvaluacion notaFinal }
      ganador { idGanadorPremio estado }
    }
    todosLosGanadoresPremios {
      idGanadorPremio estado
      candidatoPremio {
        idCandidatoPremio nota
        proyecto { idProyecto titulo }
        premio { idPremio monto evento { nombre } area { nombre }
          premioDescriptores { descriptor { descripcion } }
        }
      }
    }
    todasLasActas {
      idActaEvaluacion notaFinal fecha
      proyecto { idProyecto titulo estado }
    }
    todosLosEventos { idEvento nombre estado }
    todasLasAreas { idArea nombre estado }
    todosLosCronogramas {
      idCronograma fechaFin estado
      actividad { nombreActividad }
      evento { idEvento nombre }
    }
  }
`;

const CERRAR_ACTA_RESULTADOS = gql`
  mutation($idEvento: ID!, $idPremio: ID!) {
    cerrarActaResultados(idEvento: $idEvento, idPremio: $idPremio) {
      ok error
      candidatos { idCandidatoPremio nota estado proyecto { titulo } }
    }
  }
`;

// TipoDescriptor mutations
const CREAR_TIPO = gql`mutation($nombre: String!) { crearTipoDescriptor(nombre: $nombre) { ok error } }`;
const EDITAR_TIPO = gql`mutation($idTipoDescriptor: ID!, $nombre: String, $estado: Boolean) {
  editarTipoDescriptor(idTipoDescriptor: $idTipoDescriptor, nombre: $nombre, estado: $estado) { ok error }
}`;
const ELIMINAR_TIPO = gql`mutation($idTipoDescriptor: ID!) { eliminarTipoDescriptor(idTipoDescriptor: $idTipoDescriptor) { ok error } }`;

// Descriptor mutations
const CREAR_DESC = gql`mutation($idTipoDescriptor: ID!, $descripcion: String!) {
  crearDescriptor(idTipoDescriptor: $idTipoDescriptor, descripcion: $descripcion) { ok error }
}`;
const EDITAR_DESC = gql`mutation($idDescriptor: ID!, $idTipoDescriptor: ID, $descripcion: String, $estado: Boolean) {
  editarDescriptor(idDescriptor: $idDescriptor, idTipoDescriptor: $idTipoDescriptor, descripcion: $descripcion, estado: $estado) { ok error }
}`;
const ELIMINAR_DESC = gql`mutation($idDescriptor: ID!) { eliminarDescriptor(idDescriptor: $idDescriptor) { ok error } }`;

// Premio mutations
const CREAR_PREMIO = gql`mutation($idEvento: ID!, $idArea: ID!, $monto: Decimal!, $numeroGanadores: Int!) {
  crearPremio(idEvento: $idEvento, idArea: $idArea, monto: $monto, numeroGanadores: $numeroGanadores) { ok error }
}`;
const EDITAR_PREMIO = gql`mutation($idPremio: ID!, $idEvento: ID, $idArea: ID, $monto: Decimal, $numeroGanadores: Int, $estado: Boolean) {
  editarPremio(idPremio: $idPremio, idEvento: $idEvento, idArea: $idArea, monto: $monto, numeroGanadores: $numeroGanadores, estado: $estado) { ok error }
}`;
const ELIMINAR_PREMIO = gql`mutation($idPremio: ID!) { eliminarPremio(idPremio: $idPremio) { ok error } }`;

// PremioDescriptor mutations
const CREAR_PREMIO_DESC = gql`mutation($idPremio: ID!, $idDescriptor: ID!) {
  crearPremioDescriptor(idPremio: $idPremio, idDescriptor: $idDescriptor) { ok error }
}`;
const ELIMINAR_PREMIO_DESC = gql`mutation($idPremioDescriptor: ID!) {
  eliminarPremioDescriptor(idPremioDescriptor: $idPremioDescriptor) { ok error }
}`;

// CandidatoPremio mutations
const CREAR_CANDIDATO = gql`mutation($idPremio: ID!, $idProyecto: ID!, $idActaEvaluacion: ID!, $nota: Decimal!, $observacion: String) {
  crearCandidatoPremio(idPremio: $idPremio, idProyecto: $idProyecto, idActaEvaluacion: $idActaEvaluacion, nota: $nota, observacion: $observacion) { ok error }
}`;
const EDITAR_CANDIDATO = gql`mutation($idCandidatoPremio: ID!, $estado: String, $activo: Boolean) {
  editarCandidatoPremio(idCandidatoPremio: $idCandidatoPremio, estado: $estado, activo: $activo) { ok error }
}`;

// GanadorPremio mutations
const CREAR_GANADOR = gql`mutation($idCandidatoPremio: ID!) {
  crearGanadorPremio(idCandidatoPremio: $idCandidatoPremio) { ok error }
}`;

// ── Helpers ───────────────────────────────────────────────────────────────────
const estadoColor = { candidato: 'warning', ganador: 'success', descartado: 'error' };

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;
}

// ── Tab 1: Gestión de Premios ─────────────────────────────────────────────────
function GestionPremiosTab({ tipos, descriptores, premios, eventos, areas, refetch, showNotif }) {
  const [crearTipo] = useMutation(CREAR_TIPO);
  const [editarTipo] = useMutation(EDITAR_TIPO);
  const [eliminarTipo] = useMutation(ELIMINAR_TIPO);
  const [crearDesc] = useMutation(CREAR_DESC);
  const [editarDesc] = useMutation(EDITAR_DESC);
  const [eliminarDesc] = useMutation(ELIMINAR_DESC);
  const [crearPremio] = useMutation(CREAR_PREMIO);
  const [editarPremio] = useMutation(EDITAR_PREMIO);
  const [eliminarPremio] = useMutation(ELIMINAR_PREMIO);
  const [crearPremioDesc] = useMutation(CREAR_PREMIO_DESC);
  const [eliminarPremioDesc] = useMutation(ELIMINAR_PREMIO_DESC);

  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', onOk: null });
  const askConfirm = (title, message, onOk) => setConfirm({ open: true, title, message, onOk });
  const closeConfirm = () => setConfirm(p => ({ ...p, open: false }));

  // TipoDescriptor dialog
  const [tipoDialog, setTipoDialog] = useState({ open: false, item: null });
  const [tipoForm, setTipoForm] = useState('');

  // Descriptor dialog
  const [descDialog, setDescDialog] = useState({ open: false, item: null });
  const [descForm, setDescForm] = useState({ idTipoDescriptor: '', descripcion: '' });

  // Premio dialog
  const [premioDialog, setPremioDialog] = useState({ open: false, item: null });
  const [premioForm, setPremioForm] = useState({ idEvento: '', idArea: '', monto: '', numeroGanadores: 1 });

  // PremioDescriptor dialog
  const [pdDialog, setPdDialog] = useState({ open: false, premio: null });
  const [selectedDesc, setSelectedDesc] = useState('');

  // ── TipoDescriptor handlers ──
  const openTipoDialog = (item = null) => {
    setTipoForm(item ? item.nombre : '');
    setTipoDialog({ open: true, item });
  };
  const handleSaveTipo = async () => {
    setSaving(true);
    try {
      let res;
      if (tipoDialog.item) {
        res = (await editarTipo({ variables: { idTipoDescriptor: tipoDialog.item.idTipoDescriptor, nombre: tipoForm } })).data?.editarTipoDescriptor;
      } else {
        res = (await crearTipo({ variables: { nombre: tipoForm } })).data?.crearTipoDescriptor;
      }
      if (res?.ok) { showNotif('Tipo guardado'); refetch(); setTipoDialog({ open: false, item: null }); }
      else showNotif(res?.error || 'Error', 'error');
    } catch { showNotif('Error de conexión', 'error'); }
    setSaving(false);
  };
  const handleDeleteTipo = (id) => {
    askConfirm('Desactivar tipo', '¿Desactivar este tipo de descriptor?', async () => {
      try {
        const res = (await eliminarTipo({ variables: { idTipoDescriptor: id } })).data?.eliminarTipoDescriptor;
        if (res?.ok) { showNotif('Tipo desactivado'); refetch(); }
        else showNotif(res?.error || 'Error', 'error');
      } catch { showNotif('Error de conexión', 'error'); }
    });
  };

  // ── Descriptor handlers ──
  const openDescDialog = (item = null) => {
    setDescForm(item ? { idTipoDescriptor: item.tipoDescriptor.idTipoDescriptor, descripcion: item.descripcion } : { idTipoDescriptor: '', descripcion: '' });
    setDescDialog({ open: true, item });
  };
  const handleSaveDesc = async () => {
    setSaving(true);
    try {
      let res;
      if (descDialog.item) {
        res = (await editarDesc({ variables: { idDescriptor: descDialog.item.idDescriptor, ...descForm } })).data?.editarDescriptor;
      } else {
        res = (await crearDesc({ variables: descForm })).data?.crearDescriptor;
      }
      if (res?.ok) { showNotif('Descriptor guardado'); refetch(); setDescDialog({ open: false, item: null }); }
      else showNotif(res?.error || 'Error', 'error');
    } catch { showNotif('Error de conexión', 'error'); }
    setSaving(false);
  };
  const handleDeleteDesc = (id) => {
    askConfirm('Desactivar descriptor', '¿Desactivar este descriptor?', async () => {
      try {
        const res = (await eliminarDesc({ variables: { idDescriptor: id } })).data?.eliminarDescriptor;
        if (res?.ok) { showNotif('Descriptor desactivado'); refetch(); }
        else showNotif(res?.error || 'Error', 'error');
      } catch { showNotif('Error de conexión', 'error'); }
    });
  };

  // ── Premio handlers ──
  const openPremioDialog = (item = null) => {
    setPremioForm(item ? {
      idEvento: item.evento.idEvento, idArea: item.area.idArea,
      monto: item.monto, numeroGanadores: item.numeroGanadores
    } : { idEvento: '', idArea: '', monto: '', numeroGanadores: 1 });
    setPremioDialog({ open: true, item });
  };
  const handleSavePremio = async () => {
    setSaving(true);
    try {
      let res;
      if (premioDialog.item) {
        res = (await editarPremio({ variables: { idPremio: premioDialog.item.idPremio, ...premioForm, monto: parseFloat(premioForm.monto), numeroGanadores: parseInt(premioForm.numeroGanadores) } })).data?.editarPremio;
      } else {
        res = (await crearPremio({ variables: { ...premioForm, monto: parseFloat(premioForm.monto), numeroGanadores: parseInt(premioForm.numeroGanadores) } })).data?.crearPremio;
      }
      if (res?.ok) { showNotif('Premio guardado'); refetch(); setPremioDialog({ open: false, item: null }); }
      else showNotif(res?.error || 'Error', 'error');
    } catch { showNotif('Error de conexión', 'error'); }
    setSaving(false);
  };
  const handleDeletePremio = (id) => {
    askConfirm('Desactivar premio', '¿Estás seguro de que deseas desactivar este premio?', async () => {
      try {
        const res = (await eliminarPremio({ variables: { idPremio: id } })).data?.eliminarPremio;
        if (res?.ok) { showNotif('Premio desactivado'); refetch(); }
        else showNotif(res?.error || 'Error', 'error');
      } catch { showNotif('Error de conexión', 'error'); }
    });
  };

  // ── PremioDescriptor handlers ──
  const openPdDialog = (premio) => {
    setSelectedDesc('');
    setPdDialog({ open: true, premio });
  };
  const handleAddPremioDesc = async () => {
    if (!selectedDesc) return;
    setSaving(true);
    try {
      const res = (await crearPremioDesc({ variables: { idPremio: pdDialog.premio.idPremio, idDescriptor: selectedDesc } })).data?.crearPremioDescriptor;
      if (res?.ok) {
        showNotif('Descriptor asignado');
        const updated = await refetch();
        const updatedPremio = updated.data?.todosLosPremios?.find(p => p.idPremio === pdDialog.premio.idPremio);
        if (updatedPremio) setPdDialog(prev => ({ ...prev, premio: updatedPremio }));
        setSelectedDesc('');
      } else showNotif(res?.error || 'Error', 'error');
    } catch { showNotif('Error de conexión', 'error'); }
    setSaving(false);
  };
  const handleRemovePremioDesc = (idPremioDescriptor) => {
    askConfirm('Quitar descriptor', '¿Quitar este descriptor del premio?', async () => {
      setSaving(true);
      try {
        const res = (await eliminarPremioDesc({ variables: { idPremioDescriptor } })).data?.eliminarPremioDescriptor;
        if (res?.ok) {
          showNotif('Descriptor removido');
          const updated = await refetch();
          const updatedPremio = updated.data?.todosLosPremios?.find(p => p.idPremio === pdDialog.premio.idPremio);
          if (updatedPremio) setPdDialog(prev => ({ ...prev, premio: updatedPremio }));
        } else showNotif(res?.error || 'Error', 'error');
      } catch { showNotif('Error de conexión', 'error'); }
      setSaving(false);
    });
  };

  const tiposActivos = tipos.filter(t => t.estado);
  const descActivos = descriptores.filter(d => d.estado);

  return (
    <Box>
      {/* TipoDescriptor + Descriptor */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={5}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6">Tipos de Descriptor</Typography>
            <Button size="small" variant="outlined" startIcon={<PlusOutlined />} onClick={() => openTipoDialog()}>Nuevo</Button>
          </Box>
          <TableContainer component={Paper} elevation={0} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell align="center">Estado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tipos.map(t => (
                  <TableRow key={t.idTipoDescriptor} hover>
                    <TableCell>{t.nombre}</TableCell>
                    <TableCell align="center">
                      <Chip label={t.estado ? 'Activo' : 'Inactivo'} size="small" color={t.estado ? 'success' : 'default'} />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Editar">
                        <IconButton size="small" color="primary" onClick={() => openTipoDialog(t)}><EditOutlined /></IconButton>
                      </Tooltip>
                      <Tooltip title="Desactivar">
                        <IconButton size="small" color="error" onClick={() => handleDeleteTipo(t.idTipoDescriptor)}><DeleteOutlined /></IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {tipos.length === 0 && (
                  <TableRow><TableCell colSpan={3} align="center" sx={{ py: 3, color: 'text.secondary' }}>Sin tipos registrados.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        <Grid item xs={12} md={7}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6">Descriptores</Typography>
            <Button size="small" variant="outlined" startIcon={<PlusOutlined />} onClick={() => openDescDialog()}>Nuevo</Button>
          </Box>
          <TableContainer component={Paper} elevation={0} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell align="center">Estado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {descriptores.map(d => (
                  <TableRow key={d.idDescriptor} hover>
                    <TableCell>{d.descripcion}</TableCell>
                    <TableCell><Chip label={d.tipoDescriptor.nombre} size="small" variant="outlined" icon={<TagOutlined style={{ fontSize: 11 }} />} /></TableCell>
                    <TableCell align="center">
                      <Chip label={d.estado ? 'Activo' : 'Inactivo'} size="small" color={d.estado ? 'success' : 'default'} />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Editar">
                        <IconButton size="small" color="primary" onClick={() => openDescDialog(d)}><EditOutlined /></IconButton>
                      </Tooltip>
                      <Tooltip title="Desactivar">
                        <IconButton size="small" color="error" onClick={() => handleDeleteDesc(d.idDescriptor)}><DeleteOutlined /></IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {descriptores.length === 0 && (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>Sin descriptores registrados.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      <Divider sx={{ mb: 3 }} />

      {/* Premios */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6">Premios</Typography>
        <Button variant="contained" startIcon={<PlusOutlined />} onClick={() => openPremioDialog()}>Nuevo Premio</Button>
      </Box>
      <TableContainer component={Paper} elevation={0}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width={60}>ID</TableCell>
              <TableCell>Evento</TableCell>
              <TableCell>Área</TableCell>
              <TableCell>Descriptores</TableCell>
              <TableCell align="center">Monto (Bs.)</TableCell>
              <TableCell align="center">Nro. Ganadores</TableCell>
              <TableCell align="center">Estado</TableCell>
              <TableCell align="right" width={130}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {premios.map(p => (
              <TableRow key={p.idPremio} hover>
                <TableCell>{p.idPremio}</TableCell>
                <TableCell>{p.evento.nombre}</TableCell>
                <TableCell>{p.area.nombre}</TableCell>
                <TableCell>
                  <Stack direction="row" flexWrap="wrap" gap={0.5}>
                    {(p.premioDescriptores || []).map(pd => (
                      <Chip key={pd.id} label={pd.descriptor.descripcion} size="small" variant="outlined" color="secondary" />
                    ))}
                    {(p.premioDescriptores || []).length === 0 && (
                      <Typography variant="caption" color="text.secondary">Sin descriptores</Typography>
                    )}
                  </Stack>
                </TableCell>
                <TableCell align="center"><Typography fontWeight={600}>{p.monto}</Typography></TableCell>
                <TableCell align="center">{p.numeroGanadores}</TableCell>
                <TableCell align="center">
                  <Chip label={p.estado ? 'Activo' : 'Inactivo'} size="small" color={p.estado ? 'success' : 'default'} />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Gestionar descriptores">
                    <IconButton size="small" color="secondary" onClick={() => openPdDialog(p)}><TagOutlined /></IconButton>
                  </Tooltip>
                  <Tooltip title="Editar">
                    <IconButton size="small" color="primary" onClick={() => openPremioDialog(p)}><EditOutlined /></IconButton>
                  </Tooltip>
                  <Tooltip title="Desactivar">
                    <IconButton size="small" color="error" onClick={() => handleDeletePremio(p.idPremio)}><DeleteOutlined /></IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {premios.length === 0 && (
              <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>Sin premios registrados.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── Dialogs ── */}
      {/* TipoDescriptor Dialog */}
      <Dialog open={tipoDialog.open} onClose={() => setTipoDialog({ open: false, item: null })} maxWidth="xs" fullWidth>
        <DialogTitle>{tipoDialog.item ? 'Editar Tipo' : 'Nuevo Tipo de Descriptor'}</DialogTitle>
        <DialogContent dividers>
          <TextField label="Nombre del tipo" fullWidth value={tipoForm} onChange={e => setTipoForm(e.target.value)} sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTipoDialog({ open: false, item: null })} color="secondary">Cancelar</Button>
          <Button variant="contained" disabled={!tipoForm.trim() || saving} onClick={handleSaveTipo}>
            {saving ? <CircularProgress size={22} color="inherit" /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Descriptor Dialog */}
      <Dialog open={descDialog.open} onClose={() => setDescDialog({ open: false, item: null })} maxWidth="xs" fullWidth>
        <DialogTitle>{descDialog.item ? 'Editar Descriptor' : 'Nuevo Descriptor'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel>Tipo</InputLabel>
              <Select value={descForm.idTipoDescriptor} label="Tipo" onChange={e => setDescForm(p => ({ ...p, idTipoDescriptor: e.target.value }))}>
                {tiposActivos.map(t => <MenuItem key={t.idTipoDescriptor} value={t.idTipoDescriptor}>{t.nombre}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Descripción" fullWidth value={descForm.descripcion} onChange={e => setDescForm(p => ({ ...p, descripcion: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDescDialog({ open: false, item: null })} color="secondary">Cancelar</Button>
          <Button variant="contained" disabled={!descForm.idTipoDescriptor || !descForm.descripcion.trim() || saving} onClick={handleSaveDesc}>
            {saving ? <CircularProgress size={22} color="inherit" /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Premio Dialog */}
      <Dialog open={premioDialog.open} onClose={() => setPremioDialog({ open: false, item: null })} maxWidth="sm" fullWidth>
        <DialogTitle>{premioDialog.item ? 'Editar Premio' : 'Nuevo Premio'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel>Evento</InputLabel>
              <Select value={premioForm.idEvento} label="Evento" onChange={e => setPremioForm(p => ({ ...p, idEvento: e.target.value }))}>
                {eventos.filter(ev => ev.estado).map(ev => <MenuItem key={ev.idEvento} value={ev.idEvento}>{ev.nombre}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel>Área</InputLabel>
              <Select value={premioForm.idArea} label="Área" onChange={e => setPremioForm(p => ({ ...p, idArea: e.target.value }))}>
                {areas.filter(a => a.estado).map(a => <MenuItem key={a.idArea} value={a.idArea}>{a.nombre}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Monto (Bs.)" type="number" fullWidth required value={premioForm.monto}
              inputProps={{ min: 0, step: 0.01 }} onChange={e => setPremioForm(p => ({ ...p, monto: e.target.value }))} />
            <TextField label="Número de ganadores" type="number" fullWidth required value={premioForm.numeroGanadores}
              inputProps={{ min: 1 }} onChange={e => setPremioForm(p => ({ ...p, numeroGanadores: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPremioDialog({ open: false, item: null })} color="secondary">Cancelar</Button>
          <Button variant="contained" disabled={!premioForm.idEvento || !premioForm.idArea || !premioForm.monto || saving} onClick={handleSavePremio}>
            {saving ? <CircularProgress size={22} color="inherit" /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        onConfirm={() => { confirm.onOk?.(); closeConfirm(); }}
        onCancel={closeConfirm}
      />

      {/* PremioDescriptor Dialog */}
      <Dialog open={pdDialog.open} onClose={() => setPdDialog({ open: false, premio: null })} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" gap={1}>
            <TagOutlined />
            Descriptores — {pdDialog.premio?.area?.nombre} ({pdDialog.premio?.evento?.nombre})
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle2" gutterBottom>Descriptores asignados</Typography>
          {(pdDialog.premio?.premioDescriptores || []).length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Sin descriptores asignados.</Typography>
          ) : (
            <Stack spacing={1} sx={{ mb: 2 }}>
              {(pdDialog.premio?.premioDescriptores || []).map(pd => (
                <Box key={pd.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={500}>{pd.descriptor.descripcion}</Typography>
                    <Typography variant="caption" color="text.secondary">{pd.descriptor.tipoDescriptor?.nombre}</Typography>
                  </Box>
                  <Tooltip title="Quitar descriptor">
                    <IconButton size="small" color="error" onClick={() => handleRemovePremioDesc(pd.id)}><DeleteOutlined style={{ fontSize: 13 }} /></IconButton>
                  </Tooltip>
                </Box>
              ))}
            </Stack>
          )}
          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle2" gutterBottom>Agregar descriptor</Typography>
          <Stack direction="row" spacing={1}>
            <FormControl fullWidth size="small">
              <InputLabel>Seleccionar descriptor</InputLabel>
              <Select value={selectedDesc} label="Seleccionar descriptor" onChange={e => setSelectedDesc(e.target.value)}>
                {descActivos
                  .filter(d => !(pdDialog.premio?.premioDescriptores || []).some(pd => pd.descriptor.idDescriptor === d.idDescriptor))
                  .map(d => (
                    <MenuItem key={d.idDescriptor} value={d.idDescriptor}>
                      {d.descripcion} <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>({d.tipoDescriptor.nombre})</Typography>
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            <Button variant="contained" disabled={!selectedDesc || saving} onClick={handleAddPremioDesc}>Agregar</Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPdDialog({ open: false, premio: null })}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ── Tab 2: Ranking / Leaderboard ──────────────────────────────────────────────
function RankingTab({ actas, premios, cronogramas, refetch, showNotif }) {
  const [crearCandidato] = useMutation(CREAR_CANDIDATO);
  const [cerrarActa] = useMutation(CERRAR_ACTA_RESULTADOS);
  const [saving, setSaving] = useState(false);
  const [candidatoDialog, setCandidatoDialog] = useState({ open: false, acta: null });
  const [candidatoForm, setCandidatoForm] = useState({ idPremio: '', observacion: '' });
  const [cerrarDialog, setCerrarDialog] = useState({ open: false, evento: null });
  const [cerrarPremio, setCerrarPremio] = useState('');

  const now = new Date();
  const cronogramasResultadoExpirados = cronogramas.filter(c =>
    c.actividad?.nombreActividad?.toLowerCase().includes('resultado') &&
    new Date(c.fechaFin) < now
  );

  const handleCerrarActa = async () => {
    if (!cerrarPremio || !cerrarDialog.evento) return;
    setSaving(true);
    try {
      const res = (await cerrarActa({
        variables: { idEvento: cerrarDialog.evento.idEvento, idPremio: cerrarPremio },
      })).data?.cerrarActaResultados;
      if (res?.ok) {
        showNotif(`Acta cerrada. ${res.candidatos?.length || 0} candidato(s) adjudicado(s) automáticamente.`);
        refetch();
        setCerrarDialog({ open: false, evento: null });
        setCerrarPremio('');
      } else {
        showNotif(res?.error || 'Error al cerrar acta', 'error');
      }
    } catch { showNotif('Error de conexión', 'error'); }
    setSaving(false);
  };

  const actasOrdenadas = [...actas]
    .filter(a => parseFloat(a.notaFinal) > 0)
    .sort((a, b) => parseFloat(b.notaFinal) - parseFloat(a.notaFinal));

  const openCandidatoDialog = (acta) => {
    setCandidatoForm({ idPremio: '', observacion: '' });
    setCandidatoDialog({ open: true, acta });
  };

  const handlePostular = async () => {
    const { acta } = candidatoDialog;
    setSaving(true);
    try {
      const res = (await crearCandidato({
        variables: {
          idPremio: candidatoForm.idPremio,
          idProyecto: acta.proyecto.idProyecto,
          idActaEvaluacion: acta.idActaEvaluacion,
          nota: parseFloat(acta.notaFinal),
          observacion: candidatoForm.observacion,
        }
      })).data?.crearCandidatoPremio;
      if (res?.ok) { showNotif('Proyecto postulado como candidato'); refetch(); setCandidatoDialog({ open: false, acta: null }); }
      else showNotif(res?.error || 'Error', 'error');
    } catch { showNotif('Error de conexión', 'error'); }
    setSaving(false);
  };

  const premiosActivos = premios.filter(p => p.estado);
  const maxNota = actasOrdenadas.length > 0 ? parseFloat(actasOrdenadas[0].notaFinal) : 1;

  return (
    <Box>
      {/* Alertas de períodos de resultados expirados */}
      {cronogramasResultadoExpirados.map(c => (
        <Alert
          key={c.idCronograma}
          severity="warning"
          sx={{ mb: 1.5 }}
          action={
            <Button
              size="small" color="warning" variant="contained"
              onClick={() => { setCerrarDialog({ open: true, evento: c.evento }); setCerrarPremio(''); }}
            >
              Cerrar Acta
            </Button>
          }
        >
          El período de <strong>Publicación de Resultados</strong> finalizó para <strong>{c.evento?.nombre}</strong>.
          Cierra el acta para adjudicar candidatos automáticamente.
        </Alert>
      ))}

      {/* Summary */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Proyectos evaluados', value: actasOrdenadas.length, color: 'primary.lighter' },
          { label: 'Nota más alta', value: actasOrdenadas[0]?.notaFinal || '—', color: 'success.lighter' },
          { label: 'Nota más baja', value: actasOrdenadas[actasOrdenadas.length - 1]?.notaFinal || '—', color: 'warning.lighter' },
          { label: 'Total premios activos', value: premiosActivos.length, color: 'secondary.lighter' },
        ].map(c => (
          <Grid item xs={6} sm={3} key={c.label}>
            <Card variant="outlined" sx={{ bgcolor: c.color }}>
              <CardContent sx={{ py: '12px !important', px: 2 }}>
                <Typography variant="h5" fontWeight={700}>{c.value}</Typography>
                <Typography variant="caption" color="text.secondary">{c.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <TableContainer component={Paper} elevation={0}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width={60} align="center">Pos.</TableCell>
              <TableCell>Proyecto</TableCell>
              <TableCell>Fecha Evaluación</TableCell>
              <TableCell align="center">Nota Final</TableCell>
              <TableCell align="right">Acción</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {actasOrdenadas.map((acta, idx) => {
              const nota = parseFloat(acta.notaFinal);
              const pct = maxNota > 0 ? (nota / maxNota) * 100 : 0;
              const medalColor = idx === 0 ? '#faad14' : idx === 1 ? '#bfbfbf' : idx === 2 ? '#d46b08' : 'inherit';
              return (
                <TableRow key={acta.idActaEvaluacion} hover sx={{ bgcolor: idx < 3 ? 'action.hover' : 'inherit' }}>
                  <TableCell align="center">
                    <Typography fontWeight={700} sx={{ color: medalColor, fontSize: idx < 3 ? 18 : 14 }}>
                      {idx < 3 ? ['🥇', '🥈', '🥉'][idx] : idx + 1}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>{acta.proyecto.titulo}</Typography>
                    <Chip label={acta.proyecto.estado} size="small" sx={{ mt: 0.3 }}
                      color={{ aprobado: 'success', inscrito: 'info', revision: 'warning', rechazado: 'error' }[acta.proyecto.estado] || 'default'} />
                  </TableCell>
                  <TableCell><Typography variant="body2">{acta.fecha}</Typography></TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                      <Box sx={{ width: 80, height: 6, bgcolor: 'action.hover', borderRadius: 3, overflow: 'hidden' }}>
                        <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: idx === 0 ? 'warning.main' : 'primary.main', borderRadius: 3 }} />
                      </Box>
                      <Typography fontWeight={700} color={idx === 0 ? 'warning.main' : 'primary.main'}>{nota}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" variant="outlined" color="secondary" startIcon={<TrophyOutlined />}
                      onClick={() => openCandidatoDialog(acta)}>
                      Postular
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {actasOrdenadas.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No hay actas con nota final registrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Cerrar Acta Dialog */}
      <Dialog open={cerrarDialog.open} onClose={() => setCerrarDialog({ open: false, evento: null })} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" gap={1}>
            <TrophyOutlined style={{ color: '#faad14' }} />
            Cerrar Acta de Resultados
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 2 }}>
            Se adjudicarán automáticamente como candidatos los proyectos con la <strong>nota más alta</strong>.
            En caso de empate, todos los proyectos empatados serán incluidos.
          </Alert>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Evento: <strong>{cerrarDialog.evento?.nombre}</strong>
          </Typography>
          <FormControl fullWidth required>
            <InputLabel>Premio a adjudicar</InputLabel>
            <Select
              value={cerrarPremio}
              label="Premio a adjudicar"
              onChange={e => setCerrarPremio(e.target.value)}
            >
              {premios
                .filter(p => p.estado && p.evento?.idEvento === cerrarDialog.evento?.idEvento)
                .map(pr => (
                  <MenuItem key={pr.idPremio} value={pr.idPremio}>
                    {pr.area?.nombre} — Bs. {pr.monto}
                    <Stack direction="row" gap={0.5} sx={{ ml: 1 }}>
                      {(pr.premioDescriptores || []).map(pd => (
                        <Chip key={pd.id} label={pd.descriptor.descripcion} size="small" />
                      ))}
                    </Stack>
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCerrarDialog({ open: false, evento: null })} color="secondary">Cancelar</Button>
          <Button
            variant="contained" color="warning"
            disabled={!cerrarPremio || saving}
            onClick={handleCerrarActa}
          >
            {saving ? <CircularProgress size={22} color="inherit" /> : 'Cerrar Acta y Adjudicar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Candidato Dialog */}
      <Dialog open={candidatoDialog.open} onClose={() => setCandidatoDialog({ open: false, acta: null })} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" gap={1}>
            <TrophyOutlined style={{ color: '#faad14' }} />
            Postular como Candidato
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="body2" fontWeight={500}>{candidatoDialog.acta?.proyecto?.titulo}</Typography>
              <Typography variant="caption" color="text.secondary">Nota: {candidatoDialog.acta?.notaFinal}</Typography>
            </Box>
            <FormControl fullWidth required>
              <InputLabel>Premio</InputLabel>
              <Select value={candidatoForm.idPremio} label="Premio" onChange={e => setCandidatoForm(p => ({ ...p, idPremio: e.target.value }))}>
                {premiosActivos.map(pr => (
                  <MenuItem key={pr.idPremio} value={pr.idPremio}>
                    {pr.area.nombre} — {pr.evento.nombre} (Bs. {pr.monto})
                    <Stack direction="row" gap={0.5} sx={{ ml: 1 }}>
                      {(pr.premioDescriptores || []).map(pd => (
                        <Chip key={pd.id} label={pd.descriptor.descripcion} size="small" />
                      ))}
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField label="Observación (opcional)" fullWidth multiline rows={2}
              value={candidatoForm.observacion} onChange={e => setCandidatoForm(p => ({ ...p, observacion: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCandidatoDialog({ open: false, acta: null })} color="secondary">Cancelar</Button>
          <Button variant="contained" color="warning" disabled={!candidatoForm.idPremio || saving} onClick={handlePostular}>
            {saving ? <CircularProgress size={22} color="inherit" /> : 'Postular'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ── Tab 3: Adjudicación ───────────────────────────────────────────────────────
function AdjudicacionTab({ candidatos, refetch, showNotif }) {
  const [editarCandidato] = useMutation(EDITAR_CANDIDATO);
  const [crearGanador] = useMutation(CREAR_GANADOR);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', onOk: null, color: 'error' });
  const askConfirm = (title, message, onOk, color = 'error') => setConfirm({ open: true, title, message, onOk, color });
  const closeConfirm = () => setConfirm(p => ({ ...p, open: false }));

  const handleMarcarGanador = (candidato) => {
    askConfirm(
      'Adjudicar Ganador',
      `¿Confirmas que "${candidato.proyecto.titulo}" es el GANADOR? Los demás candidatos de este premio pasarán a estado "Descartado". Esta acción no se puede deshacer.`,
      async () => {
      setSaving(true);
      try {
      // Crear el registro de ganador
      const resGanador = (await crearGanador({ variables: { idCandidatoPremio: candidato.idCandidatoPremio } })).data?.crearGanadorPremio;
      if (!resGanador?.ok) { showNotif(resGanador?.error || 'Error al crear ganador', 'error'); setSaving(false); return; }

      // Actualizar estado del candidato ganador
      await editarCandidato({ variables: { idCandidatoPremio: candidato.idCandidatoPremio, estado: 'ganador' } });

      // Descartar los demás candidatos del mismo premio
      const otrosCandidatos = candidatos.filter(
        c => c.premio.idPremio === candidato.premio.idPremio &&
          c.idCandidatoPremio !== candidato.idCandidatoPremio &&
          c.estado?.toLowerCase() === 'candidato'
      );
      for (const otro of otrosCandidatos) {
        await editarCandidato({ variables: { idCandidatoPremio: otro.idCandidatoPremio, estado: 'descartado' } });
      }

      showNotif('¡Ganador adjudicado exitosamente!');
      refetch();
      } catch { showNotif('Error de conexión', 'error'); }
      setSaving(false);
    },
    'success'
    );
  };

  const handleDescartar = (candidato) => {
    askConfirm(
      'Descartar candidato',
      `¿Descartar a "${candidato.proyecto.titulo}" de este premio?`,
      async () => {
        setSaving(true);
        try {
          const res = (await editarCandidato({ variables: { idCandidatoPremio: candidato.idCandidatoPremio, estado: 'descartado' } })).data?.editarCandidatoPremio;
          if (res?.ok) { showNotif('Candidato descartado'); refetch(); }
          else showNotif(res?.error || 'Error', 'error');
        } catch { showNotif('Error de conexión', 'error'); }
        setSaving(false);
      }
    );
  };

  // Agrupar por premio
  const candidatosPorPremio = candidatos.reduce((acc, c) => {
    const key = c.premio.idPremio;
    if (!acc[key]) acc[key] = { premio: c.premio, candidatos: [] };
    acc[key].candidatos.push(c);
    return acc;
  }, {});

  const grupos = Object.values(candidatosPorPremio);

  return (
    <Box>
      {grupos.length === 0 ? (
        <Alert severity="info">No hay candidatos registrados. Postula proyectos desde el tab "Ranking".</Alert>
      ) : (
        grupos.map(grupo => (
          <Box key={grupo.premio.idPremio} sx={{ mb: 4 }}>
            <Box sx={{ p: 1.5, bgcolor: 'secondary.lighter', borderRadius: 1, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <GoldOutlined style={{ fontSize: 20, color: '#722ed1' }} />
              <Box>
                <Typography fontWeight={700}>{grupo.premio.area.nombre} — {grupo.premio.evento.nombre}</Typography>
                <Stack direction="row" gap={0.5} flexWrap="wrap">
                  {(grupo.premio.premioDescriptores || []).map(pd => (
                    <Chip key={pd.descriptor?.descripcion} label={pd.descriptor?.descripcion} size="small" color="secondary" />
                  ))}
                  <Chip label={`Bs. ${grupo.premio.monto}`} size="small" variant="outlined" />
                </Stack>
              </Box>
            </Box>
            <TableContainer component={Paper} elevation={0} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Proyecto</TableCell>
                    <TableCell align="center">Nota</TableCell>
                    <TableCell>Observación</TableCell>
                    <TableCell align="center">Estado</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {grupo.candidatos
                    .sort((a, b) => parseFloat(b.nota) - parseFloat(a.nota))
                    .map(c => (
                      <TableRow key={c.idCandidatoPremio} hover>
                        <TableCell><Typography variant="body2" fontWeight={500}>{c.proyecto.titulo}</Typography></TableCell>
                        <TableCell align="center"><Typography fontWeight={700} color="primary.main">{c.nota}</Typography></TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{c.observacion || '—'}</Typography></TableCell>
                        <TableCell align="center">
                          <Chip label={c.estado} size="small" color={estadoColor[c.estado?.toLowerCase()] || 'default'} />
                        </TableCell>
                        <TableCell align="right">
                          {c.estado?.toLowerCase() === 'candidato' && (
                            <>
                              <Tooltip title="Marcar como ganador">
                                <IconButton size="small" color="success" disabled={saving} onClick={() => handleMarcarGanador(c)}>
                                  <CheckCircleOutlined />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Descartar candidato">
                                <IconButton size="small" color="error" disabled={saving} onClick={() => handleDescartar(c)}>
                                  <CloseCircleOutlined />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                          {c.estado?.toLowerCase() === 'ganador' && (
                            <Chip label="GANADOR" color="success" size="small" icon={<TrophyOutlined style={{ fontSize: 12 }} />} />
                          )}
                          {c.estado?.toLowerCase() === 'descartado' && (
                            <Typography variant="caption" color="text.secondary">Descartado</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ))
      )}

      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        confirmColor={confirm.color}
        confirmLabel={confirm.color === 'success' ? 'Confirmar' : 'Aceptar'}
        onConfirm={() => { confirm.onOk?.(); closeConfirm(); }}
        onCancel={closeConfirm}
      />
    </Box>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CuadroHonorPage() {
  const { data, loading, error, refetch } = useQuery(GET_DATA, { fetchPolicy: 'network-only' });
  const [tab, setTab] = useState(0);
  const [notif, setNotif] = useState({ open: false, msg: '', sev: 'success' });
  const showNotif = (msg, sev = 'success') => setNotif({ open: true, msg, sev });

  const tipos = data?.todosSLosTiposDescriptores || [];
  const descriptores = data?.todosLosDescriptores || [];
  const premios = data?.todosLosPremios || [];
  const candidatos = data?.todosLosCandidatosPremios?.filter(c => c.activo) || [];
  const actas = data?.todasLasActas || [];
  const eventos = data?.todosLosEventos || [];
  const areas = data?.todasLasAreas || [];
  const cronogramas = data?.todosLosCronogramas || [];

  return (
    <MainCard title="Cuadro de Honor y Premios">
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error">Error al cargar: {error.message}</Alert>
      ) : (
        <>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 0 }}>
            <Tab label="Gestión de Premios" icon={<GoldOutlined />} iconPosition="start" />
            <Tab label="Ranking / Candidatos" icon={<TrophyOutlined />} iconPosition="start" />
            <Tab label="Adjudicación de Ganadores" icon={<CheckCircleOutlined />} iconPosition="start" />
          </Tabs>

          <TabPanel value={tab} index={0}>
            <GestionPremiosTab tipos={tipos} descriptores={descriptores} premios={premios} eventos={eventos} areas={areas} refetch={refetch} showNotif={showNotif} />
          </TabPanel>
          <TabPanel value={tab} index={1}>
            <RankingTab actas={actas} premios={premios} cronogramas={cronogramas} refetch={refetch} showNotif={showNotif} />
          </TabPanel>
          <TabPanel value={tab} index={2}>
            <AdjudicacionTab candidatos={candidatos} refetch={refetch} showNotif={showNotif} />
          </TabPanel>
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
