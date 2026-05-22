import { useState, useMemo } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';

import {
  Grid,
  Card,
  CardHeader,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Typography,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Checkbox,
  FormControlLabel,
  Alert,
  CircularProgress,
  Autocomplete,
  Chip,
  Stack,
  Divider,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Avatar,
} from '@mui/material';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  DownOutlined,
  BookOutlined,
  CalendarOutlined,
  ProjectOutlined,
  CheckSquareOutlined,
  TrophyOutlined,
  SettingOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import MainCard from 'components/MainCard';

// ─── GraphQL ──────────────────────────────────────────────────────────────────

const TODOS_LOS_ROLES = gql`
  query TodosLosRoles {
    todosLosRoles {
      idRol
      nombre
      permisos { idPermiso code nombre modulo }
    }
  }
`;

const TODOS_LOS_PERMISOS = gql`
  query TodosLosPermisos {
    todosLosPermisos {
      idPermiso code nombre modulo
    }
  }
`;

const TODOS_LOS_USUARIOS = gql`
  query TodosLosUsuarios {
    todosLosUsuarios {
      idUsuario username email
      rol { idRol nombre }
    }
  }
`;

const CREAR_ROL = gql`
  mutation CrearRol($nombre: String!) {
    crearRol(nombre: $nombre) { rol { idRol nombre } ok error }
  }
`;

const EDITAR_ROL = gql`
  mutation EditarRol($idRol: ID!, $nombre: String!) {
    editarRol(idRol: $idRol, nombre: $nombre) { rol { idRol nombre } ok error }
  }
`;

const ELIMINAR_ROL = gql`
  mutation EliminarRol($idRol: ID!) {
    eliminarRol(idRol: $idRol) { ok error }
  }
`;

const ASIGNAR_PERMISOS = gql`
  mutation AsignarPermisosARol($idRol: ID!, $codigos: [String!]!) {
    asignarPermisosARol(idRol: $idRol, codigos: $codigos) {
      rol { idRol nombre permisos { code } }
      ok error
    }
  }
`;

const ASIGNAR_ROL_A_USUARIO = gql`
  mutation AsignarRolAUsuario($idUsuario: ID!, $idRol: ID) {
    asignarRolAUsuario(idUsuario: $idUsuario, idRol: $idRol) {
      usuario { idUsuario username rol { idRol nombre } }
      ok error
    }
  }
`;

// ─── Configuración visual por módulo ─────────────────────────────────────────

