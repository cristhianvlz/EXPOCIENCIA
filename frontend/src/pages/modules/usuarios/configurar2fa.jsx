import { useState } from 'react';
import { useMutation, useQuery, gql } from '@apollo/client';
import {
  Box, Button, Typography, TextField, Alert, CircularProgress,
  Stepper, Step, StepLabel, Paper, Chip, Divider
} from '@mui/material';
import { SafetyOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import MainCard from 'components/MainCard';

const GET_USUARIO = gql`
  query {
    todosLosUsuarios {
      idUsuario
      username
      email
      is2faEnabled
    }
  }
`;

const GENERAR_QR = gql`
  mutation GenerarQr2fa($idUsuario: ID!) {
    generarQr2fa(idUsuario: $idUsuario) {
      qrBase64
      secret
      ok
      error
    }
  }
`;

const CONFIRMAR_2FA = gql`
  mutation ConfirmarActivacion2fa($idUsuario: ID!, $totpCode: String!) {
    confirmarActivacion2fa(idUsuario: $idUsuario, totpCode: $totpCode) {
      ok
      error
    }
  }
`;

const DESACTIVAR_2FA = gql`
  mutation Desactivar2fa($idUsuario: ID!, $totpCode: String!) {
    desactivar2fa(idUsuario: $idUsuario, totpCode: $totpCode) {
      ok
      error
    }
  }
`;

export default function Configurar2faPage() {
  // Obtener el usuario logueado desde localStorage
  const rawUser = localStorage.getItem('user');
  const loggedUser = rawUser ? JSON.parse(rawUser) : null;

  const { data, loading, refetch } = useQuery(GET_USUARIO);
  const [generarQr] = useMutation(GENERAR_QR);
  const [confirmarActivacion] = useMutation(CONFIRMAR_2FA);
  const [desactivar2fa] = useMutation(DESACTIVAR_2FA);

  const [activeStep, setActiveStep] = useState(0);
  const [qrBase64, setQrBase64] = useState('');
  const [secret, setSecret] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);

  // Encontrar el usuario actual
  const usuarios = data?.todosLosUsuarios || [];
  const currentUser = usuarios.find(u => u.username === loggedUser?.username) || usuarios[0];

  const handleGenerarQr = async () => {
    if (!currentUser) return;
    setLoadingAction(true);
    setErrorMsg('');
    try {
      const { data: res } = await generarQr({ variables: { idUsuario: currentUser.idUsuario } });
      if (res?.generarQr2fa?.ok) {
        setQrBase64(res.generarQr2fa.qrBase64);
        setSecret(res.generarQr2fa.secret);
        setActiveStep(1);
      } else {
        setErrorMsg(res?.generarQr2fa?.error || 'Error al generar QR');
      }
    } catch {
      setErrorMsg('Error de conexión');
    }
    setLoadingAction(false);
  };

  const handleConfirmar = async () => {
    if (!currentUser) return;
    setLoadingAction(true);
    setErrorMsg('');
    try {
      const { data: res } = await confirmarActivacion({
        variables: { idUsuario: currentUser.idUsuario, totpCode }
      });
      if (res?.confirmarActivacion2fa?.ok) {
        setSuccessMsg('✅ 2FA activado correctamente. Tu cuenta ahora está protegida.');
        setActiveStep(2);
        refetch();
      } else {
        setErrorMsg(res?.confirmarActivacion2fa?.error || 'Código incorrecto');
      }
    } catch {
      setErrorMsg('Error de conexión');
    }
    setLoadingAction(false);
  };

  const handleDesactivar = async () => {
    if (!currentUser) return;
    setLoadingAction(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const { data: res } = await desactivar2fa({
        variables: { idUsuario: currentUser.idUsuario, totpCode: disableCode }
      });
      if (res?.desactivar2fa?.ok) {
        setSuccessMsg('2FA desactivado correctamente.');
        setDisableCode('');
        refetch();
      } else {
        setErrorMsg(res?.desactivar2fa?.error || 'Código incorrecto');
      }
    } catch {
      setErrorMsg('Error de conexión');
    }
    setLoadingAction(false);
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

  const is2faEnabled = currentUser?.is2faEnabled;

  return (
    <MainCard title="Autenticación de Dos Factores (2FA)">
      <Box sx={{ maxWidth: 600, mx: 'auto' }}>

        {/* Estado actual */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, p: 2.5, borderRadius: 3, bgcolor: is2faEnabled ? 'success.lighter' : 'warning.lighter', border: '1px solid', borderColor: is2faEnabled ? 'success.light' : 'warning.light' }}>
          {is2faEnabled
            ? <CheckCircleOutlined style={{ fontSize: 28, color: '#52c41a' }} />
            : <CloseCircleOutlined style={{ fontSize: 28, color: '#faad14' }} />
          }
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              Estado actual: {' '}
              <Chip
                label={is2faEnabled ? '2FA Activo' : '2FA Inactivo'}
                color={is2faEnabled ? 'success' : 'warning'}
                size="small"
                sx={{ fontWeight: 700 }}
              />
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {is2faEnabled
                ? 'Tu cuenta está protegida con verificación en dos pasos.'
                : 'Activa el 2FA para añadir una capa extra de seguridad a tu cuenta.'}
            </Typography>
          </Box>
        </Box>

        {successMsg && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{successMsg}</Alert>
        )}
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{errorMsg}</Alert>
        )}

        {/* ── Si 2FA NO está activo: Flujo de activación ── */}
        {!is2faEnabled && (
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <SafetyOutlined style={{ color: '#6366f1' }} /> Activar Autenticación de Dos Factores
            </Typography>

            <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
              <Step><StepLabel>Generar QR</StepLabel></Step>
              <Step><StepLabel>Escanear y confirmar</StepLabel></Step>
              <Step><StepLabel>¡Listo!</StepLabel></Step>
            </Stepper>

            {/* Paso 0 */}
            {activeStep === 0 && (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Necesitarás una app de autenticación como <strong>Google Authenticator</strong> o <strong>Authy</strong> en tu celular.
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleGenerarQr}
                  disabled={loadingAction}
                  startIcon={loadingAction ? <CircularProgress size={16} /> : <SafetyOutlined />}
                  sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                >
                  Generar código QR
                </Button>
              </Box>
            )}

            {/* Paso 1: QR generado */}
            {activeStep === 1 && (
              <Box>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                  1. Escanea este código QR con tu app:
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <Box
                    component="img"
                    src={`data:image/png;base64,${qrBase64}`}
                    alt="QR 2FA"
                    sx={{ width: 200, height: 200, borderRadius: 2, border: '4px solid', borderColor: 'primary.main', boxShadow: '0 4px 20px rgba(99,102,241,0.3)' }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  ¿No puedes escanear el QR? Ingresa este código manualmente en tu app:
                </Typography>
                <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 2, mb: 2, textAlign: 'center' }}>
                  <Typography variant="body2" fontFamily="monospace" fontWeight={700} letterSpacing={2}>
                    {secret}
                  </Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                  2. Ingresa el código de 6 dígitos que muestra la app:
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <TextField
                    size="small"
                    placeholder="000000"
                    value={totpCode}
                    onChange={(e) => { setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setErrorMsg(''); }}
                    inputProps={{ maxLength: 6, style: { textAlign: 'center', letterSpacing: '0.3em', fontSize: '1.2rem', fontWeight: 700 } }}
                    sx={{ width: 160 }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleConfirmar}
                    disabled={totpCode.length !== 6 || loadingAction}
                    sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', height: 40 }}
                  >
                    {loadingAction ? <CircularProgress size={18} /> : 'Confirmar'}
                  </Button>
                </Box>
              </Box>
            )}

            {/* Paso 2: Activado */}
            {activeStep === 2 && (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <CheckCircleOutlined style={{ fontSize: 56, color: '#52c41a' }} />
                <Typography variant="h6" fontWeight={700} sx={{ mt: 1 }}>
                  ¡2FA activado exitosamente!
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Desde ahora, cada vez que inicies sesión necesitarás el código de tu app.
                </Typography>
              </Box>
            )}
          </Paper>
        )}

        {/* ── Si 2FA SÍ está activo: Opción de desactivar ── */}
        {is2faEnabled && (
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'error.light', borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} color="error.main" sx={{ mb: 1 }}>
              Desactivar 2FA
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Para desactivar el 2FA, ingresa el código actual de tu app autenticadora como confirmación.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <TextField
                size="small"
                placeholder="Código de 6 dígitos"
                value={disableCode}
                onChange={(e) => { setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setErrorMsg(''); }}
                inputProps={{ maxLength: 6, style: { textAlign: 'center', letterSpacing: '0.3em', fontSize: '1.1rem', fontWeight: 700 } }}
                sx={{ width: 180 }}
              />
              <Button
                variant="contained"
                color="error"
                onClick={handleDesactivar}
                disabled={disableCode.length !== 6 || loadingAction}
                sx={{ borderRadius: 2, height: 40 }}
              >
                {loadingAction ? <CircularProgress size={18} color="inherit" /> : 'Desactivar 2FA'}
              </Button>
            </Box>
          </Paper>
        )}
      </Box>
    </MainCard>
  );
}
