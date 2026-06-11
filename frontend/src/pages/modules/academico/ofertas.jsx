import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
  Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Switch,
  FormControlLabel, Snackbar, Alert, CircularProgress, Tabs, Tab, Chip,
  FormControl, InputLabel, Select, MenuItem, Stepper, Step, StepLabel,
  Typography, Divider, Avatar, Pagination, Grid
} from '@mui/material';
import {
  EditOutlined, DeleteOutlined, PlusOutlined, EyeOutlined,
  SolutionOutlined, IdcardOutlined, CheckCircleOutlined,
  StopOutlined, RedoOutlined, ReloadOutlined, SearchOutlined
} from '@ant-design/icons';
import MainCard from 'components/MainCard';

// ── Helpers ───────────────────────────────────────────────────────────────────
const MEDIA_BASE = 'http://localhost:8000/media/';
const imgUrl = (path) => (path ? `${MEDIA_BASE}${path}` : null);

// ── GQL ──────────────────────────────────────────────────────────────────────
const GET_ALL = gql`
  query {
    todasLasOfertas {
      idOferta nombre descripcion estado
      categoriaEvento {
        id
        categoria { idCategoria nombre }
        evento    {
          idEvento nombre version gestion
          membrete {
            idMembrete titulo subtitulo direccion
            piePagina1 piePagina2 piePagina3
            logoUnidad logoInstitucion firma selloAutoridad
          }
        }
      }
      modalidadArea {
        id
        modalidad { idModalidad nombre }
        area      { idArea nombre }
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
      evento    { idEvento nombre version }
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
    todosLosEventos             { idEvento nombre version estado }
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
  mutation($idOferta: ID!, $idCategoriaEvento: ID, $idModalidadArea: ID, $nombre: String, $descripcion: String, $estado: Boolean) {
    editarOferta(idOferta: $idOferta, idCategoriaEvento: $idCategoriaEvento, idModalidadArea: $idModalidadArea, nombre: $nombre, descripcion: $descripcion, estado: $estado) { ok error }
  }
`;
const DELETE_OFERTA = gql`
  mutation($idOferta: ID!) { eliminarOferta(idOferta: $idOferta) { ok error } }
`;

