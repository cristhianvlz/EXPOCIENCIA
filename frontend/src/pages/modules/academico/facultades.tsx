import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
  Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Switch, FormControlLabel,
  Snackbar, Alert, CircularProgress, Tabs, Tab, Chip, Typography, Pagination, Select, MenuItem, Grid
} from '@mui/material';
import {
  EditOutlined, DeleteOutlined, PlusOutlined,
  BankOutlined, ApartmentOutlined, ProfileOutlined, TagsOutlined,
  StopOutlined, RedoOutlined, ReloadOutlined, SearchOutlined
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

function CustomPagination({ count, rowsPerPage, page, onPageChange, onRowsPerPageChange }: any) {
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
            minWidth: 65,
            height: 32,
            borderRadius: '6px',
            bgcolor: 'transparent',
            '.MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255,255,255,0.1)',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255,255,255,0.2)',
            },
            '.MuiSelect-select': {
              py: 0.5,
              px: 1.5,
              fontSize: '0.875rem',
              color: 'text.primary',
            }
          }}
        >
          <MenuItem value={5}>5</MenuItem>
          <MenuItem value={10}>10</MenuItem>
          <MenuItem value={25}>25</MenuItem>
        </Select>
        <Typography variant="body2" color="text.secondary">registros</Typography>
      </Box>
      <Pagination 
        count={totalPages} 
        page={page + 1} 
        onChange={(e, value) => onPageChange(e, value - 1)}
        shape="rounded"
        color="primary"
        sx={{
          '& .MuiPaginationItem-root': {
            bgcolor: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'text.secondary',
            borderRadius: '6px',
            minWidth: 32,
            height: 32,
          },
          '& .Mui-selected': {
            bgcolor: '#1677ff !important',
            color: '#fff',
            border: 'none',
            boxShadow: '0 2px 8px rgba(22, 119, 255, 0.4)',
          }
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
          {loading ? <CircularProgress size={20} color="inherit" /> : (isError ? 'Desactivar' : 'Restaurar')}
        </Button>
      </Box>
    </Dialog>
  );
}

