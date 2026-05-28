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
      modalidad { idModalidad nombre }
      area      { idArea nombre }
    }
    todasLasCategorias  { idCategoria nombre estado }
    todasLasModalidades { idModalidad nombre estado }
    todasLasAreas       { idArea nombre estado }
    todasLasEntidadesAcademicas { idEntidadAcademica nombre estado }
    todosLosEventos             { idEvento nombre estado }
  }
`;

const CREATE_OFERTA = gql`
  mutation($idCategoriaEvento: ID!, $idModalidadArea: ID!, $nombre: String!, $descripcion: String) {
    crearOferta(idCategoriaEvento: $idCategoriaEvento, idModalidadArea: $idModalidadArea, nombre: $nombre, descripcion: $descripcion) {
      oferta { idOferta }
      ok error
    }
  }
`;

const CREAR_CAT_EV = gql`
  mutation($idCategoria: ID!, $idEvento: ID!) {
    crearCategoriaEvento(idCategoria: $idCategoria, idEvento: $idEvento) {
      categoriaEvento { id }
      ok error
    }
  }
`;

const CREAR_MOD_AREA = gql`
  mutation($idModalidad: ID!, $idArea: ID!) {
    crearModalidadArea(idModalidad: $idModalidad, idArea: $idArea) {
      modalidadArea { id }
      ok error
    }
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
const WIZARD_STEPS = ['Evento', 'Categoría', 'Modalidad × Área', 'Datos de la Oferta', 'Carrera Autorizada'];

const INIT_EDIT_OFERTA = { nombre: '', descripcion: '', estado: true };
const INIT_OEC         = { idOferta: '', idEntidadAcademica: '', carrera: '', plan: '' };

// ── Main component ────────────────────────────────────────────────────────────
export default function OfertasPage() {
  const [tab, setTab] = useState(0);
  const { data, loading, error, refetch } = useQuery(GET_ALL, { fetchPolicy: 'network-only' });

  const [crearOferta]    = useMutation(CREATE_OFERTA);
  const [editarOferta]   = useMutation(EDIT_OFERTA);
  const [eliminarOferta] = useMutation(DELETE_OFERTA);
  const [crearOEC]       = useMutation(CREATE_OEC);
  const [editarOEC]      = useMutation(EDIT_OEC);
  const [eliminarOEC]    = useMutation(DELETE_OEC);
  const [crearCatEv]     = useMutation(CREAR_CAT_EV);
  const [crearModArea]   = useMutation(CREAR_MOD_AREA);

  // Wizard state
  const [openWizard, setOpenWizard]           = useState(false);
  const [wizardStep, setWizardStep]           = useState(0);
  const [wizardEvento, setWizardEvento]       = useState('');
  const [wizardCategoria, setWizardCategoria] = useState('');
  const [wizardModalidad, setWizardModalidad] = useState('');
  const [wizardArea, setWizardArea]           = useState('');
  const [wizardNombre, setWizardNombre]       = useState('');
  const [wizardDesc, setWizardDesc]           = useState('');
  const [wizardEntidad, setWizardEntidad]     = useState('');
  const [wizardCarrera, setWizardCarrera]     = useState('');
  const [wizardPlan, setWizardPlan]           = useState('');
  // IDs resueltos internamente (find-or-create)
  const [resolvedCatEvId, setResolvedCatEvId]     = useState('');
  const [resolvedModAreaId, setResolvedModAreaId] = useState('');
  const [wizardAdvancing, setWizardAdvancing]     = useState(false);

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
  const categorias       = data?.todasLasCategorias           || [];
  const modalidades      = data?.todasLasModalidades          || [];
  const areas            = data?.todasLasAreas                || [];

  const showNotif = (message, severity = 'success') =>
    setNotification({ open: true, message, severity });

  // ── Wizard helpers ────────────────────────────────────────────────────────
  const resetWizard = () => {
    setWizardStep(0);
    setWizardEvento('');
    setWizardCategoria('');
    setWizardModalidad('');
    setWizardArea('');
    setWizardNombre('');
    setWizardDesc('');
    setWizardEntidad('');
    setWizardCarrera('');
    setWizardPlan('');
    setResolvedCatEvId('');
    setResolvedModAreaId('');
  };

  const wizardNextDisabled = () => {
    if (wizardAdvancing) return true;
    if (wizardStep === 0) return !wizardEvento;
    if (wizardStep === 1) return !wizardCategoria;
    if (wizardStep === 2) return !wizardModalidad || !wizardArea;
    if (wizardStep === 3) return !wizardNombre.trim();
    if (wizardStep === 4) return !wizardEntidad || !wizardCarrera.trim() || !wizardPlan.trim();
    return false;
  };

  // Avanza pasos: los pasos 1 y 2 resuelven (find-or-create) la relación antes de avanzar
  const handleWizardNext = async () => {
    if (wizardStep === 1) {
      // Buscar CategoriaEvento existente
      const existing = categoriaEventos.find(
        ce => ce.categoria?.idCategoria === wizardCategoria && ce.evento?.idEvento === wizardEvento
      );
      if (existing) {
        setResolvedCatEvId(existing.id);
        setWizardStep(2);
        return;
      }
      // Crear si no existe
      setWizardAdvancing(true);
      try {
        const res = await crearCatEv({ variables: { idCategoria: wizardCategoria, idEvento: wizardEvento } });
        const result = res.data?.crearCategoriaEvento;
        if (result?.ok) {
          setResolvedCatEvId(result.categoriaEvento.id);
          await refetch();
          setWizardStep(2);
        } else {
          showNotif(result?.error || 'Error al vincular categoría-evento', 'error');
        }
      } catch { showNotif('Error de conexión', 'error'); }
      setWizardAdvancing(false);
      return;
    }

    if (wizardStep === 2) {
      // Buscar ModalidadArea existente
      const existing = modalidadAreas.find(
        ma => ma.modalidad?.idModalidad === wizardModalidad && ma.area?.idArea === wizardArea
      );
      if (existing) {
        setResolvedModAreaId(existing.id);
        setWizardStep(3);
        return;
      }
      // Crear si no existe
      setWizardAdvancing(true);
      try {
        const res = await crearModArea({ variables: { idModalidad: wizardModalidad, idArea: wizardArea } });
        const result = res.data?.crearModalidadArea;
        if (result?.ok) {
          setResolvedModAreaId(result.modalidadArea.id);
          await refetch();
          setWizardStep(3);
        } else {
          showNotif(result?.error || 'Error al vincular modalidad-área', 'error');
        }
      } catch { showNotif('Error de conexión', 'error'); }
      setWizardAdvancing(false);
      return;
    }

    setWizardStep(s => s + 1);
  };

  // Paso final: crear Oferta + OfertaEaCarrera en secuencia
  const handleWizardFinal = async () => {
    setSaving(true);
    try {
      // 1. Crear Oferta
      const ofertaRes = await crearOferta({
        variables: {
          idCategoriaEvento: resolvedCatEvId,
          idModalidadArea:   resolvedModAreaId,
          nombre:            wizardNombre,
          descripcion:       wizardDesc,
        }
      });
      const ofertaResult = ofertaRes.data?.crearOferta;
      if (!ofertaResult?.ok) {
        showNotif(ofertaResult?.error || 'Error al crear oferta', 'error');
        setSaving(false);
        return;
      }
      const idNuevaOferta = ofertaResult.oferta.idOferta;

      // 2. Crear OfertaEaCarrera (carrera autorizada)
      const oecRes = await crearOEC({
        variables: {
          idOferta:            idNuevaOferta,
          idEntidadAcademica:  wizardEntidad,
          carrera:             wizardCarrera,
          plan:                wizardPlan,
        }
      });
      const oecResult = oecRes.data?.crearOfertaEaCarrera;
      if (!oecResult?.ok) {
        showNotif(oecResult?.error || 'Error al asignar carrera', 'error');
        setSaving(false);
        return;
      }

      showNotif('Oferta y carrera autorizada creadas exitosamente');
      await refetch();
      setOpenWizard(false);
      resetWizard();
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
            <Select value={wizardEvento} label="Evento"
              onChange={e => { setWizardEvento(e.target.value); setWizardCategoria(''); }}>
              {eventos.filter(ev => ev.estado).map(ev => (
                <MenuItem key={ev.idEvento} value={ev.idEvento}>{ev.nombre}</MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 1:
        return (
          <FormControl fullWidth required>
            <InputLabel>Categoría</InputLabel>
            <Select value={wizardCategoria} label="Categoría"
              onChange={e => setWizardCategoria(e.target.value)}>
              {categorias.filter(c => c.estado).map(c => (
                <MenuItem key={c.idCategoria} value={c.idCategoria}>{c.nombre}</MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 2:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth required>
              <InputLabel>Modalidad</InputLabel>
              <Select value={wizardModalidad} label="Modalidad"
                onChange={e => setWizardModalidad(e.target.value)}>
                {modalidades.filter(m => m.estado).map(m => (
                  <MenuItem key={m.idModalidad} value={m.idModalidad}>{m.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel>Área</InputLabel>
              <Select value={wizardArea} label="Área"
                onChange={e => setWizardArea(e.target.value)}>
                {areas.filter(a => a.estado).map(a => (
                  <MenuItem key={a.idArea} value={a.idArea}>{a.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        );

      case 3: {
        const selEvento    = eventos.find(ev => ev.idEvento === wizardEvento);
        const selCategoria = categorias.find(c => c.idCategoria === wizardCategoria);
        const selModalidad = modalidades.find(m => m.idModalidad === wizardModalidad);
        const selArea      = areas.find(a => a.idArea === wizardArea);
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                Resumen de selección
              </Typography>
              <Typography variant="body2"><strong>Evento:</strong> {selEvento?.nombre}</Typography>
              <Typography variant="body2"><strong>Categoría:</strong> {selCategoria?.nombre}</Typography>
              <Typography variant="body2"><strong>Modalidad / Área:</strong> {selModalidad?.nombre} / {selArea?.nombre}</Typography>
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

      case 4:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info" sx={{ mb: 0.5 }}>
              Asigna la carrera y entidad que podrán inscribir proyectos a esta oferta.
            </Alert>
            <FormControl fullWidth required>
              <InputLabel>Facultad / Entidad Académica</InputLabel>
              <Select value={wizardEntidad} label="Facultad / Entidad Académica"
                onChange={e => setWizardEntidad(e.target.value)}>
                {entidades.filter(ea => ea.estado).map(ea => (
                  <MenuItem key={ea.idEntidadAcademica} value={ea.idEntidadAcademica}>
                    {ea.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Carrera" value={wizardCarrera} fullWidth required
              onChange={e => setWizardCarrera(e.target.value)}
            />
            <TextField
              label="Plan" value={wizardPlan} fullWidth required
              onChange={e => setWizardPlan(e.target.value)}
            />
          </Box>
        );

      default: return null;
    }
  };

  const tabActions = [
    <Button key="of" variant="contained" startIcon={<PlusOutlined />} onClick={() => { resetWizard(); setOpenWizard(true); }}>
      Nueva Oferta
    </Button>,
    null,
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
            <Button onClick={() => setWizardStep(s => s - 1)} color="inherit" disabled={wizardAdvancing || saving}>
              Atrás
            </Button>
          )}
          {wizardStep < WIZARD_STEPS.length - 1 ? (
            <Button
              onClick={handleWizardNext}
              variant="contained"
              disabled={wizardNextDisabled()}
              startIcon={wizardAdvancing ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {wizardAdvancing ? 'Procesando...' : 'Siguiente'}
            </Button>
          ) : (
            <Button
              onClick={handleWizardFinal}
              variant="contained"
              disabled={wizardNextDisabled() || saving}
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <CheckCircleOutlined />}
            >
              {saving ? 'Creando...' : 'Crear Oferta y Carrera'}
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
      <Dialog open={openViewOferta} onClose={() => setOpenViewOferta(false)} fullWidth maxWidth="md">
        {viewOferta && (() => {
          const viewOECs = oecList.filter(oec => oec.oferta?.idOferta === viewOferta.idOferta);
          return (
            <>
              {/* ── Cabecera ── */}
              <DialogTitle sx={{ p: 0 }}>
                <Box sx={{
                  px: 3, py: 2.5, display: 'flex', alignItems: 'center', gap: 2,
                  borderBottom: '1px solid', borderColor: 'divider',
                  background: 'linear-gradient(135deg, rgba(24,144,255,0.06) 0%, transparent 60%)',
                }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 52, height: 52 }}>
                    <SolutionOutlined style={{ fontSize: 24 }} />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h5" fontWeight={700}>{viewOferta.nombre}</Typography>
                    <Typography variant="caption" color="text.secondary">Oferta Académica #{viewOferta.idOferta}</Typography>
                  </Box>
                  <Chip
                    label={viewOferta.estado ? 'ACTIVA' : 'INACTIVA'}
                    color={viewOferta.estado ? 'success' : 'default'}
                    variant="filled" size="small"
                    sx={{ fontWeight: 700, letterSpacing: 0.5 }}
                  />
                </Box>
              </DialogTitle>

              <DialogContent sx={{ p: 3, bgcolor: 'background.default' }}>
                {/* ── Bloque 1: Evento ── */}
                <Box sx={{ mb: 2.5 }}>
                  <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
                    Evento Asociado
                  </Typography>
                  <Box sx={{
                    mt: 0.75, p: 2, bgcolor: 'background.paper',
                    borderRadius: 2, border: '1px solid', borderColor: 'divider',
                    display: 'flex', alignItems: 'center', gap: 1.5
                  }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', flexShrink: 0 }} />
                    <Typography variant="subtitle1" fontWeight={600}>
                      {viewOferta.categoriaEvento?.evento?.nombre || '—'}
                    </Typography>
                  </Box>
                </Box>

                {/* ── Bloque 2: Categoría + Modalidad/Área ── */}
                <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
                      Categoría
                    </Typography>
                    <Box sx={{ mt: 0.75, p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                      <Chip
                        label={viewOferta.categoriaEvento?.categoria?.nombre || '—'}
                        color="primary" variant="outlined" size="small"
                      />
                    </Box>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
                      Modalidad / Área
                    </Typography>
                    <Box sx={{ mt: 0.75, p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="body2" fontWeight={500}>
                        {viewOferta.modalidadArea?.modalidad?.nombre || '—'}
                      </Typography>
                      <Chip
                        label={viewOferta.modalidadArea?.area?.nombre || '—'}
                        size="small" variant="outlined" sx={{ mt: 0.5 }}
                      />
                    </Box>
                  </Box>
                </Box>

                {/* ── Bloque 3: Descripción ── */}
                {viewOferta.descripcion && (
                  <Box sx={{ mb: 2.5 }}>
                    <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
                      Descripción
                    </Typography>
                    <Box sx={{ mt: 0.75, p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                        {viewOferta.descripcion}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* ── Bloque 4: Carreras Autorizadas ── */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
                    <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
                      Carreras Autorizadas
                    </Typography>
                    <Chip label={`${viewOECs.length} carrera${viewOECs.length !== 1 ? 's' : ''}`} size="small" color="secondary" variant="outlined" />
                  </Box>
                  {viewOECs.length === 0 ? (
                    <Alert severity="warning" sx={{ borderRadius: 2 }}>
                      Esta oferta aún no tiene carreras autorizadas asignadas.
                    </Alert>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {viewOECs.map(oec => (
                        <Box key={oec.id} sx={{
                          p: 2, bgcolor: 'background.paper', borderRadius: 2,
                          border: '1px solid', borderColor: 'divider',
                          display: 'flex', alignItems: 'center', gap: 2,
                        }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" fontWeight={600}>{oec.carrera}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {oec.entidadAcademica?.nombre} · Plan: {oec.plan}
                            </Typography>
                          </Box>
                          <Chip
                            label={oec.estado ? 'Activo' : 'Inactivo'}
                            color={oec.estado ? 'success' : 'default'}
                            size="small" variant="outlined"
                          />
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              </DialogContent>

              <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={() => setOpenViewOferta(false)} variant="outlined">Cerrar</Button>
              </DialogActions>
            </>
          );
        })()}
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
