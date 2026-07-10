import { useState, useRef } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Switch,
  FormControlLabel,
  Snackbar,
  Alert,
  CircularProgress,
  Chip,
  Tooltip,
  Typography,
  Divider,
  Grid,
  Avatar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  ListItemText
} from '@mui/material';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  UploadOutlined,
  EyeOutlined,
  FileDoneOutlined,
  EnvironmentOutlined,
  AlignLeftOutlined,
  LeftOutlined,
  RightOutlined,
  StopOutlined,
  RedoOutlined,
  UserOutlined,
  ClearOutlined,
  SearchOutlined,
  FilterOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';
import MainCard from 'components/MainCard';

const BACKEND_MEDIA = `http://${window.location.hostname}:8000/media/`;
const imgUrl = (path) => (path ? `${BACKEND_MEDIA}${path}` : null);

const GET_MEMBRETES = gql`
  query {
    todosLosMembretes {
      idMembrete
      titulo
      subtitulo
      direccion
      piePagina1
      piePagina2
      piePagina3
      estado
      logoUnidad
      logoInstitucion
      firma
      selloAutoridad
      membreteFirmantes {
        idMembreteFirmante
        orden
        estado
        personal {
          idPersonal
          nombre
          apellido
          firmaImg
          cargo {
            nombre
          }
        }
      }
    }
  }
`;

const OBTENER_PERSONAL_FIRMANTES = gql`
  query {
    todoElPersonal {
      idPersonal
      nombre
      apellido
      firmaImg
      estado
      cargo {
        nombre
      }
    }
  }
`;

const CREATE_MEMBRETE = gql`
  mutation (
    $titulo: String!
    $subtitulo: String
    $direccion: String
    $piePagina1: String
    $piePagina2: String
    $piePagina3: String
    $logoUnidad: Upload
    $logoInstitucion: Upload
    $firma: Upload
    $selloAutoridad: Upload
    $idsPersonalFirmantes: [ID]
  ) {
    crearMembrete(
      titulo: $titulo
      subtitulo: $subtitulo
      direccion: $direccion
      piePagina1: $piePagina1
      piePagina2: $piePagina2
      piePagina3: $piePagina3
      logoUnidad: $logoUnidad
      logoInstitucion: $logoInstitucion
      firma: $firma
      selloAutoridad: $selloAutoridad
      idsPersonalFirmantes: $idsPersonalFirmantes
    ) {
      ok
      error
    }
  }
`;

const EDIT_MEMBRETE = gql`
  mutation (
    $idMembrete: ID!
    $titulo: String
    $subtitulo: String
    $direccion: String
    $piePagina1: String
    $piePagina2: String
    $piePagina3: String
    $estado: Boolean
    $logoUnidad: Upload
    $logoInstitucion: Upload
    $firma: Upload
    $selloAutoridad: Upload
    $idsPersonalFirmantes: [ID]
  ) {
    editarMembrete(
      idMembrete: $idMembrete
      titulo: $titulo
      subtitulo: $subtitulo
      direccion: $direccion
      piePagina1: $piePagina1
      piePagina2: $piePagina2
      piePagina3: $piePagina3
      estado: $estado
      logoUnidad: $logoUnidad
      logoInstitucion: $logoInstitucion
      firma: $firma
      selloAutoridad: $selloAutoridad
      idsPersonalFirmantes: $idsPersonalFirmantes
    ) {
      ok
      error
    }
  }
`;

const DELETE_MEMBRETE = gql`
  mutation ($idMembrete: ID!) {
    eliminarMembrete(idMembrete: $idMembrete) {
      ok
      error
    }
  }
`;

const INIT_FORM = {
  titulo: '',
  subtitulo: '',
  direccion: '',
  piePagina1: '',
  piePagina2: '',
  piePagina3: '',
  estado: true
};

const INIT_IMGS = { logoUnidad: null, logoInstitucion: null, firma: null, selloAutoridad: null };

