import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
  Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Switch,
  FormControlLabel, Snackbar, Alert, CircularProgress, Tabs, Tab, Chip,
  FormControl, InputLabel, Select, MenuItem, Stepper, Step, StepLabel,
  Typography, Divider, Avatar, Pagination, Grid, Tooltip, Checkbox
} from '@mui/material';
import {
  EditOutlined, DeleteOutlined, PlusOutlined, EyeOutlined,
  SolutionOutlined, IdcardOutlined, CheckCircleOutlined,
  StopOutlined, RedoOutlined, ReloadOutlined, SearchOutlined, ClearOutlined,
  CaretRightOutlined, CaretDownOutlined
} from '@ant-design/icons';
import MainCard from 'components/MainCard';

// ── Helpers ───────────────────────────────────────────────────────────────────
const MEDIA_BASE = 'http://localhost:8000/media/';
const imgUrl = (path) => (path ? `${MEDIA_BASE}${path}` : null);

// ── GQL ──────────────────────────────────────────────────────────────────────
const GET_ALL = gql`
  query {
    todasLasOfertas {
      idOferta descripcion estado
      categoriaEvento {
        id
        categoria { idCategoria nombre }
        evento    {
          idEvento nombre version gestion
          membretes {
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
      id estado
      oferta {
        idOferta
        categoriaEvento {
          categoria { nombre }
          evento    { nombre version }
        }
        modalidadArea {
          modalidad { nombre }
          area      { nombre }
        }
      }
      eaCarrera {
        id
        entidadAcademica { idEntidadAcademica nombre }
        carrera          { idCarrera nombre plan }
      }
    }
    todosLosEaCarreras {
      id
      entidadAcademica { idEntidadAcademica nombre }
      carrera          { idCarrera nombre plan }
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
  mutation($idCategoriaEvento: ID!, $idModalidadArea: ID!, $descripcion: String) {
    crearOferta(idCategoriaEvento: $idCategoriaEvento, idModalidadArea: $idModalidadArea, descripcion: $descripcion) {
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
  mutation($idOferta: ID!, $idCategoriaEvento: ID, $idModalidadArea: ID, $descripcion: String, $estado: Boolean) {
    editarOferta(idOferta: $idOferta, idCategoriaEvento: $idCategoriaEvento, idModalidadArea: $idModalidadArea, descripcion: $descripcion, estado: $estado) { ok error }
  }
`;
const DELETE_OFERTA = gql`
  mutation($idOferta: ID!) { eliminarOferta(idOferta: $idOferta) { ok error } }
`;

const CREATE_OEC = gql`
  mutation($idOferta: ID!, $idEaCarrera: ID!) {
    crearOfertaEaCarrera(idOferta: $idOferta, idEaCarrera: $idEaCarrera) { ok error }
  }
`;
const EDIT_OEC = gql`
  mutation($idOfertaEaCarrera: ID!, $estado: Boolean) {
    editarOfertaEaCarrera(idOfertaEaCarrera: $idOfertaEaCarrera, estado: $estado) { ok error }
  }
`;
const DELETE_OEC = gql`
  mutation($idOfertaEaCarrera: ID!) { eliminarOfertaEaCarrera(idOfertaEaCarrera: $idOfertaEaCarrera) { ok error } }
`;

// ── Wizard steps labels ───────────────────────────────────────────────────────
const WIZARD_STEPS = ['Evento', 'Categoría', 'Modalidad × Área', 'Descripción', 'Carrera Autorizada'];

