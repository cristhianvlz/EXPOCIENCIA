import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
  Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Switch, FormControlLabel,
  Snackbar, Alert, CircularProgress, Tabs, Tab, Chip, Typography, Pagination, Select, MenuItem,
  Grid, Tooltip, FormControl, InputLabel
} from '@mui/material';
import {
  EditOutlined, DeleteOutlined, PlusOutlined,
  BankOutlined, ApartmentOutlined, ProfileOutlined, TagsOutlined, BookOutlined,
  StopOutlined, RedoOutlined, ReloadOutlined, SearchOutlined, ClearOutlined, LinkOutlined
} from '@ant-design/icons';
import MainCard from 'components/MainCard';

// ── GQL ──────────────────────────────────────────────────────────────────────
const GET_ALL = gql`
  query {
    todasLasEntidadesAcademicas { idEntidadAcademica nombre estado }
    todasLasAreas               { idArea nombre estado }
    todasLasModalidades         { idModalidad nombre estado }
    todasLasCategorias          { idCategoria nombre estado }
    todasLasCarreras            { idCarrera nombre plan codigo estado }
    todosLosEaCarreras {
      id
      entidadAcademica { idEntidadAcademica nombre }
      carrera          { idCarrera nombre plan codigo }
    }
  }
`;

const CREATE_EA = gql`mutation($nombre: String!) { crearEntidadAcademica(nombre: $nombre) { ok error } }`;
const EDIT_EA   = gql`mutation($idEntidadAcademica: ID!, $nombre: String, $estado: Boolean) { editarEntidadAcademica(idEntidadAcademica: $idEntidadAcademica, nombre: $nombre, estado: $estado) { ok error } }`;
const DELETE_EA = gql`mutation($idEntidadAcademica: ID!) { eliminarEntidadAcademica(idEntidadAcademica: $idEntidadAcademica) { ok error } }`;

const CREATE_AREA = gql`mutation($nombre: String!) { crearArea(nombre: $nombre) { ok error } }`;
const EDIT_AREA   = gql`mutation($idArea: ID!, $nombre: String, $estado: Boolean) { editarArea(idArea: $idArea, nombre: $nombre, estado: $estado) { ok error } }`;
const DELETE_AREA = gql`mutation($idArea: ID!) { eliminarArea(idArea: $idArea) { ok error } }`;

const CREATE_MOD = gql`mutation($nombre: String!) { crearModalidad(nombre: $nombre) { ok error } }`;
const EDIT_MOD   = gql`mutation($idModalidad: ID!, $nombre: String, $estado: Boolean) { editarModalidad(idModalidad: $idModalidad, nombre: $nombre, estado: $estado) { ok error } }`;
const DELETE_MOD = gql`mutation($idModalidad: ID!) { eliminarModalidad(idModalidad: $idModalidad) { ok error } }`;

const CREATE_CAT = gql`mutation($nombre: String!) { crearCategoria(nombre: $nombre) { ok error } }`;
const EDIT_CAT   = gql`mutation($idCategoria: ID!, $nombre: String, $estado: Boolean) { editarCategoria(idCategoria: $idCategoria, nombre: $nombre, estado: $estado) { ok error } }`;
const DELETE_CAT = gql`mutation($idCategoria: ID!) { eliminarCategoria(idCategoria: $idCategoria) { ok error } }`;

const CREATE_CARRERA = gql`mutation($nombre: String!, $plan: String, $codigo: String) { crearCarrera(nombre: $nombre, plan: $plan, codigo: $codigo) { ok error } }`;
const EDIT_CARRERA   = gql`mutation($idCarrera: ID!, $nombre: String, $plan: String, $codigo: String, $estado: Boolean) { editarCarrera(idCarrera: $idCarrera, nombre: $nombre, plan: $plan, codigo: $codigo, estado: $estado) { ok error } }`;
const DELETE_CARRERA = gql`mutation($idCarrera: ID!) { eliminarCarrera(idCarrera: $idCarrera) { ok error } }`;

