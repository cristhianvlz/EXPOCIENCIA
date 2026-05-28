import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
  Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Dialog, DialogContent, DialogActions, TextField,
  Snackbar, Alert, CircularProgress, Chip, FormControl, InputLabel, Select, MenuItem,
  Typography, Divider, Avatar, Card, CardActionArea, Tabs, Tab,
  ToggleButton, ToggleButtonGroup, Stack
} from '@mui/material';
import {
  EyeOutlined, TableOutlined, AppstoreOutlined, UserOutlined, TeamOutlined,
  FileProtectOutlined, InfoCircleOutlined, BankOutlined, FilePdfOutlined,
  CalendarOutlined, DownloadOutlined
} from '@ant-design/icons';
import MainCard from 'components/MainCard';

// ── GQL ──────────────────────────────────────────────────────────────────────
const GET_ALL = gql`
  query {
    todosLosProyectos {
      idProyecto titulo resumen estado fechaInscripcion fechaConfirmacion observacion activo archivo
      ofertaEaCarrera {
        id carrera
        oferta { nombre }
        entidadAcademica { nombre }
      }
    }
    todosLosParticipantes {
      idParticipante nombre apellido ci
      proyectosInscritos { idProyecto }
    }
    todosLosTutores {
      idTutor nombre apellido ci codEmpleado
      proyectosTutelados { idProyecto }
    }
  }
`;

const EDITAR_PROYECTO = gql`
  mutation($idProyecto: ID!, $estado: String, $observacion: String) {
    editarProyecto(idProyecto: $idProyecto, estado: $estado, observacion: $observacion) {
      ok error
    }
  }
`;

// ── Constants ─────────────────────────────────────────────────────────────────
const ESTADOS = ['revision', 'aprobado', 'rechazado'];

const ESTADO_CONFIG = {
  inscrito:  { label: 'Inscrito',    color: 'info' },
  revision:  { label: 'En Revisión', color: 'warning' },
  aprobado:  { label: 'Aprobado',    color: 'success' },
  rechazado: { label: 'Rechazado',   color: 'error' },
};

// ── Helper: panel de tab ──────────────────────────────────────────────────────
function TabPanel({ value, index, children }) {
  return value === index ? (
    <Box sx={{ pt: 2.5 }}>{children}</Box>
  ) : null;
}

// ── Helper: fila de dato ──────────────────────────────────────────────────────
function DataRow({ icon, label, value }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 1.25,
               borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 0 } }}>
      <Box sx={{ mt: 0.2, color: 'text.secondary', fontSize: 14 }}>{icon}</Box>
      <Box sx={{ minWidth: 130 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={600}
          sx={{ textTransform: 'uppercase', letterSpacing: 0.4 }}>
          {label}
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ flex: 1, color: value ? 'text.primary' : 'text.disabled' }}>
        {value || '—'}
      </Typography>
    </Box>
  );
}

// ── Helper: tarjeta de sección ────────────────────────────────────────────────
function SectionCard({ title, icon, children }) {
  return (
    <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider',
               borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 1.25, bgcolor: 'grey.50', borderBottom: '1px solid',
                 borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ color: 'primary.main', fontSize: 14 }}>{icon}</Box>
        <Typography variant="caption" fontWeight={700} color="text.secondary"
          sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {title}
        </Typography>
      </Box>
      <Box sx={{ px: 2 }}>{children}</Box>
    </Box>
  );
}

