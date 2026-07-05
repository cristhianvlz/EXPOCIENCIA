import { forwardRef, useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import {
  Dialog, DialogTitle, DialogContent,
  Box, Typography, Grid, Chip, Stack, Divider, Button, IconButton,
  Slide, Tab, Tabs, TextField, Alert, InputAdornment, CircularProgress,
  Stepper, Step, StepLabel
} from '@mui/material';
import CloseOutlined from '@ant-design/icons/CloseOutlined';
import LockOutlined from '@ant-design/icons/LockOutlined';
import SafetyOutlined from '@ant-design/icons/SafetyOutlined';
import InfoCircleOutlined from '@ant-design/icons/InfoCircleOutlined';
import EyeOutlined from '@ant-design/icons/EyeOutlined';
import EyeInvisibleOutlined from '@ant-design/icons/EyeInvisibleOutlined';
import QrcodeOutlined from '@ant-design/icons/QrcodeOutlined';
import CheckCircleOutlined from '@ant-design/icons/CheckCircleOutlined';

import { getNombreCompleto } from './VerPerfilDialog';

// ── Mutations ─────────────────────────────────────────────────────
const CAMBIAR_PASSWORD = gql`
  mutation CambiarPasswordPropioEditar($passwordActual: String!, $passwordNuevo: String!) {
    cambiarPasswordPropio(passwordActual: $passwordActual, passwordNuevo: $passwordNuevo) {
      ok
      error
    }
  }
`;

const GENERAR_QR = gql`
  mutation GenQr2faEditar($idUsuario: ID!) {
    generarQr2fa(idUsuario: $idUsuario) {
      qrBase64
      secret
      ok
      error
    }
  }
`;

const CONFIRMAR_2FA = gql`
  mutation Confirmar2faEditar($idUsuario: ID!, $totpCode: String!) {
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
const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const EXPEDICION = {
  LP: 'La Paz', CB: 'Cochabamba', SC: 'Santa Cruz', OR: 'Oruro',
  PT: 'Potosí', CH: 'Chuquisaca', TJ: 'Tarija', BN: 'Beni', PD: 'Pando'
};

function getPerfilData(me) {
  if (me?.participante) return { tipo: 'Participante', d: me.participante };
  if (me?.tutor) return { tipo: 'Tutor', d: me.tutor };
  if (me?.tribunal) return { tipo: 'Tribunal', d: me.tribunal };
  if (me?.personal) return { tipo: 'Personal', d: me.personal };
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
      sx={{ '& .MuiInputBase-input': { color: 'text.secondary', cursor: 'default' } }}
    />
  );
}

// ── Tab: Información ─────────────────────────────────────────────
function TabInfo({ me }) {
  const perfil = getPerfilData(me);
  return (
    <Grid container spacing={2} sx={{ pt: 0.5 }}>
      <Grid item xs={12} sm={6}>
        <InfoField label="Nombre de usuario" value={me?.username} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <InfoField label="Correo electrónico" value={me?.email} />
      </Grid>
      {perfil && (
        <>
          <Grid item xs={12} sm={6}>
            <InfoField label="Nombre completo" value={`${perfil.d.nombre} ${perfil.d.apellido}`} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <InfoField
              label="Cédula / Expedición"
              value={perfil.d.ci
                ? `${perfil.d.ci}${EXPEDICION[perfil.d.expedicion] ? ` (${EXPEDICION[perfil.d.expedicion]})` : ''}`
                : null}
            />
          </Grid>
          {perfil.d.celular && (
            <Grid item xs={12} sm={6}>
              <InfoField label="Celular" value={perfil.d.celular} />
            </Grid>
          )}
          {perfil.d.direccion && (
            <Grid item xs={12} sm={6}>
              <InfoField label="Dirección" value={perfil.d.direccion} />
            </Grid>
          )}
          {perfil.tipo === 'Tutor' && perfil.d.codEmpleado && (
            <Grid item xs={12} sm={6}>
              <InfoField label="Código de empleado" value={perfil.d.codEmpleado} />
            </Grid>
          )}
          {perfil.tipo === 'Tribunal' && perfil.d.especialidad && (
            <Grid item xs={12} sm={6}>
              <InfoField label="Especialidad" value={perfil.d.especialidad} />
            </Grid>
          )}
          {perfil.tipo === 'Personal' && perfil.d.cargo && (
            <Grid item xs={12} sm={6}>
              <InfoField label="Cargo" value={perfil.d.cargo?.nombre} />
            </Grid>
          )}
          {perfil.tipo === 'Participante' && perfil.d.codigoEspecifico && (
            <Grid item xs={12} sm={6}>
              <InfoField label="Código de participante" value={perfil.d.codigoEspecifico} />
            </Grid>
          )}
        </>
      )}
      <Grid item xs={12}>
        <Box sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
          <Typography variant="caption" color="text.disabled">
            La información de tu perfil solo puede ser modificada por un administrador del sistema.
          </Typography>
        </Box>
      </Grid>
    </Grid>
  );
}

// ── Tab: Contraseña ──────────────────────────────────────────────
function TabContrasena() {
  const [cambiarPassword] = useMutation(CAMBIAR_PASSWORD);
  const [form, setForm] = useState({ actual: '', nuevo: '', confirmar: '' });
  const [show, setShow] = useState({ actual: false, nuevo: false, confirmar: false });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const toggleShow = (f) => setShow(p => ({ ...p, [f]: !p[f] }));
  const handleChange = (f) => (e) => { setForm(p => ({ ...p, [f]: e.target.value })); setMsg(null); };

  const handleSubmit = async () => {
    if (!form.actual || !form.nuevo || !form.confirmar) {
      setMsg({ type: 'warning', text: 'Completa todos los campos.' }); return;
    }
    if (form.nuevo !== form.confirmar) {
      setMsg({ type: 'error', text: 'Las contraseñas nuevas no coinciden.' }); return;
    }
    if (form.nuevo.length < 6) {
      setMsg({ type: 'warning', text: 'La nueva contraseña debe tener al menos 6 caracteres.' }); return;
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
        setMsg({ type: 'error', text: data?.cambiarPasswordPropio?.error || 'Error al actualizar.' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Error de conexión.' });
    }
    setLoading(false);
  };

  const pwField = (id, label, field) => (
    <TextField
      key={id}
      label={label}
      type={show[field] ? 'text' : 'password'}
      value={form[field]}
      onChange={handleChange(field)}
      size="small"
      fullWidth
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton size="small" onClick={() => toggleShow(field)} edge="end" sx={{ color: 'text.disabled' }}>
              {show[field] ? <EyeOutlined style={{ fontSize: 15 }} /> : <EyeInvisibleOutlined style={{ fontSize: 15 }} />}
            </IconButton>
          </InputAdornment>
        )
      }}
    />
  );

  return (
    <Stack gap={2} sx={{ pt: 0.5 }}>
      {msg && <Alert severity={msg.type} sx={{ borderRadius: 2 }}>{msg.text}</Alert>}
      {pwField('actual', 'Contraseña actual', 'actual')}
      {pwField('nuevo', 'Nueva contraseña', 'nuevo')}
      {pwField('confirmar', 'Confirmar nueva contraseña', 'confirmar')}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          disableElevation
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={15} color="inherit" /> : <LockOutlined />}
          sx={{ borderRadius: 2, fontWeight: 700 }}
        >
          {loading ? 'Guardando...' : 'Actualizar contraseña'}
        </Button>
      </Box>
    </Stack>
  );
}

// ── Tab: Seguridad 2FA ────────────────────────────────────────────
function TabSeguridad({ idUsuario, is2faEnabled, onRefetch }) {
  const [generarQr] = useMutation(GENERAR_QR);
  const [confirmarActivacion] = useMutation(CONFIRMAR_2FA);
  const [desactivar2fa] = useMutation(DESACTIVAR_2FA);

  const [qrStep, setQrStep] = useState(0);
  const [qrBase64, setQrBase64] = useState('');
  const [secret, setSecret] = useState('');
  const [activarCode, setActivarCode] = useState('');
  const [desactivarCode, setDesactivarCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleGenerarQr = async () => {
    setLoading(true); setMsg(null);
    try {
      const { data } = await generarQr({ variables: { idUsuario } });
      if (data?.generarQr2fa?.ok) {
        setQrBase64(data.generarQr2fa.qrBase64);
        setSecret(data.generarQr2fa.secret);
        setQrStep(1);
      } else {
        setMsg({ type: 'error', text: data?.generarQr2fa?.error || 'Error al generar QR.' });
      }
    } catch { setMsg({ type: 'error', text: 'Error de conexión.' }); }
    setLoading(false);
  };

  const handleConfirmar = async () => {
    if (activarCode.length !== 6) { setMsg({ type: 'warning', text: 'Ingresa el código de 6 dígitos.' }); return; }
    setLoading(true); setMsg(null);
    try {
      const { data } = await confirmarActivacion({ variables: { idUsuario, totpCode: activarCode } });
      if (data?.confirmarActivacion2fa?.ok) {
        setQrStep(2);
        setMsg({ type: 'success', text: '2FA activado. Tu cuenta ahora está protegida.' });
        onRefetch();
      } else {
        setMsg({ type: 'error', text: data?.confirmarActivacion2fa?.error || 'Código incorrecto.' });
      }
    } catch { setMsg({ type: 'error', text: 'Error de conexión.' }); }
    setLoading(false);
  };

  const handleDesactivar = async () => {
    if (desactivarCode.length !== 6) { setMsg({ type: 'warning', text: 'Ingresa el código de 6 dígitos.' }); return; }
    setLoading(true); setMsg(null);
    try {
      const { data } = await desactivar2fa({ variables: { idUsuario, totpCode: desactivarCode } });
      if (data?.desactivar2fa?.ok) {
        setMsg({ type: 'success', text: '2FA desactivado correctamente.' });
        setDesactivarCode('');
        onRefetch();
      } else {
        setMsg({ type: 'error', text: data?.desactivar2fa?.error || 'Código incorrecto.' });
      }
    } catch { setMsg({ type: 'error', text: 'Error de conexión.' }); }
    setLoading(false);
  };

  return (
    <Stack gap={2} sx={{ pt: 0.5 }}>
      {/* Estado actual */}
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 1.5,
        p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'action.hover'
      }}>
        <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: is2faEnabled ? 'success.main' : 'text.disabled', flexShrink: 0 }} />
        <Box>
          <Typography variant="body2" fontWeight={600} color={is2faEnabled ? 'success.main' : 'text.secondary'}>
            {is2faEnabled ? '2FA habilitado' : '2FA deshabilitado'}
          </Typography>
          <Typography variant="caption" color="text.disabled">
            {is2faEnabled
              ? 'Cada inicio de sesión requiere código de tu app autenticadora.'
              : 'Actívalo para añadir una capa extra de seguridad a tu cuenta.'}
          </Typography>
        </Box>
      </Box>

      {msg && <Alert severity={msg.type} sx={{ borderRadius: 2 }}>{msg.text}</Alert>}

      {/* Flujo activar 2FA */}
      {!is2faEnabled && (
        <Box>
          {qrStep === 0 && (
            <Button
              variant="outlined"
              onClick={handleGenerarQr}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={15} color="inherit" /> : <QrcodeOutlined />}
              sx={{ borderRadius: 2, fontWeight: 700 }}
            >
              Activar 2FA
            </Button>
          )}

          {qrStep === 1 && (
            <Stack gap={2}>
              <Stepper activeStep={1} sx={{ '& .MuiStepLabel-label': { fontSize: '0.75rem' } }}>
                <Step><StepLabel>Generar QR</StepLabel></Step>
                <Step><StepLabel>Escanear</StepLabel></Step>
                <Step><StepLabel>Listo</StepLabel></Step>
              </Stepper>

              <Typography variant="body2" color="text.secondary">
                Escanea el código QR con <strong>Google Authenticator</strong> o <strong>Authy</strong>:
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Box
                  component="img"
                  src={`data:image/png;base64,${qrBase64}`}
                  alt="QR 2FA"
                  sx={{
                    width: 160, height: 160, borderRadius: 2,
                    border: '1px solid', borderColor: 'divider',
                    bgcolor: '#fff', p: 0.5
                  }}
                />
              </Box>

              <Box sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'action.hover', textAlign: 'center' }}>
                <Typography variant="caption" color="text.disabled" display="block" mb={0.5}>
                  ¿No puedes escanear? Ingresa este código en la app:
                </Typography>
                <Typography variant="body2" fontFamily="monospace" fontWeight={700} letterSpacing={2} color="text.primary">
                  {secret}
                </Typography>
              </Box>

              <Divider />
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                Ingresa el código de 6 dígitos que muestra la app:
              </Typography>
              <Stack direction="row" gap={2} alignItems="center">
                <TextField
                  size="small"
                  placeholder="000 000"
                  value={activarCode}
                  onChange={(e) => { setActivarCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setMsg(null); }}
                  inputProps={{ maxLength: 6, style: { textAlign: 'center', letterSpacing: '0.35em', fontSize: '1.1rem', fontWeight: 700 } }}
                  sx={{ width: 150 }}
                />
                <Button
                  variant="contained"
                  disableElevation
                  onClick={handleConfirmar}
                  disabled={activarCode.length !== 6 || loading}
                  sx={{ borderRadius: 2, fontWeight: 700 }}
                >
                  {loading ? <CircularProgress size={18} color="inherit" /> : 'Confirmar'}
                </Button>
                <Button
                  color="inherit"
                  sx={{ color: 'text.secondary' }}
                  onClick={() => { setQrStep(0); setActivarCode(''); setMsg(null); }}
                >
                  Cancelar
                </Button>
              </Stack>
            </Stack>
          )}

          {qrStep === 2 && (
            <Box sx={{ textAlign: 'center', py: 1 }}>
              <CheckCircleOutlined style={{ fontSize: 40, color: '#52c41a' }} />
              <Typography variant="subtitle1" fontWeight={700} mt={1} color="success.main">
                2FA activado correctamente
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Desactivar 2FA */}
      {is2faEnabled && (
        <Box>
          <Typography variant="body2" color="text.secondary" mb={1.5}>
            Ingresa el código de tu app autenticadora para desactivar el 2FA:
          </Typography>
          <Stack direction="row" gap={2} alignItems="center">
            <TextField
              size="small"
              placeholder="000 000"
              value={desactivarCode}
              onChange={(e) => { setDesactivarCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setMsg(null); }}
              inputProps={{ maxLength: 6, style: { textAlign: 'center', letterSpacing: '0.35em', fontSize: '1.1rem', fontWeight: 700 } }}
              sx={{ width: 160 }}
            />
            <Button
              variant="outlined"
              color="error"
              onClick={handleDesactivar}
              disabled={desactivarCode.length !== 6 || loading}
              sx={{ borderRadius: 2, fontWeight: 700 }}
            >
              {loading ? <CircularProgress size={18} color="inherit" /> : 'Desactivar 2FA'}
            </Button>
          </Stack>
        </Box>
      )}
    </Stack>
  );
}

// ── Componente principal ─────────────────────────────────────────
export default function EditarPerfilDialog({ open, onClose, me, onRefetch }) {
  const [tab, setTab] = useState(0);
  const nombre = getNombreCompleto(me);
  const initial = nombre.charAt(0).toUpperCase();
  const rolNombre = me?.rol?.nombre || 'Sin rol';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      TransitionComponent={Transition}
      PaperProps={{ sx: { borderRadius: 3, backgroundImage: 'none', overflow: 'hidden' } }}
    >
      {/* Título */}
      <DialogTitle sx={{ pb: 1.5, pt: 2.5, px: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight={700}>Editar Perfil</Typography>
          <IconButton onClick={onClose} size="small" sx={{ color: 'text.disabled', '&:hover': { color: 'text.primary' } }}>
            <CloseOutlined style={{ fontSize: 15 }} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ px: 3, pt: 2.5, pb: 3 }}>
        {/* Identidad */}
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 2, mb: 2.5,
          p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'action.hover'
        }}>
          <Box sx={{
            width: 44, height: 44, borderRadius: 2, flexShrink: 0,
            bgcolor: 'action.selected', border: '1px solid', borderColor: 'divider',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem', fontWeight: 800, color: 'text.primary', userSelect: 'none'
          }}>
            {initial}
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>{nombre}</Typography>
            <Stack direction="row" gap={0.75} mt={0.4} flexWrap="wrap" alignItems="center">
              <Chip label={rolNombre} size="small" variant="outlined"
                sx={{ height: 20, fontSize: '0.67rem', fontWeight: 600, borderColor: 'divider', color: 'text.secondary' }} />
              <Stack direction="row" alignItems="center" gap={0.5}>
                <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: me?.is2faEnabled ? 'success.main' : 'text.disabled' }} />
                <Typography variant="caption" fontWeight={600}
                  sx={{ color: me?.is2faEnabled ? 'success.main' : 'text.disabled', fontSize: '0.67rem' }}>
                  2FA {me?.is2faEnabled ? 'Activo' : 'Inactivo'}
                </Typography>
              </Stack>
            </Stack>
          </Box>
        </Box>

        {/* Tabs */}
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            mb: 2.5,
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': { minHeight: 40, fontSize: '0.82rem', fontWeight: 600, textTransform: 'none', py: 1 },
          }}
        >
          <Tab icon={<InfoCircleOutlined style={{ fontSize: 14 }} />} iconPosition="start" label="Información" />
          <Tab icon={<LockOutlined style={{ fontSize: 14 }} />} iconPosition="start" label="Contraseña" />
          <Tab icon={<SafetyOutlined style={{ fontSize: 14 }} />} iconPosition="start" label="Seguridad 2FA" />
        </Tabs>

        {tab === 0 && <TabInfo me={me} />}
        {tab === 1 && <TabContrasena />}
        {tab === 2 && (
          <TabSeguridad
            idUsuario={me?.idUsuario}
            is2faEnabled={me?.is2faEnabled}
            onRefetch={onRefetch}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