const CREATE_EAC = gql`mutation($idEntidadAcademica: ID!, $idCarrera: ID!) { crearEaCarrera(idEntidadAcademica: $idEntidadAcademica, idCarrera: $idCarrera) { ok error } }`;
const DELETE_EAC = gql`mutation($idEaCarrera: ID!) { eliminarEaCarrera(idEaCarrera: $idEaCarrera) { ok error } }`;

// ── Shared sub-components ────────────────────────────────────────────────────

function CustomPagination({ count, rowsPerPage, page, onPageChange, onRowsPerPageChange }: any) {
  const totalPages = Math.ceil(count / rowsPerPage);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" color="text.secondary">Mostrar</Typography>
        <Select
          size="small" value={rowsPerPage} onChange={onRowsPerPageChange}
          sx={{
            minWidth: 65, height: 32, borderRadius: '6px', bgcolor: 'transparent',
            '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
            '.MuiSelect-select': { py: 0.5, px: 1.5, fontSize: '0.875rem', color: 'text.primary' },
          }}
        >
          <MenuItem value={5}>5</MenuItem>
          <MenuItem value={10}>10</MenuItem>
          <MenuItem value={25}>25</MenuItem>
        </Select>
        <Typography variant="body2" color="text.secondary">registros</Typography>
      </Box>
      <Pagination
        count={totalPages} page={page + 1}
        onChange={(e, value) => onPageChange(e, value - 1)}
        shape="rounded" color="primary"
        sx={{
          '& .MuiPaginationItem-root': { bgcolor: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'text.secondary', borderRadius: '6px', minWidth: 32, height: 32 },
          '& .Mui-selected': { bgcolor: '#1677ff !important', color: '#fff', border: 'none', boxShadow: '0 2px 8px rgba(22, 119, 255, 0.4)' },
        }}
      />
    </Box>
  );
}

function StatusIcon({ type }: any) {
  if (type === 'error') return <StopOutlined style={{ fontSize: 50, color: '#ff4d4f' }} />;
  return <RedoOutlined style={{ fontSize: 50, color: '#52c41a' }} />;
}

function ConfirmDialog({ open, title, message, onConfirm, onClose, loading, type = 'error' }: any) {
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
          {loading ? <CircularProgress size={20} color="inherit" /> : (isError ? 'Eliminar' : 'Restaurar')}
        </Button>
      </Box>
    </Dialog>
  );
}

