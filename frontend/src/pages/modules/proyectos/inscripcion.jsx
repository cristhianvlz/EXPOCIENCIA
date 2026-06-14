import { useState, useRef } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
  Box, Button, Stepper, Step, StepLabel, Typography, CircularProgress,
  Alert, FormControl, InputLabel, Select, MenuItem, TextField, Chip,
  Divider, IconButton, Paper, Snackbar, FormControlLabel, Switch,
  ToggleButton, ToggleButtonGroup, Dialog, DialogTitle, DialogContent,
  DialogActions, List, ListItem, ListItemText, ListItemIcon, Autocomplete, Avatar
} from '@mui/material';
import {
  PlusOutlined, DeleteOutlined, CheckCircleOutlined, ProjectOutlined,
  CloudUploadOutlined, FileTextOutlined, UserAddOutlined, UserOutlined
} from '@ant-design/icons';
import MainCard from 'components/MainCard';

// ── GQL ──────────────────────────────────────────────────────────────────────
const GET_DATA = gql`
  query {
    todosLosOfertaEaCarreras {
      id carrera plan estado
      oferta {
        idOferta nombre
        categoriaEvento { evento { idEvento } }
      }
      entidadAcademica { idEntidadAcademica nombre }
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

  // ── Participante helpers ──────────────────────────────────────────────────
  const addParticipante    = () => setParticipantes(p => [...p, { ...EMPTY_PARTICIPANTE }]);
  const removeParticipante = (i) => setParticipantes(p => p.filter((_, idx) => idx !== i));
  const updateParticipante = (i, field, value) =>
    setParticipantes(p => p.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  // ── Tutor helpers ─────────────────────────────────────────────────────────
  const addTutor    = () => setTutores(t => [...t, { ...EMPTY_TUTOR }]);
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
    setTitulo('');
    setResumen('');
    setArchivoFile(null);
    setParticipantes([{ ...EMPTY_PARTICIPANTE }]);
    setTutores([{ ...EMPTY_TUTOR }]);
    setDone(false);
  };

  // ── Step 0: Oferta ────────────────────────────────────────────────────────
  const renderStep0 = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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
        <FormControl fullWidth required>
          <InputLabel>Oferta Académica</InputLabel>
          <Select value={selectedOec} label="Oferta Académica" onChange={e => setSelectedOec(e.target.value)}>
            {ofertas.map(oec => (
              <MenuItem key={oec.id} value={oec.id}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>{oec.oferta?.nombre}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {oec.entidadAcademica?.nombre} · {oec.carrera} · Plan: {oec.plan}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
      {selectedOec && (() => {
        const oec = ofertas.find(o => o.id === selectedOec);
        return oec ? (
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
              Oferta seleccionada
            </Typography>
            <Typography variant="subtitle1" sx={{ mt: 0.5 }}>{oec.oferta?.nombre}</Typography>
            <Typography variant="body2" color="text.secondary">
              {oec.entidadAcademica?.nombre} · {oec.carrera} · Plan {oec.plan}
            </Typography>
          </Paper>
        ) : null;
      })()}
    </Box>
  );

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
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      {option.nombre} {option.apellido}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      CI: {option.ci} · Cód: {option.codigoEspecifico}
                    </Typography>
                  </Box>
                </li>
              )}
            />
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
        <Typography variant="body2" color="text.secondary">
          Selecciona integrantes ya registrados o ingresa nuevos. Para nuevos, el CI será su usuario y contraseña inicial.
        </Typography>
        <Button startIcon={<PlusOutlined />} variant="outlined" size="small" onClick={addParticipante}>
          Agregar
        </Button>
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
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      {option.nombre} {option.apellido}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      CI: {option.ci} · Cód: {option.codEmpleado}
                    </Typography>
                  </Box>
                </li>
              )}
            />
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
        <Typography variant="body2" color="text.secondary">
          Selecciona un tutor ya registrado o ingresa uno nuevo. Para nuevos, el CI será su usuario y contraseña inicial.
        </Typography>
        <Button startIcon={<PlusOutlined />} variant="outlined" size="small" onClick={addTutor}>
          Agregar
        </Button>
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CheckCircleOutlined style={{ color: '#1890ff', fontSize: 18 }} />
                <Typography variant="subtitle2" fontWeight={700}>Oferta Académica y Proyecto</Typography>
              </Box>
              <Divider sx={{ mb: 1.5 }} />
              
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>Oferta Académica</Typography>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 1.5 }}>
                {ofertas.find(o => o.id === selectedOec)?.oferta?.nombre || '-'}
              </Typography>

              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>Título del Proyecto</Typography>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 1.5 }}>{titulo || 'Sin título'}</Typography>
              
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>Archivo Adjunto</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <FileTextOutlined style={{ color: archivoFile ? '#52c41a' : '#bfbfbf' }} />
                <Typography variant="body2" color={archivoFile ? 'text.primary' : 'text.disabled'}>
                  {archivoFile ? archivoFile.name : 'No se adjuntó ningún archivo'}
                </Typography>
              </Box>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <UserOutlined style={{ color: '#1890ff', fontSize: 18 }} />
                  <Typography variant="subtitle2" fontWeight={700}>Integrantes</Typography>
                </Box>
                <Chip label={`${participantes.length} registrado(s)`} size="small" color="primary" variant="outlined" />
              </Box>
              <Divider sx={{ mb: 1.5 }} />
              <List dense disablePadding>
                {participantes.map((p, i) => {
                  let nombreF = '';
                  let ciF = '';
                  if (p.modo === 'existente') {
                    const fp = todosParticipantes.find(tp => tp.idParticipante === p.idParticipante);
                    nombreF = fp ? `${fp.nombre} ${fp.apellido}` : 'Desconocido';
                    ciF = fp ? fp.ci : '-';
                  } else {
                    nombreF = `${p.nombre} ${p.apellido}`;
                    ciF = p.ci;
                  }
                  return (
                    <ListItem key={i} disableGutters sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.lighter', color: 'primary.main', fontSize: 13, fontWeight: 600 }}>
                          {i + 1}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText 
                        primary={<Typography variant="body2" fontWeight={600}>{nombreF || 'Sin nombre'}</Typography>}
                        secondary={<Typography variant="caption" color="text.secondary">CI: {ciF || '-'}</Typography>}
                      />
                    </ListItem>
                  );
                })}
              </List>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <UserAddOutlined style={{ color: '#52c41a', fontSize: 18 }} />
                  <Typography variant="subtitle2" fontWeight={700}>Tutores</Typography>
                </Box>
                <Chip label={`${tutores.length} asignado(s)`} size="small" color="success" variant="outlined" />
              </Box>
              <Divider sx={{ mb: 1.5 }} />
              <List dense disablePadding>
                {tutores.map((t, i) => {
                  let nombreF = '';
                  let ciF = '';
                  if (t.modo === 'existente') {
                    const ft = todosTutores.find(tt => tt.idTutor === t.idTutor);
                    nombreF = ft ? `${ft.nombre} ${ft.apellido}` : 'Desconocido';
                    ciF = ft ? ft.ci : '-';
                  } else {
                    nombreF = `${t.nombre} ${t.apellido}`;
                    ciF = t.ci;
                  }
                  return (
                    <ListItem key={i} disableGutters sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: 'success.lighter', color: 'success.main', fontSize: 13, fontWeight: 600 }}>
                          {i + 1}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText 
                        primary={<Typography variant="body2" fontWeight={600}>{nombreF || 'Sin nombre'}</Typography>}
                        secondary={<Typography variant="caption" color="text.secondary">CI: {ciF || '-'}</Typography>}
                      />
                    </ListItem>
                  );
                })}
              </List>
            </Paper>

          </Box>
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