const CREATE_OEC = gql`
  mutation($idOferta: ID!, $idEntidadAcademica: ID!, $carrera: String, $plan: String) {
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

const INIT_EDIT_OFERTA = { nombre: '', descripcion: '', estado: true, evento: '', categoria: '', modalidad: '', area: '' };
const INIT_OEC         = { idOferta: '', idEntidadAcademica: '', carrera: '', plan: '' };

function CustomPagination({ count, rowsPerPage, page, onPageChange, onRowsPerPageChange }) {
  const totalPages = Math.ceil(count / rowsPerPage);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" color="text.secondary">Mostrar</Typography>
        <Select
          size="small"
          value={rowsPerPage}
          onChange={onRowsPerPageChange}
          sx={{
            minWidth: 65, height: 32, borderRadius: '6px', bgcolor: 'transparent',
            '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
            '.MuiSelect-select': { py: 0.5, px: 1.5, fontSize: '0.875rem', color: 'text.primary' }
          }}
        >
          <MenuItem value={5}>5</MenuItem>
          <MenuItem value={10}>10</MenuItem>
          <MenuItem value={25}>25</MenuItem>
        </Select>
        <Typography variant="body2" color="text.secondary">registros</Typography>
      </Box>
      <Pagination 
        count={totalPages} page={page + 1} onChange={(e, value) => onPageChange(e, value - 1)}
        shape="rounded" color="primary"
        sx={{
          '& .MuiPaginationItem-root': { bgcolor: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'text.secondary', borderRadius: '6px', minWidth: 32, height: 32 },
          '& .Mui-selected': { bgcolor: '#1677ff !important', color: '#fff', border: 'none', boxShadow: '0 2px 8px rgba(22, 119, 255, 0.4)' }
        }}
      />
    </Box>
  );
}

function StatusIcon({ type }) {
  if (type === 'error') return <StopOutlined style={{ fontSize: 50, color: '#ff4d4f' }} />;
  return <RedoOutlined style={{ fontSize: 50, color: '#52c41a' }} />;
}

function ConfirmDialog({ open, title, message, onConfirm, onClose, loading, type = 'error' }) {
  const isError = type === 'error';
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.12)' } }}>
      <Box sx={{ pt: 5, pb: 1, textAlign: 'center', position: 'relative' }}>
        <Box sx={{
          position: 'absolute', left: '50%', top: 16, transform: 'translateX(-50%)',
          width: 130, height: 130, borderRadius: '50%',
          background: isError ? 'radial-gradient(circle, rgba(255,77,79,0.1) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(82,196,26,0.1) 0%, transparent 70%)',
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

// ── Main component ────────────────────────────────────────────────────────────
export default function OfertasPage() {
  const [tab, setTab] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchNombre, setSearchNombre] = useState('');
  const [searchEstado, setSearchEstado] = useState('Todos');
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
    if (wizardStep === 4) return !wizardEntidad;
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
    setFormEditOferta({ 
      nombre: oferta.nombre, 
      descripcion: oferta.descripcion || '', 
      estado: oferta.estado,
      evento: oferta.categoriaEvento?.evento?.idEvento || '',
      categoria: oferta.categoriaEvento?.categoria?.idCategoria || '',
      modalidad: oferta.modalidadArea?.modalidad?.idModalidad || '',
      area: oferta.modalidadArea?.area?.idArea || ''
    });
    setOpenEditOferta(true);
  };

  const handleSaveEditOferta = async () => {
    setSaving(true);
    try {
      let catEvId = editingOferta.categoriaEvento?.id;
      if (formEditOferta.evento !== editingOferta.categoriaEvento?.evento?.idEvento || 
          formEditOferta.categoria !== editingOferta.categoriaEvento?.categoria?.idCategoria) {
         const existing = categoriaEventos.find(
           ce => ce.categoria?.idCategoria === formEditOferta.categoria && ce.evento?.idEvento === formEditOferta.evento
         );
         if (existing) {
           catEvId = existing.id;
         } else {
           const res = await crearCatEv({ variables: { idCategoria: formEditOferta.categoria, idEvento: formEditOferta.evento } });
           if (res.data?.crearCategoriaEvento?.ok) catEvId = res.data.crearCategoriaEvento.categoriaEvento.id;
           else throw new Error(res.data?.crearCategoriaEvento?.error || "Error al crear categoría-evento");
         }
      }

      let modAreaId = editingOferta.modalidadArea?.id;
      if (formEditOferta.modalidad !== editingOferta.modalidadArea?.modalidad?.idModalidad || 
          formEditOferta.area !== editingOferta.modalidadArea?.area?.idArea) {
         const existing = modalidadAreas.find(
           ma => ma.modalidad?.idModalidad === formEditOferta.modalidad && ma.area?.idArea === formEditOferta.area
         );
         if (existing) {
           modAreaId = existing.id;
         } else {
           const res = await crearModArea({ variables: { idModalidad: formEditOferta.modalidad, idArea: formEditOferta.area } });
           if (res.data?.crearModalidadArea?.ok) modAreaId = res.data.crearModalidadArea.modalidadArea.id;
           else throw new Error(res.data?.crearModalidadArea?.error || "Error al crear modalidad-área");
         }
      }

      const res = await editarOferta({
        variables: { 
          idOferta: editingOferta.idOferta, 
          idCategoriaEvento: catEvId,
          idModalidadArea: modAreaId,
          nombre: formEditOferta.nombre, 
          descripcion: formEditOferta.descripcion, 
          estado: formEditOferta.estado 
        }
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

  const [confirmDlg, setConfirmDlg] = useState({ open: false, title: '', message: '', onConfirm: async () => {}, type: 'error' });
  const [confirming, setConfirming] = useState(false);

  const handleToggleEstadoOferta = (row) => {
    const isActiva = row.estado;
    setConfirmDlg({
      open: true,
      title: isActiva ? `¿Desactivar Oferta?` : `¿Restaurar Oferta?`,
      message: isActiva 
        ? `¿Deseas desactivar la oferta "${row.nombre}"? Esta acción la marcará como inactiva.` 
        : `¿Deseas restaurar la oferta "${row.nombre}"? Volverá a estar activa.`,
      type: isActiva ? 'error' : 'success',
      onConfirm: async () => {
        setConfirming(true);
        try {
          const res = isActiva
            ? await eliminarOferta({ variables: { idOferta: row.idOferta } })
            : await editarOferta({ variables: { idOferta: row.idOferta, estado: true } });
          const result = isActiva ? res.data?.eliminarOferta : res.data?.editarOferta;
          if (result?.ok) {
            showNotif(`Oferta ${isActiva ? 'desactivada' : 'restaurada'}`);
            refetch();
          } else {
            showNotif(result?.error || 'Error en la operación', 'error');
          }
        } catch { showNotif('Error de conexión', 'error'); }
        setConfirming(false);
        setConfirmDlg(p => ({ ...p, open: false }));
      }
    });
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

  const handleToggleEstadoOEC = (row) => {
    const isActiva = row.estado;
    const nombreCarrera = row.carrera;
    setConfirmDlg({
      open: true,
      title: isActiva ? `¿Desactivar Asignación?` : `¿Restaurar Asignación?`,
      message: isActiva 
        ? `¿Deseas desactivar la asignación de la carrera "${nombreCarrera}"?` 
        : `¿Deseas restaurar la asignación de la carrera "${nombreCarrera}"?`,
      type: isActiva ? 'error' : 'success',
      onConfirm: async () => {
        setConfirming(true);
        try {
          const res = isActiva
            ? await eliminarOEC({ variables: { idOfertaEaCarrera: row.id } })
            : await editarOEC({ variables: { idOfertaEaCarrera: row.id, estado: true } });
          const result = isActiva ? res.data?.eliminarOfertaEaCarrera : res.data?.editarOfertaEaCarrera;
          if (result?.ok) {
            showNotif(`Asignación ${isActiva ? 'desactivada' : 'restaurada'}`);
            refetch();
          } else {
            showNotif(result?.error || 'Error en la operación', 'error');
          }
        } catch { showNotif('Error de conexión', 'error'); }
        setConfirming(false);
        setConfirmDlg(p => ({ ...p, open: false }));
      }
    });
  };

  const oecFormValid = !editingOEC
    ? (formOEC.idOferta && formOEC.idEntidadAcademica)
    : true;

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
                <MenuItem key={ev.idEvento} value={ev.idEvento}>{ev.nombre} v{ev.version}</MenuItem>
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
              <Typography variant="body2"><strong>Evento:</strong> {selEvento?.nombre} v{selEvento?.version}</Typography>
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

      case 4: {
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
              <Typography variant="body2"><strong>Evento:</strong> {selEvento?.nombre} v{selEvento?.version}</Typography>
              <Typography variant="body2"><strong>Categoría:</strong> {selCategoria?.nombre}</Typography>
              <Typography variant="body2"><strong>Modalidad / Área:</strong> {selModalidad?.nombre} / {selArea?.nombre}</Typography>
              <Typography variant="body2"><strong>Oferta:</strong> {wizardNombre}</Typography>
            </Box>
            <Divider />
            <Alert severity="info" sx={{ mb: 0.5 }}>
              Asigna la entidad que podrá inscribir proyectos a esta oferta. Seleccionar carrera y plan es opcional.
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
              label="Carrera (Opcional)" value={wizardCarrera} fullWidth
              placeholder="ej. 187 - Ingeniería de Sistemas"
              onChange={e => setWizardCarrera(e.target.value)}
              helperText="Escribe el código de la carrera seguido del nombre"
            />
            <TextField
              label="Plan (Opcional)" value={wizardPlan} fullWidth
              placeholder="ej. 4"
              onChange={e => setWizardPlan(e.target.value)}
              helperText="Ingresa solo el número de plan si aplica"
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
    <Button key="ca" variant="contained" startIcon={<PlusOutlined />} onClick={() => handleOpenOEC()}>
      Asignar Carrera
    </Button>,
  ];

  const filteredOfertas = ofertas.filter((item) => {
    const matchNombre = searchNombre ? item.nombre?.toLowerCase().includes(searchNombre.toLowerCase()) : true;
    const matchEstado = searchEstado !== 'Todos' ? (searchEstado === 'Activo' ? item.estado : !item.estado) : true;
    return matchNombre && matchEstado;
  });
  const paginatedOfertas = filteredOfertas.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const filteredOec = oecList.filter((item) => {
    const matchNombre = searchNombre ? (item.carrera?.toLowerCase().includes(searchNombre.toLowerCase()) || item.oferta?.nombre?.toLowerCase().includes(searchNombre.toLowerCase())) : true;
    const matchEstado = searchEstado !== 'Todos' ? (searchEstado === 'Activo' ? item.estado : !item.estado) : true;
    return matchNombre && matchEstado;
  });
  const paginatedOec = filteredOec.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <MainCard title="Ofertas Académicas" secondary={tabActions[tab]}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => { setTab(v); setPage(0); setSearchNombre(''); setSearchEstado('Todos'); }}>
          <Tab label="Gestión de Ofertas"   icon={<SolutionOutlined />} iconPosition="start" />
          <Tab label="Carreras Autorizadas" icon={<IdcardOutlined />}   iconPosition="start" />
        </Tabs>
      </Box>

      <Box sx={{ px: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              size="small" fullWidth
              placeholder="Buscar por nombre..."
              value={searchNombre}
              onChange={(e) => { setSearchNombre(e.target.value); setPage(0); }}
              InputProps={{ startAdornment: <SearchOutlined style={{ color: '#888', marginRight: 8 }} /> }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField 
              fullWidth size="small" select label="Estado" 
              value={searchEstado} onChange={e => { setSearchEstado(e.target.value); setPage(0); }}
            >
              <MenuItem value="Todos">Todos</MenuItem>
              <MenuItem value="Activo">Activo</MenuItem>
              <MenuItem value="Inactivo">Inactivo</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error">Error al cargar datos: {error.message}</Alert>
      ) : (
        <>
          {/* ── Tab 0: Ofertas ── */}
          {tab === 0 && (
            <>
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
                  {paginatedOfertas.map(of => (
                    <TableRow key={of.idOferta} hover>
                      <TableCell>{of.idOferta}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{of.nombre}</TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {of.categoriaEvento?.evento?.nombre} v{of.categoriaEvento?.evento?.version}
                        </Typography>
                        <Chip label={of.categoriaEvento?.categoria?.nombre} size="small" color="primary" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {of.modalidadArea?.modalidad?.nombre} / {of.modalidadArea?.area?.nombre}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={of.estado ? 'Activa' : 'Inactiva'} color={of.estado ? 'success' : 'error'} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          <IconButton color="info" size="small" onClick={() => { setViewOferta(of); setOpenViewOferta(true); }}>
                            <EyeOutlined />
                          </IconButton>
                          <IconButton color="primary" size="small" onClick={() => handleOpenEditOferta(of)}>
                            <EditOutlined />
                          </IconButton>
                          <IconButton color={of.estado ? "error" : "success"} size="small" onClick={() => handleToggleEstadoOferta(of)}>
                            {of.estado ? <DeleteOutlined /> : <ReloadOutlined />}
                          </IconButton>
                        </Box>
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
            {filteredOfertas.length > 0 && (
              <CustomPagination 
                count={filteredOfertas.length} rowsPerPage={rowsPerPage} page={page} 
                onPageChange={(_, p) => setPage(p)} onRowsPerPageChange={e => { setRowsPerPage(e.target.value); setPage(0); }} 
              />
            )}
            </>
          )}

          {/* ── Tab 1: Carreras Autorizadas ── */}
          {tab === 1 && (
            <>
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
                  {paginatedOec.map(oec => (
                    <TableRow key={oec.id} hover>
                      <TableCell>{oec.id}</TableCell>
                      <TableCell>
                        <Chip label={oec.oferta?.nombre} size="small" color="primary" variant="outlined" />
                      </TableCell>
                      <TableCell>{oec.entidadAcademica?.nombre}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{oec.carrera}</TableCell>
                      <TableCell>{oec.plan}</TableCell>
                      <TableCell>
                        <Chip label={oec.estado ? 'Activo' : 'Inactivo'} color={oec.estado ? 'success' : 'error'} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          <IconButton color="primary" size="small" onClick={() => handleOpenOEC(oec)}>
                            <EditOutlined />
                          </IconButton>
                          <IconButton color={oec.estado ? "error" : "success"} size="small" onClick={() => handleToggleEstadoOEC(oec)}>
                            {oec.estado ? <DeleteOutlined /> : <ReloadOutlined />}
                          </IconButton>
                        </Box>
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
            {filteredOec.length > 0 && (
              <CustomPagination 
                count={filteredOec.length} rowsPerPage={rowsPerPage} page={page} 
                onPageChange={(_, p) => setPage(p)} onRowsPerPageChange={e => { setRowsPerPage(e.target.value); setPage(0); }} 
              />
            )}
            </>
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
            <FormControl fullWidth required>
              <InputLabel>Evento</InputLabel>
              <Select value={formEditOferta.evento} label="Evento"
                onChange={e => setFormEditOferta(p => ({ ...p, evento: e.target.value }))}>
                {eventos.filter(ev => ev.estado).map(ev => (
                  <MenuItem key={ev.idEvento} value={ev.idEvento}>{ev.nombre} v{ev.version}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel>Categoría</InputLabel>
              <Select value={formEditOferta.categoria} label="Categoría"
                onChange={e => setFormEditOferta(p => ({ ...p, categoria: e.target.value }))}>
                {categorias.filter(c => c.estado).map(c => (
                  <MenuItem key={c.idCategoria} value={c.idCategoria}>{c.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel>Modalidad</InputLabel>
              <Select value={formEditOferta.modalidad} label="Modalidad"
                onChange={e => setFormEditOferta(p => ({ ...p, modalidad: e.target.value }))}>
                {modalidades.filter(m => m.estado).map(m => (
                  <MenuItem key={m.idModalidad} value={m.idModalidad}>{m.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel>Área</InputLabel>
              <Select value={formEditOferta.area} label="Área"
                onChange={e => setFormEditOferta(p => ({ ...p, area: e.target.value }))}>
                {areas.filter(a => a.estado).map(a => (
                  <MenuItem key={a.idArea} value={a.idArea}>{a.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
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
                    color={viewOferta.estado ? 'success' : 'error'}
                    variant="outlined" size="small"
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
                      {viewOferta.categoriaEvento?.evento?.nombre ? `${viewOferta.categoriaEvento.evento.nombre} v${viewOferta.categoriaEvento.evento.version}` : '—'}
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
                            color={oec.estado ? 'success' : 'error'}
                            size="small" variant="outlined"
                          />
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>

                {/* ── Bloque 5: Membrete del Evento ── */}
                {(() => {
                  const membrete = viewOferta.categoriaEvento?.evento?.membrete;
                  if (!membrete) return null;

                  const pies = [membrete.piePagina1, membrete.piePagina2, membrete.piePagina3].filter(Boolean);

                  return (
                    <Box sx={{ mt: 2.5 }}>
                      <Divider sx={{ mb: 2 }} />
                      <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
                        Membrete del Evento
                      </Typography>

                      {/* Vista previa — solo texto */}
                      <Box sx={{
                        mt: 1, border: '1px solid', borderColor: 'primary.light',
                        borderRadius: 2, overflow: 'hidden',
                        background: 'linear-gradient(135deg, rgba(24,144,255,0.03) 0%, transparent 60%)',
                      }}>
                        {/* Cabecera: título central */}
                        <Box sx={{
                          px: 2.5, py: 1.5, textAlign: 'center',
                          borderBottom: '2px solid', borderColor: 'primary.main',
                        }}>
                          <Typography variant="subtitle2" fontWeight={700} sx={{ lineHeight: 1.3 }}>
                            {membrete.titulo}
                          </Typography>
                          {membrete.subtitulo && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {membrete.subtitulo}
                            </Typography>
                          )}
                          {membrete.direccion && (
                            <Typography variant="caption" color="text.disabled" display="block">
                              {membrete.direccion}
                            </Typography>
                          )}
                        </Box>

                        {/* Pie de página — solo texto */}
                        {pies.length > 0 && (
                          <Box sx={{ px: 2.5, py: 1, textAlign: 'center', bgcolor: 'action.hover' }}>
                            {pies.map((p, i) => (
                              <Typography key={i} variant="caption" color="text.secondary" display="block" sx={{ fontSize: 9, lineHeight: 1.4 }}>
                                {p}
                              </Typography>
                            ))}
                          </Box>
                        )}
                      </Box>

                      {/* Galería de imágenes — 4 en fila */}
                      {(() => {
                        const imgs = [
                          { label: 'Logo Unidad',      src: imgUrl(membrete.logoUnidad) },
                          { label: 'Logo Institución', src: imgUrl(membrete.logoInstitucion) },
                          { label: 'Firma',            src: imgUrl(membrete.firma) },
                          { label: 'Sello Autoridad',  src: imgUrl(membrete.selloAutoridad) },
                        ].filter(i => i.src);
                        if (imgs.length === 0) return null;
                        return (
                          <Box sx={{ mt: 1.5, display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                            {imgs.map(({ label, src }) => (
                              <Box key={label} sx={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5,
                                p: 1, bgcolor: 'background.paper', borderRadius: 1.5,
                                border: '1px solid', borderColor: 'divider', minWidth: 80,
                              }}>
                                <Box component="img" src={src} alt={label}
                                  sx={{ height: 52, maxWidth: 90, objectFit: 'contain', borderRadius: 1 }}
                                  onError={e => { e.target.style.display = 'none'; }}
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                                  {label}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        );
                      })()}

                    </Box>
                  );
                })()}

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

      <ConfirmDialog 
        open={confirmDlg.open} 
        title={confirmDlg.title} 
        message={confirmDlg.message} 
        type={confirmDlg.type}
        loading={confirming}
        onClose={() => setConfirmDlg(p => ({ ...p, open: false }))}
        onConfirm={confirmDlg.onConfirm}
      />
    </MainCard>
  );
}