const MODULO_CONFIG = {
  usuarios:     { label: 'Módulo de Usuario',   Icon: SettingOutlined,     color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  academico:    { label: 'Módulo Académico',     Icon: BookOutlined,        color: '#0ea5e9', bg: 'rgba(14,165,233,0.12)'  },
  eventos:      { label: 'Módulo de Eventos',    Icon: CalendarOutlined,    color: '#f97316', bg: 'rgba(249,115,22,0.12)'  },
  proyectos:    { label: 'Módulo de Proyectos',  Icon: ProjectOutlined,     color: '#a855f7', bg: 'rgba(168,85,247,0.12)'  },
  evaluaciones: { label: 'Módulo de Evaluación', Icon: CheckSquareOutlined, color: '#22c55e', bg: 'rgba(34,197,94,0.12)'   },
  premiacion:   { label: 'Módulo de Premiación', Icon: TrophyOutlined,      color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
};

// ─── Modal: Crear / Editar Rol ────────────────────────────────────────────────

function RolModal({ open, onClose, rol, allPermisos }) {
  const [nombre, setNombre] = useState(rol?.nombre || '');
  const [seleccionados, setSeleccionados] = useState(
    () => new Set((rol?.permisos || []).map((p) => p.code))
  );
  const [errorMsg, setErrorMsg] = useState('');
  const [expandido, setExpandido] = useState(false);

  const [crearRol,        { loading: lCrear }]    = useMutation(CREAR_ROL,        { refetchQueries: [{ query: TODOS_LOS_ROLES }] });
  const [editarRol,       { loading: lEditar }]   = useMutation(EDITAR_ROL,       { refetchQueries: [{ query: TODOS_LOS_ROLES }] });
  const [asignarPermisos, { loading: lPermisos }] = useMutation(ASIGNAR_PERMISOS, { refetchQueries: [{ query: TODOS_LOS_ROLES }] });

  const loading = lCrear || lEditar || lPermisos;

  const permisosPorModulo = useMemo(() => {
    const g = {};
    (allPermisos || []).forEach((p) => { (g[p.modulo] ||= []).push(p); });
    return g;
  }, [allPermisos]);

  const togglePermiso = (code) =>
    setSeleccionados((prev) => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });

  const toggleModulo = (modulo) => {
    const codes = (permisosPorModulo[modulo] || []).map((p) => p.code);
    const todos = codes.every((c) => seleccionados.has(c));
    setSeleccionados((prev) => {
      const next = new Set(prev);
      todos ? codes.forEach((c) => next.delete(c)) : codes.forEach((c) => next.add(c));
      return next;
    });
  };

  const handleGuardar = async () => {
    setErrorMsg('');
    if (!nombre.trim()) { setErrorMsg('El nombre del rol es obligatorio.'); return; }
    try {
      let idRol = rol?.idRol;
      if (rol) {
        const { data } = await editarRol({ variables: { idRol: rol.idRol, nombre: nombre.trim() } });
        if (!data.editarRol.ok) { setErrorMsg(data.editarRol.error); return; }
      } else {
        const { data } = await crearRol({ variables: { nombre: nombre.trim() } });
        if (!data.crearRol.ok) { setErrorMsg(data.crearRol.error); return; }
        idRol = data.crearRol.rol.idRol;
      }
      const { data: dp } = await asignarPermisos({ variables: { idRol, codigos: [...seleccionados] } });
      if (!dp.asignarPermisosARol.ok) { setErrorMsg(dp.asignarPermisosARol.error); return; }
      onClose();
    } catch { setErrorMsg('Error de conexión. Intenta nuevamente.'); }
  };

  const totalSeleccionados = seleccionados.size;
  const totalDisponibles = allPermisos?.length || 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>

      {/* Header */}
      <Box sx={{ px: 3, pt: 3, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
            <SafetyCertificateOutlined style={{ fontSize: 18 }} />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={600}>
              {rol ? `Editar rol: ${rol.nombre}` : 'Crear nuevo rol'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {totalSeleccionados} de {totalDisponibles} permisos seleccionados
            </Typography>
          </Box>
        </Stack>
      </Box>

      <DialogContent sx={{ p: 0, display: 'flex', minHeight: 480 }}>

        {/* Panel izquierdo — datos del rol */}
        <Box sx={{ width: 260, flexShrink: 0, p: 3, borderRight: '1px solid', borderColor: 'divider',
          display: 'flex', flexDirection: 'column', gap: 2 }}>

          <TextField
            label="Nombre del rol"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            fullWidth
            size="small"
            autoFocus
          />

          <Divider />

          <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.8}>
            Resumen
          </Typography>

          {Object.keys(MODULO_CONFIG).map((modulo) => {
            const items = permisosPorModulo[modulo] || [];
            if (!items.length) return null;
            const sel = items.filter((p) => seleccionados.has(p.code)).length;
            const cfg = MODULO_CONFIG[modulo];
            return (
              <Stack key={modulo} direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 160 }}>
                  {cfg.label}
                </Typography>
                <Chip
                  label={`${sel}/${items.length}`}
                  size="small"
                  sx={{
                    bgcolor: sel > 0 ? cfg.bg : 'transparent',
                    color: sel > 0 ? cfg.color : 'text.disabled',
                    border: `1px solid ${sel > 0 ? cfg.color : 'transparent'}`,
                    fontWeight: 600,
                    fontSize: '0.7rem',
                  }}
                />
              </Stack>
            );
          })}

          {errorMsg && (
            <Alert severity="error" sx={{ mt: 'auto' }}>{errorMsg}</Alert>
          )}
        </Box>

        {/* Panel derecho — permisos */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}
            textTransform="uppercase" letterSpacing={0.8} sx={{ px: 1, display: 'block', mb: 1.5 }}>
            Permisos por módulo
          </Typography>

          {Object.keys(MODULO_CONFIG).map((modulo) => {
            const items = permisosPorModulo[modulo] || [];
            if (!items.length) return null;
            const cfg = MODULO_CONFIG[modulo];
            const codes = items.map((p) => p.code);
            const todosChecked = codes.every((c) => seleccionados.has(c));
            const algunoChecked = codes.some((c) => seleccionados.has(c));
            const IconComp = cfg.Icon;
            const selCount = codes.filter((c) => seleccionados.has(c)).length;

            return (
              <Accordion
                key={modulo}
                expanded={expandido === modulo}
                onChange={(_, isOpen) => setExpandido(isOpen ? modulo : false)}
                disableGutters
                elevation={0}
                sx={{
                  mb: 1,
                  border: '1px solid',
                  borderColor: todosChecked ? cfg.color : algunoChecked ? `${cfg.color}66` : 'divider',
                  borderRadius: '10px !important',
                  overflow: 'hidden',
                  '&:before': { display: 'none' },
                  transition: 'border-color 0.2s',
                }}
              >
                <AccordionSummary
                  expandIcon={<DownOutlined style={{ fontSize: 12 }} />}
                  sx={{
                    bgcolor: expandido === modulo ? cfg.bg : 'transparent',
                    minHeight: 48,
                    px: 2,
                    '& .MuiAccordionSummary-content': { alignItems: 'center', gap: 1.5 },
                  }}
                >
                  <Checkbox
                    checked={todosChecked}
                    indeterminate={algunoChecked && !todosChecked}
                    onChange={(e) => { e.stopPropagation(); toggleModulo(modulo); }}
                    onClick={(e) => e.stopPropagation()}
                    size="small"
                    sx={{ p: 0, color: cfg.color, '&.Mui-checked': { color: cfg.color }, '&.MuiCheckbox-indeterminate': { color: cfg.color } }}
                  />
                  <Avatar sx={{ width: 26, height: 26, bgcolor: cfg.bg }}>
                    <IconComp style={{ fontSize: 13, color: cfg.color }} />
                  </Avatar>
                  <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>
                    {cfg.label}
                  </Typography>
                  {selCount > 0 && (
                    <Chip label={selCount} size="small"
                      sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 700, fontSize: '0.7rem', height: 20, minWidth: 24 }} />
                  )}
                </AccordionSummary>

                <AccordionDetails sx={{ px: 2, pt: 1, pb: 2, bgcolor: `${cfg.bg}55` }}>
                  <Grid container spacing={0}>
                    {items.map((p) => (
                      <Grid item xs={6} key={p.code}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={seleccionados.has(p.code)}
                              onChange={() => togglePermiso(p.code)}
                              size="small"
                              sx={{ color: cfg.color, '&.Mui-checked': { color: cfg.color } }}
                            />
                          }
                          label={<Typography variant="body2">{p.nombre}</Typography>}
                          sx={{ m: 0, py: 0.3 }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={onClose} disabled={loading} variant="outlined" color="inherit">
          Cancelar
        </Button>
        <Button variant="contained" onClick={handleGuardar} disabled={loading}
          startIcon={loading ? <CircularProgress size={14} /> : null}>
          {loading ? 'Guardando…' : rol ? 'Guardar cambios' : 'Crear rol'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Modal: Confirmar eliminación ────────────────────────────────────────────

function ConfirmDeleteModal({ open, onClose, rol }) {
  const [errorMsg, setErrorMsg] = useState('');
  const [eliminarRol, { loading }] = useMutation(ELIMINAR_ROL, {
    refetchQueries: [{ query: TODOS_LOS_ROLES }, { query: TODOS_LOS_USUARIOS }],
  });

  const handleEliminar = async () => {
    setErrorMsg('');
    try {
      const { data } = await eliminarRol({ variables: { idRol: rol.idRol } });
      if (!data.eliminarRol.ok) { setErrorMsg(data.eliminarRol.error); return; }
      onClose();
    } catch { setErrorMsg('Error de conexión.'); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Avatar sx={{ bgcolor: 'error.lighter', width: 32, height: 32 }}>
            <DeleteOutlined style={{ fontSize: 16, color: '#f44336' }} />
          </Avatar>
          <Typography variant="h6">Eliminar rol</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          ¿Estás seguro de que quieres eliminar el rol{' '}
          <Typography component="span" fontWeight={700} color="text.primary">{rol?.nombre}</Typography>?
          {' '}Esta acción no se puede deshacer.
        </Typography>
        {errorMsg && <Alert severity="error" sx={{ mt: 2 }}>{errorMsg}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading} variant="outlined" color="inherit" size="small">
          Cancelar
        </Button>
        <Button variant="contained" color="error" onClick={handleEliminar} disabled={loading} size="small">
          {loading ? <CircularProgress size={16} /> : 'Eliminar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Tarjeta de Rol ───────────────────────────────────────────────────────────

function RolCard({ rol, onEdit, onDelete }) {
  const modulosConPermisos = [...new Set(rol.permisos.map((p) => p.modulo))];

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2,
        cursor: 'default',
        transition: 'box-shadow 0.2s, border-color 0.2s',
        '&:hover': { boxShadow: 3, borderColor: 'primary.main' },
        borderLeft: '3px solid',
        borderLeftColor: rol.permisos.length > 0 ? 'primary.main' : 'divider',
      }}
    >
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
            <Typography variant="subtitle2" fontWeight={700} noWrap>
              {rol.nombre}
            </Typography>
            <Chip
              label={`${rol.permisos.length} permiso${rol.permisos.length !== 1 ? 's' : ''}`}
              size="small"
              color={rol.permisos.length > 0 ? 'primary' : 'default'}
              variant="outlined"
              sx={{ height: 20, fontSize: '0.68rem' }}
            />
          </Stack>

          {modulosConPermisos.length > 0 ? (
            <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 1 }}>
              {modulosConPermisos.map((m) => {
                const cfg = MODULO_CONFIG[m];
                if (!cfg) return null;
                const IconComp = cfg.Icon;
                return (
                  <Chip
                    key={m}
                    icon={<IconComp style={{ fontSize: 10, color: cfg.color }} />}
                    label={cfg.label.replace('Módulo ', '').replace('de ', '').replace('de', '')}
                    size="small"
                    sx={{
                      bgcolor: cfg.bg,
                      color: cfg.color,
                      border: `1px solid ${cfg.color}44`,
                      height: 22,
                      fontSize: '0.68rem',
                      '& .MuiChip-icon': { ml: '6px' },
                    }}
                  />
                );
              })}
            </Stack>
          ) : (
            <Typography variant="caption" color="text.disabled">Sin permisos asignados</Typography>
          )}
        </Box>

        <Stack direction="row" spacing={0.5} sx={{ ml: 1, flexShrink: 0 }}>
          <Tooltip title="Editar">
            <IconButton size="small" onClick={onEdit} sx={{ color: 'primary.main' }}>
              <EditOutlined style={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar">
            <IconButton size="small" onClick={onDelete} sx={{ color: 'error.main' }}>
              <DeleteOutlined style={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
    </Paper>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function RolesPage() {
  const { data: dataRoles,    loading: loadingRoles }    = useQuery(TODOS_LOS_ROLES);
  const { data: dataPermisos }                           = useQuery(TODOS_LOS_PERMISOS);
  const { data: dataUsuarios, loading: loadingUsuarios } = useQuery(TODOS_LOS_USUARIOS);

  const roles      = dataRoles?.todosLosRoles     || [];
  const allPermisos = dataPermisos?.todosLosPermisos || [];
  const usuarios   = dataUsuarios?.todosLosUsuarios  || [];

  const [modalRol,    setModalRol]    = useState({ open: false, rol: null });
  const [modalDelete, setModalDelete] = useState({ open: false, rol: null });

  const [usuarioSel,   setUsuarioSel]   = useState(null);
  const [rolSel,       setRolSel]       = useState(null);
  const [asignando,    setAsignando]    = useState(false);
  const [asignarError, setAsignarError] = useState('');
  const [asignarOk,    setAsignarOk]    = useState('');

  const [asignarRolAUsuario] = useMutation(ASIGNAR_ROL_A_USUARIO, {
    refetchQueries: [{ query: TODOS_LOS_USUARIOS }],
  });

  const handleAsignar = async () => {
    if (!usuarioSel) return;
    setAsignarError(''); setAsignarOk(''); setAsignando(true);
    try {
      const { data } = await asignarRolAUsuario({
        variables: { idUsuario: usuarioSel.idUsuario, idRol: rolSel?.idRol || null },
      });
      if (!data.asignarRolAUsuario.ok) {
        setAsignarError(data.asignarRolAUsuario.error);
      } else {
        setAsignarOk(`Rol asignado a "${usuarioSel.username}" correctamente.`);
        setUsuarioSel(null); setRolSel(null);
      }
    } catch { setAsignarError('Error de conexión.'); }
    finally { setAsignando(false); }
  };

  return (
    <MainCard
      title={
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Avatar sx={{ bgcolor: 'primary.lighter', width: 32, height: 32 }}>
            <SafetyCertificateOutlined style={{ fontSize: 16, color: '#1976d2' }} />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={700}>Roles y Permisos</Typography>
            <Typography variant="caption" color="text.secondary">
              {roles.length} rol{roles.length !== 1 ? 'es' : ''} · {allPermisos.length} permisos disponibles
            </Typography>
          </Box>
        </Stack>
      }
    >
      <Grid container spacing={3}>

        {/* ── Columna izquierda: Roles ── */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
            <CardHeader
              sx={{ pb: 1 }}
              title={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <TeamOutlined style={{ fontSize: 16 }} />
                  <Typography variant="subtitle1" fontWeight={600}>Roles del Sistema</Typography>
                </Stack>
              }
              action={
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<PlusOutlined />}
                  onClick={() => setModalRol({ open: true, rol: null })}
                  sx={{ borderRadius: 2 }}
                >
                  Nuevo Rol
                </Button>
              }
            />
            <Divider />
            <CardContent sx={{ pt: 2 }}>
              {loadingRoles ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress size={32} />
                </Box>
              ) : roles.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <SafetyCertificateOutlined style={{ fontSize: 40, color: '#bdbdbd' }} />
                  <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
                    No hay roles creados
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    Haz clic en "+ Nuevo Rol" para comenzar
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  {roles.map((rol) => (
                    <RolCard
                      key={rol.idRol}
                      rol={rol}
                      onEdit={() => setModalRol({ open: true, rol })}
                      onDelete={() => setModalDelete({ open: true, rol })}
                    />
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* ── Columna derecha: Asignar + Tabla de usuarios ── */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={3}>

            {/* Formulario de asignación */}
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardHeader
                sx={{ pb: 1 }}
                title={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <UserOutlined style={{ fontSize: 16 }} />
                    <Typography variant="subtitle1" fontWeight={600}>Asignar Rol a Usuario</Typography>
                  </Stack>
                }
              />
              <Divider />
              <CardContent>
                <Grid container spacing={2} alignItems="flex-start">
                  <Grid size={{ xs: 12, sm: 5 }}>
                    <Autocomplete
                      options={usuarios}
                      getOptionLabel={(u) => `${u.username}  —  ${u.email}`}
                      value={usuarioSel}
                      onChange={(_, val) => {
                        setUsuarioSel(val);
                        setRolSel(val?.rol || null);
                        setAsignarError(''); setAsignarOk('');
                      }}
                      renderInput={(params) => (
                        <TextField {...params} label="Buscar usuario" size="small" />
                      )}
                      isOptionEqualToValue={(o, v) => o.idUsuario === v.idUsuario}
                      renderOption={(props, u) => (
                        <Box component="li" {...props}>
                          <Stack>
                            <Typography variant="body2" fontWeight={600}>{u.username}</Typography>
                            <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                          </Stack>
                        </Box>
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 5 }}>
                    <Autocomplete
                      options={roles}
                      getOptionLabel={(r) => r.nombre}
                      value={rolSel}
                      onChange={(_, val) => setRolSel(val)}
                      renderInput={(params) => (
                        <TextField {...params} label="Rol" size="small" />
                      )}
                      isOptionEqualToValue={(o, v) => o.idRol === v.idRol}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 2 }}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={handleAsignar}
                      disabled={!usuarioSel || asignando}
                      startIcon={asignando ? <CircularProgress size={14} /> : <UserOutlined />}
                      sx={{ height: 40 }}
                    >
                      Asignar
                    </Button>
                  </Grid>
                </Grid>

                {asignarError && <Alert severity="error"  sx={{ mt: 2 }}>{asignarError}</Alert>}
                {asignarOk    && <Alert severity="success" sx={{ mt: 2 }}>{asignarOk}</Alert>}
              </CardContent>
            </Card>

            {/* Tabla usuarios con roles */}
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardHeader
                sx={{ pb: 1 }}
                title={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <TeamOutlined style={{ fontSize: 16 }} />
                    <Typography variant="subtitle1" fontWeight={600}>Usuarios y sus Roles</Typography>
                  </Stack>
                }
                action={
                  <Chip
                    label={`${usuarios.length} usuarios`}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem' }}
                  />
                }
              />
              <Divider />
              {loadingUsuarios ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={28} />
                </Box>
              ) : (
                <TableContainer sx={{ maxHeight: 400, overflowX: 'auto' }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Usuario</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Correo</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Rol</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {usuarios.map((u) => (
                        <TableRow key={u.idUsuario} hover>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Avatar sx={{ width: 26, height: 26, fontSize: '0.75rem', bgcolor: 'primary.lighter', color: 'primary.main' }}>
                                {u.username[0].toUpperCase()}
                              </Avatar>
                              <Typography variant="body2" fontWeight={500}>{u.username}</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                          </TableCell>
                          <TableCell>
                            {u.rol ? (
                              <Chip label={u.rol.nombre} size="small" color="primary" variant="outlined"
                                sx={{ fontSize: '0.7rem', height: 22 }} />
                            ) : (
                              <Typography variant="caption" color="text.disabled">Sin rol</Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Card>

          </Stack>
        </Grid>
      </Grid>

      {/* ── Modales ── */}
      {modalRol.open && (
        <RolModal
          open={modalRol.open}
          onClose={() => setModalRol({ open: false, rol: null })}
          rol={modalRol.rol}
          allPermisos={allPermisos}
        />
      )}
      {modalDelete.open && (
        <ConfirmDeleteModal
          open={modalDelete.open}
          onClose={() => setModalDelete({ open: false, rol: null })}
          rol={modalDelete.rol}
        />
      )}
    </MainCard>
  );
}
