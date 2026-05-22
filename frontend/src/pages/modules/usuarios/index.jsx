import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useTheme } from '@mui/material/styles';
import {
  Typography,
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
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Snackbar,
  Alert,
  CircularProgress,
  TablePagination,
  Pagination,
  Stack
} from '@mui/material';
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined, FilterOutlined } from '@ant-design/icons';
import { MenuItem, Select, InputLabel, FormControl, Grid, Chip, Avatar, Tooltip } from '@mui/material';
import { UserOutlined, MailOutlined, CheckCircleOutlined, StopOutlined } from '@ant-design/icons';
import MainCard from 'components/MainCard';

const GET_USUARIOS = gql`
  query {
    todosLosUsuarios {
      idUsuario
      username
      email
      estado
      participante {
        idParticipante
      }
      tutor {
        idTutor
      }
      tribunal {
        idTribunal
      }
    }
  }
`;

const CREATE_USUARIO = gql`
  mutation Create($username: String!, $email: String!, $password: String!) {
    crearUsuario(username: $username, email: $email, password: $password) {
      ok
      error
    }
  }
`;

const EDIT_USUARIO = gql`
  mutation Edit($idUsuario: ID!, $username: String, $email: String, $password: String, $estado: Boolean) {
    editarUsuario(idUsuario: $idUsuario, username: $username, email: $email, password: $password, estado: $estado) {
      ok
      error
    }
  }
`;

const DELETE_USUARIO = gql`
  mutation Delete($idUsuario: ID!) {
    eliminarUsuario(idUsuario: $idUsuario) {
      ok
      error
    }
  }
`;