function CatalogTable({ rows, idKey, onEdit, onToggleEstado }: any) {
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
          {rows.map((row: any) => (
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
                <IconButton 
                  color={row.estado ? "error" : "success"} 
                  size="small" 
                  onClick={() => onToggleEstado(row)}
                >
                  {row.estado ? <DeleteOutlined /> : <ReloadOutlined />}
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

function CatalogDialog({ open, onClose, onSave, entityName, form, setForm, saving, editing }: any) {
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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchNombre, setSearchNombre] = useState('');
  const [searchEstado, setSearchEstado] = useState('Todos');
  
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

  const [confirmDlg, setConfirmDlg] = useState({ open: false, title: '', message: '', onConfirm: async () => {}, type: 'error' });
  const [confirming, setConfirming] = useState(false);

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
      create: async (f: any) => (await crearEA({ variables: { nombre: f.nombre } })).data?.crearEntidadAcademica,
      update: async (id: string, f: any) => (await editarEA({ variables: { idEntidadAcademica: id, nombre: f.nombre, estado: f.estado } })).data?.editarEntidadAcademica,
      remove: async (id: string) => (await eliminarEA({ variables: { idEntidadAcademica: id } })).data?.eliminarEntidadAcademica,
    },
    {
      label: 'Área', idKey: 'idArea', rows: areas,
      create: async (f: any) => (await crearArea({ variables: { nombre: f.nombre } })).data?.crearArea,
      update: async (id: string, f: any) => (await editarArea({ variables: { idArea: id, nombre: f.nombre, estado: f.estado } })).data?.editarArea,
      remove: async (id: string) => (await eliminarArea({ variables: { idArea: id } })).data?.eliminarArea,
    },
    {
      label: 'Modalidad', idKey: 'idModalidad', rows: modalidades,
      create: async (f: any) => (await crearMod({ variables: { nombre: f.nombre } })).data?.crearModalidad,
      update: async (id: string, f: any) => (await editarMod({ variables: { idModalidad: id, nombre: f.nombre, estado: f.estado } })).data?.editarModalidad,
      remove: async (id: string) => (await eliminarMod({ variables: { idModalidad: id } })).data?.eliminarModalidad,
    },
    {
      label: 'Categoría', idKey: 'idCategoria', rows: categorias,
      create: async (f: any) => (await crearCat({ variables: { nombre: f.nombre } })).data?.crearCategoria,
      update: async (id: string, f: any) => (await editarCat({ variables: { idCategoria: id, nombre: f.nombre, estado: f.estado } })).data?.editarCategoria,
      remove: async (id: string) => (await eliminarCat({ variables: { idCategoria: id } })).data?.eliminarCategoria,
    },
  ];

  const current = handlers[tab];

  const filteredRows = current.rows.filter((item: any) => {
    const matchNombre = searchNombre ? item.nombre?.toLowerCase().includes(searchNombre.toLowerCase()) : true;
    const matchEstado = searchEstado !== 'Todos' ? (searchEstado === 'Activo' ? item.estado : !item.estado) : true;
    return matchNombre && matchEstado;
  });
  const paginatedRows = filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleOpen = (item: any = null) => {
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

  const handleToggleEstado = (row: any) => {
    const isActiva = row.estado;
    const nombre = row.nombre;
    const tipo = current.label;
    
    setConfirmDlg({
      open: true,
      title: isActiva ? `¿Desactivar ${tipo}?` : `¿Restaurar ${tipo}?`,
      message: isActiva 
        ? `¿Deseas desactivar "${nombre}"? Esta acción lo marcará como inactivo.` 
        : `¿Deseas restaurar "${nombre}"? Volverá a estar activo en el sistema.`,
      type: isActiva ? 'error' : 'success',
      onConfirm: async () => {
        setConfirming(true);
        try {
          const result = isActiva
            ? await current.remove(row[current.idKey])
            : await current.update(row[current.idKey], { ...row, estado: true });
          
          if (result?.ok) {
            showNotif(`${tipo} ${isActiva ? 'desactivada' : 'restaurada'}`);
            refetch();
          } else {
            showNotif(result?.error || 'Error en la operación', 'error');
          }
        } catch {
          showNotif('Error de conexión', 'error');
        }
        setConfirming(false);
        setConfirmDlg(p => ({ ...p, open: false }));
      }
    });
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
        <Tabs value={tab} onChange={(_, v) => { setTab(v); setPage(0); setSearchNombre(''); setSearchEstado('Todos'); }}>
          <Tab label="Facultades"  icon={<BankOutlined />}       iconPosition="start" />
          <Tab label="Áreas"       icon={<ApartmentOutlined />}  iconPosition="start" />
          <Tab label="Modalidades" icon={<ProfileOutlined />}    iconPosition="start" />
          <Tab label="Categorías"  icon={<TagsOutlined />}       iconPosition="start" />
        </Tabs>
      </Box>

      <Box sx={{ px: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              size="small"
              fullWidth
              placeholder={`Buscar ${current.label.toLowerCase()}...`}
              value={searchNombre}
              onChange={(e) => { setSearchNombre(e.target.value); setPage(0); }}
              InputProps={{
                startAdornment: <SearchOutlined style={{ color: '#888', marginRight: 8 }} />
              }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField 
              fullWidth 
              size="small" 
              select 
              label="Estado" 
              value={searchEstado} 
              onChange={e => { setSearchEstado(e.target.value); setPage(0); }}
            >
              <MenuItem value="Todos">Todos</MenuItem>
              <MenuItem value="Activo">Activo</MenuItem>
              <MenuItem value="Inactivo">Inactivo</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">Error al cargar datos: {error.message}</Alert>
      ) : (
        <>
          <CatalogTable
            rows={paginatedRows}
            idKey={current.idKey}
            onEdit={handleOpen}
            onToggleEstado={handleToggleEstado}
          />
          {filteredRows.length > 0 && (
            <CustomPagination 
              count={filteredRows.length} 
              rowsPerPage={rowsPerPage} 
              page={page} 
              onPageChange={(_: any, p: number) => setPage(p)} 
              onRowsPerPageChange={(e: any) => { setRowsPerPage(e.target.value); setPage(0); }} 
            />
          )}
        </>
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
