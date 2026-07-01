import { useState, useRef } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
  Box, Button, Stepper, Step, StepLabel, Typography, CircularProgress,
  Alert, FormControl, InputLabel, Select, MenuItem, TextField, Chip,
  Divider, IconButton, Paper, Snackbar, FormControlLabel, Switch,
  ToggleButton, ToggleButtonGroup, Dialog, DialogTitle, DialogContent,
  DialogActions, List, ListItem, ListItemText, ListItemIcon, Autocomplete, Avatar, Radio
} from '@mui/material';
import {
  PlusOutlined, DeleteOutlined, CheckCircleOutlined, ProjectOutlined,
  CloudUploadOutlined, FileTextOutlined, UserAddOutlined, UserOutlined,
  RightOutlined, DownOutlined
} from '@ant-design/icons';
import MainCard from 'components/MainCard';

// ── GQL ──────────────────────────────────────────────────────────────────────
const GET_DATA = gql`
  query {
    todosLosOfertaEaCarreras {
      id estado
      oferta {
        idOferta
        categoriaEvento {
          evento    { idEvento nombre version maxParticipantes maxTribunal maxTutores }
          categoria { nombre }
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
    todosLosParticipantes {
      idParticipante nombre apellido ci celular codigoEspecifico
    }
    todosLosTutores {
      idTutor nombre apellido ci celular codEmpleado
    }
    todosLosCronogramas {
      idCronograma fechaInicio fechaFin estado
      actividad { nombreActividad }
      evento { idEvento }
    }
  }
`;

const CREAR_USUARIO = gql`
  mutation($username: String!, $email: String!, $password: String!) {
    crearUsuario(username: $username, email: $email, password: $password) {
      usuario { idUsuario }
      ok error
    }
  }
`;

const CREAR_PROYECTO = gql`
  mutation($idOfertaEaCarrera: ID!, $titulo: String!, $resumen: String, $archivo: Upload!) {
    crearProyecto(
      idOfertaEaCarrera: $idOfertaEaCarrera, titulo: $titulo,
      resumen: $resumen, archivo: $archivo, estado: "revision"
    ) {
      proyecto { idProyecto }
      ok error
    }
  }
`;

const CREAR_PARTICIPANTE = gql`
  mutation(
    $idUsuario: ID!, $codigoEspecifico: String!, $nombre: String!, $apellido: String!,
    $celular: String!, $ci: String!, $expedicion: String!, $idProyecto: ID,
    $direccion: String, $institucion: String
  ) {
    crearParticipante(
      idUsuario: $idUsuario, codigoEspecifico: $codigoEspecifico,
      nombre: $nombre, apellido: $apellido, celular: $celular,
      ci: $ci, expedicion: $expedicion, idProyecto: $idProyecto,
      direccion: $direccion, institucion: $institucion
    ) { ok error }
  }
`;

const EDITAR_PARTICIPANTE = gql`
  mutation($idParticipante: ID!, $idProyecto: ID) {
    editarParticipante(idParticipante: $idParticipante, idProyecto: $idProyecto) {
      ok error
    }
  }
`;

const CREAR_TUTOR = gql`
  mutation(
    $idUsuario: ID!, $codEmpleado: String!, $nombre: String!, $apellido: String!,
    $celular: String!, $direccion: String!, $ci: String!, $expedicion: String!, $idProyecto: ID
  ) {
    crearTutor(
      idUsuario: $idUsuario, codEmpleado: $codEmpleado, nombre: $nombre,
      apellido: $apellido, celular: $celular, direccion: $direccion,
      ci: $ci, expedicion: $expedicion, idProyecto: $idProyecto
    ) { ok error }
  }
`;

const EDITAR_TUTOR = gql`
  mutation($idTutor: ID!, $idProyecto: ID) {
    editarTutor(idTutor: $idTutor, idProyecto: $idProyecto) {
      ok error
    }
  }
`;

// ── Constants ─────────────────────────────────────────────────────────────────
const WIZARD_STEPS = ['Selección de Oferta', 'Datos del Proyecto', 'Integrantes', 'Tutor'];
const EXPEDICION_OPTS = ['LP', 'CB', 'SC', 'OR', 'PT', 'CH', 'TJ', 'BN', 'PD'];

const EMPTY_PARTICIPANTE = {
  modo: 'existente',
  idParticipante: '',
  nombre: '', apellido: '', ci: '', expedicion: 'LP', celular: '',
  codigoEspecifico: '', email: '', esExterno: false, direccion: '', institucion: ''
};

const EMPTY_TUTOR = {
  modo: 'existente',
  idTutor: '',
  nombre: '', apellido: '', ci: '', expedicion: 'LP',
  celular: '', direccion: '', codEmpleado: '', email: ''
};

// ── Mini info field ───────────────────────────────────────────────────────────
function InfoField({ label, value, icon }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary"
        sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.62rem' }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500} sx={{ mt: 0.1 }}>
        {value || <span style={{ color: '#888' }}>—</span>}
      </Typography>
    </Box>
  );
}

