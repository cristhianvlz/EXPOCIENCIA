import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
  Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Snackbar, Alert, CircularProgress, Chip, Typography, Stack, Divider,
  FormControl, InputLabel, Select, MenuItem, Tooltip, Tabs, Tab
} from '@mui/material';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, FilePdfOutlined,
  PrinterOutlined, FileTextOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import MainCard from 'components/MainCard';

// ── GQL ──────────────────────────────────────────────────────────────────────
const GET_DATA = gql`
  query {
    todasLasPlantillas {
      idPlantilla descripcion contenido estado
    }
    todosLosCertificados {
      idCertificado fechaEmision estado
      plantilla { idPlantilla descripcion contenido }
      ganadorPremio {
        idGanadorPremio estado
        candidatoPremio {
          nota
          proyecto { idProyecto titulo }
          premio {
            monto
            evento { nombre }
            area { nombre }
            premioDescriptores { descriptor { descripcion } }
          }
        }
      }
    }
    todosLosGanadoresPremios {
      idGanadorPremio estado
      candidatoPremio {
        nota
        proyecto { idProyecto titulo }
        premio {
          monto
          evento { nombre }
          area { nombre }
          premioDescriptores { descriptor { descripcion } }
        }
      }
    }
  }
`;

const CREAR_PLANTILLA = gql`mutation($descripcion: String!, $contenido: String!) {
  crearPlantilla(descripcion: $descripcion, contenido: $contenido) { ok error }
}`;
const EDITAR_PLANTILLA = gql`mutation($idPlantilla: ID!, $descripcion: String, $contenido: String, $estado: Boolean) {
  editarPlantilla(idPlantilla: $idPlantilla, descripcion: $descripcion, contenido: $contenido, estado: $estado) { ok error }
}`;
const ELIMINAR_PLANTILLA = gql`mutation($idPlantilla: ID!) { eliminarPlantilla(idPlantilla: $idPlantilla) { ok error } }`;

const CREAR_CERTIFICADO = gql`mutation($idGanadorPremio: ID!, $idPlantilla: ID!) {
  crearCertificado(idGanadorPremio: $idGanadorPremio, idPlantilla: $idPlantilla) { ok error }
}`;
const ELIMINAR_CERTIFICADO = gql`mutation($idCertificado: ID!) { eliminarCertificado(idCertificado: $idCertificado) { ok error } }`;

// ── Helpers ───────────────────────────────────────────────────────────────────
function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;
}

// Diálogo de confirmación reutilizable (reemplaza window.confirm)
function ConfirmDialog({ open, title, message, confirmLabel = 'Confirmar', confirmColor = 'error', onConfirm, onCancel }) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" gap={1}>
          <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: 20 }} />
          {title}
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ pt: 1 }}>{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="secondary">Cancelar</Button>
        <Button variant="contained" color={confirmColor} onClick={onConfirm}>{confirmLabel}</Button>
      </DialogActions>
    </Dialog>
  );
}

const VARIABLES_HINT = [
  { token: '{{Nombre_Proyecto}}', desc: 'Título del proyecto' },
  { token: '{{Descriptor}}', desc: 'Etiqueta del premio (ej. Primer Lugar)' },
  { token: '{{Area}}', desc: 'Área del premio' },
  { token: '{{Evento}}', desc: 'Nombre del evento' },
  { token: '{{Nota}}', desc: 'Nota obtenida por el proyecto' },
  { token: '{{Monto}}', desc: 'Monto del premio en Bs.' },
];

function resolverContenido(contenido, ganador) {
  if (!ganador || !contenido) return contenido;
  const cp = ganador.candidatoPremio;
  const descriptores = (cp.premio.premioDescriptores || []).map(pd => pd.descriptor.descripcion).join(', ');
  return contenido
    .replace(/\{\{Nombre_Proyecto\}\}/g, cp.proyecto.titulo)
    .replace(/\{\{Descriptor\}\}/g, descriptores || '—')
    .replace(/\{\{Area\}\}/g, cp.premio.area.nombre)
    .replace(/\{\{Evento\}\}/g, cp.premio.evento.nombre)
    .replace(/\{\{Nota\}\}/g, cp.nota)
    .replace(/\{\{Monto\}\}/g, cp.premio.monto);
}