export default function UsuariosPage() {
  const theme = useTheme();
  const { data, loading, error, refetch } = useQuery(GET_USUARIOS, { fetchPolicy: 'network-only' });
  const [crearUsuario] = useMutation(CREATE_USUARIO);
  const [editarUsuario] = useMutation(EDIT_USUARIO);
  const [eliminarUsuario] = useMutation(DELETE_USUARIO);

  console.log('GraphQL Data:', data);
  console.log('GraphQL Error:', error);

  const usuarios = data?.todosLosUsuarios || [];

  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ username: '', email: '', password: '', estado: true });
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [saving, setSaving] = useState(false);

  // Filtros
  const [filterTipo, setFilterTipo] = useState('todos');
  const [filterEmail, setFilterEmail] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');

  // Paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const getTipoUsuario = (user) => {
    if (user.participante) return 'Participante';
    if (user.tutor) return 'Tutor';
    if (user.tribunal) return 'Tribunal';
    return 'Administrador';
  };

  const usuariosFiltrados = usuarios.filter((user) => {
    const tipo = getTipoUsuario(user);
    const matchesTipo = filterTipo === 'todos' || tipo === filterTipo;
    const matchesEmail = (user.email || '').toLowerCase().includes(filterEmail.toLowerCase());
    const matchesEstado =
      filterEstado === 'todos' || (filterEstado === 'activo' && user.estado) || (filterEstado === 'inactivo' && !user.estado);

    return matchesTipo && matchesEmail && matchesEstado;
  });

  const paginatedUsers = usuariosFiltrados.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({ username: user.username, email: user.email, password: '', estado: user.estado });
    } else {
      setEditingUser(null);
      setFormData({ username: '', email: '', password: '', estado: true });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    const isEditing = !!editingUser;

    try {
      const variables = isEditing
        ? {
            idUsuario: editingUser.idUsuario,
            username: formData.username,
            email: formData.email,
            estado: formData.estado,
            ...(formData.password ? { password: formData.password } : {})
          }
        : { username: formData.username, email: formData.email, password: formData.password };

      const response = isEditing ? await editarUsuario({ variables }) : await crearUsuario({ variables });

      const actionResult = isEditing ? response.data?.editarUsuario : response.data?.crearUsuario;

      if (actionResult?.ok) {
        showNotification(isEditing ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente', 'success');
        refetch();
        handleCloseDialog();
      } else {
        showNotification(actionResult?.error || 'Error al guardar usuario', 'error');
      }
    } catch (error) {
      showNotification('Error de conexión o validación', 'error');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) return;

    try {
      const response = await eliminarUsuario({ variables: { idUsuario: id } });
      const result = response.data?.eliminarUsuario;

      if (result?.ok) {
        showNotification('Usuario eliminado exitosamente', 'success');
        refetch();
      } else {
        showNotification(result?.error || 'Error al eliminar', 'error');
      }
    } catch (error) {
      showNotification('Error de conexión', 'error');
    }
  };

  const showNotification = (message, severity) => {
    setNotification({ open: true, message, severity });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Encabezado Premium */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
            Gestión de Usuarios
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Administra los accesos y roles del sistema Expociencia.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PlusOutlined />}
          onClick={() => handleOpenDialog()}
          sx={{
            borderRadius: '12px',
            px: 3,
            py: 1.2,
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: '0 8px 16px rgba(0, 100, 255, 0.2)',
            transition: 'all 0.2s',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 12px 20px rgba(0, 100, 255, 0.3)'
            }
          }}
        >
          Nuevo Usuario
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress size={48} thickness={4} />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(255,0,0,0.1)' }}>
          Error al cargar usuarios: {error.message}
        </Alert>
      ) : (
        <>
          {/* Filtros Neumórficos/Premium */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 4px 24px rgba(0,0,0,0.03)',
              transition: 'box-shadow 0.3s',
              '&:hover': { boxShadow: '0 8px 32px rgba(0,0,0,0.06)' }
            }}
          >
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} sm={4} md={3}>
                <FormControl fullWidth size="medium">
                  <InputLabel sx={{ fontWeight: 500 }}>Filtrar por Tipo</InputLabel>
                  <Select
                    label="Filtrar por Tipo"
                    value={filterTipo}
                    onChange={(e) => {
                      setFilterTipo(e.target.value);
                      setPage(0);
                    }}
                    startAdornment={<FilterOutlined style={{ marginRight: 8, color: theme.palette.primary.main }} />}
                    sx={{ borderRadius: 2.5 }}
                  >
                    <MenuItem value="todos">Todos los Roles</MenuItem>
                    <MenuItem value="Participante">Participante</MenuItem>
                    <MenuItem value="Tutor">Tutor</MenuItem>
                    <MenuItem value="Tribunal">Tribunal</MenuItem>
                    <MenuItem value="Administrador">Administrador</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={8} md={6}>
                <TextField
                  fullWidth
                  size="medium"
                  label="Buscar por Email o Nombre"
                  placeholder="Ej: juan.perez@uagrm.edu.bo"
                  value={filterEmail}
                  onChange={(e) => {
                    setFilterEmail(e.target.value);
                    setPage(0);
                  }}
                  InputProps={{
                    startAdornment: <SearchOutlined style={{ marginRight: 8, color: theme.palette.text.secondary }} />,
                    sx: { borderRadius: 2.5 }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={12} md={3}>
                <FormControl fullWidth size="medium">
                  <InputLabel sx={{ fontWeight: 500 }}>Estado</InputLabel>
                  <Select
                    label="Estado"
                    value={filterEstado}
                    onChange={(e) => {
                      setFilterEstado(e.target.value);
                      setPage(0);
                    }}
                    sx={{ borderRadius: 2.5 }}
                  >
                    <MenuItem value="todos">Cualquier Estado</MenuItem>
                    <MenuItem value="activo">✅ Activo</MenuItem>
                    <MenuItem value="inactivo">❌ Inactivo</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          {/* Tabla de Usuarios Moderna */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 4,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 4px 24px rgba(0,0,0,0.03)'
            }}
          >
            <TableContainer>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? 'background.default' : 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 700, py: 2.5, color: 'text.secondary', borderBottom: '2px solid', borderColor: 'divider' }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 700, py: 2.5, color: 'text.secondary', borderBottom: '2px solid', borderColor: 'divider' }}>Usuario</TableCell>
                    <TableCell sx={{ fontWeight: 700, py: 2.5, color: 'text.secondary', borderBottom: '2px solid', borderColor: 'divider' }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 700, py: 2.5, color: 'text.secondary', borderBottom: '2px solid', borderColor: 'divider' }}>Rol del Sistema</TableCell>
                    <TableCell sx={{ fontWeight: 700, py: 2.5, color: 'text.secondary', borderBottom: '2px solid', borderColor: 'divider' }}>Estado</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, py: 2.5, color: 'text.secondary', borderBottom: '2px solid', borderColor: 'divider' }}>
                      Acciones
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedUsers.map((row) => (
                    <TableRow
                      key={row.idUsuario}
                      hover
                      sx={{
                        transition: 'all 0.2s',
                        '&:hover': { bgcolor: 'primary.lighter', transform: 'translateY(-1px)', boxShadow: '0 4px 10px rgba(0,0,0,0.04)' },
                        '& td': { borderBottom: '1px solid', borderColor: 'divider', py: 2 }
                      }}
                    >
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>#{row.idUsuario}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            sx={{
                              width: 40,
                              height: 40,
                              fontSize: '1rem',
                              fontWeight: 700,
                              background: row.estado ? 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)' : 'linear-gradient(135deg, #d9d9d9 0%, #bfbfbf 100%)',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                            }}
                          >
                            {row.username.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                              {row.username}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: 'text.secondary' }}>
                          <Box sx={{ p: 0.8, borderRadius: 2, bgcolor: 'grey.100', display: 'flex' }}>
                            <MailOutlined style={{ fontSize: 14 }} />
                          </Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{row.email}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getTipoUsuario(row)}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            borderRadius: '8px',
                            px: 1.5,
                            py: 2,
                            bgcolor: row.participante
                              ? 'info.lighter'
                              : row.tutor
                                ? 'success.lighter'
                                : row.tribunal
                                  ? 'warning.lighter'
                                  : 'secondary.lighter',
                            color: row.participante
                              ? 'info.main'
                              : row.tutor
                                ? 'success.main'
                                : row.tribunal
                                  ? 'warning.main'
                                  : 'secondary.main',
                            border: '1px solid',
                            borderColor: 'transparent'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.estado ? 'Activo' : 'Inactivo'}
                          icon={row.estado ? <CheckCircleOutlined style={{ fontSize: 14 }} /> : <StopOutlined style={{ fontSize: 14 }} />}
                          color={row.estado ? 'success' : 'error'}
                          size="small"
                          variant={row.estado ? 'filled' : 'outlined'}
                          sx={{ fontWeight: 600, borderRadius: '8px', px: 1, py: 1.5,
                            bgcolor: row.estado ? 'success.main' : 'transparent',
                            color: row.estado ? 'white' : 'error.main'
                           }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Editar Usuario" arrow placement="top">
                            <IconButton
                              color="primary"
                              onClick={() => handleOpenDialog(row)}
                              size="medium"
                              sx={{ 
                                bgcolor: 'primary.lighter', 
                                borderRadius: 2,
                                transition: 'all 0.2s',
                                '&:hover': { bgcolor: 'primary.main', color: 'white', transform: 'scale(1.05)' } 
                              }}
                            >
                              <EditOutlined style={{ fontSize: '1.1rem' }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar" arrow placement="top">
                            <IconButton
                              color="error"
                              onClick={() => handleDelete(row.idUsuario)}
                              size="medium"
                              sx={{ 
                                bgcolor: 'error.lighter', 
                                borderRadius: 2,
                                transition: 'all 0.2s',
                                '&:hover': { bgcolor: 'error.main', color: 'white', transform: 'scale(1.05)' } 
                              }}
                            >
                              <DeleteOutlined style={{ fontSize: '1.1rem' }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {usuariosFiltrados.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ width: 64, height: 64, bgcolor: 'grey.100' }}>
                            <UserOutlined style={{ fontSize: 32, color: '#bfbfbf' }} />
                          </Avatar>
                          <Typography variant="h6" color="text.secondary">
                            No se encontraron usuarios
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Intenta ajustar los filtros o el término de búsqueda.
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Box
              sx={{
                p: 2.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                bgcolor: 'background.paper',
                borderTop: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Mostrar
                </Typography>
                <Select
                  size="small"
                  value={rowsPerPage}
                  onChange={handleChangeRowsPerPage}
                  sx={{
                    height: 36,
                    borderRadius: 2,
                    fontWeight: 600,
                    '& .MuiSelect-select': { py: 0.5, px: 2 }
                  }}
                >
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={15}>15</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                </Select>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  registros
                </Typography>
              </Box>

              <Pagination
                count={Math.ceil(usuariosFiltrados.length / rowsPerPage)}
                page={page + 1}
                onChange={(e, p) => setPage(p - 1)}
                color="primary"
                variant="outlined"
                shape="rounded"
                sx={{
                  '& .MuiPaginationItem-root': {
                    borderRadius: 2,
                    fontWeight: 600,
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.2s',
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'white',
                      borderColor: 'primary.main',
                      boxShadow: '0 4px 8px rgba(24, 144, 255, 0.3)',
                      '&:hover': {
                        bgcolor: 'primary.dark'
                      }
                    },
                    '&:hover:not(.Mui-selected)': {
                      bgcolor: 'grey.100'
                    }
                  }
                }}
              />
            </Box>
          </Paper>
        </>
      )}

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        fullWidth 
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: '12px',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05), 0 10px 10px -5px rgba(0,0,0,0.02)'
          }
        }}
      >
        <DialogTitle sx={{ p: 3, pb: 2, borderBottom: '1px solid', borderColor: 'grey.100' }}>
          <Typography variant="h4" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {editingUser ? 'Actualiza los datos del usuario seleccionado.' : 'Completa los datos para crear un nuevo acceso.'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: 4, pb: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField 
              label="Nombre de Usuario" 
              name="username" 
              value={formData.username} 
              onChange={handleChange} 
              fullWidth 
              required 
              InputProps={{ 
                sx: { 
                  borderRadius: '8px', 
                  bgcolor: '#F8FAFC', 
                  transition: 'all 0.15s ease',
                  '&:hover': { bgcolor: '#F1F5F9' },
                  '&.Mui-focused': { bgcolor: '#FFF' }
                } 
              }}
            />
            <TextField 
              label="Correo Electrónico" 
              name="email" 
              type="email" 
              value={formData.email} 
              onChange={handleChange} 
              fullWidth 
              required 
              InputProps={{ 
                sx: { 
                  borderRadius: '8px', 
                  bgcolor: '#F8FAFC', 
                  transition: 'all 0.15s ease',
                  '&:hover': { bgcolor: '#F1F5F9' },
                  '&.Mui-focused': { bgcolor: '#FFF' }
                } 
              }}
            />
            <TextField
              label={editingUser ? 'Contraseña (dejar en blanco para no cambiar)' : 'Contraseña'}
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              fullWidth
              required={!editingUser}
              InputProps={{ 
                sx: { 
                  borderRadius: '8px', 
                  bgcolor: '#F8FAFC', 
                  transition: 'all 0.15s ease',
                  '&:hover': { bgcolor: '#F1F5F9' },
                  '&.Mui-focused': { bgcolor: '#FFF' }
                } 
              }}
            />
            {editingUser && (
              <Box sx={{ 
                p: 2, 
                borderRadius: '8px', 
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s'
              }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Box sx={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      bgcolor: formData.estado ? 'success.main' : 'error.main' 
                    }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      Estado de la Cuenta
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {formData.estado ? 'El usuario tiene acceso activo al sistema' : 'El acceso de este usuario está suspendido'}
                  </Typography>
                </Box>
                <Switch 
                  checked={formData.estado} 
                  onChange={handleChange} 
                  name="estado" 
                  color="primary"
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2, borderTop: '1px solid', borderColor: 'grey.100' }}>
          <Button 
            onClick={handleCloseDialog} 
            color="inherit"
            sx={{ 
              fontWeight: 500, 
              borderRadius: '6px', 
              px: 3, 
              py: 0.8,
              textTransform: 'none',
              color: 'text.secondary',
              '&:hover': { bgcolor: '#F1F5F9' }
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.username || !formData.email || (!editingUser && !formData.password) || saving}
            sx={{ 
              fontWeight: 500, 
              borderRadius: '6px', 
              px: 4, 
              py: 0.8,
              textTransform: 'none',
              bgcolor: '#0F172A',
              color: '#FFF',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: '#1E293B',
                boxShadow: 'none'
              },
              '&.Mui-disabled': {
                bgcolor: 'action.disabledBackground',
                color: 'action.disabled'
              }
            }}
          >
            {saving ? <CircularProgress size={24} color="inherit" /> : (editingUser ? 'Guardar Cambios' : 'Crear Usuario')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          severity={notification.severity} 
          variant="filled"
          sx={{ borderRadius: 2, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
