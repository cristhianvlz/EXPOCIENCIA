import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
  Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert,
  CircularProgress, Tabs, Tab, Chip, FormControl, InputLabel, Select, MenuItem, Typography
} from '@mui/material';
import { DeleteOutlined, PlusOutlined, LinkOutlined, FlagOutlined, BookOutlined } from '@ant-design/icons';
import MainCard from 'components/MainCard';

// ── GQL ──────────────────────────────────────────────────────────────────────
const GET_ALL = gql`
  query {
    todosLosModalidadAreas {
      id
      modalidad { idModalidad nombre }
      area      { idArea nombre }
    }
    todosLosCategoriaEventos {
      id
      categoria { idCategoria nombre }
      evento    { idEvento nombre }
    }
    todosLosEaCarreras {
      id
      entidadAcademica { idEntidadAcademica nombre }
      carrera          { idCarrera nombre plan codigo }
    }
    todasLasModalidades         { idModalidad nombre estado }
    todasLasAreas               { idArea nombre estado }
    todasLasCategorias          { idCategoria nombre estado }
    todosLosEventos             { idEvento nombre estado }
    todasLasEntidadesAcademicas { idEntidadAcademica nombre estado }
    todasLasCarreras            { idCarrera nombre plan codigo estado }
  }
`;

const CREATE_MA = gql`
  mutation($idModalidad: ID!, $idArea: ID!) {
    crearModalidadArea(idModalidad: $idModalidad, idArea: $idArea) { ok error }
  }
`;
const DELETE_MA = gql`
  mutation($idModalidadArea: ID!) {
    eliminarModalidadArea(idModalidadArea: $idModalidadArea) { ok error }
  }
`;

const CREATE_CE = gql`
  mutation($idCategoria: ID!, $idEvento: ID!) {
    crearCategoriaEvento(idCategoria: $idCategoria, idEvento: $idEvento) { ok error }
  }
`;
const DELETE_CE = gql`
  mutation($idCategoriaEvento: ID!) {
    eliminarCategoriaEvento(idCategoriaEvento: $idCategoriaEvento) { ok error }
  }
`;

const CREATE_EAC = gql`
  mutation($idEntidadAcademica: ID!, $idCarrera: ID!) {
    crearEaCarrera(idEntidadAcademica: $idEntidadAcademica, idCarrera: $idCarrera) { ok error }
  }
`;
const DELETE_EAC = gql`
  mutation($idEaCarrera: ID!) {
    eliminarEaCarrera(idEaCarrera: $idEaCarrera) { ok error }
  }
`;

// ── Main component ────────────────────────────────────────────────────────────
const INIT_MA  = { idModalidad: '', idArea: '' };
const INIT_CE  = { idCategoria: '', idEvento: '' };
const INIT_EAC = { idEntidadAcademica: '', idCarrera: '' };

