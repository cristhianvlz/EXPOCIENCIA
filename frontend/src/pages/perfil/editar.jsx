import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
  Box, Typography, Grid, Chip, Divider, Stack, CircularProgress,
  Button, Avatar, Paper, TextField, Alert, InputAdornment, IconButton,
  Stepper, Step, StepLabel, Switch, FormControlLabel
} from '@mui/material';
import MainCard from 'components/MainCard';
import {
  UserOutlined, MailOutlined, SafetyOutlined, IdcardOutlined,
  PhoneOutlined, HomeOutlined, TeamOutlined, ArrowLeftOutlined,
  LockOutlined, EyeOutlined, EyeInvisibleOutlined, QrcodeOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';

// ── GraphQL ──────────────────────────────────────────────────────────
const ME_QUERY = gql`
  query MeEditar {
    me {
      idUsuario
      username
      email
      is2faEnabled
      rol { nombre }
      participante { nombre apellido ci expedicion celular codigoEspecifico }
      tutor { nombre apellido ci expedicion celular codEmpleado direccion }
      tribunal { nombre apellido ci expedicion celular especialidad direccion }
      personal { nombre apellido ci expedicion celular cargo direccion }
    }
  }
`;

const CAMBIAR_PASSWORD = gql`
  mutation CambiarPasswordPropio($passwordActual: String!, $passwordNuevo: String!) {
    cambiarPasswordPropio(passwordActual: $passwordActual, passwordNuevo: $passwordNuevo) {
      ok
      error
    }
  }
`;

const GENERAR_QR = gql`
  mutation GenerarQr2faEditar($idUsuario: ID!) {
    generarQr2fa(idUsuario: $idUsuario) {
      qrBase64
      secret
      ok
      error
    }
  }
`;

const CONFIRMAR_2FA = gql`
  mutation ConfirmarActivacion2faEditar($idUsuario: ID!, $totpCode: String!) {
    confirmarActivacion2fa(idUsuario: $idUsuario, totpCode: $totpCode) {
      ok
      error
    }
  }
`;

const DESACTIVAR_2FA = gql`
  mutation Desactivar2faEditar($idUsuario: ID!, $totpCode: String!) {
    desactivar2fa(idUsuario: $idUsuario, totpCode: $totpCode) {
      ok
      error
    }
  }
`;

// ── Helpers ────────────────────────────────────────────────────────
const EXPEDICION_LABELS = {
  LP: 'La Paz', CB: 'Cochabamba', SC: 'Santa Cruz', OR: 'Oruro',
  PT: 'Potosí', CH: 'Chuquisaca', TJ: 'Tarija', BN: 'Beni', PD: 'Pando'
};
const CARGO_LABELS = {
  SECRETARIA: 'Secretaria', DECANO: 'Decano', VICEDECANO: 'Vicedecano',
  RECTOR: 'Rector', VICERECTOR: 'Vicerector'
};

function getNombreCompleto(me) {
  if (!me) return 'Usuario';
  const p = me.participante || me.tutor || me.tribunal || me.personal;
  if (p) return `${p.nombre} ${p.apellido}`;
  return me.username;
}
function getPerfilData(me) {
  if (me?.participante) return { tipo: 'Participante', data: me.participante };
  if (me?.tutor) return { tipo: 'Tutor', data: me.tutor };
  if (me?.tribunal) return { tipo: 'Tribunal', data: me.tribunal };
  if (me?.personal) return { tipo: 'Personal', data: me.personal };
  return null;
}

function InfoField({ label, value }) {
  if (!value) return null;
  return (
    <TextField
      label={label}
      value={value}
      fullWidth
      size="small"
      InputProps={{ readOnly: true }}
      sx={{ '& .MuiInputBase-input': { color: 'text.secondary' } }}
    />
  );
}

// ── Panel: Cambio de Contraseña ──────────────────────────────────
function PanelPassword({ idUsuario }) {
  const [cambiarPassword] = useMutation(CAMBIAR_PASSWORD);
  const [form, setForm] = useState({ actual: '', nuevo: '', confirmar: '' });
  const [show, setShow] = useState({ actual: false, nuevo: false, confirmar: false });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const toggleShow = (field) => setShow(prev => ({ ...prev, [field]: !prev[field] }));
  const handleChange = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async () => {
    setMsg(null);
    if (!form.actual || !form.nuevo || !form.confirmar) {
      setMsg({ type: 'error', text: 'Completa todos los campos.' });
      return;
    }
    if (form.nuevo !== form.confirmar) {
      setMsg({ type: 'error', text: 'Las contraseñas nuevas no coinciden.' });
      return;
    }
    if (form.nuevo.length < 6) {
      setMsg({ type: 'error', text: 'La nueva contraseña debe tener al menos 6 caracteres.' });
      return;
    }
    setLoading(true);
    try {
      const { data } = await cambiarPassword({
        variables: { passwordActual: form.actual, passwordNuevo: form.nuevo }
      });
      if (data?.cambiarPasswordPropio?.ok) {
        setMsg({ type: 'success', text: 'Contraseña actualizada correctamente.' });
        setForm({ actual: '', nuevo: '', confirmar: '' });
      } else {
        setMsg({ type: 'error', text: data?.cambiarPasswordPropio?.error || 'Error al cambiar la contraseña.' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Error de conexión.' });
    }
    setLoading(false);
  };

  return (
    <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 2 }}>
      <Stack direction="row" alignItems="center" gap={1} mb={1.5}>
        <LockOutlined style={{ color: '#6366f1', fontSize: 18 }} />
        <Typography variant="subtitle1" fontWeight={700}>Cambiar Contraseña</Typography>
      </Stack>
      <Divider sx={{ mb: 2 }} />

      {msg && <Alert severity={msg.type} sx={{ mb: 2, borderRadius: 2 }}>{msg.text}</Alert>}

      <Stack gap={2}>
        <TextField
          label="Contraseña actual"
          type={show.actual ? 'text' : 'password'}
          value={form.actual}
          onChange={handleChange('actual')}
          size="small"
          fullWidth
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => toggleShow('actual')}>
                  {show.actual ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        <TextField
          label="Nueva contraseña"
          type={show.nuevo ? 'text' : 'password'}
          value={form.nuevo}
          onChange={handleChange('nuevo')}
          size="small"
          fullWidth
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => toggleShow('nuevo')}>
                  {show.nuevo ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        <TextField
          label="Confirmar nueva contraseña"
          type={show.confirmar ? 'text' : 'password'}
          value={form.confirmar}
          onChange={handleChange('confirmar')}
          size="small"
          fullWidth
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => toggleShow('confirmar')}>
                  {show.confirmar ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <LockOutlined />}
            sx={{ borderRadius: 2, fontWeight: 700, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            {loading ? 'Guardando...' : 'Actualizar Contraseña'}
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}

// ── Panel: Toggle 2FA ─────────────────────────────────────────────
function Panel2FA({ idUsuario, is2faEnabled, onRefetch }) {
  const [generarQr] = useMutation(GENERAR_QR);
  const [confirmarActivacion] = useMutation(CONFIRMAR_2FA);
  const [desactivar2fa] = useMutation(DESACTIVAR_2FA);

  // Estado de activación
  const [qrStep, setQrStep] = useState(0); // 0=inicio, 1=qr mostrado, 2=éxito
  const [qrBase64, setQrBase64] = useState('');
  const [secret, setSecret] = useState('');
  const [activarCode, setActivarCode] = useState('');

  // Estado de desactivación
  const [desactivarCode, setDesactivarCode] = useState('');

  const [loadingAction, setLoadingAction] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleGenerarQr = async () => {
    setLoadingAction(true);
    setMsg(null);
    try {
      const { data } = await generarQr({ variables: { idUsuario } });
      if (data?.generarQr2fa?.ok) {
        setQrBase64(data.generarQr2fa.qrBase64);
        setSecret(data.generarQr2fa.secret);
        setQrStep(1);
      } else {
        setMsg({ type: 'error', text: data?.generarQr2fa?.error || 'Error al generar QR.' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Error de conexión.' });
    }
    setLoadingAction(false);
  };

  const handleConfirmarActivar = async () => {
    if (activarCode.length !== 6) { setMsg({ type: 'error', text: 'Ingresa el código de 6 dígitos.' }); return; }
    setLoadingAction(true);
    setMsg(null);
    try {
      const { data } = await confirmarActivacion({ variables: { idUsuario, totpCode: activarCode } });
      if (data?.confirmarActivacion2fa?.ok) {
        setQrStep(2);
        setMsg({ type: 'success', text: '2FA activado correctamente. Tu cuenta ahora está protegida.' });
        onRefetch();
      } else {
        setMsg({ type: 'error', text: data?.confirmarActivacion2fa?.error || 'Código incorrecto.' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Error de conexión.' });
    }
    setLoadingAction(false);
  };

  const handleDesactivar = async () => {
    if (desactivarCode.length !== 6) { setMsg({ type: 'error', text: 'Ingresa el código de 6 dígitos.' }); return; }
    setLoadingAction(true);
    setMsg(null);
    try {
      const { data } = await desactivar2fa({ variables: { idUsuario, totpCode: desactivarCode } });
      if (data?.desactivar2fa?.ok) {
        setMsg({ type: 'success', text: '2FA desactivado. Tu cuenta ya no requiere verificación en dos pasos.' });
        setDesactivarCode('');
        onRefetch();
      } else {
        setMsg({ type: 'error', text: data?.desactivar2fa?.error || 'Código incorrecto.' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Error de conexión.' });
    }
    setLoadingAction(false);
  };

  return (
    <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: is2faEnabled ? 'success.light' : 'divider', borderRadius: 3, mb: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
        <Stack direction="row" alignItems="center" gap={1}>
          <SafetyOutlined style={{ color: is2faEnabled ? '#52c41a' : '#6366f1', fontSize: 18 }} />
          <Typography variant="subtitle1" fontWeight={700}>Autenticación de Dos Factores (2FA)</Typography>
        </Stack>
        <Chip
          label={is2faEnabled ? '2FA Activo' : '2FA Inactivo'}
          color={is2faEnabled ? 'success' : 'default'}
          size="small"
          icon={is2faEnabled ? <CheckCircleOutlined /> : undefined}
          sx={{ fontWeight: 700 }}
        />
      </Stack>
      <Divider sx={{ mb: 2 }} />

      <Typography variant="body2" color="text.secondary" mb={2}>
        {is2faEnabled
          ? 'Tu cuenta está protegida con verificación en dos pasos. Cada inicio de sesión requerirá un código de tu app autenticadora.'
          : 'Activa el 2FA para añadir una capa extra de seguridad. Necesitarás una app como Google Authenticator o Authy.'}
      </Typography>

      {msg && <Alert severity={msg.type} sx={{ mb: 2, borderRadius: 2 }}>{msg.text}</Alert>}

      {/* ── Activar 2FA ── */}
      {!is2faEnabled && (
        <>
          {qrStep === 0 && (
            <Button
              variant="contained"
              onClick={handleGenerarQr}
              disabled={loadingAction}
              startIcon={loadingAction ? <CircularProgress size={16} color="inherit" /> : <QrcodeOutlined />}
              sx={{ borderRadius: 2, fontWeight: 700, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              Activar 2FA
            </Button>
          )}

          {qrStep === 1 && (
            <Box>
              <Stepper activeStep={1} sx={{ mb: 2 }}>
                <Step><StepLabel>Generar QR</StepLabel></Step>
                <Step><StepLabel>Escanear y confirmar</StepLabel></Step>
                <Step><StepLabel>¡Listo!</StepLabel></Step>
              </Stepper>

              <Typography variant="body2" fontWeight={600} mb={1}>
                1. Escanea este código QR con tu app autenticadora:
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Box
                  component="img"
                  src={`data:image/png;base64,${qrBase64}`}
                  alt="QR 2FA"
                  sx={{ width: 180, height: 180, borderRadius: 2, border: '4px solid', borderColor: 'primary.main', boxShadow: '0 4px 20px rgba(99,102,241,0.3)', bgcolor: '#fff' }}
                />
              </Box>

              <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 2, mb: 2, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                  ¿No puedes escanear? Ingresa este código manual:
                </Typography>
                <Typography variant="body2" fontFamily="monospace" fontWeight={700} letterSpacing={2} color="primary.main">
                  {secret}
                </Typography>
              </Box>

              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" fontWeight={600} mb={1}>
                2. Ingresa el código de 6 dígitos que muestra la app:
              </Typography>
              <Stack direction="row" gap={2} alignItems="flex-start">
                <TextField
                  size="small"
                  placeholder="000000"
                  value={activarCode}
                  onChange={(e) => { setActivarCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setMsg(null); }}
                  inputProps={{ maxLength: 6, style: { textAlign: 'center', letterSpacing: '0.3em', fontSize: '1.2rem', fontWeight: 700 } }}
                  sx={{ width: 160 }}
                />
                <Button
                  variant="contained"
                  onClick={handleConfirmarActivar}
                  disabled={activarCode.length !== 6 || loadingAction}
                  sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', height: 40 }}
                >
                  {loadingAction ? <CircularProgress size={18} color="inherit" /> : 'Confirmar'}
                </Button>
                <Button variant="text" color="inherit" onClick={() => { setQrStep(0); setActivarCode(''); setMsg(null); }}>
                  Cancelar
                </Button>
              </Stack>
            </Box>
          )}

          {qrStep === 2 && (
            <Box sx={{ textAlign: 'center', py: 1 }}>
              <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
              <Typography variant="h6" fontWeight={700} mt={1}>¡2FA activado!</Typography>
            </Box>
          )}
        </>
      )}

      {/* ── Desactivar 2FA ── */}
      {is2faEnabled && (
        <Box>
          <Typography variant="body2" color="text.secondary" mb={1.5}>
            Para desactivar el 2FA, ingresa el código actual de tu app autenticadora:
          </Typography>
          <Stack direction="row" gap={2} alignItems="flex-start">
            <TextField
              size="small"
              placeholder="Código de 6 dígitos"
              value={desactivarCode}
              onChange={(e) => { setDesactivarCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setMsg(null); }}
              inputProps={{ maxLength: 6, style: { textAlign: 'center', letterSpacing: '0.3em', fontSize: '1.1rem', fontWeight: 700 } }}
              sx={{ width: 200 }}
            />
            <Button
              variant="contained"
              color="error"
              onClick={handleDesactivar}
              disabled={desactivarCode.length !== 6 || loadingAction}
              sx={{ borderRadius: 2, height: 40 }}
            >
              {loadingAction ? <CircularProgress size={18} color="inherit" /> : 'Desactivar 2FA'}
            </Button>
          </Stack>
        </Box>
      )}
    </Paper>
  );
}

// ── Página principal ──────────────────────────────────────────────
export default function EditarPerfil() {
  const navigate = useNavigate();
  const { data, loading, refetch } = useQuery(ME_QUERY, { fetchPolicy: 'network-only' });
  const me = data?.me;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const perfil = getPerfilData(me);
  const nombreCompleto = getNombreCompleto(me);
  const rolNombre = me?.rol?.nombre || 'Sin rol';

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      <Button
        startIcon={<ArrowLeftOutlined />}
        onClick={() => navigate(-1)}
        sx={{ mb: 2, color: 'text.secondary' }}
      >
        Volver
      </Button>

      <MainCard title="Editar Perfil">
        {/* Encabezado de identificación */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3, p: 2.5, borderRadius: 3, bgcolor: 'primary.lighter' }}>
          <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: 24, fontWeight: 700 }}>
            {nombreCompleto.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={800}>{nombreCompleto}</Typography>
            <Stack direction="row" gap={1} mt={0.5} flexWrap="wrap">
              <Chip label={rolNombre} color="primary" size="small" />
              {perfil && <Chip label={perfil.tipo} variant="outlined" size="small" />}
            </Stack>
          </Box>
        </Box>

        {/* Información de la cuenta (solo lectura) */}
        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 2 }}>
          <Stack direction="row" alignItems="center" gap={1} mb={1.5}>
            <UserOutlined style={{ color: '#6366f1', fontSize: 18 }} />
            <Typography variant="subtitle1" fontWeight={700}>Información de Cuenta</Typography>
            <Chip label="Solo lectura" size="small" variant="outlined" sx={{ ml: 'auto', fontSize: '0.7rem' }} />
          </Stack>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <InfoField label="Nombre de usuario" value={me?.username} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <InfoField label="Correo electrónico" value={me?.email} />
            </Grid>
            {perfil && (
              <>
                <Grid item xs={12} sm={6}>
                  <InfoField label="Nombre completo" value={`${perfil.data.nombre} ${perfil.data.apellido}`} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoField
                    label="CI / Expedición"
                    value={perfil.data.ci
                      ? `${perfil.data.ci} (${EXPEDICION_LABELS[perfil.data.expedicion] || perfil.data.expedicion})`
                      : null}
                  />
                </Grid>
                {perfil.data.celular && (
                  <Grid item xs={12} sm={6}>
                    <InfoField label="Celular" value={perfil.data.celular} />
                  </Grid>
                )}
                {perfil.data.direccion && (
                  <Grid item xs={12} sm={6}>
                    <InfoField label="Dirección" value={perfil.data.direccion} />
                  </Grid>
                )}
                {perfil.tipo === 'Tutor' && (
                  <Grid item xs={12} sm={6}>
                    <InfoField label="Código de empleado" value={perfil.data.codEmpleado} />
                  </Grid>
                )}
                {perfil.tipo === 'Tribunal' && (
                  <Grid item xs={12} sm={6}>
                    <InfoField label="Especialidad" value={perfil.data.especialidad} />
                  </Grid>
                )}
                {perfil.tipo === 'Personal' && (
                  <Grid item xs={12} sm={6}>
                    <InfoField label="Cargo" value={CARGO_LABELS[perfil.data.cargo] || perfil.data.cargo} />
                  </Grid>
                )}
              </>
            )}
          </Grid>
        </Paper>

        {/* Cambio de contraseña */}
        <PanelPassword idUsuario={me?.idUsuario} />

        {/* Toggle 2FA */}
        {me?.idUsuario && (
          <Panel2FA
            idUsuario={me.idUsuario}
            is2faEnabled={me.is2faEnabled}
            onRefetch={refetch}
          />
        )}
      </MainCard>
    </Box>
  );
}