// Miniatura para la tabla
function Thumb({ path, label }) {
  const url = imgUrl(path);
  if (!url)
    return (
      <Typography variant="caption" color="text.disabled">
        —
      </Typography>
    );
  return (
    <Tooltip title={<img src={url} alt={label} style={{ maxWidth: 200 }} />} arrow placement="right">
      <Box
        component="img"
        src={url}
        alt={label}
        sx={{ height: 32, width: 32, objectFit: 'contain', border: '1px solid #e0e0e0', borderRadius: 1, cursor: 'pointer' }}
      />
    </Tooltip>
  );
}

// Campo de carga de imagen — Diseño moderno tipo tarjeta
function ImageField({ label, fieldKey, currentPath, preview, onFileSelect, inputRef, icon }) {
  const currentUrl = imgUrl(currentPath);
  const displayUrl = preview || currentUrl;
  const hasImage = Boolean(displayUrl);

  return (
    <Box
      component="label"
      htmlFor={`img-upload-${fieldKey}`}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        p: 2,
        height: 150,
        borderRadius: 3,
        border: '2px dashed',
        borderColor: hasImage ? 'primary.main' : 'divider',
        bgcolor: hasImage ? 'primary.lighter' : 'background.default',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          borderColor: 'primary.main',
          bgcolor: 'primary.lighter',
          transform: 'translateY(-2px)',
          boxShadow: '0 6px 20px rgba(99,102,241,0.15)'
        }
      }}
    >
      <input id={`img-upload-${fieldKey}`} type="file" hidden accept="image/*" ref={inputRef} onChange={onFileSelect} />

      {hasImage ? (
        <>
          <Box component="img" src={displayUrl} alt={label} sx={{ height: 80, maxWidth: '100%', objectFit: 'contain', borderRadius: 1 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {preview ? (
              <Typography variant="caption" color="success.main" fontWeight={700}>
                ✓ Nueva imagen lista
              </Typography>
            ) : (
              <Typography variant="caption" color="primary.main" fontWeight={600}>
                Imagen guardada • Clic para cambiar
              </Typography>
            )}
          </Box>
        </>
      ) : (
        <>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              bgcolor: 'action.hover',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <UploadOutlined style={{ fontSize: 20, color: '#9e9e9e' }} />
          </Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textAlign: 'center', lineHeight: 1.4 }}>
            {label}
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.68rem' }}>
            Haz clic para subir
          </Typography>
        </>
      )}
    </Box>
  );
}