// ── Helper: avatar de persona ─────────────────────────────────────────────────
function PersonRow({ nombre, apellido, sub, color = 'primary' }) {
  const initials = `${nombre?.[0] || ''}${apellido?.[0] || ''}`.toUpperCase();
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1,
               borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 0 } }}>
      <Avatar sx={{ width: 32, height: 32, fontSize: 12, bgcolor: `${color}.main` }}>
        {initials}
      </Avatar>
      <Box>
        <Typography variant="body2" fontWeight={500}>{nombre} {apellido}</Typography>
        <Typography variant="caption" color="text.secondary">{sub}</Typography>
      </Box>
    </Box>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function RevisionPage() {
  const [view, setView]                     = useState('table');
  const [filtroEstado, setFiltroEstado]     = useState('');
  const [selected, setSelected]             = useState(null);
  const [openModal, setOpenModal]           = useState(false);
  const [nuevoEstado, setNuevoEstado]       = useState('');
  const [nuevaObservacion, setNuevaObservacion] = useState('');
  const [saving, setSaving]                 = useState(false);
  const [tab, setTab]                       = useState(0);
  const [notification, setNotification]     = useState({ open: false, message: '', severity: 'success' });

  const { data, loading, error, refetch } = useQuery(GET_ALL, { fetchPolicy: 'network-only' });
  const [editarProyecto] = useMutation(EDITAR_PROYECTO);

  const proyectos     = (data?.todosLosProyectos   || []).filter(p => p.activo);
  const participantes = data?.todosLosParticipantes || [];
  const tutores       = data?.todosLosTutores       || [];

  const proyectosFiltrados = filtroEstado
    ? proyectos.filter(p => p.estado === filtroEstado)
    : proyectos;

  const showNotif = (message, severity = 'success') =>
    setNotification({ open: true, message, severity });

  const getParticipantes = (id) => participantes.filter(p => p.proyectosInscritos?.some(proy => proy.idProyecto === id));
  const getTutores       = (id) => tutores.filter(t => t.proyectosTutelados?.some(proy => proy.idProyecto === id));

  const handleOpenProject = (proyecto) => {
    setSelected(proyecto);
    setNuevoEstado(proyecto.estado);
    setNuevaObservacion(proyecto.observacion || '');
    setTab(0);
    setOpenModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res    = await editarProyecto({
        variables: { idProyecto: selected.idProyecto, estado: nuevoEstado, observacion: nuevaObservacion }
      });
      const result = res.data?.editarProyecto;
      if (result?.ok) {
        showNotif('Proyecto actualizado correctamente');
        refetch();
        setOpenModal(false);
      } else {
        showNotif(result?.error || 'Error al actualizar', 'error');
      }
    } catch {
      showNotif('Error de conexión', 'error');
    }
    setSaving(false);
  };

  // ── Table view ────────────────────────────────────────────────────────────
  const renderTable = () => (
    <TableContainer component={Paper} elevation={0}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell width={60}>ID</TableCell>
            <TableCell>Título</TableCell>
            <TableCell>Oferta / Carrera</TableCell>
            <TableCell>Facultad</TableCell>
            <TableCell width={130}>Estado</TableCell>
            <TableCell align="right" width={70}>Ver</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {proyectosFiltrados.map(p => (
            <TableRow key={p.idProyecto} hover>
              <TableCell>{p.idProyecto}</TableCell>
              <TableCell sx={{ maxWidth: 260 }}>
                <Typography variant="body2" fontWeight={500} noWrap>{p.titulo}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">{p.ofertaEaCarrera?.oferta?.nombre}</Typography>
                <Typography variant="caption" color="text.secondary">{p.ofertaEaCarrera?.carrera}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">{p.ofertaEaCarrera?.entidadAcademica?.nombre}</Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={ESTADO_CONFIG[p.estado]?.label || p.estado}
                  color={ESTADO_CONFIG[p.estado]?.color || 'default'}
                  size="small"
                />
              </TableCell>
              <TableCell align="right">
                <IconButton color="primary" size="small" onClick={() => handleOpenProject(p)}>
                  <EyeOutlined />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
          {proyectosFiltrados.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                Sin proyectos{filtroEstado ? ` con estado "${ESTADO_CONFIG[filtroEstado]?.label}"` : ''}.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  // ── Kanban view ───────────────────────────────────────────────────────────
  const renderKanban = () => (
    <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2, alignItems: 'flex-start' }}>
      {ESTADOS.map(estado => {
        const cfg   = ESTADO_CONFIG[estado];
        const cards = proyectos.filter(p => p.estado === estado);
        return (
          <Box key={estado} sx={{ minWidth: 240, flex: '1 0 240px' }}>
            <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label={cfg.label} color={cfg.color} size="small" />
              <Typography variant="caption" color="text.secondary">({cards.length})</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5,
                       minHeight: 100, p: 1, borderRadius: 2,
                       bgcolor: 'action.hover', border: '1px dashed', borderColor: 'divider' }}>
              {cards.map(p => (
                <Card key={p.idProyecto} variant="outlined" sx={{ bgcolor: 'background.paper' }}>
                  <CardActionArea onClick={() => handleOpenProject(p)} sx={{ p: 1.5 }}>
                    <Typography variant="subtitle2" sx={{ lineHeight: 1.3, mb: 0.5 }}>{p.titulo}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {p.ofertaEaCarrera?.oferta?.nombre}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {p.ofertaEaCarrera?.entidadAcademica?.nombre} · {p.ofertaEaCarrera?.carrera}
                    </Typography>
                  </CardActionArea>
                </Card>
              ))}
              {cards.length === 0 && (
                <Typography variant="caption" color="text.disabled"
                  sx={{ textAlign: 'center', py: 2, display: 'block' }}>
                  Sin proyectos
                </Typography>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );

  // ── Modal data ────────────────────────────────────────────────────────────
  const selParts  = selected ? getParticipantes(selected.idProyecto) : [];
  const selTutors = selected ? getTutores(selected.idProyecto) : [];
  const estadoCfg = ESTADO_CONFIG[selected?.estado] || {};

  const fmtDate = (d) => d
    ? new Date(d).toLocaleString('es-BO', { dateStyle: 'long', timeStyle: 'short' })
    : null;

  return (
    <MainCard
      title="Revisión y Aprobación"
      secondary={
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Estado</InputLabel>
            <Select value={filtroEstado} label="Estado"
              onChange={e => setFiltroEstado(e.target.value)}>
              <MenuItem value="">Todos</MenuItem>
              {ESTADOS.map(e => (
                <MenuItem key={e} value={e}>{ESTADO_CONFIG[e].label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <ToggleButtonGroup value={view} exclusive size="small"
            onChange={(_, v) => v && setView(v)}>
            <ToggleButton value="table" title="Tabla"><TableOutlined /></ToggleButton>
            <ToggleButton value="kanban" title="Kanban"><AppstoreOutlined /></ToggleButton>
          </ToggleButtonGroup>
        </Box>
      }
    >
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">Error al cargar los proyectos: {error.message}</Alert>
      ) : (
        view === 'table' ? renderTable() : renderKanban()
      )}

      {/* ── Modal de detalle ── */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)}
        fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 3 } }}>

        {/* Cabecera del modal */}
        {selected && (
          <Box sx={{ px: 3, pt: 3, pb: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
              <Avatar sx={{ width: 44, height: 44, bgcolor: 'primary.main', flexShrink: 0 }}>
                <FileProtectOutlined style={{ fontSize: 20 }} />
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.3 }}>
                  {selected.titulo}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Proyecto #{selected.idProyecto}
                </Typography>
              </Box>
              <Chip
                label={estadoCfg.label || selected.estado}
                color={estadoCfg.color || 'default'}
                size="small"
                sx={{ mt: 0.5, fontWeight: 600 }}
              />
            </Box>

            {/* Tabs de navegación */}
            <Tabs value={tab} onChange={(_, v) => setTab(v)}
              sx={{
                borderBottom: '1px solid',
                borderColor: 'divider',
                '& .MuiTab-root': { minHeight: 40, fontSize: 13, fontWeight: 600, textTransform: 'none' },
                '& .Mui-selected': { color: 'primary.main' },
              }}>
              <Tab icon={<InfoCircleOutlined style={{ fontSize: 14 }} />}
                iconPosition="start" label="Info" />
              <Tab icon={<BankOutlined style={{ fontSize: 14 }} />}
                iconPosition="start" label="Académico" />
              <Tab icon={<TeamOutlined style={{ fontSize: 14 }} />}
                iconPosition="start" label="Equipo" />
              <Tab icon={<FilePdfOutlined style={{ fontSize: 14 }} />}
                iconPosition="start" label="Archivo" />
            </Tabs>
          </Box>
        )}

        <DialogContent sx={{ px: 3, py: 0, bgcolor: 'background.default' }}>
          {selected && (
            <>
              {/* ── Tab 0: Info ── */}
              <TabPanel value={tab} index={0}>
                <Stack gap={2}>
                  <SectionCard title="Datos generales" icon={<InfoCircleOutlined />}>
                    <DataRow icon={<CalendarOutlined />}
                      label="Inscripción" value={fmtDate(selected.fechaInscripcion)} />
                    <DataRow icon={<CalendarOutlined />}
                      label="Confirmación"
                      value={fmtDate(selected.fechaConfirmacion) || 'Pendiente de aprobación'} />
                  </SectionCard>

                  {selected.resumen && (
                    <SectionCard title="Resumen del proyecto" icon={<InfoCircleOutlined />}>
                      <Typography variant="body2" sx={{ py: 1.5, lineHeight: 1.7, color: 'text.secondary' }}>
                        {selected.resumen}
                      </Typography>
                    </SectionCard>
                  )}

                  {selected.observacion && (
                    <SectionCard title="Observación" icon={<InfoCircleOutlined />}>
                      <Typography variant="body2" sx={{ py: 1.5, lineHeight: 1.7, color: 'text.secondary' }}>
                        {selected.observacion}
                      </Typography>
                    </SectionCard>
                  )}
                </Stack>
              </TabPanel>

              {/* ── Tab 1: Académico ── */}
              <TabPanel value={tab} index={1}>
                <SectionCard title="Información académica" icon={<BankOutlined />}>
                  <DataRow icon={<BankOutlined />}
                    label="Oferta"   value={selected.ofertaEaCarrera?.oferta?.nombre} />
                  <DataRow icon={<BankOutlined />}
                    label="Carrera"  value={selected.ofertaEaCarrera?.carrera} />
                  <DataRow icon={<BankOutlined />}
                    label="Facultad" value={selected.ofertaEaCarrera?.entidadAcademica?.nombre} />
                </SectionCard>
              </TabPanel>

              {/* ── Tab 2: Equipo ── */}
              <TabPanel value={tab} index={2}>
                <Stack gap={2}>
                  <SectionCard
                    title={`Participantes (${selParts.length})`}
                    icon={<UserOutlined />}>
                    {selParts.length === 0 ? (
                      <Typography variant="body2" color="text.disabled" sx={{ py: 1.5 }}>
                        Sin participantes registrados
                      </Typography>
                    ) : selParts.map(p => (
                      <PersonRow key={p.idParticipante}
                        nombre={p.nombre} apellido={p.apellido}
                        sub={`CI: ${p.ci}`} color="primary" />
                    ))}
                  </SectionCard>

                  <SectionCard
                    title={`Tutores (${selTutors.length})`}
                    icon={<TeamOutlined />}>
                    {selTutors.length === 0 ? (
                      <Typography variant="body2" color="text.disabled" sx={{ py: 1.5 }}>
                        Sin tutores registrados
                      </Typography>
                    ) : selTutors.map(t => (
                      <PersonRow key={t.idTutor}
                        nombre={t.nombre} apellido={t.apellido}
                        sub={`Cód: ${t.codEmpleado} · CI: ${t.ci}`} color="success" />
                    ))}
                  </SectionCard>
                </Stack>
              </TabPanel>

              {/* ── Tab 3: Archivo ── */}
              <TabPanel value={tab} index={3}>
                {selected.archivo ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Preview del archivo */}
                    <Box sx={{ bgcolor: 'background.paper', border: '1px solid',
                               borderColor: 'divider', borderRadius: 2, p: 3,
                               display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ width: 52, height: 52, borderRadius: 2,
                                 bgcolor: 'error.lighter', display: 'flex',
                                 alignItems: 'center', justifyContent: 'center' }}>
                        <FilePdfOutlined style={{ fontSize: 26, color: '#d32f2f' }} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {selected.archivo.split('/').pop()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Documento adjunto del proyecto
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<DownloadOutlined />}
                        href={`http://localhost:8000/media/${selected.archivo}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ flexShrink: 0 }}
                      >
                        Descargar
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                             py: 5, gap: 1.5, color: 'text.disabled' }}>
                    <FilePdfOutlined style={{ fontSize: 40 }} />
                    <Typography variant="body2">Sin documento adjunto</Typography>
                    <Typography variant="caption">Este proyecto no tiene archivos subidos</Typography>
                  </Box>
                )}
              </TabPanel>

              {/* ── Acción del comité (siempre visible) ── */}
              <Divider sx={{ mt: 2, mb: 2 }} />
              <Box sx={{ pb: 2 }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary"
                  sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1.5 }}>
                  Acción del comité
                </Typography>
                <Stack gap={1.5}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Cambiar Estado</InputLabel>
                    <Select value={nuevoEstado} label="Cambiar Estado"
                      onChange={e => setNuevoEstado(e.target.value)}>
                      {ESTADOS.map(e => (
                        <MenuItem key={e} value={e}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip label={ESTADO_CONFIG[e].label}
                              color={ESTADO_CONFIG[e].color} size="small" />
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    label="Observación / Retroalimentación"
                    value={nuevaObservacion}
                    onChange={e => setNuevaObservacion(e.target.value)}
                    multiline rows={3} fullWidth size="small"
                    placeholder="Escribe correcciones o comentarios para el equipo..."
                  />
                </Stack>
              </Box>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setOpenModal(false)} color="inherit" size="small">
            Cancelar
          </Button>
          <Button onClick={handleSave} variant="contained" size="small" disabled={saving}
            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={notification.open} autoHideDuration={4000}
        onClose={() => setNotification(p => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={notification.severity} variant="filled">
          {notification.message}
        </Alert>
      </Snackbar>
    </MainCard>
  );
}