const INIT_EDIT_OFERTA = { descripcion: '', estado: true, evento: '', categoria: '', modalidad: '', area: '' };
const INIT_OEC         = { idOferta: '', idEntidadAcademica: '', idEaCarrera: '' };

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
  const [wizardDesc, setWizardDesc]           = useState('');
  const [wizardEntidades, setWizardEntidades]   = useState([]);
  const [wizardEaCarreras, setWizardEaCarreras] = useState([]);
  // IDs resueltos internamente (find-or-create)
  const [resolvedCatEvId, setResolvedCatEvId]     = useState('');
  const [resolvedModAreaId, setResolvedModAreaId] = useState('');
  const [wizardAdvancing, setWizardAdvancing]     = useState(false);

  // Edit oferta state (non-wizard)
  const [openEditOferta, setOpenEditOferta]   = useState(false);
  const [editingOferta, setEditingOferta]     = useState(null);
  const [formEditOferta, setFormEditOferta]   = useState(INIT_EDIT_OFERTA);
  // Gestión de carreras dentro del dialog de edición
  const [editAddFacultades, setEditAddFacultades]       = useState([]);
  const [editAddEaCarreras, setEditAddEaCarreras]       = useState([]);
  const [showAddCarreraInEdit, setShowAddCarreraInEdit] = useState(false);
  const [addingCarreraToEdit, setAddingCarreraToEdit]   = useState(false);
  const [expandedEditFacs, setExpandedEditFacs]         = useState(new Set());

  // View oferta
  const [openViewOferta, setOpenViewOferta] = useState(false);
  const [viewOferta, setViewOferta]         = useState(null);

  // OfertaEaCarrera state
  const [openOEC, setOpenOEC]         = useState(false);
  const [editingOEC, setEditingOEC]   = useState(null);
  const [formOEC, setFormOEC]         = useState(INIT_OEC);

  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  // Grupos expandidos (Set de idOferta)
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const toggleGroup = (id) => setExpandedGroups(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const ofertas          = data?.todasLasOfertas              || [];
  const oecList          = data?.todosLosOfertaEaCarreras     || [];
  const eaCarreras       = data?.todosLosEaCarreras           || [];
  const categoriaEventos = data?.todosLosCategoriaEventos     || [];
  const modalidadAreas   = data?.todosLosModalidadAreas       || [];
  const entidades        = data?.todasLasEntidadesAcademicas  || [];
  const eventos          = data?.todosLosEventos              || [];
  const categorias       = data?.todasLasCategorias           || [];
  const modalidades      = data?.todasLasModalidades          || [];
  const areas            = data?.todasLasAreas                || [];

  const usedEventIds = new Set(ofertas.map(of => of.categoriaEvento?.evento?.idEvento).filter(Boolean));

  const showNotif = (message, severity = 'success') =>
    setNotification({ open: true, message, severity });

  // ── Wizard helpers ────────────────────────────────────────────────────────
  const resetWizard = () => {
    setWizardStep(0);
    setWizardEvento('');
    setWizardCategoria('');
    setWizardModalidad('');
    setWizardArea('');
    setWizardDesc('');
    setWizardEntidades([]);
    setWizardEaCarreras([]);
    setResolvedCatEvId('');
    setResolvedModAreaId('');
  };

  const wizardNextDisabled = () => {
    if (wizardAdvancing) return true;
    if (wizardStep === 0) return !wizardEvento;
    if (wizardStep === 1) return !wizardCategoria;
    if (wizardStep === 2) return !wizardModalidad || !wizardArea;
    if (wizardStep === 4) return wizardEaCarreras.length === 0;
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

      // 2. Crear una OfertaEaCarrera por cada EaCarrera seleccionada
      const oecResults = await Promise.all(
        wizardEaCarreras.map(idEaCarrera =>
          crearOEC({ variables: { idOferta: idNuevaOferta, idEaCarrera } })
        )
      );
      const failed = oecResults.filter(r => !r.data?.crearOfertaEaCarrera?.ok);
      if (failed.length > 0) {
        showNotif(`Oferta creada, pero ${failed.length} carrera(s) no pudieron asignarse`, 'warning');
      } else {
        showNotif(`Oferta creada con ${wizardEaCarreras.length} carrera(s) autorizada(s)`);
      }
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

  const handleCloseEditOferta = () => {
    setOpenEditOferta(false);
    setShowAddCarreraInEdit(false);
    setEditAddFacultades([]);
    setEditAddEaCarreras([]);
    setExpandedEditFacs(new Set());
  };

  const toggleExpandEditFac = (facId) => {
    setExpandedEditFacs(prev => {
      const next = new Set(prev);
      if (next.has(facId)) next.delete(facId); else next.add(facId);
      return next;
    });
  };

  const handleAddCarrerasToEdit = async () => {
    setAddingCarreraToEdit(true);
    try {
      const results = await Promise.all(
        editAddEaCarreras.map(idEaCarrera =>
          crearOEC({ variables: { idOferta: editingOferta.idOferta, idEaCarrera } })
        )
      );
      const errors = results.filter(r => !r.data?.crearOfertaEaCarrera?.ok);
      if (errors.length === 0) {
        showNotif(`${editAddEaCarreras.length} carrera${editAddEaCarreras.length !== 1 ? 's' : ''} agregada${editAddEaCarreras.length !== 1 ? 's' : ''}`);
        refetch();
        setEditAddFacultades([]);
        setEditAddEaCarreras([]);
        setShowAddCarreraInEdit(false);
      } else {
        showNotif(`${errors.length} error(es) al agregar`, 'error');
        refetch();
      }
    } catch { showNotif('Error de conexión', 'error'); }
    setAddingCarreraToEdit(false);
  };

  const handleToggleOECInline = async (oec) => {
    try {
      let res, result;
      if (oec.estado) {
        res = await eliminarOEC({ variables: { idOfertaEaCarrera: oec.id } });
        result = res.data?.eliminarOfertaEaCarrera;
      } else {
        res = await editarOEC({ variables: { idOfertaEaCarrera: oec.id, estado: true } });
        result = res.data?.editarOfertaEaCarrera;
      }
      if (result?.ok) {
        showNotif(`Carrera ${oec.estado ? 'desactivada' : 'activada'}`);
        refetch();
      } else {
        showNotif(result?.error || 'Error', 'error');
      }
    } catch { showNotif('Error de conexión', 'error'); }
  };

  const [confirmDlg, setConfirmDlg] = useState({ open: false, title: '', message: '', onConfirm: async () => {}, type: 'error' });
  const [confirming, setConfirming] = useState(false);

  const handleToggleEstadoOferta = (row) => {
    const isActiva = row.estado;
    setConfirmDlg({
      open: true,
      title: isActiva ? `¿Desactivar Oferta?` : `¿Restaurar Oferta?`,
      message: isActiva
        ? `¿Deseas desactivar esta oferta? Esta acción la marcará como inactiva.`
        : `¿Deseas restaurar esta oferta? Volverá a estar activa.`,
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
      ? { idOferta: oec.oferta?.idOferta || '', idEntidadAcademica: oec.eaCarrera?.entidadAcademica?.idEntidadAcademica || '', idEaCarrera: oec.eaCarrera?.id || '', estado: oec.estado }
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
          variables: { idOfertaEaCarrera: editingOEC.id, estado: formOEC.estado }
        });
        result = res.data?.editarOfertaEaCarrera;
      } else {
        res = await crearOEC({ variables: { idOferta: formOEC.idOferta, idEaCarrera: formOEC.idEaCarrera } });
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
    const nombreCarrera = row.eaCarrera?.carrera?.nombre || 'esta carrera';
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
    ? (formOEC.idOferta && formOEC.idEaCarrera)
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
              {eventos.filter(ev => ev.estado && !usedEventIds.has(ev.idEvento)).map(ev => (
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

        const facDisponibles = entidades.filter(ea => ea.estado);
        const allFacIds = facDisponibles.map(ea => ea.idEntidadAcademica);
        const todasFacSel = allFacIds.length > 0 && allFacIds.every(id => wizardEntidades.includes(id));
        const algunaFacSel = wizardEntidades.length > 0 && !todasFacSel;

        const toggleFac = (id) => {
          const next = wizardEntidades.includes(id)
            ? wizardEntidades.filter(x => x !== id)
            : [...wizardEntidades, id];
          setWizardEntidades(next);
          setWizardEaCarreras([]);
        };
        const toggleTodasFac = () => {
          setWizardEntidades(todasFacSel ? [] : allFacIds);
          setWizardEaCarreras([]);
        };

        const eacFiltradas = eaCarreras.filter(
          eac => wizardEntidades.includes(eac.entidadAcademica?.idEntidadAcademica)
        );
        const allEacIds = eacFiltradas.map(eac => eac.id);
        const todasEacSel = allEacIds.length > 0 && allEacIds.every(id => wizardEaCarreras.includes(id));
        const algunaEacSel = wizardEaCarreras.length > 0 && !todasEacSel;

        const toggleEac = (id) => {
          setWizardEaCarreras(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
          );
        };
        const toggleTodasEac = () =>
          setWizardEaCarreras(todasEacSel ? [] : allEacIds);

        const rowSx = {
          px: 1.5, py: 0.75, display: 'flex', alignItems: 'center', gap: 1,
          cursor: 'pointer', '&:hover': { bgcolor: 'action.selected' },
        };
        const headerRowSx = {
          ...rowSx, py: 1,
          bgcolor: 'action.hover',
          borderBottom: '1px solid', borderColor: 'divider',
        };
        const listSx = {
          border: '1px solid', borderColor: 'divider', borderRadius: 1,
          maxHeight: 180, overflowY: 'auto', mt: 0.75,
        };

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

            {/* ── Selección de Facultades ── */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: 1 }}>
                  Facultades
                </Typography>
                {wizardEntidades.length > 0 && (
                  <Chip label={`${wizardEntidades.length} seleccionada${wizardEntidades.length !== 1 ? 's' : ''}`} size="small" color="primary" variant="outlined" />
                )}
              </Box>
              <Box sx={listSx}>
                <Box sx={headerRowSx} onClick={toggleTodasFac}>
                  <Checkbox size="small" checked={todasFacSel} indeterminate={algunaFacSel}
                    onChange={toggleTodasFac} onClick={e => e.stopPropagation()} sx={{ p: 0 }} />
                  <Typography variant="body2" fontWeight={600}>Todas las facultades</Typography>
                </Box>
                {facDisponibles.map(ea => (
                  <Box key={ea.idEntidadAcademica} sx={rowSx} onClick={() => toggleFac(ea.idEntidadAcademica)}>
                    <Checkbox size="small" checked={wizardEntidades.includes(ea.idEntidadAcademica)}
                      onChange={() => toggleFac(ea.idEntidadAcademica)} onClick={e => e.stopPropagation()} sx={{ p: 0 }} />
                    <Typography variant="body2">{ea.nombre}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* ── Selección de Carreras ── */}
            {wizardEntidades.length > 0 && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: 1 }}>
                    Carreras autorizadas
                  </Typography>
                  {wizardEaCarreras.length > 0 && (
                    <Chip label={`${wizardEaCarreras.length} seleccionada${wizardEaCarreras.length !== 1 ? 's' : ''}`} size="small" color="secondary" variant="outlined" />
                  )}
                </Box>
                {eacFiltradas.length === 0 ? (
                  <Alert severity="warning" sx={{ mt: 0.75, fontSize: '0.8rem' }}>
                    Las facultades seleccionadas no tienen carreras vinculadas.
                  </Alert>
                ) : (
                  <Box sx={listSx}>
                    <Box sx={headerRowSx} onClick={toggleTodasEac}>
                      <Checkbox size="small" checked={todasEacSel} indeterminate={algunaEacSel}
                        onChange={toggleTodasEac} onClick={e => e.stopPropagation()} sx={{ p: 0 }} />
                      <Typography variant="body2" fontWeight={600}>Todas las carreras</Typography>
                    </Box>
                    {eacFiltradas.map(eac => (
                      <Box key={eac.id} sx={rowSx} onClick={() => toggleEac(eac.id)}>
                        <Checkbox size="small" checked={wizardEaCarreras.includes(eac.id)}
                          onChange={() => toggleEac(eac.id)} onClick={e => e.stopPropagation()} sx={{ p: 0 }} />
                        <Box>
                          <Typography variant="body2">{eac.carrera?.nombre}{eac.carrera?.plan ? ` — Plan ${eac.carrera.plan}` : ''}</Typography>
                          <Typography variant="caption" color="text.secondary">{eac.entidadAcademica?.nombre}</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            )}
          </Box>
        );
      }

      default: return null;
    }
  };

  const handleClearFilters = () => {
    setSearchNombre('');
    setSearchEstado('Todos');
    setPage(0);
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
    const q = searchNombre.toLowerCase();
    const matchNombre = searchNombre ? (
      item.categoriaEvento?.evento?.nombre?.toLowerCase().includes(q) ||
      item.categoriaEvento?.categoria?.nombre?.toLowerCase().includes(q) ||
      item.modalidadArea?.modalidad?.nombre?.toLowerCase().includes(q) ||
      item.modalidadArea?.area?.nombre?.toLowerCase().includes(q)
    ) : true;
    const matchEstado = searchEstado !== 'Todos' ? (searchEstado === 'Activo' ? item.estado : !item.estado) : true;
    return matchNombre && matchEstado;
  });
  const paginatedOfertas = filteredOfertas.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const filteredOec = oecList.filter((item) => {
    const q = searchNombre.toLowerCase();
    const matchNombre = searchNombre
      ? (item.eaCarrera?.carrera?.nombre?.toLowerCase().includes(q) ||
         item.oferta?.categoriaEvento?.evento?.nombre?.toLowerCase().includes(q) ||
         item.eaCarrera?.entidadAcademica?.nombre?.toLowerCase().includes(q))
      : true;
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
              placeholder="Buscar por evento, categoría, área..."
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
          <Grid item xs={12} sm={1} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Tooltip title="Limpiar Filtros">
              <IconButton 
                onClick={handleClearFilters} 
                color="secondary" 
                sx={{ 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  borderRadius: '8px',
                  visibility: (searchNombre || searchEstado !== 'Todos') ? 'visible' : 'hidden'
                }}
              >
                <ClearOutlined />
              </IconButton>
            </Tooltip>
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
                      <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
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
          {tab === 1 && (() => {
            // Agrupar por oferta
            const gruposMap = filteredOec.reduce((acc, oec) => {
              const key = oec.oferta?.idOferta || 'sin-oferta';
              if (!acc[key]) acc[key] = { oferta: oec.oferta, items: [] };
              acc[key].items.push(oec);
              return acc;
            }, {});

            // Ordenar grupos: ofertas más recientes (mayor idOferta) primero
            const ofertaGroups = Object.values(gruposMap).sort((a, b) => {
              const idA = parseInt(a.oferta?.idOferta || 0);
              const idB = parseInt(b.oferta?.idOferta || 0);
              return idB - idA;
            });

            const paginatedGroups = ofertaGroups.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

            if (ofertaGroups.length === 0) {
              return (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  Sin asignaciones registradas.
                </Box>
              );
            }

            return (
              <Box>
                {paginatedGroups.map((grupo) => {
                  const key = grupo.oferta?.idOferta || 'sin-oferta';
                  const isOpen = expandedGroups.has(key);
                  return (
                    <Box key={key} sx={{ mb: 2 }}>
                      <Box sx={{
                        px: 2, py: 1.25, borderRadius: isOpen ? '8px 8px 0 0' : 1.5,
                        background: 'linear-gradient(135deg, rgba(24,144,255,0.08), rgba(24,144,255,0.02))',
                        border: '1px solid rgba(24,144,255,0.25)',
                        display: 'flex', alignItems: 'center', gap: 1.5,
                        cursor: 'default',
                      }}>
                        <SolutionOutlined style={{ color: '#1890ff', fontSize: 17 }} />
                        <Typography variant="subtitle2" fontWeight={700} color="primary.main" sx={{ flex: 1 }}>
                          {grupo.oferta
                            ? `${grupo.oferta.categoriaEvento?.evento?.nombre || ''} v${grupo.oferta.categoriaEvento?.evento?.version || ''} · ${grupo.oferta.categoriaEvento?.categoria?.nombre || ''} · ${grupo.oferta.modalidadArea?.modalidad?.nombre || ''} / ${grupo.oferta.modalidadArea?.area?.nombre || ''}`
                            : 'Sin oferta asignada'}
                        </Typography>
                        <Chip
                          label={
                            isOpen
                              ? `▲ ${grupo.items.length} ${grupo.items.length === 1 ? 'carrera' : 'carreras'}`
                              : `▼ ${grupo.items.length} ${grupo.items.length === 1 ? 'carrera' : 'carreras'}`
                          }
                          size="small" color="primary"
                          variant={isOpen ? 'filled' : 'outlined'}
                          onClick={() => toggleGroup(key)}
                          sx={{ cursor: 'pointer', fontWeight: 600, userSelect: 'none' }}
                        />
                      </Box>

                      {isOpen && (
                        <TableContainer component={Paper} elevation={0}
                          sx={{ border: '1px solid rgba(24,144,255,0.25)', borderTop: 'none', borderRadius: '0 0 8px 8px' }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell width={60}>ID</TableCell>
                                <TableCell>Facultad</TableCell>
                                <TableCell>Carrera</TableCell>
                                <TableCell>Plan</TableCell>
                                <TableCell width={100}>Estado</TableCell>
                                <TableCell align="right" width={110}>Acciones</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {grupo.items.map(oec => (
                                <TableRow key={oec.id} hover>
                                  <TableCell>{oec.id}</TableCell>
                                  <TableCell>{oec.eaCarrera?.entidadAcademica?.nombre}</TableCell>
                                  <TableCell sx={{ fontWeight: 500 }}>{oec.eaCarrera?.carrera?.nombre}</TableCell>
                                  <TableCell>{oec.eaCarrera?.carrera?.plan || '—'}</TableCell>
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
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </Box>
                  );
                })}
                {ofertaGroups.length > 0 && (
                  <CustomPagination 
                    count={ofertaGroups.length} rowsPerPage={rowsPerPage} page={page} 
                    onPageChange={(_, p) => setPage(p)} onRowsPerPageChange={e => { setRowsPerPage(e.target.value); setPage(0); }} 
                  />
                )}
              </Box>
            );
          })()}
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
              {saving ? 'Creando...' : `Crear Oferta (${wizardEaCarreras.length} carrera${wizardEaCarreras.length !== 1 ? 's' : ''})`}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* ── Dialog: Editar Oferta ── */}
      <Dialog open={openEditOferta} onClose={handleCloseEditOferta} fullWidth maxWidth="md">
        <DialogTitle sx={{ pb: 1 }}>Editar Oferta</DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {editingOferta && (() => {
            const editOecList = oecList.filter(oec => oec.oferta?.idOferta === editingOferta.idOferta);
            const linkedEacIds = editOecList.map(oec => oec.eaCarrera?.id);
            return (
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: 480 }}>

                {/* ── Columna izquierda: datos de la oferta ── */}
                <Box sx={{ flex: 1, p: 3, borderRight: { md: '1px solid' }, borderColor: { md: 'divider' }, display: 'flex', flexDirection: 'column', gap: 2.5 }}>

                  {/* Sección: Información general */}
                  <Box>
                    <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
                      Información General
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                      <TextField
                        label="Descripción" value={formEditOferta.descripcion} fullWidth multiline rows={2} size="small"
                        onChange={e => setFormEditOferta(p => ({ ...p, descripcion: e.target.value }))}
                      />
                      <FormControlLabel
                        control={
                          <Switch checked={formEditOferta.estado}
                            onChange={e => setFormEditOferta(p => ({ ...p, estado: e.target.checked }))} />
                        }
                        label={<Typography variant="body2">{formEditOferta.estado ? 'Activa' : 'Inactiva'}</Typography>}
                      />
                    </Box>
                  </Box>

                  <Divider />

                  {/* Sección: Configuración académica */}
                  <Box>
                    <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
                      Configuración Académica
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mt: 1 }}>
                      <FormControl fullWidth required size="small">
                        <InputLabel>Evento</InputLabel>
                        <Select value={formEditOferta.evento} label="Evento"
                          onChange={e => setFormEditOferta(p => ({ ...p, evento: e.target.value }))}>
                          {eventos.filter(ev => ev.estado && (!usedEventIds.has(ev.idEvento) || ev.idEvento === editingOferta?.categoriaEvento?.evento?.idEvento)).map(ev => (
                            <MenuItem key={ev.idEvento} value={ev.idEvento}>{ev.nombre} v{ev.version}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl fullWidth required size="small">
                        <InputLabel>Categoría</InputLabel>
                        <Select value={formEditOferta.categoria} label="Categoría"
                          onChange={e => setFormEditOferta(p => ({ ...p, categoria: e.target.value }))}>
                          {categorias.filter(c => c.estado).map(c => (
                            <MenuItem key={c.idCategoria} value={c.idCategoria}>{c.nombre}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl fullWidth required size="small">
                        <InputLabel>Modalidad</InputLabel>
                        <Select value={formEditOferta.modalidad} label="Modalidad"
                          onChange={e => setFormEditOferta(p => ({ ...p, modalidad: e.target.value }))}>
                          {modalidades.filter(m => m.estado).map(m => (
                            <MenuItem key={m.idModalidad} value={m.idModalidad}>{m.nombre}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl fullWidth required size="small">
                        <InputLabel>Área</InputLabel>
                        <Select value={formEditOferta.area} label="Área"
                          onChange={e => setFormEditOferta(p => ({ ...p, area: e.target.value }))}>
                          {areas.filter(a => a.estado).map(a => (
                            <MenuItem key={a.idArea} value={a.idArea}>{a.nombre}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  </Box>
                </Box>

                {/* ── Columna derecha: carreras autorizadas ── */}
                {(() => {
                  const groupedOecs = editOecList.reduce((acc, oec) => {
                    const facId = oec.eaCarrera?.entidadAcademica?.idEntidadAcademica || '__none__';
                    const facNombre = oec.eaCarrera?.entidadAcademica?.nombre || 'Sin facultad';
                    if (!acc[facId]) acc[facId] = { facNombre, oecs: [] };
                    acc[facId].oecs.push(oec);
                    return acc;
                  }, {});

                  const facDisponibles = entidades.filter(ea => ea.estado);
                  const allFacIds = facDisponibles.map(ea => ea.idEntidadAcademica);
                  const todasFacsEdit = allFacIds.length > 0 && allFacIds.every(id => editAddFacultades.includes(id));
                  const algunaFacEdit = editAddFacultades.length > 0 && !todasFacsEdit;

                  const eacParaAgregar = eaCarreras.filter(
                    eac => editAddFacultades.includes(eac.entidadAcademica?.idEntidadAcademica) &&
                           !linkedEacIds.includes(eac.id)
                  );
                  const allEacIdsAdd = eacParaAgregar.map(eac => eac.id);
                  const todasEacEdit = allEacIdsAdd.length > 0 && allEacIdsAdd.every(id => editAddEaCarreras.includes(id));
                  const algunaEacEdit = editAddEaCarreras.length > 0 && !todasEacEdit;

                  const toggleFacEdit = (id) => {
                    setEditAddFacultades(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
                    setEditAddEaCarreras([]);
                  };
                  const toggleTodasFacsEdit = () => {
                    setEditAddFacultades(todasFacsEdit ? [] : allFacIds);
                    setEditAddEaCarreras([]);
                  };
                  const toggleEacEdit = (id) =>
                    setEditAddEaCarreras(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
                  const toggleTodasEacEdit = () =>
                    setEditAddEaCarreras(todasEacEdit ? [] : allEacIdsAdd);

                  const listBoxSx = {
                    border: '1px solid', borderColor: 'divider', borderRadius: 1,
                    maxHeight: 150, overflowY: 'auto',
                  };
                  const rowSx = {
                    px: 1, py: 0.6, display: 'flex', alignItems: 'center', gap: 1,
                    cursor: 'pointer', '&:hover': { bgcolor: 'action.selected' },
                  };
                  const headerRowSx = {
                    ...rowSx, bgcolor: 'action.hover',
                    borderBottom: '1px solid', borderColor: 'divider',
                  };

                  return (
                    <Box sx={{ width: { xs: '100%', md: 390 }, p: 3, display: 'flex', flexDirection: 'column', gap: 1.5, borderLeft: { md: '1px solid' }, borderColor: { md: 'divider' } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
                          Carreras Autorizadas
                        </Typography>
                        <Chip label={editOecList.length} size="small" color="primary" variant="outlined" />
                      </Box>

                      {/* Lista agrupada por facultad */}
                      <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0.5, maxHeight: 280 }}>
                        {editOecList.length === 0 && !showAddCarreraInEdit && (
                          <Alert severity="info" sx={{ fontSize: '0.8rem' }}>Sin carreras autorizadas.</Alert>
                        )}
                        {Object.entries(groupedOecs).map(([facId, { facNombre, oecs: facOecs }]) => (
                          <Box key={facId} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, overflow: 'hidden' }}>
                            <Box onClick={() => toggleExpandEditFac(facId)}
                              sx={{ px: 1.5, py: 0.9, display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer',
                                   bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }}>
                              <Box sx={{ fontSize: 10, color: 'text.secondary', lineHeight: 1, flexShrink: 0 }}>
                                {expandedEditFacs.has(facId) ? <CaretDownOutlined /> : <CaretRightOutlined />}
                              </Box>
                              <Typography variant="body2" fontWeight={700} sx={{ flex: 1 }} noWrap>{facNombre}</Typography>
                              <Chip
                                label={`${facOecs.filter(o => o.estado).length}/${facOecs.length}`}
                                size="small"
                                color={facOecs.some(o => !o.estado) ? 'warning' : 'success'}
                                variant="outlined"
                              />
                            </Box>
                            {expandedEditFacs.has(facId) && facOecs.map(oec => (
                              <Box key={oec.id} sx={{
                                px: 1.5, py: 0.8, display: 'flex', alignItems: 'center', gap: 1,
                                borderTop: '1px solid', borderColor: 'divider',
                                bgcolor: oec.estado ? 'transparent' : 'rgba(255,77,79,0.04)',
                              }}>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography variant="body2" noWrap>{oec.eaCarrera?.carrera?.nombre}</Typography>
                                  {oec.eaCarrera?.carrera?.plan && (
                                    <Typography variant="caption" color="text.secondary">Plan {oec.eaCarrera.carrera.plan}</Typography>
                                  )}
                                </Box>
                                <Tooltip title={oec.estado ? 'Desactivar' : 'Activar'}>
                                  <Switch size="small" checked={oec.estado} onChange={() => handleToggleOECInline(oec)} />
                                </Tooltip>
                              </Box>
                            ))}
                          </Box>
                        ))}
                      </Box>

                      {/* Panel de agregar — multi-select */}
                      {showAddCarreraInEdit ? (
                        <Box sx={{ border: '1px dashed', borderColor: 'primary.main', borderRadius: 1.5, p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          <Typography variant="caption" fontWeight={700} color="primary.main">
                            Agregar carreras autorizadas
                          </Typography>

                          {/* Facultades multi-select */}
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="caption" color="text.secondary" fontWeight={600}>Facultades</Typography>
                              {editAddFacultades.length > 0 && (
                                <Chip label={`${editAddFacultades.length} sel.`} size="small" color="primary" variant="outlined" />
                              )}
                            </Box>
                            <Box sx={listBoxSx}>
                              <Box sx={headerRowSx} onClick={toggleTodasFacsEdit}>
                                <Checkbox size="small" checked={todasFacsEdit} indeterminate={algunaFacEdit}
                                  onChange={toggleTodasFacsEdit} onClick={e => e.stopPropagation()} sx={{ p: 0 }} />
                                <Typography variant="body2" fontWeight={600}>Todas las facultades</Typography>
                              </Box>
                              {facDisponibles.map(ea => (
                                <Box key={ea.idEntidadAcademica} sx={rowSx} onClick={() => toggleFacEdit(ea.idEntidadAcademica)}>
                                  <Checkbox size="small" checked={editAddFacultades.includes(ea.idEntidadAcademica)}
                                    onChange={() => toggleFacEdit(ea.idEntidadAcademica)} onClick={e => e.stopPropagation()} sx={{ p: 0 }} />
                                  <Typography variant="body2" noWrap>{ea.nombre}</Typography>
                                </Box>
                              ))}
                            </Box>
                          </Box>

                          {/* Carreras multi-select */}
                          {editAddFacultades.length > 0 && (
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>Carreras</Typography>
                                {editAddEaCarreras.length > 0 && (
                                  <Chip label={`${editAddEaCarreras.length} sel.`} size="small" color="secondary" variant="outlined" />
                                )}
                              </Box>
                              {eacParaAgregar.length === 0 ? (
                                <Alert severity="warning" sx={{ fontSize: '0.75rem', py: 0.5 }}>
                                  Sin carreras disponibles para agregar.
                                </Alert>
                              ) : (
                                <Box sx={listBoxSx}>
                                  <Box sx={headerRowSx} onClick={toggleTodasEacEdit}>
                                    <Checkbox size="small" checked={todasEacEdit} indeterminate={algunaEacEdit}
                                      onChange={toggleTodasEacEdit} onClick={e => e.stopPropagation()} sx={{ p: 0 }} />
                                    <Typography variant="body2" fontWeight={600}>Todas las carreras</Typography>
                                  </Box>
                                  {eacParaAgregar.map(eac => (
                                    <Box key={eac.id} sx={rowSx} onClick={() => toggleEacEdit(eac.id)}>
                                      <Checkbox size="small" checked={editAddEaCarreras.includes(eac.id)}
                                        onChange={() => toggleEacEdit(eac.id)} onClick={e => e.stopPropagation()} sx={{ p: 0 }} />
                                      <Box sx={{ minWidth: 0 }}>
                                        <Typography variant="body2" noWrap>
                                          {eac.carrera?.nombre}{eac.carrera?.plan ? ` — Plan ${eac.carrera.plan}` : ''}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" noWrap display="block">
                                          {eac.entidadAcademica?.nombre}
                                        </Typography>
                                      </Box>
                                    </Box>
                                  ))}
                                </Box>
                              )}
                            </Box>
                          )}

                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button size="small" variant="contained" fullWidth
                              disabled={editAddEaCarreras.length === 0 || addingCarreraToEdit}
                              onClick={handleAddCarrerasToEdit}>
                              {addingCarreraToEdit
                                ? <CircularProgress size={16} color="inherit" />
                                : `Agregar${editAddEaCarreras.length > 0 ? ` (${editAddEaCarreras.length})` : ''}`}
                            </Button>
                            <Button size="small" color="secondary" variant="outlined"
                              onClick={() => { setShowAddCarreraInEdit(false); setEditAddFacultades([]); setEditAddEaCarreras([]); }}>
                              Cancelar
                            </Button>
                          </Box>
                        </Box>
                      ) : (
                        <Button size="small" variant="outlined" startIcon={<PlusOutlined />}
                          onClick={() => setShowAddCarreraInEdit(true)} fullWidth>
                          Agregar carreras
                        </Button>
                      )}
                    </Box>
                  );
                })()}
              </Box>
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditOferta} color="secondary">Cancelar</Button>
          <Button onClick={handleSaveEditOferta} variant="contained" disabled={saving}>
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
                    <Typography variant="h6" fontWeight={700}>
                      {viewOferta.categoriaEvento?.evento?.nombre} v{viewOferta.categoriaEvento?.evento?.version}
                      {' · '}{viewOferta.categoriaEvento?.categoria?.nombre}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Oferta #{viewOferta.idOferta} · {viewOferta.modalidadArea?.modalidad?.nombre} / {viewOferta.modalidadArea?.area?.nombre}
                    </Typography>
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
                            <Typography variant="body2" fontWeight={600}>{oec.eaCarrera?.carrera?.nombre}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {oec.eaCarrera?.entidadAcademica?.nombre}{oec.eaCarrera?.carrera?.plan ? ` · Plan: ${oec.eaCarrera.carrera.plan}` : ''}
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
                  const membrete = (viewOferta.categoriaEvento?.evento?.membretes || [])[0];
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
                        {of.categoriaEvento?.evento?.nombre} v{of.categoriaEvento?.evento?.version} · {of.categoriaEvento?.categoria?.nombre} · {of.modalidadArea?.modalidad?.nombre} / {of.modalidadArea?.area?.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth required>
                  <InputLabel>Facultad / Entidad Académica</InputLabel>
                  <Select
                    value={formOEC.idEntidadAcademica}
                    label="Facultad / Entidad Académica"
                    onChange={e => setFormOEC(p => ({ ...p, idEntidadAcademica: e.target.value, idEaCarrera: '' }))}
                  >
                    {entidades.filter(ea => ea.estado).map(ea => (
                      <MenuItem key={ea.idEntidadAcademica} value={ea.idEntidadAcademica}>{ea.nombre}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth required disabled={!formOEC.idEntidadAcademica}>
                  <InputLabel>Carrera</InputLabel>
                  <Select
                    value={formOEC.idEaCarrera}
                    label="Carrera"
                    onChange={e => setFormOEC(p => ({ ...p, idEaCarrera: e.target.value }))}
                  >
                    {eaCarreras
                      .filter(eac => eac.entidadAcademica?.idEntidadAcademica === formOEC.idEntidadAcademica)
                      .map(eac => (
                        <MenuItem key={eac.id} value={eac.id}>
                          {eac.carrera?.nombre}{eac.carrera?.plan ? ` — Plan ${eac.carrera.plan}` : ''}
                        </MenuItem>
                      ))
                    }
                    {formOEC.idEntidadAcademica && eaCarreras.filter(eac => eac.entidadAcademica?.idEntidadAcademica === formOEC.idEntidadAcademica).length === 0 && (
                      <MenuItem disabled>Sin carreras vinculadas a esta facultad</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </>
            )}
            {editingOEC && (
              <>
                <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Oferta: <strong>{editingOEC.oferta?.categoriaEvento?.evento?.nombre} · {editingOEC.oferta?.categoriaEvento?.categoria?.nombre}</strong>
                  </Typography>
                  <br />
                  <Typography variant="caption" color="text.secondary">
                    Facultad: <strong>{editingOEC.eaCarrera?.entidadAcademica?.nombre}</strong>
                    {' · '}Carrera: <strong>{editingOEC.eaCarrera?.carrera?.nombre}</strong>
                    {editingOEC.eaCarrera?.carrera?.plan ? ` — Plan ${editingOEC.eaCarrera.carrera.plan}` : ''}
                  </Typography>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formOEC.estado}
                      onChange={e => setFormOEC(p => ({ ...p, estado: e.target.checked }))}
                    />
                  }
                  label={formOEC.estado ? 'Activo' : 'Inactivo'}
                />
              </>
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