export default function EstructurasPage() {
  const [tab, setTab] = useState(0);
  const { data, loading, error, refetch } = useQuery(GET_ALL, { fetchPolicy: 'network-only' });

  const [crearMA]    = useMutation(CREATE_MA);
  const [eliminarMA] = useMutation(DELETE_MA);
  const [crearCE]    = useMutation(CREATE_CE);
  const [eliminarCE] = useMutation(DELETE_CE);
  const [crearEAC]   = useMutation(CREATE_EAC);
  const [eliminarEAC]= useMutation(DELETE_EAC);

  // Modalidad × Área dialog
  const [openMA, setOpenMA] = useState(false);
  const [formMA, setFormMA] = useState(INIT_MA);

  // Categoría × Evento dialog
  const [openCE, setOpenCE] = useState(false);
  const [formCE, setFormCE] = useState(INIT_CE);

  // Facultad × Carrera dialog
  const [openEAC, setOpenEAC] = useState(false);
  const [formEAC, setFormEAC] = useState(INIT_EAC);

  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  const modalidadAreas   = data?.todosLosModalidadAreas    || [];
  const categoriaEventos = data?.todosLosCategoriaEventos  || [];
  const eaCarreras       = data?.todosLosEaCarreras        || [];
  const modalidades      = data?.todasLasModalidades        || [];
  const areas            = data?.todasLasAreas              || [];
  const categorias       = data?.todasLasCategorias         || [];
  const eventos          = data?.todosLosEventos            || [];
  const entidades        = data?.todasLasEntidadesAcademicas|| [];
  const carreras         = data?.todasLasCarreras           || [];

  const showNotif = (message, severity = 'success') =>
    setNotification({ open: true, message, severity });

  // ── Modalidad × Área ──────────────────────────────────────────────────────
  const handleSubmitMA = async () => {
    setSaving(true);
    try {
      const res = await crearMA({ variables: formMA });
      const result = res.data?.crearModalidadArea;
      if (result?.ok) {
        showNotif('Vínculo Modalidad × Área creado');
        refetch();
        setOpenMA(false);
        setFormMA(INIT_MA);
      } else {
        showNotif(result?.error || 'Error al guardar', 'error');
      }
    } catch { showNotif('Error de conexión', 'error'); }
    setSaving(false);
  };

  const handleDeleteMA = async (id) => {
    if (!window.confirm('¿Eliminar este vínculo Modalidad × Área?')) return;
    try {
      const res = await eliminarMA({ variables: { idModalidadArea: id } });
      if (res.data?.eliminarModalidadArea?.ok) { showNotif('Vínculo eliminado'); refetch(); }
      else showNotif(res.data?.eliminarModalidadArea?.error || 'Error', 'error');
    } catch { showNotif('Error de conexión', 'error'); }
  };

  // ── Categoría × Evento ────────────────────────────────────────────────────
  const handleSubmitCE = async () => {
    setSaving(true);
    try {
      const res = await crearCE({ variables: formCE });
      const result = res.data?.crearCategoriaEvento;
      if (result?.ok) {
        showNotif('Vínculo Categoría × Evento creado');
        refetch();
        setOpenCE(false);
        setFormCE(INIT_CE);
      } else {
        showNotif(result?.error || 'Error al guardar', 'error');
      }
    } catch { showNotif('Error de conexión', 'error'); }
    setSaving(false);
  };

  const handleDeleteCE = async (id) => {
    if (!window.confirm('¿Eliminar este vínculo Categoría × Evento?')) return;
    try {
      const res = await eliminarCE({ variables: { idCategoriaEvento: id } });
      if (res.data?.eliminarCategoriaEvento?.ok) { showNotif('Vínculo eliminado'); refetch(); }
      else showNotif(res.data?.eliminarCategoriaEvento?.error || 'Error', 'error');
    } catch { showNotif('Error de conexión', 'error'); }
  };

  // ── Facultad × Carrera ────────────────────────────────────────────────────
  const handleSubmitEAC = async () => {
    setSaving(true);
    try {
      const res = await crearEAC({ variables: formEAC });
      const result = res.data?.crearEaCarrera;
      if (result?.ok) {
        showNotif('Vínculo Facultad × Carrera creado');
        refetch();
        setOpenEAC(false);
        setFormEAC(INIT_EAC);
      } else {
        showNotif(result?.error || 'Error al guardar', 'error');
      }
    } catch { showNotif('Error de conexión', 'error'); }
    setSaving(false);
  };

  const handleDeleteEAC = async (id) => {
    if (!window.confirm('¿Eliminar este vínculo Facultad × Carrera?')) return;
    try {
      const res = await eliminarEAC({ variables: { idEaCarrera: id } });
      if (res.data?.eliminarEaCarrera?.ok) { showNotif('Vínculo eliminado'); refetch(); }
      else showNotif(res.data?.eliminarEaCarrera?.error || 'Error', 'error');
    } catch { showNotif('Error de conexión', 'error'); }
  };

  const tabActions = [
    <Button key="ma" variant="contained" startIcon={<PlusOutlined />} onClick={() => setOpenMA(true)}>
      Nuevo Vínculo
    </Button>,
    <Button key="ce" variant="contained" startIcon={<PlusOutlined />} onClick={() => setOpenCE(true)}>
      Nuevo Vínculo
    </Button>,
    <Button key="eac" variant="contained" startIcon={<PlusOutlined />} onClick={() => setOpenEAC(true)}>
      Nuevo Vínculo
    </Button>,
  ];

  return (
    <MainCard title="Estructuras y Relaciones" secondary={tabActions[tab]}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Modalidad × Área"    icon={<LinkOutlined />}  iconPosition="start" />
          <Tab label="Categoría × Evento"  icon={<FlagOutlined />}  iconPosition="start" />
          <Tab label="Facultad × Carrera"  icon={<BookOutlined />}  iconPosition="start" />
        </Tabs>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">Error al cargar datos: {error.message}</Alert>
      ) : (
        <>
          {/* ── Tab 0: Modalidad × Área ── */}
          {tab === 0 && (
            <TableContainer component={Paper} elevation={0}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width={80}>ID</TableCell>
                    <TableCell>Modalidad</TableCell>
                    <TableCell>Área</TableCell>
                    <TableCell align="right" width={90}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {modalidadAreas.map(ma => (
                    <TableRow key={ma.id} hover>
                      <TableCell>{ma.id}</TableCell>
                      <TableCell>
                        <Chip label={ma.modalidad?.nombre} size="small" color="primary" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Chip label={ma.area?.nombre} size="small" color="secondary" variant="outlined" />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton color="error" size="small" onClick={() => handleDeleteMA(ma.id)}>
                          <DeleteOutlined />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {modalidadAreas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        Sin vínculos registrados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* ── Tab 1: Categoría × Evento ── */}
          {tab === 1 && (
            <TableContainer component={Paper} elevation={0}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width={80}>ID</TableCell>
                    <TableCell>Categoría</TableCell>
                    <TableCell>Evento</TableCell>
                    <TableCell align="right" width={90}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categoriaEventos.map(ce => (
                    <TableRow key={ce.id} hover>
                      <TableCell>{ce.id}</TableCell>
                      <TableCell>
                        <Chip label={ce.categoria?.nombre} size="small" color="primary" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Chip label={ce.evento?.nombre} size="small" color="secondary" variant="outlined" />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton color="error" size="small" onClick={() => handleDeleteCE(ce.id)}>
                          <DeleteOutlined />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {categoriaEventos.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        Sin vínculos registrados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* ── Tab 2: Facultad × Carrera ── */}
          {tab === 2 && (
            <TableContainer component={Paper} elevation={0}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width={80}>ID</TableCell>
                    <TableCell>Facultad</TableCell>
                    <TableCell>Carrera</TableCell>
                    <TableCell>Plan</TableCell>
                    <TableCell>Código</TableCell>
                    <TableCell align="right" width={90}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {eaCarreras.map(eac => (
                    <TableRow key={eac.id} hover>
                      <TableCell>{eac.id}</TableCell>
                      <TableCell>
                        <Chip label={eac.entidadAcademica?.nombre} size="small" color="primary" variant="outlined" />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{eac.carrera?.nombre}</TableCell>
                      <TableCell>{eac.carrera?.plan || '—'}</TableCell>
                      <TableCell>{eac.carrera?.codigo || '—'}</TableCell>
                      <TableCell align="right">
                        <IconButton color="error" size="small" onClick={() => handleDeleteEAC(eac.id)}>
                          <DeleteOutlined />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {eaCarreras.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        Sin vínculos registrados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* ── Dialog: Nuevo Modalidad × Área ── */}
      <Dialog open={openMA} onClose={() => { setOpenMA(false); setFormMA(INIT_MA); }} fullWidth maxWidth="xs">
        <DialogTitle>Vincular Modalidad × Área</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel>Modalidad</InputLabel>
              <Select
                value={formMA.idModalidad}
                label="Modalidad"
                onChange={e => setFormMA(p => ({ ...p, idModalidad: e.target.value }))}
              >
                {modalidades.filter(m => m.estado).map(m => (
                  <MenuItem key={m.idModalidad} value={m.idModalidad}>{m.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel>Área</InputLabel>
              <Select
                value={formMA.idArea}
                label="Área"
                onChange={e => setFormMA(p => ({ ...p, idArea: e.target.value }))}
              >
                {areas.filter(a => a.estado).map(a => (
                  <MenuItem key={a.idArea} value={a.idArea}>{a.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {formMA.idModalidad && formMA.idArea && (
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                Se creará el vínculo:{' '}
                <strong>{modalidades.find(m => m.idModalidad === formMA.idModalidad)?.nombre}</strong>
                {' → '}
                <strong>{areas.find(a => a.idArea === formMA.idArea)?.nombre}</strong>
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenMA(false); setFormMA(INIT_MA); }} color="secondary">Cancelar</Button>
          <Button
            onClick={handleSubmitMA}
            variant="contained"
            disabled={!formMA.idModalidad || !formMA.idArea || saving}
          >
            {saving ? <CircularProgress size={24} color="inherit" /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog: Nueva Categoría × Evento ── */}
      <Dialog open={openCE} onClose={() => { setOpenCE(false); setFormCE(INIT_CE); }} fullWidth maxWidth="xs">
        <DialogTitle>Vincular Categoría × Evento</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel>Categoría</InputLabel>
              <Select
                value={formCE.idCategoria}
                label="Categoría"
                onChange={e => setFormCE(p => ({ ...p, idCategoria: e.target.value }))}
              >
                {categorias.filter(c => c.estado).map(c => (
                  <MenuItem key={c.idCategoria} value={c.idCategoria}>{c.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel>Evento</InputLabel>
              <Select
                value={formCE.idEvento}
                label="Evento"
                onChange={e => setFormCE(p => ({ ...p, idEvento: e.target.value }))}
              >
                {eventos.filter(ev => ev.estado).map(ev => (
                  <MenuItem key={ev.idEvento} value={ev.idEvento}>{ev.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {formCE.idCategoria && formCE.idEvento && (
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                Se habilitará:{' '}
                <strong>{categorias.find(c => c.idCategoria === formCE.idCategoria)?.nombre}</strong>
                {' en '}
                <strong>{eventos.find(ev => ev.idEvento === formCE.idEvento)?.nombre}</strong>
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenCE(false); setFormCE(INIT_CE); }} color="secondary">Cancelar</Button>
          <Button
            onClick={handleSubmitCE}
            variant="contained"
            disabled={!formCE.idCategoria || !formCE.idEvento || saving}
          >
            {saving ? <CircularProgress size={24} color="inherit" /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog: Nueva Facultad × Carrera ── */}
      <Dialog open={openEAC} onClose={() => { setOpenEAC(false); setFormEAC(INIT_EAC); }} fullWidth maxWidth="xs">
        <DialogTitle>Vincular Facultad × Carrera</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel>Facultad</InputLabel>
              <Select
                value={formEAC.idEntidadAcademica}
                label="Facultad"
                onChange={e => setFormEAC(p => ({ ...p, idEntidadAcademica: e.target.value }))}
              >
                {entidades.filter(e => e.estado).map(e => (
                  <MenuItem key={e.idEntidadAcademica} value={e.idEntidadAcademica}>{e.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel>Carrera</InputLabel>
              <Select
                value={formEAC.idCarrera}
                label="Carrera"
                onChange={e => setFormEAC(p => ({ ...p, idCarrera: e.target.value }))}
              >
                {carreras.filter(c => c.estado).map(c => (
                  <MenuItem key={c.idCarrera} value={c.idCarrera}>
                    {c.nombre}{c.plan ? ` — ${c.plan}` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {formEAC.idEntidadAcademica && formEAC.idCarrera && (
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                Se vinculará:{' '}
                <strong>{entidades.find(e => e.idEntidadAcademica === formEAC.idEntidadAcademica)?.nombre}</strong>
                {' → '}
                <strong>{carreras.find(c => c.idCarrera === formEAC.idCarrera)?.nombre}</strong>
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenEAC(false); setFormEAC(INIT_EAC); }} color="secondary">Cancelar</Button>
          <Button
            onClick={handleSubmitEAC}
            variant="contained"
            disabled={!formEAC.idEntidadAcademica || !formEAC.idCarrera || saving}
          >
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
