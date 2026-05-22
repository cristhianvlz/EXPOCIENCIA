import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
  Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Switch, FormControlLabel,
  Snackbar, Alert, CircularProgress, Tabs, Tab, Chip
} from '@mui/material';
import {
  EditOutlined, DeleteOutlined, PlusOutlined,
  BankOutlined, ApartmentOutlined, ProfileOutlined, TagsOutlined
} from '@ant-design/icons';
import MainCard from 'components/MainCard';

// ── GQL ──────────────────────────────────────────────────────────────────────
const GET_ALL = gql`
  query {
    todasLasEntidadesAcademicas { idEntidadAcademica nombre estado }
    todasLasAreas               { idArea nombre estado }
    todasLasModalidades         { idModalidad nombre estado }
    todasLasCategorias          { idCategoria nombre estado }
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

// ── Shared sub-components (all 4 catalogs have the same shape) ───────────────
function CatalogTable({ rows, idKey, onEdit, onDelete }) {
  return (
    <TableContainer component={Paper} elevation={0}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell width={80}>ID</TableCell>
            <TableCell>Nombre</TableCell>
            <TableCell width={110}>Estado</TableCell>
            <TableCell align="right" width={110}>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(row => (
            <TableRow key={row[idKey]} hover>
              <TableCell>{row[idKey]}</TableCell>
              <TableCell>{row.nombre}</TableCell>
              <TableCell>
                <Chip
                  label={row.estado ? 'Activo' : 'Inactivo'}
                  color={row.estado ? 'success' : 'default'}
                  size="small"
                />
              </TableCell>
              <TableCell align="right">
                <IconButton color="primary" size="small" onClick={() => onEdit(row)}>
                  <EditOutlined />
                </IconButton>
                <IconButton color="error" size="small" onClick={() => onDelete(row[idKey])}>
                  <DeleteOutlined />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                Sin registros.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function CatalogDialog({ open, onClose, onSave, entityName, form, setForm, saving, editing }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{editing ? `Editar ${entityName}` : `Nueva ${entityName}`}</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Nombre" value={form.nombre} fullWidth required autoFocus
            onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
          />
          {editing && (
            <FormControlLabel
              control={
                <Switch
                  checked={form.estado}
                  onChange={e => setForm(p => ({ ...p, estado: e.target.checked }))}
                />
              }
              label={form.estado ? 'Activo' : 'Inactivo'}
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">Cancelar</Button>
        <Button onClick={onSave} variant="contained" disabled={!form.nombre.trim() || saving}>
          {saving ? <CircularProgress size={24} color="inherit" /> : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const INIT_FORM = { nombre: '', estado: true };

export default function CatalogosBasePage() {
  const [tab, setTab] = useState(0);
  const { data, loading, error, refetch } = useQuery(GET_ALL, { fetchPolicy: 'network-only' });

  const [crearEA]     = useMutation(CREATE_EA);
  const [editarEA]    = useMutation(EDIT_EA);
  const [eliminarEA]  = useMutation(DELETE_EA);
  const [crearArea]   = useMutation(CREATE_AREA);
  const [editarArea]  = useMutation(EDIT_AREA);
  const [eliminarArea]= useMutation(DELETE_AREA);
  const [crearMod]    = useMutation(CREATE_MOD);
  const [editarMod]   = useMutation(EDIT_MOD);
  const [eliminarMod] = useMutation(DELETE_MOD);
  const [crearCat]    = useMutation(CREATE_CAT);
  const [editarCat]   = useMutation(EDIT_CAT);
  const [eliminarCat] = useMutation(DELETE_CAT);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(INIT_FORM);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  const entidades   = data?.todasLasEntidadesAcademicas || [];
  const areas       = data?.todasLasAreas               || [];
  const modalidades = data?.todasLasModalidades         || [];
  const categorias  = data?.todasLasCategorias          || [];

  const showNotif = (message, severity = 'success') =>
    setNotification({ open: true, message, severity });

  // Dispatch table — one entry per tab, same API shape
  const handlers = [
    {
      label: 'Facultad', idKey: 'idEntidadAcademica', rows: entidades,
      create: async f => (await crearEA({ variables: { nombre: f.nombre } })).data?.crearEntidadAcademica,
      update: async (id, f) => (await editarEA({ variables: { idEntidadAcademica: id, nombre: f.nombre, estado: f.estado } })).data?.editarEntidadAcademica,
      remove: async id => (await eliminarEA({ variables: { idEntidadAcademica: id } })).data?.eliminarEntidadAcademica,
    },
    {
      label: 'Área', idKey: 'idArea', rows: areas,
      create: async f => (await crearArea({ variables: { nombre: f.nombre } })).data?.crearArea,
      update: async (id, f) => (await editarArea({ variables: { idArea: id, nombre: f.nombre, estado: f.estado } })).data?.editarArea,
      remove: async id => (await eliminarArea({ variables: { idArea: id } })).data?.eliminarArea,
    },
    {
      label: 'Modalidad', idKey: 'idModalidad', rows: modalidades,
      create: async f => (await crearMod({ variables: { nombre: f.nombre } })).data?.crearModalidad,
      update: async (id, f) => (await editarMod({ variables: { idModalidad: id, nombre: f.nombre, estado: f.estado } })).data?.editarModalidad,
      remove: async id => (await eliminarMod({ variables: { idModalidad: id } })).data?.eliminarModalidad,
    },
    {
      label: 'Categoría', idKey: 'idCategoria', rows: categorias,
      create: async f => (await crearCat({ variables: { nombre: f.nombre } })).data?.crearCategoria,
      update: async (id, f) => (await editarCat({ variables: { idCategoria: id, nombre: f.nombre, estado: f.estado } })).data?.editarCategoria,
      remove: async id => (await eliminarCat({ variables: { idCategoria: id } })).data?.eliminarCategoria,
    },
  ];

  const current = handlers[tab];

  const handleOpen = (item = null) => {
    setEditingItem(item);
    setForm(item ? { nombre: item.nombre, estado: item.estado } : INIT_FORM);
    setOpenDialog(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = editingItem
        ? await current.update(editingItem[current.idKey], form)
        : await current.create(form);
      if (result?.ok) {
        showNotif(editingItem ? `${current.label} actualizada` : `${current.label} creada`);
        refetch();
        setOpenDialog(false);
      } else {
        showNotif(result?.error || 'Error al guardar', 'error');
      }
    } catch { showNotif('Error de conexión', 'error'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Desactivar este registro?')) return;
    try {
      const result = await current.remove(id);
      if (result?.ok) { showNotif(`${current.label} desactivada`); refetch(); }
      else showNotif(result?.error || 'Error', 'error');
    } catch { showNotif('Error de conexión', 'error'); }
  };

  return (
    <MainCard
      title="Catálogos Base"
      secondary={
        <Button variant="contained" startIcon={<PlusOutlined />} onClick={() => handleOpen()}>
          Nueva {current.label}
        </Button>
      }
    >
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Facultades"  icon={<BankOutlined />}       iconPosition="start" />
          <Tab label="Áreas"       icon={<ApartmentOutlined />}  iconPosition="start" />
          <Tab label="Modalidades" icon={<ProfileOutlined />}    iconPosition="start" />
          <Tab label="Categorías"  icon={<TagsOutlined />}       iconPosition="start" />
        </Tabs>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">Error al cargar datos: {error.message}</Alert>
      ) : (
        <CatalogTable
          rows={current.rows}
          idKey={current.idKey}
          onEdit={handleOpen}
          onDelete={handleDelete}
        />
      )}

      <CatalogDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onSave={handleSave}
        entityName={current.label}
        form={form}
        setForm={setForm}
        saving={saving}
        editing={!!editingItem}
      />

      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification(p => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={notification.severity} variant="filled">
          {notification.message}
        </Alert>
      </Snackbar>
    </MainCard>
  );
}