function CatalogTable({ rows, idKey, onEdit, onToggleEstado, extraCols }: any) {
  return (
    <TableContainer component={Paper} elevation={0}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell width={80}>ID</TableCell>
            <TableCell>Nombre</TableCell>
            {extraCols?.map((col: any) => (
              <TableCell key={col.key}>{col.label}</TableCell>
            ))}
            <TableCell width={110}>Estado</TableCell>
            <TableCell align="right" width={110}>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row: any) => (
            <TableRow key={row[idKey]} hover>
              <TableCell>{row[idKey]}</TableCell>
              <TableCell>{row.nombre}</TableCell>
              {extraCols?.map((col: any) => (
                <TableCell key={col.key}>{row[col.key] || '—'}</TableCell>
              ))}
              <TableCell>
                <Chip label={row.estado ? 'Activo' : 'Inactivo'} color={row.estado ? 'success' : 'error'} size="small" variant="outlined" />
              </TableCell>
              <TableCell align="right">
                <IconButton color="primary" size="small" onClick={() => onEdit(row)}>
                  <EditOutlined />
                </IconButton>
                <IconButton color={row.estado ? 'error' : 'success'} size="small" onClick={() => onToggleEstado(row)}>
                  {row.estado ? <DeleteOutlined /> : <ReloadOutlined />}
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={4 + (extraCols?.length || 0)} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                Sin registros.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function CatalogDialog({ open, onClose, onSave, entityName, form, setForm, saving, editing, extraFields }: any) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{editing ? `Editar ${entityName}` : `Nueva ${entityName}`}</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Nombre" value={form.nombre} fullWidth required autoFocus
            onChange={e => setForm((p: any) => ({ ...p, nombre: e.target.value }))}
          />
          {extraFields?.map((field: any) => (
            <TextField
              key={field.key} label={field.label} value={form[field.key] ?? ''} fullWidth
              placeholder={field.placeholder}
              onChange={e => setForm((p: any) => ({ ...p, [field.key]: e.target.value }))}
            />
          ))}
          {editing && (
            <FormControlLabel
              control={<Switch checked={form.estado} onChange={e => setForm((p: any) => ({ ...p, estado: e.target.checked }))} />}
              label={form.estado ? 'Activo' : 'Inactivo'}
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">Cancelar</Button>
        <Button onClick={onSave} variant="contained" disabled={!form.nombre?.trim() || saving}>
          {saving ? <CircularProgress size={24} color="inherit" /> : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const INIT_FORM        = { nombre: '', estado: true };
const INIT_CARRERA_FORM = { nombre: '', plan: '', codigo: '', estado: true };

export default function CatalogosBasePage() {
  const [tab, setTab] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchNombre, setSearchNombre] = useState('');
  const [searchEstado, setSearchEstado] = useState('Todos');

  const { data, loading, error, refetch } = useQuery(GET_ALL, { fetchPolicy: 'network-only' });

  const [crearEA]       = useMutation(CREATE_EA);
  const [editarEA]      = useMutation(EDIT_EA);
  const [eliminarEA]    = useMutation(DELETE_EA);
  const [crearArea]     = useMutation(CREATE_AREA);
  const [editarArea]    = useMutation(EDIT_AREA);
  const [eliminarArea]  = useMutation(DELETE_AREA);
  const [crearMod]      = useMutation(CREATE_MOD);
  const [editarMod]     = useMutation(EDIT_MOD);
  const [eliminarMod]   = useMutation(DELETE_MOD);
  const [crearCat]      = useMutation(CREATE_CAT);
  const [editarCat]     = useMutation(EDIT_CAT);
  const [eliminarCat]   = useMutation(DELETE_CAT);
  const [crearCarrera]  = useMutation(CREATE_CARRERA);
  const [editarCarrera] = useMutation(EDIT_CARRERA);
  const [eliminarCarrera] = useMutation(DELETE_CARRERA);
  const [crearEAC]      = useMutation(CREATE_EAC);
  const [eliminarEAC]   = useMutation(DELETE_EAC);

  // Dialog estado para tabs 0-4
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [form, setForm] = useState<any>(INIT_FORM);
  const [saving, setSaving] = useState(false);

  // Estado para tab 5: Facultad × Carrera
  const [expandedFacultades, setExpandedFacultades] = useState<Set<string>>(new Set());
  const [openEACDialog, setOpenEACDialog] = useState(false);
  const [eacFacultadId, setEacFacultadId] = useState('');
  const [eacCarreraId, setEacCarreraId] = useState('');
  const [savingEAC, setSavingEAC] = useState(false);

  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' as any });
  const [confirmDlg, setConfirmDlg] = useState({ open: false, title: '', message: '', onConfirm: async () => {}, type: 'error' });
  const [confirming, setConfirming] = useState(false);

  const entidades  = data?.todasLasEntidadesAcademicas || [];
  const areas      = data?.todasLasAreas               || [];
  const modalidades= data?.todasLasModalidades          || [];
  const categorias = data?.todasLasCategorias          || [];
  const carreras   = data?.todasLasCarreras            || [];
  const eaCarreras = data?.todosLosEaCarreras          || [];

  const showNotif = (message: string, severity = 'success') =>
    setNotification({ open: true, message, severity: severity as any });

  const handlers = [
    {
      label: 'Facultad', idKey: 'idEntidadAcademica', rows: entidades,
      initForm: INIT_FORM, extraFields: undefined, extraCols: undefined,
      create: async (f: any) => (await crearEA({ variables: { nombre: f.nombre } })).data?.crearEntidadAcademica,
      update: async (id: string, f: any) => (await editarEA({ variables: { idEntidadAcademica: id, nombre: f.nombre, estado: f.estado } })).data?.editarEntidadAcademica,
      remove: async (id: string) => (await eliminarEA({ variables: { idEntidadAcademica: id } })).data?.eliminarEntidadAcademica,
    },
    {
      label: 'Área', idKey: 'idArea', rows: areas,
      initForm: INIT_FORM, extraFields: undefined, extraCols: undefined,
      create: async (f: any) => (await crearArea({ variables: { nombre: f.nombre } })).data?.crearArea,
      update: async (id: string, f: any) => (await editarArea({ variables: { idArea: id, nombre: f.nombre, estado: f.estado } })).data?.editarArea,
      remove: async (id: string) => (await eliminarArea({ variables: { idArea: id } })).data?.eliminarArea,
    },
    {
      label: 'Modalidad', idKey: 'idModalidad', rows: modalidades,
      initForm: INIT_FORM, extraFields: undefined, extraCols: undefined,
      create: async (f: any) => (await crearMod({ variables: { nombre: f.nombre } })).data?.crearModalidad,
      update: async (id: string, f: any) => (await editarMod({ variables: { idModalidad: id, nombre: f.nombre, estado: f.estado } })).data?.editarModalidad,
      remove: async (id: string) => (await eliminarMod({ variables: { idModalidad: id } })).data?.eliminarModalidad,
    },
    {
      label: 'Categoría', idKey: 'idCategoria', rows: categorias,
      initForm: INIT_FORM, extraFields: undefined, extraCols: undefined,
      create: async (f: any) => (await crearCat({ variables: { nombre: f.nombre } })).data?.crearCategoria,
      update: async (id: string, f: any) => (await editarCat({ variables: { idCategoria: id, nombre: f.nombre, estado: f.estado } })).data?.editarCategoria,
      remove: async (id: string) => (await eliminarCat({ variables: { idCategoria: id } })).data?.eliminarCategoria,
    },
    {
      label: 'Carrera', idKey: 'idCarrera', rows: carreras,
      initForm: INIT_CARRERA_FORM,
      extraFields: [
        { key: 'plan',   label: 'Plan',   placeholder: 'ej. 4' },
        { key: 'codigo', label: 'Código', placeholder: 'ej. 187' },
      ],
      extraCols: [
        { key: 'plan',   label: 'Plan' },
        { key: 'codigo', label: 'Código' },
      ],
      create: async (f: any) => (await crearCarrera({ variables: { nombre: f.nombre, plan: f.plan || '', codigo: f.codigo || '' } })).data?.crearCarrera,
      update: async (id: string, f: any) => (await editarCarrera({ variables: { idCarrera: id, nombre: f.nombre, plan: f.plan ?? '', codigo: f.codigo ?? '', estado: f.estado } })).data?.editarCarrera,
      remove: async (id: string) => (await eliminarCarrera({ variables: { idCarrera: id } })).data?.eliminarCarrera,
    },
  ];

  const current = tab < 5 ? handlers[tab] : null;

  const filteredRows = current
    ? current.rows.filter((item: any) => {
        const matchNombre = searchNombre ? item.nombre?.toLowerCase().includes(searchNombre.toLowerCase()) : true;
        const matchEstado = searchEstado !== 'Todos' ? (searchEstado === 'Activo' ? item.estado : !item.estado) : true;
        return matchNombre && matchEstado;
      })
    : [];
  const paginatedRows = filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleOpen = (item: any = null) => {
    setEditingItem(item);
    setForm(item
      ? { nombre: item.nombre, plan: item.plan ?? '', codigo: item.codigo ?? '', estado: item.estado }
      : current!.initForm
    );
    setOpenDialog(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = editingItem
        ? await current!.update(editingItem[current!.idKey], form)
        : await current!.create(form);
      if (result?.ok) {
        showNotif(editingItem ? `${current!.label} actualizada` : `${current!.label} creada`);
        refetch();
        setOpenDialog(false);
      } else {
        showNotif(result?.error || 'Error al guardar', 'error');
      }
    } catch { showNotif('Error de conexión', 'error'); }
    setSaving(false);
  };

  const handleToggleEstado = (row: any) => {
    const isActiva = row.estado;
    const tipo = current!.label;
    setConfirmDlg({
      open: true,
      title: isActiva ? `¿Desactivar ${tipo}?` : `¿Restaurar ${tipo}?`,
      message: isActiva
        ? `¿Deseas desactivar "${row.nombre}"? Esta acción lo marcará como inactivo.`
        : `¿Deseas restaurar "${row.nombre}"? Volverá a estar activo en el sistema.`,
      type: isActiva ? 'error' : 'success',
      onConfirm: async () => {
        setConfirming(true);
        try {
          const result = isActiva
            ? await current!.remove(row[current!.idKey])
            : await current!.update(row[current!.idKey], { ...row, estado: true });
          if (result?.ok) {
            showNotif(`${tipo} ${isActiva ? 'desactivada' : 'restaurada'}`);
            refetch();
          } else {
            showNotif(result?.error || 'Error en la operación', 'error');
          }
        } catch { showNotif('Error de conexión', 'error'); }
        setConfirming(false);
        setConfirmDlg(p => ({ ...p, open: false }));
      },
    });
  };

  // ── Handlers Facultad × Carrera ──────────────────────────────────────────
  const toggleFacultad = (id: string) => {
    setExpandedFacultades(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleOpenAddCarrera = (idFacultad: string) => {
    setEacFacultadId(idFacultad);
    setEacCarreraId('');
    setOpenEACDialog(true);
  };

  const handleSubmitEAC = async () => {
    setSavingEAC(true);
    try {
      const res = await crearEAC({ variables: { idEntidadAcademica: eacFacultadId, idCarrera: eacCarreraId } });
      const result = res.data?.crearEaCarrera;
      if (result?.ok) {
        showNotif('Carrera vinculada a la facultad');
        refetch();
        setOpenEACDialog(false);
      } else {
        showNotif(result?.error || 'Error al vincular', 'error');
      }
    } catch { showNotif('Error de conexión', 'error'); }
    setSavingEAC(false);
  };

  const handleDeleteEAC = (eac: any) => {
    setConfirmDlg({
      open: true,
      title: '¿Quitar carrera de la facultad?',
      message: `Se quitará "${eac.carrera?.nombre}" de "${eac.entidadAcademica?.nombre}". Los vínculos existentes en Ofertas deberán actualizarse manualmente.`,
      type: 'error',
      onConfirm: async () => {
        setConfirming(true);
        try {
          const res = await eliminarEAC({ variables: { idEaCarrera: eac.id } });
          if (res.data?.eliminarEaCarrera?.ok) {
            showNotif('Carrera desvinculada');
            refetch();
          } else {
            showNotif(res.data?.eliminarEaCarrera?.error || 'Error', 'error');
          }
        } catch { showNotif('Error de conexión', 'error'); }
        setConfirming(false);
        setConfirmDlg(p => ({ ...p, open: false }));
      },
    });
  };

  const handleClearFilters = () => { setSearchNombre(''); setSearchEstado('Todos'); setPage(0); };

  // Carreras ya vinculadas a una facultad (para excluirlas del selector)
  const carrerasVinculadas = (idFacultad: string): string[] =>
    eaCarreras
      .filter((eac: any) => eac.entidadAcademica?.idEntidadAcademica === idFacultad)
      .map((eac: any) => eac.carrera?.idCarrera);

  const carrerasDisponibles = carreras.filter(
    (c: any) => c.estado && !carrerasVinculadas(eacFacultadId).includes(c.idCarrera)
  );

  const facultadNombre = entidades.find((e: any) => e.idEntidadAcademica === eacFacultadId)?.nombre || '';

  return (
    <MainCard
      title="Catálogos Base"
      secondary={
        tab < 5 ? (
          <Button variant="contained" startIcon={<PlusOutlined />} onClick={() => handleOpen()}>
            Nueva {current!.label}
          </Button>
        ) : null
      }
    >
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => { setTab(v); setPage(0); setSearchNombre(''); setSearchEstado('Todos'); }}>
          <Tab label="Facultades"        icon={<BankOutlined />}      iconPosition="start" />
          <Tab label="Áreas"             icon={<ApartmentOutlined />} iconPosition="start" />
          <Tab label="Modalidades"       icon={<ProfileOutlined />}   iconPosition="start" />
          <Tab label="Categorías"        icon={<TagsOutlined />}      iconPosition="start" />
          <Tab label="Carreras"          icon={<BookOutlined />}      iconPosition="start" />
          <Tab label="Facultad × Carrera" icon={<LinkOutlined />}     iconPosition="start" />
        </Tabs>
      </Box>

      {/* Filtros — solo para tabs 0-4 */}
      {tab < 5 && (
        <Box sx={{ px: 2, mb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                size="small" fullWidth
                placeholder={`Buscar ${current!.label.toLowerCase()}...`}
                value={searchNombre}
                onChange={(e) => { setSearchNombre(e.target.value); setPage(0); }}
                InputProps={{ startAdornment: <SearchOutlined style={{ color: '#888', marginRight: 8 }} /> }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth size="small" select label="Estado"
                value={searchEstado} onChange={e => { setSearchEstado(e.target.value); setPage(0); }}>
                <MenuItem value="Todos">Todos</MenuItem>
                <MenuItem value="Activo">Activo</MenuItem>
                <MenuItem value="Inactivo">Inactivo</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={1} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Tooltip title="Limpiar Filtros">
                <IconButton onClick={handleClearFilters} color="secondary"
                  sx={{
                    border: '1px solid', borderColor: 'divider', borderRadius: '8px',
                    visibility: (searchNombre || searchEstado !== 'Todos') ? 'visible' : 'hidden',
                  }}>
                  <ClearOutlined />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error">Error al cargar datos: {error.message}</Alert>
      ) : (
        <>
          {/* ── Tabs 0-4: tablas simples ── */}
          {tab < 5 && (
            <>
              <CatalogTable
                rows={paginatedRows}
                idKey={current!.idKey}
                onEdit={handleOpen}
                onToggleEstado={handleToggleEstado}
                extraCols={current!.extraCols}
              />
              {filteredRows.length > 0 && (
                <CustomPagination
                  count={filteredRows.length} rowsPerPage={rowsPerPage} page={page}
                  onPageChange={(_: any, p: number) => setPage(p)}
                  onRowsPerPageChange={(e: any) => { setRowsPerPage(e.target.value); setPage(0); }}
                />
              )}
            </>
          )}

          {/* ── Tab 5: Facultad × Carrera ── */}
          {tab === 5 && (
            <Box sx={{ px: 1 }}>
              {entidades.length === 0 ? (
                <Alert severity="info">No hay facultades registradas. Agrégalas en el tab "Facultades".</Alert>
              ) : (
                entidades.map((facultad: any) => {
                  const isOpen = expandedFacultades.has(facultad.idEntidadAcademica);
                  const carrerasDeFacultad = eaCarreras.filter(
                    (eac: any) => eac.entidadAcademica?.idEntidadAcademica === facultad.idEntidadAcademica
                  );
                  const count = carrerasDeFacultad.length;

                  return (
                    <Box key={facultad.idEntidadAcademica} sx={{ mb: 1.5 }}>
                      {/* ── Cabecera de facultad ── */}
                      <Box sx={{
                        px: 2, py: 1.5,
                        borderRadius: isOpen ? '10px 10px 0 0' : '10px',
                        background: 'linear-gradient(135deg, rgba(24,144,255,0.08), rgba(24,144,255,0.02))',
                        border: '1px solid',
                        borderColor: isOpen ? 'primary.main' : 'rgba(24,144,255,0.25)',
                        display: 'flex', alignItems: 'center', gap: 1.5,
                        transition: 'border-color 0.2s',
                      }}>
                        <BankOutlined style={{ color: '#1890ff', fontSize: 16, flexShrink: 0 }} />
                        <Typography variant="subtitle2" fontWeight={700} color="primary.main" sx={{ flex: 1 }}>
                          {facultad.nombre}
                        </Typography>
                        <Tooltip title="Agregar carrera a esta facultad">
                          <IconButton
                            size="small" color="primary"
                            onClick={() => handleOpenAddCarrera(facultad.idEntidadAcademica)}
                            sx={{ mr: 0.5 }}
                          >
                            <PlusOutlined />
                          </IconButton>
                        </Tooltip>
                        <Chip
                          label={
                            isOpen
                              ? `▲ ${count} ${count === 1 ? 'carrera' : 'carreras'}`
                              : `▼ ${count} ${count === 1 ? 'carrera' : 'carreras'}`
                          }
                          size="small"
                          color={count > 0 ? 'primary' : 'default'}
                          variant={isOpen ? 'filled' : 'outlined'}
                          onClick={() => toggleFacultad(facultad.idEntidadAcademica)}
                          sx={{ cursor: 'pointer', fontWeight: 600, userSelect: 'none', minWidth: 90 }}
                        />
                      </Box>

                      {/* ── Lista de carreras (expandible) ── */}
                      {isOpen && (
                        <Box sx={{
                          border: '1px solid', borderColor: 'primary.main', borderTop: 'none',
                          borderRadius: '0 0 10px 10px', overflow: 'hidden',
                        }}>
                          {carrerasDeFacultad.length === 0 ? (
                            <Box sx={{ px: 3, py: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                Sin carreras vinculadas.
                              </Typography>
                              <Button
                                size="small" variant="outlined" startIcon={<PlusOutlined />}
                                onClick={() => handleOpenAddCarrera(facultad.idEntidadAcademica)}
                                sx={{ ml: 1 }}
                              >
                                Agregar carrera
                              </Button>
                            </Box>
                          ) : (
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ bgcolor: 'rgba(24,144,255,0.04)' }}>
                                  <TableCell width={60}>ID</TableCell>
                                  <TableCell>Carrera</TableCell>
                                  <TableCell width={100}>Plan</TableCell>
                                  <TableCell width={100}>Código</TableCell>
                                  <TableCell align="right" width={80}>Quitar</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {carrerasDeFacultad.map((eac: any) => (
                                  <TableRow key={eac.id} hover>
                                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{eac.id}</TableCell>
                                    <TableCell sx={{ fontWeight: 500 }}>{eac.carrera?.nombre}</TableCell>
                                    <TableCell>{eac.carrera?.plan || '—'}</TableCell>
                                    <TableCell>{eac.carrera?.codigo || '—'}</TableCell>
                                    <TableCell align="right">
                                      <IconButton color="error" size="small" onClick={() => handleDeleteEAC(eac)}>
                                        <DeleteOutlined />
                                      </IconButton>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                        </Box>
                      )}
                    </Box>
                  );
                })
              )}
            </Box>
          )}
        </>
      )}

      {/* ── Dialog CRUD tabs 0-4 ── */}
      {current && (
        <CatalogDialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          onSave={handleSave}
          entityName={current.label}
          form={form}
          setForm={setForm}
          saving={saving}
          editing={!!editingItem}
          extraFields={current.extraFields}
        />
      )}

      {/* ── Dialog: Vincular Carrera a Facultad ── */}
      <Dialog open={openEACDialog} onClose={() => setOpenEACDialog(false)} fullWidth maxWidth="xs">
        <DialogTitle>Agregar Carrera a Facultad</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">Facultad seleccionada:</Typography>
              <Typography variant="body2" fontWeight={600}>{facultadNombre}</Typography>
            </Box>
            <FormControl fullWidth required>
              <InputLabel>Carrera</InputLabel>
              <Select
                value={eacCarreraId}
                label="Carrera"
                onChange={e => setEacCarreraId(e.target.value as string)}
              >
                {carrerasDisponibles.map((c: any) => (
                  <MenuItem key={c.idCarrera} value={c.idCarrera}>
                    {c.nombre}{c.plan ? ` — Plan ${c.plan}` : ''}{c.codigo ? ` (${c.codigo})` : ''}
                  </MenuItem>
                ))}
                {carrerasDisponibles.length === 0 && (
                  <MenuItem disabled>Todas las carreras ya están vinculadas</MenuItem>
                )}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEACDialog(false)} color="secondary">Cancelar</Button>
          <Button
            onClick={handleSubmitEAC}
            variant="contained"
            disabled={!eacCarreraId || savingEAC}
          >
            {savingEAC ? <CircularProgress size={24} color="inherit" /> : 'Vincular'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={notification.open} autoHideDuration={4000}
        onClose={() => setNotification(p => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={notification.severity} variant="filled">{notification.message}</Alert>
      </Snackbar>

      <ConfirmDialog
        open={confirmDlg.open} title={confirmDlg.title} message={confirmDlg.message}
        type={confirmDlg.type} loading={confirming}
        onClose={() => setConfirmDlg(p => ({ ...p, open: false }))}
        onConfirm={confirmDlg.onConfirm}
      />
    </MainCard>
  );
}