// Genera y abre la ventana de impresión para una lista de certificados
function buildCertPage(cert) {
  const texto = resolverContenido(cert.plantilla.contenido, cert.ganadorPremio);
  const cp = cert.ganadorPremio.candidatoPremio;
  const descriptores = (cp.premio.premioDescriptores || []).map(pd => pd.descriptor.descripcion).join(' · ');
  return `
    <div class="cert-page">
      <div class="cert-box">
        <div class="cert-header-line"></div>
        <div class="cert-title">CERTIFICADO</div>
        <div class="cert-descriptor">${descriptores || ''}</div>
        <div class="cert-event">${cp.premio.evento.nombre}</div>
        <div class="cert-area">Área: ${cp.premio.area.nombre}</div>
        <div class="cert-divider"></div>
        <div class="cert-body">${texto.replace(/\n/g, '<br/>')}</div>
        <div class="cert-divider"></div>
        <div class="cert-footer">Fecha de emisión: ${new Date(cert.fechaEmision).toLocaleDateString('es-BO')}</div>
        <div class="cert-header-line"></div>
      </div>
    </div>`;
}

const CERT_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; background: #fff; color: #222; }
  .cert-page {
    page-break-after: always;
    display: flex; align-items: center; justify-content: center;
    min-height: 100vh; padding: 30px;
  }
  .cert-box {
    border: 3px solid #1a237e;
    outline: 6px double #1a237e;
    outline-offset: -12px;
    padding: 60px 80px;
    max-width: 720px; width: 100%;
    text-align: center;
  }
  .cert-header-line { height: 3px; background: linear-gradient(90deg,transparent,#1a237e,transparent); margin: 0 40px 20px; }
  .cert-title { font-size: 38px; font-weight: bold; color: #1a237e; letter-spacing: 8px; margin-bottom: 10px; }
  .cert-descriptor { font-size: 18px; font-weight: bold; color: #c62828; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 6px; }
  .cert-event { font-size: 14px; color: #555; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 4px; }
  .cert-area { font-size: 13px; color: #888; margin-bottom: 24px; }
  .cert-divider { height: 1px; background: #ccc; margin: 20px 60px; }
  .cert-body { font-size: 15px; line-height: 2.1; color: #333; margin: 20px 0; }
  .cert-footer { font-size: 12px; color: #999; margin-top: 20px; }
  @media print { .cert-page { page-break-after: always; min-height: 100vh; } }
`;

function imprimirCertificados(certs, showNotif) {
  if (!certs.length) return;
  const body = certs.map(buildCertPage).join('');
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Certificados — Expociencia</title><style>${CERT_CSS}</style></head><body>${body}</body></html>`;

  // Usar Blob URL: más confiable que document.write en todos los navegadores
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');

  if (!win) {
    showNotif('El navegador bloqueó la ventana emergente. Permite pop-ups para esta página.', 'warning');
    URL.revokeObjectURL(url);
    return;
  }
  // Disparar impresión cuando la página cargue completamente
  win.addEventListener('load', () => {
    win.focus();
    win.print();
    URL.revokeObjectURL(url);
  }, { once: true });
}

// ── Tab 1: Plantillas ─────────────────────────────────────────────────────────
function PlantillasTab({ plantillas, refetch, showNotif }) {
  const [crearPlantilla] = useMutation(CREAR_PLANTILLA);
  const [editarPlantilla] = useMutation(EDITAR_PLANTILLA);
  const [eliminarPlantilla] = useMutation(ELIMINAR_PLANTILLA);

  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState({ open: false, item: null });
  const [form, setForm] = useState({ descripcion: '', contenido: '' });
  const [preview, setPreview] = useState(null);
  const [confirm, setConfirm] = useState({ open: false, id: null });

  const openDialog = (item = null) => {
    setForm(item ? { descripcion: item.descripcion, contenido: item.contenido } : { descripcion: '', contenido: '' });
    setDialog({ open: true, item });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let res;
      if (dialog.item) {
        res = (await editarPlantilla({ variables: { idPlantilla: dialog.item.idPlantilla, ...form } })).data?.editarPlantilla;
      } else {
        res = (await crearPlantilla({ variables: form })).data?.crearPlantilla;
      }
      if (res?.ok) { showNotif('Plantilla guardada'); refetch(); setDialog({ open: false, item: null }); }
      else showNotif(res?.error || 'Error', 'error');
    } catch { showNotif('Error de conexión', 'error'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    try {
      const res = (await eliminarPlantilla({ variables: { idPlantilla: confirm.id } })).data?.eliminarPlantilla;
      if (res?.ok) { showNotif('Plantilla desactivada'); refetch(); }
      else showNotif(res?.error || 'Error', 'error');
    } catch { showNotif('Error de conexión', 'error'); }
    setConfirm({ open: false, id: null });
  };

  const insertToken = (token) => setForm(p => ({ ...p, contenido: p.contenido + token }));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Plantillas de Certificado</Typography>
        <Button variant="contained" startIcon={<PlusOutlined />} onClick={() => openDialog()}>Nueva Plantilla</Button>
      </Box>

      <TableContainer component={Paper} elevation={0}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width={60}>ID</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell>Contenido (vista previa)</TableCell>
              <TableCell align="center">Estado</TableCell>
              <TableCell align="right" width={120}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {plantillas.map(p => (
              <TableRow key={p.idPlantilla} hover>
                <TableCell>{p.idPlantilla}</TableCell>
                <TableCell><Typography fontWeight={500}>{p.descripcion}</Typography></TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary"
                    sx={{ fontFamily: 'monospace', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {p.contenido}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip label={p.estado ? 'Activa' : 'Inactiva'} size="small" color={p.estado ? 'success' : 'default'} />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Ver plantilla">
                    <IconButton size="small" color="secondary" onClick={() => setPreview(p)}><FileTextOutlined /></IconButton>
                  </Tooltip>
                  <Tooltip title="Editar">
                    <IconButton size="small" color="primary" onClick={() => openDialog(p)}><EditOutlined /></IconButton>
                  </Tooltip>
                  <Tooltip title="Desactivar">
                    <IconButton size="small" color="error" onClick={() => setConfirm({ open: true, id: p.idPlantilla })}><DeleteOutlined /></IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {plantillas.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>Sin plantillas registradas.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Editor Dialog */}
      <Dialog open={dialog.open} onClose={() => setDialog({ open: false, item: null })} maxWidth="md" fullWidth>
        <DialogTitle>{dialog.item ? 'Editar Plantilla' : 'Nueva Plantilla'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Descripción de la plantilla" fullWidth value={form.descripcion}
              onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))} />
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                Variables disponibles (clic para insertar):
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mb: 1 }}>
                {VARIABLES_HINT.map(v => (
                  <Tooltip key={v.token} title={v.desc}>
                    <Chip label={v.token} size="small" variant="outlined" color="primary"
                      onClick={() => insertToken(v.token)} sx={{ cursor: 'pointer', fontFamily: 'monospace' }} />
                  </Tooltip>
                ))}
              </Stack>
            </Box>
            <TextField label="Contenido del certificado" fullWidth multiline rows={8} value={form.contenido}
              onChange={e => setForm(p => ({ ...p, contenido: e.target.value }))}
              placeholder="Ej: Se otorga el presente certificado a los integrantes del proyecto {{Nombre_Proyecto}} por haber obtenido {{Descriptor}} en el área de {{Area}} en {{Evento}}, con una nota de {{Nota}}."
              inputProps={{ style: { lineHeight: 1.8 } }} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog({ open: false, item: null })} color="secondary">Cancelar</Button>
          <Button variant="contained" disabled={!form.descripcion.trim() || !form.contenido.trim() || saving} onClick={handleSave}>
            {saving ? <CircularProgress size={22} color="inherit" /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!preview} onClose={() => setPreview(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Vista previa — {preview?.descripcion}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ p: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, minHeight: 120 }}>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.9 }}>{preview?.contenido}</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreview(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirm.open}
        title="Desactivar plantilla"
        message="¿Estás seguro de que deseas desactivar esta plantilla? Ya no estará disponible para nuevos certificados."
        confirmLabel="Desactivar"
        onConfirm={handleDelete}
        onCancel={() => setConfirm({ open: false, id: null })}
      />
    </Box>
  );
}

// ── Tab 2: Certificados ───────────────────────────────────────────────────────
function CertificadosTab({ certificados, ganadores, plantillas, refetch, showNotif }) {
  const [crearCertificado] = useMutation(CREAR_CERTIFICADO);
  const [eliminarCertificado] = useMutation(ELIMINAR_CERTIFICADO);

  const [saving, setSaving] = useState(false);
  const [genDialog, setGenDialog] = useState({ open: false });
  const [form, setForm] = useState({ idGanadorPremio: '', idPlantilla: '' });
  const [confirm, setConfirm] = useState({ open: false, id: null });
  const [printAllConfirm, setPrintAllConfirm] = useState(false);

  const plantillasActivas = plantillas.filter(p => p.estado);
  const ganadoresActivos = ganadores.filter(g => g.estado);
  const certActivos = certificados.filter(c => c.estado);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = (await crearCertificado({ variables: form })).data?.crearCertificado;
      if (res?.ok) {
        showNotif('Certificado generado exitosamente');
        refetch();
        setGenDialog({ open: false });
        setForm({ idGanadorPremio: '', idPlantilla: '' });
      } else showNotif(res?.error || 'Error al generar', 'error');
    } catch { showNotif('Error de conexión', 'error'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    try {
      const res = (await eliminarCertificado({ variables: { idCertificado: confirm.id } })).data?.eliminarCertificado;
      if (res?.ok) { showNotif('Certificado desactivado'); refetch(); }
      else showNotif(res?.error || 'Error', 'error');
    } catch { showNotif('Error de conexión', 'error'); }
    setConfirm({ open: false, id: null });
  };

  const selectedGanador = ganadores.find(g => g.idGanadorPremio === form.idGanadorPremio);
  const selectedPlantilla = plantillas.find(p => p.idPlantilla === form.idPlantilla);
  const previewTexto = selectedGanador && selectedPlantilla
    ? resolverContenido(selectedPlantilla.contenido, selectedGanador)
    : null;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Certificados Emitidos</Typography>
        <Stack direction="row" gap={1}>
          <Button variant="outlined" startIcon={<PrinterOutlined />}
            onClick={() => setPrintAllConfirm(true)}
            disabled={certActivos.length === 0}>
            Imprimir Todos ({certActivos.length})
          </Button>
          <Button variant="contained" startIcon={<PlusOutlined />} onClick={() => setGenDialog({ open: true })}>
            Generar Certificado
          </Button>
        </Stack>
      </Box>

      <TableContainer component={Paper} elevation={0}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width={60}>ID</TableCell>
              <TableCell>Proyecto</TableCell>
              <TableCell>Premio</TableCell>
              <TableCell>Plantilla</TableCell>
              <TableCell align="center">Nota</TableCell>
              <TableCell>Fecha Emisión</TableCell>
              <TableCell align="center">Estado</TableCell>
              <TableCell align="right" width={110}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {certificados.map(cert => {
              const cp = cert.ganadorPremio.candidatoPremio;
              const descriptores = (cp.premio.premioDescriptores || []).map(pd => pd.descriptor.descripcion).join(', ');
              return (
                <TableRow key={cert.idCertificado} hover>
                  <TableCell>{cert.idCertificado}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>{cp.proyecto.titulo}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{cp.premio.area.nombre}</Typography>
                    <Typography variant="caption" color="text.secondary">{descriptores || cp.premio.evento.nombre}</Typography>
                  </TableCell>
                  <TableCell>{cert.plantilla.descripcion}</TableCell>
                  <TableCell align="center">
                    <Typography fontWeight={600} color="primary.main">{cp.nota}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{new Date(cert.fechaEmision).toLocaleDateString('es-BO')}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={cert.estado ? 'Activo' : 'Inactivo'} size="small" color={cert.estado ? 'success' : 'default'} />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Imprimir este certificado">
                      <IconButton size="small" color="primary"
                        onClick={() => imprimirCertificados([cert], showNotif)}>
                        <PrinterOutlined />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Desactivar">
                      <IconButton size="small" color="error"
                        onClick={() => setConfirm({ open: true, id: cert.idCertificado })}>
                        <DeleteOutlined />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
            {certificados.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  Sin certificados generados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Generar Certificado Dialog */}
      <Dialog open={genDialog.open} onClose={() => { setGenDialog({ open: false }); setForm({ idGanadorPremio: '', idPlantilla: '' }); }} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" gap={1}>
            <FilePdfOutlined style={{ color: '#ff4d4f' }} />
            Generar Certificado
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel>Ganador</InputLabel>
              <Select value={form.idGanadorPremio} label="Ganador"
                onChange={e => setForm(p => ({ ...p, idGanadorPremio: e.target.value }))}>
                {ganadoresActivos.map(g => {
                  const cp = g.candidatoPremio;
                  const descriptores = (cp.premio.premioDescriptores || []).map(pd => pd.descriptor.descripcion).join(', ');
                  return (
                    <MenuItem key={g.idGanadorPremio} value={g.idGanadorPremio}>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>{cp.proyecto.titulo}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {descriptores} — {cp.premio.area.nombre} ({cp.premio.evento.nombre}) · Nota: {cp.nota}
                        </Typography>
                      </Box>
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Plantilla</InputLabel>
              <Select value={form.idPlantilla} label="Plantilla"
                onChange={e => setForm(p => ({ ...p, idPlantilla: e.target.value }))}>
                {plantillasActivas.map(pl => (
                  <MenuItem key={pl.idPlantilla} value={pl.idPlantilla}>{pl.descripcion}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {previewTexto && (
              <>
                <Divider />
                <Typography variant="subtitle2">Vista previa del certificado</Typography>
                <Box sx={{ p: 3, border: '4px double', borderColor: 'primary.main', borderRadius: 1,
                  textAlign: 'center', bgcolor: 'background.paper' }}>
                  <Typography variant="h5" fontWeight={700} letterSpacing={3} color="primary.main" sx={{ mb: 1 }}>
                    CERTIFICADO
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 2, color: 'text.primary' }}>
                    {previewTexto}
                  </Typography>
                </Box>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setGenDialog({ open: false }); setForm({ idGanadorPremio: '', idPlantilla: '' }); }} color="secondary">
            Cancelar
          </Button>
          <Button variant="contained" disabled={!form.idGanadorPremio || !form.idPlantilla || saving} onClick={handleSave}>
            {saving ? <CircularProgress size={22} color="inherit" /> : 'Generar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmar desactivar certificado */}
      <ConfirmDialog
        open={confirm.open}
        title="Desactivar certificado"
        message="¿Estás seguro de que deseas desactivar este certificado?"
        confirmLabel="Desactivar"
        onConfirm={handleDelete}
        onCancel={() => setConfirm({ open: false, id: null })}
      />

      {/* Confirmar imprimir todos */}
      <ConfirmDialog
        open={printAllConfirm}
        title="Imprimir todos los certificados"
        message={`Se abrirá una ventana de impresión con ${certActivos.length} certificado(s). ¿Continuar?`}
        confirmLabel="Imprimir"
        confirmColor="primary"
        onConfirm={() => { setPrintAllConfirm(false); imprimirCertificados(certActivos, showNotif); }}
        onCancel={() => setPrintAllConfirm(false)}
      />
    </Box>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CertificadosPage() {
  const { data, loading, error, refetch } = useQuery(GET_DATA, { fetchPolicy: 'network-only' });
  const [tab, setTab] = useState(0);
  const [notif, setNotif] = useState({ open: false, msg: '', sev: 'success' });
  const showNotif = (msg, sev = 'success') => setNotif({ open: true, msg, sev });

  const plantillas = data?.todasLasPlantillas || [];
  const certificados = data?.todosLosCertificados || [];
  const ganadores = data?.todosLosGanadoresPremios || [];

  return (
    <MainCard title="Emisión de Certificados">
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error">Error al cargar: {error.message}</Alert>
      ) : (
        <>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 0 }}>
            <Tab label="Plantillas de Texto" icon={<FileTextOutlined />} iconPosition="start" />
            <Tab label="Certificados" icon={<FilePdfOutlined />} iconPosition="start" />
          </Tabs>

          <TabPanel value={tab} index={0}>
            <PlantillasTab plantillas={plantillas} refetch={refetch} showNotif={showNotif} />
          </TabPanel>
          <TabPanel value={tab} index={1}>
            <CertificadosTab
              certificados={certificados} ganadores={ganadores} plantillas={plantillas}
              refetch={refetch} showNotif={showNotif}
            />
          </TabPanel>
        </>
      )}

      <Snackbar open={notif.open} autoHideDuration={4000}
        onClose={() => setNotif(p => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={notif.sev} variant="filled">{notif.msg}</Alert>
      </Snackbar>
    </MainCard>
  );
}
