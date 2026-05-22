import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
  Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Switch,
  FormControlLabel, Snackbar, Alert, CircularProgress, Tabs, Tab, Chip,
  FormControl, InputLabel, Select, MenuItem, Stepper, Step, StepLabel,
  Typography, Divider, Avatar
} from '@mui/material';
import {
  EditOutlined, DeleteOutlined, PlusOutlined, EyeOutlined,
  SolutionOutlined, IdcardOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import MainCard from 'components/MainCard';

// ── GQL ──────────────────────────────────────────────────────────────────────
const GET_ALL = gql`
  query {
    todasLasOfertas {
      idOferta nombre descripcion estado
      categoriaEvento {
        id
        categoria { nombre }
        evento    { idEvento nombre }
      }
      modalidadArea {
        id
        modalidad { nombre }
        area      { nombre }
      }
    }
    todosLosOfertaEaCarreras {
      id carrera plan estado
      oferta           { idOferta nombre }
      entidadAcademica { idEntidadAcademica nombre }
    }
    todosLosCategoriaEventos {
      id
      categoria { idCategoria nombre }
      evento    { idEvento nombre }
    }
    todosLosModalidadAreas {
      id
      modalidad { nombre }
      area      { nombre }
    }
    todasLasEntidadesAcademicas { idEntidadAcademica nombre estado }
    todosLosEventos             { idEvento nombre estado }
  }
`;

const CREATE_OFERTA = gql`
  mutation($idCategoriaEvento: ID!, $idModalidadArea: ID!, $nombre: String!, $descripcion: String) {
    crearOferta(idCategoriaEvento: $idCategoriaEvento, idModalidadArea: $idModalidadArea, nombre: $nombre, descripcion: $descripcion) { ok error }
  }
`;
const EDIT_OFERTA = gql`
  mutation($idOferta: ID!, $nombre: String, $descripcion: String, $estado: Boolean) {
    editarOferta(idOferta: $idOferta, nombre: $nombre, descripcion: $descripcion, estado: $estado) { ok error }
  }
`;
const DELETE_OFERTA = gql`
  mutation($idOferta: ID!) { eliminarOferta(idOferta: $idOferta) { ok error } }
`;

const CREATE_OEC = gql`
  mutation($idOferta: ID!, $idEntidadAcademica: ID!, $carrera: String!, $plan: String!) {
    crearOfertaEaCarrera(idOferta: $idOferta, idEntidadAcademica: $idEntidadAcademica, carrera: $carrera, plan: $plan) { ok error }
  }
`;
const EDIT_OEC = gql`
  mutation($idOfertaEaCarrera: ID!, $carrera: String, $plan: String, $estado: Boolean) {
    editarOfertaEaCarrera(idOfertaEaCarrera: $idOfertaEaCarrera, carrera: $carrera, plan: $plan, estado: $estado) { ok error }
  }
`;
const DELETE_OEC = gql`
  mutation($idOfertaEaCarrera: ID!) { eliminarOfertaEaCarrera(idOfertaEaCarrera: $idOfertaEaCarrera) { ok error } }
`;

// ── Wizard steps labels ───────────────────────────────────────────────────────
const WIZARD_STEPS = ['Evento', 'Categoría', 'Modalidad × Área', 'Datos de la Oferta'];

const INIT_EDIT_OFERTA = { nombre: '', descripcion: '', estado: true };
const INIT_OEC         = { idOferta: '', idEntidadAcademica: '', carrera: '', plan: '' };

// ── Main component ────────────────────────────────────────────────────────────
export default function OfertasPage() {
  const [tab, setTab] = useState(0);
  const { data, loading, error, refetch } = useQuery(GET_ALL, { fetchPolicy: 'network-only' });

  const [crearOferta]    = useMutation(CREATE_OFERTA);
  const [editarOferta]   = useMutation(EDIT_OFERTA);
  const [eliminarOferta] = useMutation(DELETE_OFERTA);
  const [crearOEC]    = useMutation(CREATE_OEC);
  const [editarOEC]   = useMutation(EDIT_OEC);
  const [eliminarOEC] = useMutation(DELETE_OEC);

  // Wizard state (create oferta)
  const [openWizard, setOpenWizard]       = useState(false);
  const [wizardStep, setWizardStep]       = useState(0);
  const [wizardEvento, setWizardEvento]   = useState('');
  const [wizardCatEv, setWizardCatEv]     = useState('');
  const [wizardModArea, setWizardModArea] = useState('');
  const [wizardNombre, setWizardNombre]   = useState('');
  const [wizardDesc, setWizardDesc]       = useState('');

  // Edit oferta state (non-wizard)
  const [openEditOferta, setOpenEditOferta]   = useState(false);
  const [editingOferta, setEditingOferta]     = useState(null);
  const [formEditOferta, setFormEditOferta]   = useState(INIT_EDIT_OFERTA);

  // View oferta
  const [openViewOferta, setOpenViewOferta] = useState(false);
  const [viewOferta, setViewOferta]         = useState(null);

  // OfertaEaCarrera state
  const [openOEC, setOpenOEC]         = useState(false);
  const [editingOEC, setEditingOEC]   = useState(null);
  const [formOEC, setFormOEC]         = useState(INIT_OEC);

  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  const ofertas          = data?.todasLasOfertas              || [];
  const oecList          = data?.todosLosOfertaEaCarreras     || [];
  const categoriaEventos = data?.todosLosCategoriaEventos     || [];
  const modalidadAreas   = data?.todosLosModalidadAreas       || [];
  const entidades        = data?.todasLasEntidadesAcademicas  || [];
  const eventos          = data?.todosLosEventos              || [];

  const showNotif = (message, severity = 'success') =>
    setNotification({ open: true, message, severity });

  // ── Derived: categoriaEventos filtered by selected evento ────────────────
  const catEvFiltered = categoriaEventos.filter(
    ce => ce.evento?.idEvento === wizardEvento
  );

  // ── Wizard helpers ────────────────────────────────────────────────────────
  const resetWizard = () => {
    setWizardStep(0);
    setWizardEvento('');
    setWizardCatEv('');
    setWizardModArea('');
    setWizardNombre('');
    setWizardDesc('');
  };

  const wizardNextDisabled = () => {
    if (wizardStep === 0) return !wizardEvento;
    if (wizardStep === 1) return !wizardCatEv;
    if (wizardStep === 2) return !wizardModArea;
    if (wizardStep === 3) return !wizardNombre.trim();
    return false;
  };

  const handleWizardSubmit = async () => {
    setSaving(true);
    try {
      const res = await crearOferta({
        variables: {
          idCategoriaEvento: wizardCatEv,
          idModalidadArea:   wizardModArea,
          nombre:            wizardNombre,
          descripcion:       wizardDesc,
        }
      });
      const result = res.data?.crearOferta;
      if (result?.ok) {
        showNotif('Oferta creada exitosamente');
        refetch();
        setOpenWizard(false);
        resetWizard();
      } else {
        showNotif(result?.error || 'Error al crear oferta', 'error');
      }
    } catch { showNotif('Error de conexión', 'error'); }
    setSaving(false);
  };

  // ── Edit Oferta (non-wizard) ──────────────────────────────────────────────
  const handleOpenEditOferta = (oferta) => {
    setEditingOferta(oferta);
    setFormEditOferta({ nombre: oferta.nombre, descripcion: oferta.descripcion || '', estado: oferta.estado });
    setOpenEditOferta(true);
  };

  const handleSaveEditOferta = async () => {
    setSaving(true);
    try {
      const res = await editarOferta({
        variables: { idOferta: editingOferta.idOferta, ...formEditOferta }
      });
      const result = res.data?.editarOferta;
      if (result?.ok) {
        showNotif('Oferta actualizada');
        refetch();
        setOpenEditOferta(false);
      } else {
        showNotif(result?.error || 'Error al actualizar', 'error');
      }
    } catch { showNotif('Error de conexión', 'error'); }
    setSaving(false);
  };

  const handleDeleteOferta = async (id) => {
    if (!window.confirm('¿Desactivar esta oferta?')) return;
    try {
      const res = await eliminarOferta({ variables: { idOferta: id } });
      if (res.data?.eliminarOferta?.ok) { showNotif('Oferta desactivada'); refetch(); }
      else showNotif(res.data?.eliminarOferta?.error || 'Error', 'error');
    } catch { showNotif('Error de conexión', 'error'); }
  };

  // ── OfertaEaCarrera ───────────────────────────────────────────────────────
  const handleOpenOEC = (oec = null) => {
    setEditingOEC(oec);
    setFormOEC(oec
      ? { idOferta: oec.oferta?.idOferta || '', idEntidadAcademica: oec.entidadAcademica?.idEntidadAcademica || '', carrera: oec.carrera, plan: oec.plan, estado: oec.estado }
      : INIT_OEC
    );
    setOpenOEC(true);
  };

  const handleSaveOEC = async () => {
    setSaving(true);
    try {
      let res, result;
      if (editingOEC) {
        res = await editarOEC({
          variables: { idOfertaEaCarrera: editingOEC.id, carrera: formOEC.carrera, plan: formOEC.plan, estado: formOEC.estado }
        });
        result = res.data?.editarOfertaEaCarrera;
      } else {
        res = await crearOEC({ variables: formOEC });
        result = res.data?.crearOfertaEaCarrera;
      }
      if (result?.ok) {
        showNotif(editingOEC ? 'Asignación actualizada' : 'Carrera asignada');
        refetch();
        setOpenOEC(false);
      } else {
        showNotif(result?.error || 'Error al guardar', 'error');
      }
    } catch { showNotif('Error de conexión', 'error'); }
    setSaving(false);
  };

  const handleDeleteOEC = async (id) => {
    if (!window.confirm('¿Desactivar esta asignación?')) return;
    try {
      const res = await eliminarOEC({ variables: { idOfertaEaCarrera: id } });
      if (res.data?.eliminarOfertaEaCarrera?.ok) { showNotif('Asignación desactivada'); refetch(); }
      else showNotif(res.data?.eliminarOfertaEaCarrera?.error || 'Error', 'error');
    } catch { showNotif('Error de conexión', 'error'); }
  };

  const oecFormValid = !editingOEC
    ? (formOEC.idOferta && formOEC.idEntidadAcademica && formOEC.carrera.trim() && formOEC.plan.trim())
    : (formOEC.carrera?.trim() && formOEC.plan?.trim());

  // ── Wizard step content ───────────────────────────────────────────────────
  const renderWizardStep = () => {
    switch (wizardStep) {
      case 0:
        return (
          <FormControl fullWidth required>
            <InputLabel>Evento</InputLabel>
            <Select value={wizardEvento} label="Evento" onChange={e => { setWizardEvento(e.target.value); setWizardCatEv(''); }}>
              {eventos.filter(ev => ev.estado).map(ev => (
                <MenuItem key={ev.idEvento} value={ev.idEvento}>{ev.nombre}</MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      case 1:
        return (
          <Box>
            {catEvFiltered.length === 0 ? (
              <Alert severity="warning">
                No hay categorías vinculadas a este evento. Ve a "Estructuras y Relaciones" para crearlas.
              </Alert>
            ) : (
              <FormControl fullWidth required>
                <InputLabel>Categoría del Evento</InputLabel>
                <Select value={wizardCatEv} label="Categoría del Evento" onChange={e => setWizardCatEv(e.target.value)}>
                  {catEvFiltered.map(ce => (
                    <MenuItem key={ce.id} value={ce.id}>
                      {ce.categoria?.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        );
      case 2:
        return (
          <FormControl fullWidth required>
            <InputLabel>Modalidad × Área</InputLabel>
            <Select value={wizardModArea} label="Modalidad × Área" onChange={e => setWizardModArea(e.target.value)}>
              {modalidadAreas.map(ma => (
                <MenuItem key={ma.id} value={ma.id}>
                  {ma.modalidad?.nombre} / {ma.area?.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      case 3: {
        const selEvento  = eventos.find(ev => ev.idEvento === wizardEvento);
        const selCatEv   = categoriaEventos.find(ce => ce.id === wizardCatEv);
        const selModArea = modalidadAreas.find(ma => ma.id === wizardModArea);
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Resumen de selección</Typography>
              <Typography variant="body2"><strong>Evento:</strong> {selEvento?.nombre}</Typography>
              <Typography variant="body2"><strong>Categoría:</strong> {selCatEv?.categoria?.nombre}</Typography>
              <Typography variant="body2"><strong>Modalidad × Área:</strong> {selModArea?.modalidad?.nombre} / {selModArea?.area?.nombre}</Typography>
            </Box>
            <Divider />
            <TextField
              label="Nombre de la Oferta" value={wizardNombre} fullWidth required autoFocus
              onChange={e => setWizardNombre(e.target.value)}
            />
            <TextField
              label="Descripción (opcional)" value={wizardDesc} fullWidth multiline rows={3}
              onChange={e => setWizardDesc(e.target.value)}
            />
          </Box>
        );
      }
      default: return null;
    }
  };

  const tabActions = [
    <Button key="of" variant="contained" startIcon={<PlusOutlined />} onClick={() => { resetWizard(); setOpenWizard(true); }}>
      Nueva Oferta
    </Button>,
    <Button key="oec" variant="contained" startIcon={<PlusOutlined />} onClick={() => handleOpenOEC()}>
      Nueva Asignación
    </Button>,
  ];

  return (
    <MainCard title="Ofertas Académicas" secondary={tabActions[tab]}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Gestión de Ofertas"   icon={<SolutionOutlined />} iconPosition="start" />
          <Tab label="Carreras Autorizadas" icon={<IdcardOutlined />}   iconPosition="start" />
        </Tabs>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error">Error al cargar datos: {error.message}</Alert>
      ) : (
        <>
          {/* ── Tab 0: Ofertas ── */}
          {tab === 0 && (
            <TableContainer component={Paper} elevation={0}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width={60}>ID</TableCell>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Evento / Categoría</TableCell>
                    <TableCell>Modalidad / Área</TableCell>
                    <TableCell width={100}>Estado</TableCell>
                    <TableCell align="right" width={120}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ofertas.map(of => (
                    <TableRow key={of.idOferta} hover>
                      <TableCell>{of.idOferta}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{of.nombre}</TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {of.categoriaEvento?.evento?.nombre}
                        </Typography>
                        <Chip label={of.categoriaEvento?.categoria?.nombre} size="small" color="primary" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {of.modalidadArea?.modalidad?.nombre} / {of.modalidadArea?.area?.nombre}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={of.estado ? 'Activa' : 'Inactiva'} color={of.estado ? 'success' : 'default'} size="small" />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton color="info" size="small" onClick={() => { setViewOferta(of); setOpenViewOferta(true); }}>
                          <EyeOutlined />
                        </IconButton>
                        <IconButton color="primary" size="small" onClick={() => handleOpenEditOferta(of)}>
                          <EditOutlined />
                        </IconButton>
                        <IconButton color="error" size="small" onClick={() => handleDeleteOferta(of.idOferta)}>
                          <DeleteOutlined />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {ofertas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        Sin ofertas registradas.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* ── Tab 1: Carreras Autorizadas ── */}
          {tab === 1 && (
            <TableContainer component={Paper} elevation={0}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width={60}>ID</TableCell>
                    <TableCell>Oferta</TableCell>
                    <TableCell>Facultad</TableCell>
                    <TableCell>Carrera</TableCell>
                    <TableCell>Plan</TableCell>
                    <TableCell width={100}>Estado</TableCell>
                    <TableCell align="right" width={110}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {oecList.map(oec => (
                    <TableRow key={oec.id} hover>
                      <TableCell>{oec.id}</TableCell>
                      <TableCell>
                        <Chip label={oec.oferta?.nombre} size="small" color="primary" variant="outlined" />
                      </TableCell>
                      <TableCell>{oec.entidadAcademica?.nombre}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{oec.carrera}</TableCell>
                      <TableCell>{oec.plan}</TableCell>
                      <TableCell>
                        <Chip label={oec.estado ? 'Activo' : 'Inactivo'} color={oec.estado ? 'success' : 'default'} size="small" />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton color="primary" size="small" onClick={() => handleOpenOEC(oec)}>
                          <EditOutlined />
                        </IconButton>
                        <IconButton color="error" size="small" onClick={() => handleDeleteOEC(oec.id)}>
                          <DeleteOutlined />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {oecList.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        Sin asignaciones registradas.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* ── Wizard: Nueva Oferta ── */}
      <Dialog
        open={openWizard}
        onClose={() => { setOpenWizard(false); resetWizard(); }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Nueva Oferta Académica</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 3 }}>
            <Stepper activeStep={wizardStep} alternativeLabel>
              {WIZARD_STEPS.map(label => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
          <Box sx={{ minHeight: 120, pt: 1 }}>
            {renderWizardStep()}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenWizard(false); resetWizard(); }} color="secondary">
            Cancelar
          </Button>
          {wizardStep > 0 && (
            <Button onClick={() => setWizardStep(s => s - 1)} color="inherit">
              Atrás
            </Button>
          )}
          {wizardStep < WIZARD_STEPS.length - 1 ? (
            <Button
              onClick={() => setWizardStep(s => s + 1)}
              variant="contained"
              disabled={wizardNextDisabled()}
            >
              Siguiente
            </Button>
          ) : (
            <Button
              onClick={handleWizardSubmit}
              variant="contained"
              disabled={wizardNextDisabled() || saving}
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <CheckCircleOutlined />}
            >
              {saving ? 'Guardando...' : 'Crear Oferta'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* ── Dialog: Editar Oferta ── */}
      <Dialog open={openEditOferta} onClose={() => setOpenEditOferta(false)} fullWidth maxWidth="xs">
        <DialogTitle>Editar Oferta</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {editingOferta && (
              <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Evento: {editingOferta.categoriaEvento?.evento?.nombre} · Categoría: {editingOferta.categoriaEvento?.categoria?.nombre}
                </Typography>
                <br />
                <Typography variant="caption" color="text.secondary">
                  Modalidad/Área: {editingOferta.modalidadArea?.modalidad?.nombre} / {editingOferta.modalidadArea?.area?.nombre}
                </Typography>
              </Box>
            )}
            <TextField
              label="Nombre" value={formEditOferta.nombre} fullWidth required autoFocus
              onChange={e => setFormEditOferta(p => ({ ...p, nombre: e.target.value }))}
            />
            <TextField
              label="Descripción" value={formEditOferta.descripcion} fullWidth multiline rows={3}
              onChange={e => setFormEditOferta(p => ({ ...p, descripcion: e.target.value }))}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formEditOferta.estado}
                  onChange={e => setFormEditOferta(p => ({ ...p, estado: e.target.checked }))}
                />
              }
              label={formEditOferta.estado ? 'Activa' : 'Inactiva'}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditOferta(false)} color="secondary">Cancelar</Button>
          <Button onClick={handleSaveEditOferta} variant="contained" disabled={!formEditOferta.nombre.trim() || saving}>
            {saving ? <CircularProgress size={24} color="inherit" /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog: Ver Oferta ── */}
      <Dialog open={openViewOferta} onClose={() => setOpenViewOferta(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <SolutionOutlined />
          </Avatar>
          <Box>
            <Typography variant="h6">{viewOferta?.nombre}</Typography>
            <Typography variant="caption" color="text.secondary">
              Oferta #{viewOferta?.idOferta}
            </Typography>
          </Box>
          <Box sx={{ ml: 'auto' }}>
            <Chip
              label={viewOferta?.estado ? 'ACTIVA' : 'INACTIVA'}
              color={viewOferta?.estado ? 'success' : 'default'}
              variant="outlined"
            />
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: 'background.default' }}>
          {viewOferta && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                  Evento
                </Typography>
                <Typography variant="subtitle1" sx={{ mt: 0.5 }}>
                  {viewOferta.categoriaEvento?.evento?.nombre}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1, p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                    Categoría
                  </Typography>
                  <Typography variant="subtitle1" sx={{ mt: 0.5 }}>
                    {viewOferta.categoriaEvento?.categoria?.nombre}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                    Modalidad / Área
                  </Typography>
                  <Typography variant="subtitle1" sx={{ mt: 0.5 }}>
                    {viewOferta.modalidadArea?.modalidad?.nombre} / {viewOferta.modalidadArea?.area?.nombre}
                  </Typography>
                </Box>
              </Box>
              {viewOferta.descripcion && (
                <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                    Descripción
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>{viewOferta.descripcion}</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewOferta(false)} variant="outlined">Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog: Asignación de Carrera ── */}
      <Dialog open={openOEC} onClose={() => setOpenOEC(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingOEC ? 'Editar Asignación' : 'Asignar Carrera a Oferta'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {!editingOEC && (
              <>
                <FormControl fullWidth required>
                  <InputLabel>Oferta</InputLabel>
                  <Select
                    value={formOEC.idOferta}
                    label="Oferta"
                    onChange={e => setFormOEC(p => ({ ...p, idOferta: e.target.value }))}
                  >
                    {ofertas.filter(of => of.estado).map(of => (
                      <MenuItem key={of.idOferta} value={of.idOferta}>
                        {of.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth required>
                  <InputLabel>Facultad / Entidad Académica</InputLabel>
                  <Select
                    value={formOEC.idEntidadAcademica}
                    label="Facultad / Entidad Académica"
                    onChange={e => setFormOEC(p => ({ ...p, idEntidadAcademica: e.target.value }))}
                  >
                    {entidades.filter(ea => ea.estado).map(ea => (
                      <MenuItem key={ea.idEntidadAcademica} value={ea.idEntidadAcademica}>
                        {ea.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            )}
            {editingOEC && (
              <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Oferta: {editingOEC.oferta?.nombre} · Facultad: {editingOEC.entidadAcademica?.nombre}
                </Typography>
              </Box>
            )}
            <TextField
              label="Carrera" value={formOEC.carrera} fullWidth required
              onChange={e => setFormOEC(p => ({ ...p, carrera: e.target.value }))}
            />
            <TextField
              label="Plan" value={formOEC.plan} fullWidth required
              placeholder="Ej. 188-4"
              onChange={e => setFormOEC(p => ({ ...p, plan: e.target.value }))}
            />
            {editingOEC && (
              <FormControlLabel
                control={
                  <Switch
                    checked={formOEC.estado}
                    onChange={e => setFormOEC(p => ({ ...p, estado: e.target.checked }))}
                  />
                }
                label={formOEC.estado ? 'Activo' : 'Inactivo'}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenOEC(false)} color="secondary">Cancelar</Button>
          <Button onClick={handleSaveOEC} variant="contained" disabled={!oecFormValid || saving}>
            {saving ? <CircularProgress size={24} color="inherit" /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

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