export default function MembretesFirmasPage() {
  const { data, loading, error, refetch } = useQuery(GET_MEMBRETES, { fetchPolicy: 'network-only' });
  const { data: dataPersonal } = useQuery(OBTENER_PERSONAL_FIRMANTES);
  const [crearMembrete] = useMutation(CREATE_MEMBRETE);
  const [editarMembrete] = useMutation(EDIT_MEMBRETE);
  const [eliminarMembrete] = useMutation(DELETE_MEMBRETE);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(INIT_FORM);
  const [imgFiles, setImgFiles] = useState(INIT_IMGS);
  const [imgPreviews, setImgPreviews] = useState(INIT_IMGS);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [saving, setSaving] = useState(false);

  // View states
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [viewItem, setViewItem] = useState(null);

  // Paginación y Filtros
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [filterTitulo, setFilterTitulo] = useState('');
  const [filterEstado, setFilterEstado] = useState('all');

  // Confirmación de cambio de estado
  const [confirmDialog, setConfirmDialog] = useState({ open: false, item: null });

  // Firmantes (Personal) del membrete que se está creando/editando, en orden de selección
  const [selectedFirmantesIds, setSelectedFirmantesIds] = useState([]);
  const personalActivo = (dataPersonal?.todoElPersonal || []).filter((p) => p.estado);

  const moveFirmante = (idx, dir) => {
    setSelectedFirmantesIds((prev) => {
      const arr = [...prev];
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= arr.length) return arr;
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr;
    });
  };

  // refs para resetear inputs de archivo
  const refLogoUnidad = useRef(null);
  const refLogoInstitucion = useRef(null);
  const refFirma = useRef(null);
  const refSello = useRef(null);

  const membretes = data?.todosLosMembretes || [];
  
  const membretesFiltrados = membretes.filter(m => {
    const matchTitulo = filterTitulo ? m.titulo.toLowerCase().includes(filterTitulo.toLowerCase()) : true;
    const matchEstado = filterEstado === 'all' ? true : (filterEstado === 'true' ? m.estado === true : m.estado === false);
    return matchTitulo && matchEstado;
  });

  const showNotification = (message, severity) => setNotification({ open: true, message, severity });
  const totalPages = Math.ceil(membretesFiltrados.length / rowsPerPage);
  const paginatedMembretes = membretesFiltrados.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleOpen = (item = null) => {
    setEditingItem(item);
    setForm(
      item
        ? {
            titulo: item.titulo || '',
            subtitulo: item.subtitulo || '',
            direccion: item.direccion || '',
            piePagina1: item.piePagina1 || '',
            piePagina2: item.piePagina2 || '',
            piePagina3: item.piePagina3 || '',
            estado: item.estado
          }
        : INIT_FORM
    );
    setImgFiles(INIT_IMGS);
    setImgPreviews(INIT_IMGS);
    setSelectedFirmantesIds(
      item
        ? [...(item.membreteFirmantes || [])]
            .filter((f) => f.estado)
            .sort((a, b) => a.orden - b.orden)
            .map((f) => f.personal.idPersonal)
        : []
    );
    setOpenDialog(true);
  };

  const handleOpenView = (item) => {
    setViewItem(item);
    setOpenViewDialog(true);
  };

  const handleFileSelect = (fieldKey) => (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImgFiles((p) => ({ ...p, [fieldKey]: file }));
    setImgPreviews((p) => ({ ...p, [fieldKey]: URL.createObjectURL(file) }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const textVars = {
        titulo: form.titulo,
        subtitulo: form.subtitulo,
        direccion: form.direccion,
        piePagina1: form.piePagina1,
        piePagina2: form.piePagina2,
        piePagina3: form.piePagina3
      };
      const imgVars = {
        logoUnidad: imgFiles.logoUnidad || undefined,
        logoInstitucion: imgFiles.logoInstitucion || undefined,
        firma: imgFiles.firma || undefined,
        selloAutoridad: imgFiles.selloAutoridad || undefined
      };

      const vars = editingItem
        ? { idMembrete: editingItem.idMembrete, ...textVars, estado: form.estado, ...imgVars, idsPersonalFirmantes: selectedFirmantesIds }
        : { ...textVars, ...imgVars, idsPersonalFirmantes: selectedFirmantesIds };

      const res = editingItem ? await editarMembrete({ variables: vars }) : await crearMembrete({ variables: vars });

      const result = editingItem ? res.data?.editarMembrete : res.data?.crearMembrete;

      if (result?.ok) {
        showNotification(editingItem ? 'Membrete actualizado' : 'Membrete creado', 'success');
        refetch();
        setOpenDialog(false);
      } else {
        showNotification(result?.error || 'Error al guardar', 'error');
      }
    } catch (err) {
      showNotification('Error de conexión', 'error');
    }
    setSaving(false);
  };

  const handleToggleEstado = async () => {
    const item = confirmDialog.item;
    if (!item) return;
    setConfirmDialog({ open: false, item: null });
    try {
      const res = await editarMembrete({
        variables: { idMembrete: item.idMembrete, estado: !item.estado }
      });
      if (res.data?.editarMembrete?.ok) {
        showNotification(item.estado ? 'Membrete desactivado' : 'Membrete restaurado', item.estado ? 'warning' : 'success');
        refetch();
      } else {
        showNotification(res.data?.editarMembrete?.error || 'Error', 'error');
      }
    } catch {
      showNotification('Error de conexión', 'error');
    }
  };

  // Sincronizar viewItem con datos refrescados
  const currentViewItem = viewItem ? (data?.todosLosMembretes || []).find(m => m.idMembrete === viewItem.idMembrete) || viewItem : null;

  return (
    <MainCard
      title="Membretes y Firmas"
      secondary={
        <Button variant="contained" startIcon={<PlusOutlined />} onClick={() => handleOpen()}>
          Nuevo Membrete
        </Button>
      }
    >
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ p: 2 }}>
          <Alert severity="error">Error al cargar membretes: {error.message}</Alert>
        </Box>
      ) : (
        <>
          <Box sx={{
            mb: 3, p: 2,
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Buscar por título..."
                  value={filterTitulo}
                  onChange={(e) => { setFilterTitulo(e.target.value); setPage(0); }}
                  InputProps={{
                    startAdornment: <SearchOutlined style={{ color: '#bfbfbf', marginRight: 8 }} />
                  }}
                  sx={{ bgcolor: 'background.paper' }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={filterEstado}
                    label="Estado"
                    onChange={(e) => { setFilterEstado(e.target.value); setPage(0); }}
                    sx={{ bgcolor: 'background.paper' }}
                    startAdornment={<FilterOutlined style={{ color: '#bfbfbf', marginRight: 8 }} />}
                  >
                    <MenuItem value="all">Todos los Estados</MenuItem>
                    <MenuItem value="true">Activos</MenuItem>
                    <MenuItem value="false">Inactivos</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Tooltip title="Limpiar Filtros">
                  <IconButton 
                    onClick={() => { setFilterTitulo(''); setFilterEstado('all'); setPage(0); }}
                    color="secondary" 
                    sx={{ 
                      border: '1px solid', 
                      borderColor: 'divider', 
                      borderRadius: '8px',
                      visibility: (filterTitulo !== '' || filterEstado !== 'all') ? 'visible' : 'hidden'
                    }}
                  >
                    <ClearOutlined />
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>
          </Box>

          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Título</TableCell>
                  <TableCell>Subtítulo</TableCell>
                  <TableCell>Dirección</TableCell>
                  <TableCell>Logo Unidad</TableCell>
                  <TableCell>Logo Inst.</TableCell>
                  <TableCell>Firma</TableCell>
                  <TableCell>Sello</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedMembretes.map((m) => (
                  <TableRow key={m.idMembrete}>
                    <TableCell>{m.idMembrete}</TableCell>
                    <TableCell>{m.titulo}</TableCell>
                    <TableCell>{m.subtitulo || '—'}</TableCell>
                    <TableCell>{m.direccion || '—'}</TableCell>
                    <TableCell>
                      <Thumb path={m.logoUnidad} label="Logo Unidad" />
                    </TableCell>
                    <TableCell>
                      <Thumb path={m.logoInstitucion} label="Logo Institución" />
                    </TableCell>
                    <TableCell>
                      <Thumb path={m.firma} label="Firma" />
                    </TableCell>
                    <TableCell>
                      <Thumb path={m.selloAutoridad} label="Sello Autoridad" />
                    </TableCell>
                    <TableCell>
                      <Chip label={m.estado ? 'Activo' : 'Inactivo'} color={m.estado ? 'success' : 'error'} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'nowrap', gap: 0.5 }}>
                        <Tooltip title="Ver detalle">
                          <IconButton size="small" color="info" onClick={() => handleOpenView(m)}>
                            <EyeOutlined />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton size="small" color="primary" onClick={() => handleOpen(m)}>
                            <EditOutlined />
                          </IconButton>
                        </Tooltip>
                        {m.estado ? (
                          <Tooltip title="Desactivar membrete">
                            <IconButton
                              size="small"
                              onClick={() => setConfirmDialog({ open: true, item: m })}
                              sx={{
                                color: 'error.main',
                                '&:hover': { bgcolor: 'error.lighter' }
                              }}
                            >
                              <StopOutlined />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Restaurar membrete">
                            <IconButton
                              size="small"
                              onClick={() => setConfirmDialog({ open: true, item: m })}
                              sx={{
                                color: 'success.main',
                                '&:hover': { bgcolor: 'success.lighter' }
                              }}
                            >
                              <RedoOutlined />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {membretesFiltrados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      No hay membretes que coincidan con la búsqueda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* ── Barra de paginación ── */}
          {membretesFiltrados.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 2,
                py: 1.5,
                borderTop: '1px solid',
                borderColor: 'divider'
              }}
            >
              {/* Izquierda: Mostrar X registros */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Mostrar
                </Typography>
                <Select
                  value={rowsPerPage}
                  size="small"
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setPage(0);
                  }}
                  sx={{ minWidth: 64, height: 32, fontSize: '0.875rem' }}
                >
                  {[5, 10, 25, 50].map((n) => (
                    <MenuItem key={n} value={n}>
                      {n}
                    </MenuItem>
                  ))}
                </Select>
                <Typography variant="body2" color="text.secondary">
                  registros
                </Typography>
              </Box>

              {/* Derecha: Botones de página */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <IconButton
                  size="small"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  sx={{ width: 32, height: 32 }}
                >
                  <LeftOutlined style={{ fontSize: 12 }} />
                </IconButton>

                {Array.from({ length: totalPages }, (_, i) => (
                  <Box
                    key={i}
                    onClick={() => setPage(i)}
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      bgcolor: page === i ? 'primary.main' : 'transparent',
                      color: page === i ? 'primary.contrastText' : 'text.primary',
                      '&:hover': { bgcolor: page === i ? 'primary.dark' : 'action.hover' },
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {i + 1}
                  </Box>
                ))}

                <IconButton
                  size="small"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  sx={{ width: 32, height: 32 }}
                >
                  <RightOutlined style={{ fontSize: 12 }} />
                </IconButton>
              </Box>
            </Box>
          )}
        </>
      )}

      {/* ── Dialog: Nuevo / Editar Membrete ── */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: '0 24px 60px rgba(0,0,0,0.18)'
          }
        }}
      >
        {/* Header del dialog */}
        <DialogTitle
          sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <FileDoneOutlined style={{ fontSize: 20 }} />
          <Box sx={{ flexGrow: 1, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={700}>
              {editingItem ? 'Editar Membrete' : 'Nuevo Membrete'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {editingItem ? 'Modifica los datos del membrete institucional' : 'Completa los datos para crear el membrete'}
            </Typography>
          </Box>
          {editingItem && (
            <FormControlLabel
              control={<Switch checked={form.estado} onChange={(e) => setForm((p) => ({ ...p, estado: e.target.checked }))} />}
              label={
                <Typography variant="caption" fontWeight={600}>
                  {form.estado ? 'Activo' : 'Inactivo'}
                </Typography>
              }
            />
          )}
        </DialogTitle>

        <DialogContent sx={{ p: 3, bgcolor: 'background.default' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Sección 1: Información Principal */}
            <Box
              sx={{
                p: 2.5,
                borderRadius: 3,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1.5,
                    bgcolor: 'action.hover',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <AlignLeftOutlined style={{ fontSize: 16 }} />
                </Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  Información Principal
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Título *"
                    value={form.titulo}
                    fullWidth
                    required
                    onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))}
                    placeholder="Ej: Universidad Autónoma Gabriel René Moreno"
                    InputProps={{ sx: { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Subtítulo"
                    value={form.subtitulo}
                    fullWidth
                    onChange={(e) => setForm((p) => ({ ...p, subtitulo: e.target.value }))}
                    placeholder="Ej: Facultad de Ingeniería"
                    InputProps={{ sx: { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Dirección"
                    value={form.direccion}
                    fullWidth
                    onChange={(e) => setForm((p) => ({ ...p, direccion: e.target.value }))}
                    placeholder="Ej: Santa Cruz, Bolivia"
                    InputProps={{ sx: { borderRadius: 2 } }}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Sección 2: Pies de Página */}
            <Box
              sx={{
                p: 2.5,
                borderRadius: 3,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1.5,
                    bgcolor: 'action.hover',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <EnvironmentOutlined style={{ fontSize: 16 }} />
                </Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  Pies de Página
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  (se muestran al final de cada documento)
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Pie de Página 1"
                    value={form.piePagina1}
                    fullWidth
                    onChange={(e) => setForm((p) => ({ ...p, piePagina1: e.target.value }))}
                    placeholder="Línea 1"
                    InputProps={{ sx: { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Pie de Página 2"
                    value={form.piePagina2}
                    fullWidth
                    onChange={(e) => setForm((p) => ({ ...p, piePagina2: e.target.value }))}
                    placeholder="Línea 2"
                    InputProps={{ sx: { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Pie de Página 3"
                    value={form.piePagina3}
                    fullWidth
                    onChange={(e) => setForm((p) => ({ ...p, piePagina3: e.target.value }))}
                    placeholder="Línea 3"
                    InputProps={{ sx: { borderRadius: 2 } }}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Sección 3: Imágenes */}
            <Box
              sx={{
                p: 2.5,
                borderRadius: 3,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1.5,
                    bgcolor: 'action.hover',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <UploadOutlined style={{ fontSize: 16 }} />
                </Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  Imágenes del Membrete
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  (formatos: PNG, JPG, SVG)
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <ImageField
                    label="Logo Unidad"
                    fieldKey="logoUnidad"
                    currentPath={editingItem?.logoUnidad}
                    preview={imgPreviews.logoUnidad}
                    onFileSelect={handleFileSelect('logoUnidad')}
                    inputRef={refLogoUnidad}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <ImageField
                    label="Logo Institución"
                    fieldKey="logoInstitucion"
                    currentPath={editingItem?.logoInstitucion}
                    preview={imgPreviews.logoInstitucion}
                    onFileSelect={handleFileSelect('logoInstitucion')}
                    inputRef={refLogoInstitucion}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <ImageField
                    label="Firma"
                    fieldKey="firma"
                    currentPath={editingItem?.firma}
                    preview={imgPreviews.firma}
                    onFileSelect={handleFileSelect('firma')}
                    inputRef={refFirma}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <ImageField
                    label="Sello Autoridad"
                    fieldKey="selloAutoridad"
                    currentPath={editingItem?.selloAutoridad}
                    preview={imgPreviews.selloAutoridad}
                    onFileSelect={handleFileSelect('selloAutoridad')}
                    inputRef={refSello}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Sección 4: Firmantes */}
            <Box
              sx={{
                p: 2.5,
                borderRadius: 3,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1.5,
                    bgcolor: 'action.hover',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <UserOutlined style={{ fontSize: 16 }} />
                </Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  Firmantes del Certificado
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  (selecciona el personal que firmará; el orden de aparición es el orden de selección)
                </Typography>
              </Box>

              <TextField
                select
                fullWidth
                label="Personal firmante"
                size="small"
                SelectProps={{
                  multiple: true,
                  value: selectedFirmantesIds,
                  onChange: (e) => {
                    const value = e.target.value;
                    setSelectedFirmantesIds(typeof value === 'string' ? value.split(',') : value);
                  },
                  renderValue: (selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((id) => {
                        const p = personalActivo.find((x) => x.idPersonal === id);
                        return <Chip key={id} label={p ? `${p.nombre} ${p.apellido}` : id} size="small" />;
                      })}
                    </Box>
                  )
                }}
                InputProps={{ sx: { borderRadius: 2 } }}
              >
                {personalActivo.map((p) => (
                  <MenuItem key={p.idPersonal} value={p.idPersonal}>
                    <Checkbox checked={selectedFirmantesIds.indexOf(p.idPersonal) > -1} />
                    <ListItemText primary={`${p.nombre} ${p.apellido}`} secondary={p.cargo?.nombre} />
                  </MenuItem>
                ))}
              </TextField>

              {selectedFirmantesIds.length > 0 && (
                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {selectedFirmantesIds.map((id, idx) => {
                    const p = personalActivo.find((x) => x.idPersonal === id);
                    if (!p) return null;
                    return (
                      <Box
                        key={id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          p: 1,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider'
                        }}
                      >
                        <Chip label={idx + 1} size="small" />
                        <Thumb path={p.firmaImg} label="Firma" />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {p.nombre} {p.apellido}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {p.cargo?.nombre || '—'}
                          </Typography>
                        </Box>
                        <IconButton size="small" disabled={idx === 0} onClick={() => moveFirmante(idx, -1)}>
                          <ArrowUpOutlined />
                        </IconButton>
                        <IconButton
                          size="small"
                          disabled={idx === selectedFirmantesIds.length - 1}
                          onClick={() => moveFirmante(idx, 1)}
                        >
                          <ArrowDownOutlined />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setSelectedFirmantesIds((prev) => prev.filter((x) => x !== id))}
                        >
                          <DeleteOutlined />
                        </IconButton>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>

        {/* Footer */}
        <Box
          sx={{
            px: 3,
            py: 2,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 1.5,
            bgcolor: 'background.paper',
            borderTop: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Button onClick={() => setOpenDialog(false)} variant="outlined" color="secondary" sx={{ borderRadius: 2, px: 3 }}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!form.titulo || saving}
            sx={{
              borderRadius: 2,
              px: 3,
              background: 'linear-gradient(135deg, #1890ff, #096dd9)',
              boxShadow: '0 4px 14px rgba(24,144,255,0.4)',
              '&:hover': { background: 'linear-gradient(135deg, #096dd9, #0050b3)' }
            }}
          >
            {saving ? <CircularProgress size={22} color="inherit" /> : editingItem ? 'Guardar cambios' : 'Crear Membrete'}
          </Button>
        </Box>
      </Dialog>

      {/* ── Dialog: Ver Membrete ── */}
      <Dialog
        open={openViewDialog}
        onClose={() => setOpenViewDialog(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: '0 24px 60px rgba(0,0,0,0.18)'
          }
        }}
      >
        {/* Header */}
        <DialogTitle
          sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <FileDoneOutlined style={{ fontSize: 20 }} />
          <Box sx={{ flexGrow: 1, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={700}>
              {currentViewItem?.titulo || 'Detalles de Membrete'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Membrete • ID: {currentViewItem?.idMembrete}
            </Typography>
          </Box>
          {currentViewItem?.estado !== undefined && (
            <Chip
              label={currentViewItem.estado ? 'ACTIVO' : 'INACTIVO'}
              color={currentViewItem.estado ? 'success' : 'error'}
              variant="outlined"
              size="small"
            />
          )}
        </DialogTitle>

        <DialogContent sx={{ p: 3, bgcolor: 'background.default' }}>
          {currentViewItem && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Sección: Información General */}
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1.5,
                      bgcolor: 'action.hover',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <AlignLeftOutlined style={{ fontSize: 16 }} />
                  </Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Información General
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">
                      Título
                    </Typography>
                    <Typography variant="body1" fontWeight={500} sx={{ mt: 0.25 }}>
                      {currentViewItem.titulo || '—'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Subtítulo
                    </Typography>
                    <Typography variant="body1" fontWeight={500} sx={{ mt: 0.25 }}>
                      {currentViewItem.subtitulo || '—'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Dirección
                    </Typography>
                    <Typography variant="body1" fontWeight={500} sx={{ mt: 0.25 }}>
                      {currentViewItem.direccion || '—'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Sección: Pies de Página */}
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1.5,
                      bgcolor: 'action.hover',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <EnvironmentOutlined style={{ fontSize: 16 }} />
                  </Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Pies de Página
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    (al final de cada documento)
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {[currentViewItem.piePagina1, currentViewItem.piePagina2, currentViewItem.piePagina3].map((pie, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: 1,
                          bgcolor: 'action.hover',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <Typography variant="caption" fontWeight={700}>
                          {i + 1}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color={pie ? 'text.primary' : 'text.disabled'} fontStyle={pie ? 'normal' : 'italic'}>
                        {pie || 'Sin contenido'}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Sección: Imágenes */}
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1.5,
                      bgcolor: 'action.hover',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <UploadOutlined style={{ fontSize: 16 }} />
                  </Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Imágenes del Membrete
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  {[
                    { label: 'Logo Unidad', src: currentViewItem.logoUnidad },
                    { label: 'Logo Institución', src: currentViewItem.logoInstitucion },
                    { label: 'Firma', src: currentViewItem.firma },
                    { label: 'Sello Autoridad', src: currentViewItem.selloAutoridad }
                  ].map(({ label, src }) => (
                    <Grid item xs={6} sm={3} key={label}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          textAlign: 'center',
                          bgcolor: 'background.default',
                          height: '100%'
                        }}
                      >
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1, fontWeight: 600 }}>
                          {label}
                        </Typography>
                        {src ? (
                          <Box component="img" src={imgUrl(src)} alt={label} sx={{ width: '100%', maxHeight: 80, objectFit: 'contain' }} />
                        ) : (
                          <Typography variant="caption" color="text.disabled" fontStyle="italic">
                            Sin imagen
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              {/* Sección: Firmantes */}
              <Box
                sx={{
                  p: 2.5, borderRadius: 3, bgcolor: 'background.paper',
                  border: '1px solid', borderColor: 'divider', boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UserOutlined style={{ fontSize: 16 }} />
                  </Box>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ flex: 1 }}>
                    Firmantes del Certificado
                  </Typography>
                </Box>

                {(currentViewItem.membreteFirmantes || []).filter(f => f.estado).length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 1, fontStyle: 'italic' }}>
                    Sin firmantes seleccionados. Edita el membrete para elegir el personal que firmará los certificados.
                  </Typography>
                ) : (
                  <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell width={50} align="center">Orden</TableCell>
                          <TableCell>Nombre</TableCell>
                          <TableCell>Cargo</TableCell>
                          <TableCell width={80} align="center">Firma</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {[...(currentViewItem.membreteFirmantes || [])].filter(f => f.estado).sort((a, b) => a.orden - b.orden).map(f => (
                          <TableRow key={f.idMembreteFirmante} hover>
                            <TableCell align="center">
                              <Chip label={f.orden} size="small" variant="outlined" />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={500}>{f.personal.nombre} {f.personal.apellido}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">{f.personal.cargo?.nombre}</Typography>
                            </TableCell>
                            <TableCell align="center">
                              {f.personal.firmaImg
                                ? <Box component="img" src={imgUrl(f.personal.firmaImg)} alt="Firma" sx={{ height: 28, maxWidth: 60, objectFit: 'contain' }} />
                                : <Typography variant="caption" color="text.disabled">—</Typography>}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>

        {/* Footer */}
        <Box
          sx={{
            px: 3,
            py: 2,
            display: 'flex',
            justifyContent: 'flex-end',
            bgcolor: 'background.paper',
            borderTop: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Button onClick={() => setOpenViewDialog(false)} variant="outlined" color="secondary" sx={{ borderRadius: 2, px: 3 }}>
            Cerrar
          </Button>
        </Box>
      </Dialog>

      {/* ── Dialog: Confirmación de estado ── */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, item: null })}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.18)' } }}
      >
        <Box
          sx={{
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            textAlign: 'center'
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: confirmDialog.item?.estado ? 'error.lighter' : 'success.lighter',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {confirmDialog.item?.estado ? (
              <StopOutlined style={{ fontSize: 28, color: '#ff4d4f' }} />
            ) : (
              <RedoOutlined style={{ fontSize: 28, color: '#52c41a' }} />
            )}
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
              {confirmDialog.item?.estado ? '¿Desactivar membrete?' : '¿Restaurar membrete?'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {confirmDialog.item?.estado
                ? `El membrete "${confirmDialog.item?.titulo}" pasará a estado Inactivo.`
                : `El membrete "${confirmDialog.item?.titulo}" volverá a estar Activo.`}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, width: '100%' }}>
            <Button
              fullWidth
              variant="outlined"
              color="secondary"
              sx={{ borderRadius: 2 }}
              onClick={() => setConfirmDialog({ open: false, item: null })}
            >
              Cancelar
            </Button>
            <Button
              fullWidth
              variant="contained"
              sx={{
                borderRadius: 2,
                bgcolor: confirmDialog.item?.estado ? 'error.main' : 'success.main',
                '&:hover': { bgcolor: confirmDialog.item?.estado ? 'error.dark' : 'success.dark' }
              }}
              onClick={handleToggleEstado}
            >
              {confirmDialog.item?.estado ? 'Sí, desactivar' : 'Sí, restaurar'}
            </Button>
          </Box>
        </Box>
      </Dialog>


      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={notification.severity} variant="filled">
          {notification.message}
        </Alert>
      </Snackbar>
    </MainCard>
  );
}