// ── Drag-and-drop file area ────────────────────────────────────────────────────
function FileDropZone({ file, onFile }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  };

  return (
    <Box
      onClick={() => inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      sx={{
        border: '2px dashed',
        borderColor: dragging ? 'primary.main' : 'divider',
        borderRadius: 2, p: 3, textAlign: 'center', cursor: 'pointer',
        bgcolor: dragging ? 'action.hover' : 'transparent',
        transition: 'all 0.2s',
        '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' }
      }}
    >
      <input
        ref={inputRef} type="file" hidden
        accept=".pdf,.doc,.docx"
        onChange={(e) => { if (e.target.files[0]) onFile(e.target.files[0]); }}
      />
      {file ? (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />
          <Box sx={{ textAlign: 'left' }}>
            <Typography variant="body2" fontWeight={600}>{file.name}</Typography>
            <Typography variant="caption" color="text.secondary">
              {(file.size / 1024).toFixed(1)} KB — clic para cambiar
            </Typography>
          </Box>
        </Box>
      ) : (
        <Box>
          <CloudUploadOutlined style={{ fontSize: 36, color: '#8c8c8c' }} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Arrastra tu documento aquí o <strong>haz clic para seleccionar</strong>
          </Typography>
          <Typography variant="caption" color="text.disabled">PDF, DOC o DOCX</Typography>
        </Box>
      )}
    </Box>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function InscripcionPage() {
  const [activeStep, setActiveStep]   = useState(0);
  const [saving, setSaving]           = useState(false);
  const [done, setDone]               = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  const [selectedOec, setSelectedOec] = useState('');
  const [searchOferta, setSearchOferta] = useState('');
  const [expandedEvs, setExpandedEvs] = useState(new Set());
  const [titulo, setTitulo]           = useState('');
  const [resumen, setResumen]         = useState('');
  const [archivoFile, setArchivoFile] = useState(null);
  const [participantes, setParticipantes] = useState([{ ...EMPTY_PARTICIPANTE }]);
  const [tutores, setTutores]             = useState([{ ...EMPTY_TUTOR }]);

  const { data, loading, error } = useQuery(GET_DATA, { fetchPolicy: 'network-only' });
  const [crearUsuario]        = useMutation(CREAR_USUARIO);
  const [crearProyecto]       = useMutation(CREAR_PROYECTO);
  const [crearParticipante]   = useMutation(CREAR_PARTICIPANTE);
  const [editarParticipante]  = useMutation(EDITAR_PARTICIPANTE);
  const [crearTutor]          = useMutation(CREAR_TUTOR);
  const [editarTutor]         = useMutation(EDITAR_TUTOR);

  const todosParticipantes = data?.todosLosParticipantes || [];
  const todosTutores       = data?.todosLosTutores       || [];
  const cronogramas        = data?.todosLosCronogramas   || [];

  const isOfertaActiva = (oec) => {
    const idEvento = oec?.oferta?.categoriaEvento?.evento?.idEvento;
    if (!idEvento) return false;
    const now = new Date();
    return cronogramas.some(c =>
      c.actividad?.nombreActividad?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes('inscripcion') &&
      c.evento?.idEvento === idEvento &&
      new Date(c.fechaInicio) <= now &&
      new Date(c.fechaFin) >= now
    );
  };

  const ofertas = (data?.todosLosOfertaEaCarreras || []).filter(o => o.estado && isOfertaActiva(o));

  // Ya no necesitamos validar dinámicamente el mensaje de error de fecha,
  // porque el select solo muestra ofertas con período de inscripción activo.
  const inscripcionActiva = selectedOec ? true : null;

  const showNotif = (message, severity = 'success') =>
    setNotification({ open: true, message, severity });

  // ── Validation Helpers ────────────────────────────────────────────────────
  const isCiRegistradoParticipante = (ci) => todosParticipantes.some(tp => tp.ci === ci);
  const isCodRegistradoParticipante = (cod) => todosParticipantes.some(tp => tp.codigoEspecifico === cod);

  const isCiRegistradoTutor = (ci) => todosTutores.some(tt => tt.ci === ci);
  const isCodRegistradoTutor = (cod) => todosTutores.some(tt => tt.codEmpleado === cod);

  // ── Validation ────────────────────────────────────────────────────────────
  const stepValid = () => {
    switch (activeStep) {
      case 0: return !!selectedOec && inscripcionActiva !== false;
      case 1: return !!titulo.trim() && !!archivoFile;
      case 2: return participantes.length > 0 && participantes.every(p =>
        p.modo === 'existente'
          ? !!p.idParticipante
          : p.nombre.trim() && p.apellido.trim() && p.ci.trim() &&
            p.celular.trim() && p.codigoEspecifico.trim() && p.email.trim() &&
            !isCiRegistradoParticipante(p.ci.trim()) && !isCodRegistradoParticipante(p.codigoEspecifico.trim())
      );
      case 3: return tutores.length > 0 && tutores.every(t =>
        t.modo === 'existente'
          ? !!t.idTutor
          : t.nombre.trim() && t.apellido.trim() && t.ci.trim() &&
            t.celular.trim() && t.codEmpleado.trim() && t.email.trim() && t.direccion.trim() &&
            !isCiRegistradoTutor(t.ci.trim()) && !isCodRegistradoTutor(t.codEmpleado.trim())
      );
      default: return false;
    }
  };

  // ── Límites del evento seleccionado ──────────────────────────────────────
  const eventoLimits = (() => {
    if (!selectedOec) return { maxParticipantes: 0, maxTribunal: 0, maxTutores: 0 };
    const oec = ofertas.find(o => o.id === selectedOec);
    const ev = oec?.oferta?.categoriaEvento?.evento;
    return {
      maxParticipantes: ev?.maxParticipantes || 0,
      maxTribunal:      ev?.maxTribunal      || 0,
      maxTutores:       ev?.maxTutores       || 0,
    };
  })();

  const participanteLimitReached = eventoLimits.maxParticipantes > 0 && participantes.length >= eventoLimits.maxParticipantes;
  const tutorLimitReached        = eventoLimits.maxTutores       > 0 && tutores.length       >= eventoLimits.maxTutores;

  // ── Participante helpers ──────────────────────────────────────────────────
  const addParticipante    = () => { if (!participanteLimitReached) setParticipantes(p => [...p, { ...EMPTY_PARTICIPANTE }]); };
  const removeParticipante = (i) => setParticipantes(p => p.filter((_, idx) => idx !== i));
  const updateParticipante = (i, field, value) =>
    setParticipantes(p => p.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  // ── Tutor helpers ─────────────────────────────────────────────────────────
  const addTutor    = () => { if (!tutorLimitReached) setTutores(t => [...t, { ...EMPTY_TUTOR }]); };
  const removeTutor = (i) => setTutores(t => t.filter((_, idx) => idx !== i));
  const updateTutor = (i, field, value) =>
    setTutores(t => t.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSaving(true);
    try {
      // 1. Crear proyecto (con archivo si existe)
      const proyRes = await crearProyecto({
        variables: { idOfertaEaCarrera: selectedOec, titulo, resumen, archivo: archivoFile || undefined }
      });
      const proy = proyRes.data?.crearProyecto;
      if (!proy?.ok) { showNotif(proy?.error || 'Error al crear el proyecto', 'error'); setSaving(false); return; }
      const idProyecto = proy.proyecto.idProyecto;

      // 2. Vincular / crear participantes
      for (const p of participantes) {
        if (p.modo === 'existente') {
          const res = await editarParticipante({ variables: { idParticipante: p.idParticipante, idProyecto } });
          if (!res.data?.editarParticipante?.ok) {
            showNotif(res.data?.editarParticipante?.error || 'Error vinculando participante', 'error');
            setSaving(false); return;
          }
        } else {
          const uRes = await crearUsuario({ variables: { username: p.ci, email: p.email, password: p.ci } });
          const u = uRes.data?.crearUsuario;
          if (!u?.ok) { showNotif(u?.error || `Error creando cuenta para ${p.nombre}`, 'error'); setSaving(false); return; }

          const partRes = await crearParticipante({
            variables: {
              idUsuario: u.usuario.idUsuario,
              codigoEspecifico: p.codigoEspecifico,
              nombre: p.nombre, apellido: p.apellido, celular: p.celular,
              ci: p.ci, expedicion: p.expedicion, idProyecto,
              direccion:   p.esExterno ? p.direccion   : undefined,
              institucion: p.esExterno ? p.institucion : undefined,
            }
          });
          if (!partRes.data?.crearParticipante?.ok) {
            showNotif(partRes.data?.crearParticipante?.error || `Error registrando a ${p.nombre}`, 'error');
            setSaving(false); return;
          }
        }
      }

      // 3. Vincular / crear tutores
      for (const t of tutores) {
        if (t.modo === 'existente') {
          const res = await editarTutor({ variables: { idTutor: t.idTutor, idProyecto } });
          if (!res.data?.editarTutor?.ok) {
            showNotif(res.data?.editarTutor?.error || 'Error vinculando tutor', 'error');
            setSaving(false); return;
          }
        } else {
          const uRes = await crearUsuario({ variables: { username: t.ci, email: t.email, password: t.ci } });
          const u = uRes.data?.crearUsuario;
          if (!u?.ok) { showNotif(u?.error || `Error creando cuenta para tutor ${t.nombre}`, 'error'); setSaving(false); return; }

          const tutRes = await crearTutor({
            variables: {
              idUsuario: u.usuario.idUsuario, codEmpleado: t.codEmpleado,
              nombre: t.nombre, apellido: t.apellido, celular: t.celular,
              direccion: t.direccion, ci: t.ci, expedicion: t.expedicion, idProyecto,
            }
          });
          if (!tutRes.data?.crearTutor?.ok) {
            showNotif(tutRes.data?.crearTutor?.error || `Error registrando tutor ${t.nombre}`, 'error');
            setSaving(false); return;
          }
        }
      }

      setDone(true);
    } catch {
      showNotif('Error de conexión', 'error');
    }
    setSaving(false);
  };

  const handleReset = () => {
    setActiveStep(0);
    setSelectedOec('');
    setSearchOferta('');
    setExpandedEvs(new Set());
    setTitulo('');
    setResumen('');
    setArchivoFile(null);
    setParticipantes([{ ...EMPTY_PARTICIPANTE }]);
    setTutores([{ ...EMPTY_TUTOR }]);
    setDone(false);
  };

  // ── Step 0: Oferta ────────────────────────────────────────────────────────
  const renderStep0 = () => {
    // Agrupar: evento → oferta → [oecs]
    const groups = ofertas.reduce((acc, oec) => {
      const ev  = oec.oferta?.categoriaEvento?.evento;
      const evId = ev?.idEvento || '__sin_ev';
      const of  = oec.oferta;
      const ofId = of?.idOferta || '__sin_of';
      if (!acc[evId]) acc[evId] = { ev, ofertas: {} };
      if (!acc[evId].ofertas[ofId]) acc[evId].ofertas[ofId] = { of, oecs: [] };
      acc[evId].ofertas[ofId].oecs.push(oec);
      return acc;
    }, {});

    // Filtrar por búsqueda
    const q = searchOferta.toLowerCase().trim();
    const visibleGroups = Object.entries(groups).reduce((acc, [evId, evGroup]) => {
      const ofEntries = Object.entries(evGroup.ofertas).reduce((oa, [ofId, ofGroup]) => {
        const matchOecs = ofGroup.oecs.filter(oec => !q || [
          evGroup.ev?.nombre, ofGroup.of?.categoriaEvento?.categoria?.nombre,
          oec.eaCarrera?.entidadAcademica?.nombre,
          oec.eaCarrera?.carrera?.nombre,
        ].filter(Boolean).join(' ').toLowerCase().includes(q));
        if (matchOecs.length > 0) oa[ofId] = { ...ofGroup, oecs: matchOecs };
        return oa;
      }, {});
      if (Object.keys(ofEntries).length > 0) acc[evId] = { ...evGroup, ofertas: ofEntries };
      return acc;
    }, {});

    return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Typography variant="body2" color="text.secondary">
        Selecciona la oferta académica a la que se inscribe este proyecto.
      </Typography>
      {loading ? <CircularProgress /> : error ? (
        <Alert severity="error">Error al cargar las ofertas disponibles.</Alert>
      ) : ofertas.length === 0 ? (
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          <strong>No hay ofertas disponibles en este momento.</strong> Actualmente no existen eventos con su período de inscripción abierto. Por favor, intenta más adelante.
        </Alert>
      ) : (
        <Box>
          {/* Buscador */}
          <TextField
            size="small" fullWidth
            placeholder="Buscar por evento, oferta, facultad o carrera..."
            value={searchOferta}
            onChange={e => setSearchOferta(e.target.value)}
            sx={{ mb: 1 }}
            InputProps={{
              startAdornment: (
                <Box component="span" sx={{ color: 'text.disabled', mr: 1, fontSize: 16, display: 'flex' }}>⌕</Box>
              ),
              endAdornment: searchOferta ? (
                <IconButton size="small" onClick={() => setSearchOferta('')} sx={{ p: 0.25 }}>
                  <Box component="span" sx={{ fontSize: 14, lineHeight: 1 }}>✕</Box>
                </IconButton>
              ) : null,
            }}
          />

          {/* Lista agrupada */}
          <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ maxHeight: 380, overflowY: 'auto', p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {Object.keys(visibleGroups).length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Sin resultados para <strong>"{searchOferta}"</strong>
                  </Typography>
                </Box>
              ) : Object.entries(visibleGroups).map(([evId, evGroup]) => {
                // Si hay búsqueda activa, siempre mostrar expandido
                const isExpanded = q ? true : expandedEvs.has(evId);
                const toggleEv = () => setExpandedEvs(prev => {
                  const next = new Set(prev);
                  next.has(evId) ? next.delete(evId) : next.add(evId);
                  return next;
                });
                // Contar OECs seleccionadas dentro de este evento
                const hasSelected = Object.values(evGroup.ofertas).some(og =>
                  og.oecs.some(oec => oec.id === selectedOec)
                );

                return (
                <Box key={evId} sx={{ border: '1px solid', borderColor: hasSelected ? 'primary.main' : 'divider', borderRadius: 1.5, overflow: 'hidden', transition: 'border-color 0.15s' }}>

                  {/* Header del evento — clickable para colapsar */}
                  <Box
                    onClick={toggleEv}
                    sx={{
                      px: 2, py: 0.9,
                      display: 'flex', alignItems: 'center', gap: 1,
                      cursor: 'pointer',
                      bgcolor: 'action.hover',
                      '&:hover': { bgcolor: 'action.selected' },
                      transition: 'background-color 0.12s',
                      userSelect: 'none',
                    }}
                  >
                    {/* Flecha */}
                    <Box sx={{ color: 'text.disabled', fontSize: 10, flexShrink: 0, transition: 'transform 0.2s', display: 'flex', alignItems: 'center' }}>
                      {isExpanded
                        ? <DownOutlined style={{ fontSize: 10 }} />
                        : <RightOutlined style={{ fontSize: 10 }} />
                      }
                    </Box>
                    <Typography variant="body2" fontWeight={600} color="text.primary" sx={{ fontSize: '0.82rem', flex: 1 }}>
                      {evGroup.ev?.nombre || 'Sin evento'}{evGroup.ev?.version ? ` v${evGroup.ev.version}` : ''}
                    </Typography>
                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem', flexShrink: 0 }}>
                      {evGroup.ev?.gestion}
                    </Typography>
                    {/* Badge con # de opciones */}
                    <Box sx={{ bgcolor: 'action.selected', borderRadius: 0.75, px: 0.8, py: 0.15 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', fontWeight: 600 }}>
                        {Object.values(evGroup.ofertas).reduce((s, og) => s + og.oecs.length, 0)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Contenido colapsable */}
                  {isExpanded && (
                    <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
                      {Object.entries(evGroup.ofertas).map(([ofId, ofGroup], ofIdx) => (
                        <Box key={ofId} sx={{ borderTop: ofIdx > 0 ? '1px solid' : 'none', borderColor: 'divider' }}>

                          {/* Línea de oferta compacta */}
                          <Box sx={{ px: 2, py: 0.45, pl: 3, display: 'flex', alignItems: 'center', gap: 0.75, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)' }}>
                            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ fontSize: '0.7rem', flexShrink: 0 }}>
                              {ofGroup.of?.categoriaEvento?.categoria?.nombre}
                            </Typography>
                            {[
                              ofGroup.of?.categoriaEvento?.categoria?.nombre,
                              ofGroup.of?.modalidadArea?.modalidad?.nombre,
                              ofGroup.of?.modalidadArea?.area?.nombre,
                            ].filter(Boolean).map((tag, i) => (
                              <Typography key={i} variant="caption" color="text.disabled" sx={{ fontSize: '0.63rem' }}>
                                · {tag}
                              </Typography>
                            ))}
                          </Box>

                          {/* Filas de OEC */}
                          {ofGroup.oecs.map((oec) => {
                            const isSelected = selectedOec === oec.id;
                            const carr = oec.eaCarrera?.carrera;
                            return (
                              <Box
                                key={oec.id}
                                onClick={() => setSelectedOec(oec.id)}
                                sx={{
                                  px: 2, py: 0.6, pl: 3.5,
                                  cursor: 'pointer',
                                  display: 'flex', alignItems: 'center',
                                  borderTop: '1px solid', borderColor: 'divider',
                                  bgcolor: isSelected ? 'action.selected' : 'transparent',
                                  '&:hover': { bgcolor: isSelected ? 'action.selected' : 'action.hover' },
                                  transition: 'background-color 0.12s',
                                }}
                              >
                                <Radio
                                  checked={isSelected} size="small"
                                  sx={{ p: 0, mr: 1.2, color: 'text.disabled', '&.Mui-checked': { color: 'primary.main' } }}
                                />
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography variant="body2" fontWeight={isSelected ? 600 : 400} color={isSelected ? 'primary.main' : 'text.primary'} noWrap sx={{ fontSize: '0.8rem' }}>
                                    {oec.eaCarrera?.entidadAcademica?.nombre}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.7rem' }}>
                                    {carr?.nombre}{carr?.plan ? ` · Plan ${carr.plan}` : ''}
                                  </Typography>
                                </Box>
                              </Box>
                            );
                          })}
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
                );
              })}
            </Box>
          </Paper>
        </Box>
      )}
      {selectedOec && (() => {
        const oec  = ofertas.find(o => o.id === selectedOec);
        if (!oec) return null;
        const ev   = oec.oferta?.categoriaEvento?.evento;
        const carr = oec.eaCarrera?.carrera;
        const campos = [
          { label: 'Evento',    value: ev ? `${ev.nombre} v${ev.version}` : '—' },
          { label: 'Categoría', value: oec.oferta?.categoriaEvento?.categoria?.nombre || '—' },
          { label: 'Modalidad', value: oec.oferta?.modalidadArea?.modalidad?.nombre   || '—' },
          { label: 'Área',      value: oec.oferta?.modalidadArea?.area?.nombre        || '—' },
          { label: 'Facultad',  value: oec.eaCarrera?.entidadAcademica?.nombre        || '—' },
          { label: 'Carrera',   value: carr ? `${carr.nombre}${carr.plan ? ` · Plan ${carr.plan}` : ''}` : '—' },
        ];
        return (
          <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
            {/* Cabecera limpia — borde izquierdo de acento, sin color de fondo fuerte */}
            <Box sx={{ px: 2, py: 1, borderLeft: '3px solid', borderLeftColor: 'primary.main', bgcolor: 'action.hover', display: 'flex', alignItems: 'baseline', gap: 1 }}>
              <Typography variant="caption" color="primary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, fontSize: '0.62rem' }}>
                Oferta seleccionada
              </Typography>
              <Typography variant="body2" fontWeight={600} color="text.primary">
                {oec.oferta?.categoriaEvento?.evento?.nombre} v{oec.oferta?.categoriaEvento?.evento?.version} · {oec.oferta?.categoriaEvento?.categoria?.nombre}
              </Typography>
            </Box>
            <Divider />
            {/* Grid de campos 3×2 */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
              {campos.map(({ label, value }, idx) => (
                <Box key={label} sx={{
                  px: 2, py: 1,
                  borderRight: (idx + 1) % 3 !== 0 ? '1px solid' : 'none',
                  borderBottom: idx < 3 ? '1px solid' : 'none',
                  borderColor: 'divider',
                }}>
                  <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: 0.5 }}>
                    {label}
                  </Typography>
                  <Typography variant="body2" fontWeight={500} noWrap sx={{ fontSize: '0.8rem' }}>{value}</Typography>
                </Box>
              ))}
            </Box>
            {(ev?.maxParticipantes > 0 || ev?.maxTutores > 0 || ev?.maxTribunal > 0) && (
              <>
                <Divider />
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', bgcolor: 'action.hover' }}>
                  {[
                    { label: 'Máx. Participantes', value: ev?.maxParticipantes || '∞', color: 'primary.main' },
                    { label: 'Máx. Tribunal',      value: ev?.maxTribunal      || '∞', color: 'warning.main' },
                    { label: 'Máx. Tutores',       value: ev?.maxTutores       || '∞', color: 'success.main' },
                  ].map(({ label, value, color }, idx) => (
                    <Box key={label} sx={{ px: 2, py: 0.8, borderRight: idx < 2 ? '1px solid' : 'none', borderColor: 'divider', textAlign: 'center' }}>
                      <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.58rem' }}>{label}</Typography>
                      <Typography variant="body2" fontWeight={700} color={color} sx={{ fontSize: '0.82rem' }}>{value}</Typography>
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </Paper>
        );
      })()}
    </Box>
  );
  };

  // ── Step 1: Datos del Proyecto ────────────────────────────────────────────
  const renderStep1 = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="body2" color="text.secondary">
        Ingresa el título, descripción y el documento de tu proyecto.
      </Typography>
      <TextField
        label="Título del Proyecto" value={titulo} fullWidth required autoFocus
        onChange={e => setTitulo(e.target.value)}
      />
      <TextField
        label="Resumen / Descripción" value={resumen} fullWidth multiline rows={4}
        onChange={e => setResumen(e.target.value)}
        placeholder="Describe brevemente el proyecto, sus objetivos y metodología..."
      />
      <Box>
        <Typography variant="body2" sx={{ mb: 1 }}>
          Documento del Proyecto *
        </Typography>
        <FileDropZone file={archivoFile} onFile={setArchivoFile} />
        {archivoFile && (
          <Button size="small" color="error" sx={{ mt: 0.5 }} onClick={() => setArchivoFile(null)}>
            Quitar archivo
          </Button>
        )}
      </Box>
    </Box>
  );

  // ── Step 2: Integrantes ───────────────────────────────────────────────────
  const renderParticipanteCard = (p, i) => {
    const alreadySelected = participantes
      .filter((_, idx) => idx !== i)
      .map(x => x.idParticipante)
      .filter(Boolean);

    const disponibles = todosParticipantes.filter(
      tp => !alreadySelected.includes(tp.idParticipante)
    );

    return (
      <Paper key={i} variant="outlined" sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle2">Integrante {i + 1}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ToggleButtonGroup
              value={p.modo} exclusive size="small"
              onChange={(_, v) => v && updateParticipante(i, 'modo', v)}
            >
              <ToggleButton value="existente" title="Seleccionar existente">
                <UserOutlined style={{ fontSize: 13 }} />
                <Typography variant="caption" sx={{ ml: 0.5 }}>Existente</Typography>
              </ToggleButton>
              <ToggleButton value="nuevo" title="Registrar nuevo">
                <UserAddOutlined style={{ fontSize: 13 }} />
                <Typography variant="caption" sx={{ ml: 0.5 }}>Nuevo</Typography>
              </ToggleButton>
            </ToggleButtonGroup>
            {participantes.length > 1 && (
              <IconButton size="small" color="error" onClick={() => removeParticipante(i)}>
                <DeleteOutlined />
              </IconButton>
            )}
          </Box>
        </Box>

        {p.modo === 'existente' ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Autocomplete
              options={disponibles}
              getOptionLabel={(option) => `${option.nombre} ${option.apellido} (CI: ${option.ci} - Cód: ${option.codigoEspecifico})`}
              value={disponibles.find(x => x.idParticipante === p.idParticipante) || null}
              onChange={(_, newValue) => updateParticipante(i, 'idParticipante', newValue ? newValue.idParticipante : '')}
              renderInput={(params) => <TextField {...params} label="Buscar Participante" size="small" required />}
              renderOption={(props, option) => (
                <li {...props} key={option.idParticipante}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 13 }}>
                      {option.nombre?.[0]}{option.apellido?.[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {option.nombre} {option.apellido}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        CI: {option.ci} · Cód: {option.codigoEspecifico}
                      </Typography>
                    </Box>
                  </Box>
                </li>
              )}
            />

            {/* Tarjeta de info del participante seleccionado */}
            {p.idParticipante && (() => {
              const sel = disponibles.find(x => x.idParticipante === p.idParticipante);
              const oec = ofertas.find(o => o.id === selectedOec);
              if (!sel) return null;
              return (
                <Box sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                  {/* Header */}
                  <Box sx={{ px: 2, py: 1.2, bgcolor: 'action.hover', borderLeft: '3px solid', borderLeftColor: 'primary.main', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontWeight: 700, fontSize: 14 }}>
                      {sel.nombre?.[0]}{sel.apellido?.[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={700} color="text.primary">
                        {sel.nombre} {sel.apellido}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Participante registrado
                      </Typography>
                    </Box>
                  </Box>

                  {/* Datos personales */}
                  <Box sx={{ px: 2, py: 1.5, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1.5, bgcolor: 'action.hover' }}>
                    <InfoField label="Código / Registro" value={sel.codigoEspecifico} />
                    <InfoField label="C.I." value={sel.ci} />
                    <InfoField label="Nro. Celular" value={sel.celular || '—'} />
                  </Box>

                  {oec && (
                    <>
                      <Divider />
                      {/* Datos académicos del OEC seleccionado */}
                      <Box sx={{ px: 2, py: 1.5, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                        <InfoField label="Facultad" value={oec.eaCarrera?.entidadAcademica?.nombre} />
                        <InfoField
                          label="Carrera / Plan"
                          value={oec.eaCarrera?.carrera?.nombre
                            ? `${oec.eaCarrera.carrera.nombre}${oec.eaCarrera.carrera.plan ? ` · Plan ${oec.eaCarrera.carrera.plan}` : ''}`
                            : undefined}
                        />
                      </Box>
                    </>
                  )}
                </Box>
              );
            })()}
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField label="Nombre" value={p.nombre} required size="small"
              onChange={e => updateParticipante(i, 'nombre', e.target.value)} />
            <TextField label="Apellido" value={p.apellido} required size="small"
              onChange={e => updateParticipante(i, 'apellido', e.target.value)} />
            <TextField label="CI" value={p.ci} required size="small"
              error={!!p.ci && isCiRegistradoParticipante(p.ci.trim())}
              helperText={p.ci && isCiRegistradoParticipante(p.ci.trim()) ? "Este CI ya está registrado. Búscalo en 'Existente'." : ""}
              onChange={e => updateParticipante(i, 'ci', e.target.value)} />
            <FormControl size="small" required>
              <InputLabel>Expedición</InputLabel>
              <Select value={p.expedicion} label="Expedición"
                onChange={e => updateParticipante(i, 'expedicion', e.target.value)}>
                {EXPEDICION_OPTS.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Celular" value={p.celular} required size="small"
              onChange={e => updateParticipante(i, 'celular', e.target.value)} />
            <TextField label="Código Específico" value={p.codigoEspecifico} required size="small"
              error={!!p.codigoEspecifico && isCodRegistradoParticipante(p.codigoEspecifico.trim())}
              helperText={p.codigoEspecifico && isCodRegistradoParticipante(p.codigoEspecifico.trim()) ? "Este código ya está registrado." : ""}
              onChange={e => updateParticipante(i, 'codigoEspecifico', e.target.value)} />
            <Box sx={{ gridColumn: '1 / -1' }}>
              <TextField label="Correo Electrónico" value={p.email} required size="small"
                type="email" fullWidth
                helperText="CI = usuario y contraseña inicial de acceso al sistema."
                onChange={e => updateParticipante(i, 'email', e.target.value)} />
            </Box>
            <Box sx={{ gridColumn: '1 / -1' }}>
              <FormControlLabel
                control={<Switch checked={p.esExterno}
                  onChange={e => updateParticipante(i, 'esExterno', e.target.checked)} />}
                label="Participante externo (otra institución)"
              />
            </Box>
            {p.esExterno && (
              <>
                <TextField label="Institución" value={p.institucion} size="small"
                  onChange={e => updateParticipante(i, 'institucion', e.target.value)} />
                <TextField label="Dirección" value={p.direccion} size="small"
                  onChange={e => updateParticipante(i, 'direccion', e.target.value)} />
              </>
            )}
          </Box>
        )}
      </Paper>
    );
  };

  const renderStep2 = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
          {eventoLimits.maxParticipantes > 0 && (
            <Typography variant="caption" color={participanteLimitReached ? 'error' : 'text.secondary'}>
              {participantes.length} / {eventoLimits.maxParticipantes} participantes
            </Typography>
          )}
          <Button startIcon={<PlusOutlined />} variant="outlined" size="small"
            onClick={addParticipante} disabled={participanteLimitReached}>
            Agregar
          </Button>
        </Box>
      </Box>
      {loading ? <CircularProgress size={24} /> : participantes.map((p, i) => renderParticipanteCard(p, i))}
    </Box>
  );

  // ── Step 3: Tutores ───────────────────────────────────────────────────────
  const renderTutorCard = (t, i) => {
    const alreadySelected = tutores
      .filter((_, idx) => idx !== i)
      .map(x => x.idTutor)
      .filter(Boolean);

    const disponibles = todosTutores.filter(
      tt => !alreadySelected.includes(tt.idTutor)
    );

    return (
      <Paper key={i} variant="outlined" sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle2">Tutor {i + 1}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ToggleButtonGroup
              value={t.modo} exclusive size="small"
              onChange={(_, v) => v && updateTutor(i, 'modo', v)}
            >
              <ToggleButton value="existente" title="Seleccionar existente">
                <UserOutlined style={{ fontSize: 13 }} />
                <Typography variant="caption" sx={{ ml: 0.5 }}>Existente</Typography>
              </ToggleButton>
              <ToggleButton value="nuevo" title="Registrar nuevo">
                <UserAddOutlined style={{ fontSize: 13 }} />
                <Typography variant="caption" sx={{ ml: 0.5 }}>Nuevo</Typography>
              </ToggleButton>
            </ToggleButtonGroup>
            {tutores.length > 1 && (
              <IconButton size="small" color="error" onClick={() => removeTutor(i)}>
                <DeleteOutlined />
              </IconButton>
            )}
          </Box>
        </Box>

        {t.modo === 'existente' ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Autocomplete
              options={disponibles}
              getOptionLabel={(option) => `${option.nombre} ${option.apellido} (CI: ${option.ci} - Cód: ${option.codEmpleado})`}
              value={disponibles.find(x => x.idTutor === t.idTutor) || null}
              onChange={(_, newValue) => updateTutor(i, 'idTutor', newValue ? newValue.idTutor : '')}
              renderInput={(params) => <TextField {...params} label="Buscar Tutor" size="small" required />}
              renderOption={(props, option) => (
                <li {...props} key={option.idTutor}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main', fontSize: 13 }}>
                      {option.nombre?.[0]}{option.apellido?.[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {option.nombre} {option.apellido}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        CI: {option.ci} · Cód: {option.codEmpleado}
                      </Typography>
                    </Box>
                  </Box>
                </li>
              )}
            />

            {/* Tarjeta de info del tutor seleccionado */}
            {t.idTutor && (() => {
              const sel = disponibles.find(x => x.idTutor === t.idTutor);
              if (!sel) return null;
              return (
                <Box sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                  <Box sx={{ px: 2, py: 1.2, bgcolor: 'action.hover', borderLeft: '3px solid', borderLeftColor: 'secondary.main', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: 'secondary.main', width: 36, height: 36, fontWeight: 700, fontSize: 14 }}>
                      {sel.nombre?.[0]}{sel.apellido?.[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={700} color="text.primary">
                        {sel.nombre} {sel.apellido}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Tutor registrado
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ px: 2, py: 1.5, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1.5, bgcolor: 'action.hover' }}>
                    <InfoField label="Cód. Empleado" value={sel.codEmpleado} />
                    <InfoField label="C.I." value={sel.ci} />
                    <InfoField label="Nro. Celular" value={sel.celular || '—'} />
                  </Box>
                </Box>
              );
            })()}
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField label="Nombre" value={t.nombre} required size="small"
              onChange={e => updateTutor(i, 'nombre', e.target.value)} />
            <TextField label="Apellido" value={t.apellido} required size="small"
              onChange={e => updateTutor(i, 'apellido', e.target.value)} />
            <TextField label="CI" value={t.ci} required size="small"
              error={!!t.ci && isCiRegistradoTutor(t.ci.trim())}
              helperText={t.ci && isCiRegistradoTutor(t.ci.trim()) ? "Este CI ya está registrado. Búscalo en 'Existente'." : ""}
              onChange={e => updateTutor(i, 'ci', e.target.value)} />
            <FormControl size="small" required>
              <InputLabel>Expedición</InputLabel>
              <Select value={t.expedicion} label="Expedición"
                onChange={e => updateTutor(i, 'expedicion', e.target.value)}>
                {EXPEDICION_OPTS.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Código de Empleado" value={t.codEmpleado} required size="small"
              error={!!t.codEmpleado && isCodRegistradoTutor(t.codEmpleado.trim())}
              helperText={t.codEmpleado && isCodRegistradoTutor(t.codEmpleado.trim()) ? "Este código ya está registrado." : ""}
              onChange={e => updateTutor(i, 'codEmpleado', e.target.value)} />
            <TextField label="Celular" value={t.celular} required size="small"
              onChange={e => updateTutor(i, 'celular', e.target.value)} />
            <Box sx={{ gridColumn: '1 / -1' }}>
              <TextField label="Dirección" value={t.direccion} required size="small" fullWidth
                onChange={e => updateTutor(i, 'direccion', e.target.value)} />
            </Box>
            <Box sx={{ gridColumn: '1 / -1' }}>
              <TextField label="Correo Electrónico" value={t.email} required size="small"
                type="email" fullWidth
                helperText="CI = usuario y contraseña inicial de acceso al sistema."
                onChange={e => updateTutor(i, 'email', e.target.value)} />
            </Box>
          </Box>
        )}
      </Paper>
    );
  };

  const renderStep3 = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
          {eventoLimits.maxTutores > 0 && (
            <Typography variant="caption" color={tutorLimitReached ? 'error' : 'text.secondary'}>
              {tutores.length} / {eventoLimits.maxTutores} tutores
            </Typography>
          )}
          <Button startIcon={<PlusOutlined />} variant="outlined" size="small"
            onClick={addTutor} disabled={tutorLimitReached}>
            Agregar
          </Button>
        </Box>
      </Box>
      {loading ? <CircularProgress size={24} /> : tutores.map((t, i) => renderTutorCard(t, i))}
    </Box>
  );

  const stepContent = [renderStep0, renderStep1, renderStep2, renderStep3];

  // ── Success screen ────────────────────────────────────────────────────────
  if (done) return (
    <MainCard title="Inscripción de Proyectos">
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <CheckCircleOutlined style={{ fontSize: 72, color: '#52c41a' }} />
        <Typography variant="h5" sx={{ mt: 2, mb: 1 }}>¡Proyecto inscrito exitosamente!</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          El proyecto <strong>"{titulo}"</strong> fue registrado con estado{' '}
          <Chip label="En Revisión" color="warning" size="small" />{' '}
          y está en espera de revisión por el comité.
        </Typography>
        <Button variant="contained" onClick={handleReset}>Inscribir otro proyecto</Button>
      </Box>
    </MainCard>
  );

  return (
    <MainCard title="Inscripción de Proyectos">
      {/* Banner: período de inscripción cerrado */}
      {selectedOec && inscripcionActiva === false && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <strong>Período de inscripción cerrado.</strong> La fecha límite para inscribir proyectos en esta
          oferta académica ya venció o aún no ha comenzado. No es posible continuar con el registro.
        </Alert>
      )}

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {WIZARD_STEPS.map((label, idx) => (
          <Step key={label} completed={activeStep > idx}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ minHeight: 280, pb: 2 }}>
        {stepContent[activeStep]?.()}
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        {activeStep > 0 && (
          <Button onClick={() => setActiveStep(s => s - 1)} color="inherit" disabled={saving}>
            Anterior
          </Button>
        )}
        {activeStep < WIZARD_STEPS.length - 1 ? (
          <Button variant="contained" disabled={!stepValid()} onClick={() => setActiveStep(s => s + 1)}>
            Siguiente
          </Button>
        ) : (
          <Button
            variant="contained" color="success"
            disabled={!stepValid() || saving}
            onClick={() => setOpenConfirm(true)}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <ProjectOutlined />}
          >
            {saving ? 'Inscribiendo...' : 'Inscribir Proyecto'}
          </Button>
        )}
      </Box>

      {/* ── Confirm Dialog ── */}
      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.18)' } }}>
        <DialogTitle sx={{ 
          bgcolor: 'primary.lighter', 
          display: 'flex', alignItems: 'center', gap: 1.5,
          borderBottom: '1px solid', borderColor: 'divider', pb: 2, pt: 2.5
        }}>
          <Box sx={{ 
            width: 40, height: 40, borderRadius: 2, bgcolor: 'primary.main', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' 
          }}>
            <ProjectOutlined style={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700}>Confirmar Inscripción</Typography>
            <Typography variant="caption" color="text.secondary">Verifica que todos los datos sean correctos</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: 3, bgcolor: 'background.default' }}>
          {(() => {
            const oec = ofertas.find(o => o.id === selectedOec);
            const oferta  = oec?.oferta;
            const ev      = oferta?.categoriaEvento?.evento;
            const catNom  = oferta?.categoriaEvento?.categoria?.nombre;
            const modNom  = oferta?.modalidadArea?.modalidad?.nombre;
            const areaNom = oferta?.modalidadArea?.area?.nombre;
            const facNom  = oec?.eaCarrera?.entidadAcademica?.nombre;
            const carr    = oec?.eaCarrera?.carrera;
            const cardSx  = { p: 0, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', overflow: 'hidden' };
            const sectionHeaderSx = { px: 2, py: 1.2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' };

            return (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>

                {/* ── Tarjeta: Oferta + Proyecto ── */}
                <Paper variant="outlined" sx={cardSx}>
                  <Box sx={sectionHeaderSx}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircleOutlined style={{ color: '#1890ff', fontSize: 16 }} />
                      <Typography variant="subtitle2" fontWeight={700}>Oferta Académica y Proyecto</Typography>
                    </Box>
                  </Box>

                  {/* Evento */}
                  <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.8, fontSize: '0.62rem' }}>
                      Evento
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {ev ? `${ev.nombre} v${ev.version}` : '—'}
                    </Typography>
                  </Box>

                  {/* Grid: Categoría / Modalidad / Área */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid', borderColor: 'divider' }}>
                    {[
                      { label: 'Categoría',  value: catNom },
                      { label: 'Modalidad',  value: modNom },
                      { label: 'Área',       value: areaNom },
                    ].map(({ label, value }, idx) => (
                      <Box key={label} sx={{ px: 2, py: 1.5, borderLeft: idx > 0 ? '1px solid' : 'none', borderColor: 'divider' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.8, fontSize: '0.62rem' }}>
                          {label}
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>{value || '—'}</Typography>
                      </Box>
                    ))}
                  </Box>

                  {/* Grid: Facultad / Carrera */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ px: 2, py: 1.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.8, fontSize: '0.62rem' }}>Facultad</Typography>
                      <Typography variant="body2" fontWeight={500}>{facNom || '—'}</Typography>
                    </Box>
                    <Box sx={{ px: 2, py: 1.5, borderLeft: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.8, fontSize: '0.62rem' }}>Carrera / Plan</Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {carr ? `${carr.nombre}${carr.plan ? ` · Plan ${carr.plan}` : ''}` : '—'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Oferta nombre + Título + Archivo */}
                  <Box sx={{ px: 2, py: 1.5, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.8, fontSize: '0.62rem' }}>Evento</Typography>
                      <Typography variant="body2" fontWeight={600}>{ev ? `${ev.nombre} v${ev.version}` : '—'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.8, fontSize: '0.62rem' }}>Título del Proyecto</Typography>
                      <Typography variant="body2" fontWeight={600}>{titulo || 'Sin título'}</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FileTextOutlined style={{ color: archivoFile ? '#52c41a' : '#bfbfbf', fontSize: 16 }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.8, fontSize: '0.62rem' }}>Archivo Adjunto</Typography>
                      <Typography variant="body2" color={archivoFile ? 'text.primary' : 'text.disabled'}>
                        {archivoFile ? archivoFile.name : 'No se adjuntó ningún archivo'}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>

                {/* ── Tarjeta: Integrantes ── */}
                <Paper variant="outlined" sx={cardSx}>
                  <Box sx={sectionHeaderSx}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <UserOutlined style={{ color: '#1890ff', fontSize: 16 }} />
                      <Typography variant="subtitle2" fontWeight={700}>Integrantes</Typography>
                    </Box>
                    <Chip label={`${participantes.length} registrado(s)`} size="small" color="primary" variant="outlined" />
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    {participantes.map((p, i) => {
                      let fp = null;
                      let nombre = '', ci = '', cod = '', celular = '';
                      if (p.modo === 'existente') {
                        fp = todosParticipantes.find(tp => tp.idParticipante === p.idParticipante);
                        nombre  = fp ? `${fp.nombre} ${fp.apellido}` : 'Desconocido';
                        ci      = fp?.ci || '-';
                        cod     = fp?.codigoEspecifico || '-';
                        celular = fp?.celular || '-';
                      } else {
                        nombre  = `${p.nombre} ${p.apellido}`;
                        ci      = p.ci;
                        cod     = p.codigoEspecifico;
                        celular = p.celular;
                      }
                      return (
                        <Box key={i} sx={{ px: 2, py: 1.2, display: 'flex', alignItems: 'center', gap: 1.5, borderTop: i > 0 ? '1px solid' : 'none', borderColor: 'divider' }}>
                          <Avatar sx={{ width: 30, height: 30, bgcolor: 'primary.lighter', color: 'primary.main', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                            {i + 1}
                          </Avatar>
                          <Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 1 }}>
                            <Box>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase' }}>Nombre</Typography>
                              <Typography variant="body2" fontWeight={600} noWrap>{nombre}</Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase' }}>C.I.</Typography>
                              <Typography variant="body2">{ci}</Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase' }}>Código</Typography>
                              <Typography variant="body2">{cod}</Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase' }}>Celular</Typography>
                              <Typography variant="body2">{celular}</Typography>
                            </Box>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Paper>

                {/* ── Tarjeta: Tutores ── */}
                <Paper variant="outlined" sx={cardSx}>
                  <Box sx={sectionHeaderSx}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <UserAddOutlined style={{ color: '#52c41a', fontSize: 16 }} />
                      <Typography variant="subtitle2" fontWeight={700}>Tutores</Typography>
                    </Box>
                    <Chip label={`${tutores.length} asignado(s)`} size="small" color="success" variant="outlined" />
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    {tutores.map((t, i) => {
                      let ft = null;
                      let nombre = '', ci = '', cod = '', celular = '';
                      if (t.modo === 'existente') {
                        ft = todosTutores.find(tt => tt.idTutor === t.idTutor);
                        nombre  = ft ? `${ft.nombre} ${ft.apellido}` : 'Desconocido';
                        ci      = ft?.ci || '-';
                        cod     = ft?.codEmpleado || '-';
                        celular = ft?.celular || '-';
                      } else {
                        nombre  = `${t.nombre} ${t.apellido}`;
                        ci      = t.ci;
                        cod     = t.codEmpleado;
                        celular = t.celular;
                      }
                      return (
                        <Box key={i} sx={{ px: 2, py: 1.2, display: 'flex', alignItems: 'center', gap: 1.5, borderTop: i > 0 ? '1px solid' : 'none', borderColor: 'divider' }}>
                          <Avatar sx={{ width: 30, height: 30, bgcolor: 'success.lighter', color: 'success.main', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                            {i + 1}
                          </Avatar>
                          <Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 1 }}>
                            <Box>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase' }}>Nombre</Typography>
                              <Typography variant="body2" fontWeight={600} noWrap>{nombre}</Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase' }}>C.I.</Typography>
                              <Typography variant="body2">{ci}</Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase' }}>Cód. Empleado</Typography>
                              <Typography variant="body2">{cod}</Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase' }}>Celular</Typography>
                              <Typography variant="body2">{celular}</Typography>
                            </Box>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Paper>

              </Box>
            );
          })()}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenConfirm(false)} color="inherit" disabled={saving}>
            Revisar de nuevo
          </Button>
          <Button 
            variant="contained" 
            color="success" 
            onClick={() => { setOpenConfirm(false); handleSubmit(); }}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <ProjectOutlined />}
          >
            {saving ? 'Inscribiendo...' : 'Sí, confirmar e inscribir'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={notification.open} autoHideDuration={6000}
        onClose={() => setNotification(p => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={notification.severity} variant="filled">{notification.message}</Alert>
      </Snackbar>
    </MainCard>
  );
}
