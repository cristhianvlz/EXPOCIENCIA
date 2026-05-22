import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, gql } from '@apollo/client';

// material-ui
import Button from '@mui/material/Button';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Divider from '@mui/material/Divider';

// third-party
import * as Yup from 'yup';
import { Formik } from 'formik';

// project imports
import IconButton from 'components/@extended/IconButton';
import AnimateButton from 'components/@extended/AnimateButton';
import { useAuth } from 'contexts/AuthContext';

// assets
import EyeOutlined from '@ant-design/icons/EyeOutlined';
import EyeInvisibleOutlined from '@ant-design/icons/EyeInvisibleOutlined';
import UserOutlined from '@ant-design/icons/UserOutlined';
import LockOutlined from '@ant-design/icons/LockOutlined';
import SafetyOutlined from '@ant-design/icons/SafetyOutlined';
import QrcodeOutlined from '@ant-design/icons/QrcodeOutlined';

// ============================|| JWT - LOGIN CON 2FA OBLIGATORIO ||============================ //

const LOGIN_MUTATION = gql`
  mutation LoginConTotp($username: String!, $password: String!) {
    loginConTotp(username: $username, password: $password) {
      token
      requires2fa
      needsSetup
      ok
      error
    }
  }
`;

const VERIFICAR_TOTP = gql`
  mutation VerificarTotp($username: String!, $totpCode: String!) {
    verificarTotp(username: $username, totpCode: $totpCode) {
      token
      ok
      error
    }
  }
`;

const GENERAR_QR = gql`
  mutation GenerarQrPorUsername($username: String!) {
    generarQrPorUsername(username: $username) {
      qrBase64
      secret
      ok
      error
    }
  }
`;

const CONFIRMAR_SETUP_Y_LOGIN = gql`
  mutation ConfirmarSetupYLogin($username: String!, $totpCode: String!) {
    confirmarSetupYLogin(username: $username, totpCode: $totpCode) {
      token
      ok
      error
    }
  }
`;

// ── Estilos base ──────────────────────────────────────────────────
const inputBase = {
  color: '#fff',
  borderRadius: 2,
  background: 'rgba(255,255,255,0.06)',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.18)' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.4)' },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#818cf8', borderWidth: 2 },
  '& input': { color: '#fff' },
  '& input::placeholder': { color: 'rgba(255,255,255,0.35)' }
};

const inputCode = {
  ...inputBase,
  '& input': { color: '#fff', textAlign: 'center', letterSpacing: '0.4em', fontSize: '1.4rem', fontWeight: 700 },
  '& input::placeholder': { color: 'rgba(255,255,255,0.3)', letterSpacing: 'normal', fontSize: '0.9rem' }
};

const gradientBtn = {
  py: 1.5, borderRadius: 2.5, fontWeight: 700, fontSize: '1rem', letterSpacing: 0.5,
  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  boxShadow: '0 8px 24px rgba(99,102,241,0.45)',
  '&:hover': { background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', transform: 'translateY(-1px)', boxShadow: '0 12px 32px rgba(99,102,241,0.6)' },
  '&:active': { transform: 'translateY(0)' },
  transition: 'all 0.25s ease'
};

const ErrorBox = ({ msg }) => msg ? (
  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', textAlign: 'center' }}>
    <Typography variant="body2" sx={{ color: '#f87171' }}>{msg}</Typography>
  </Box>
) : null;

const Footer = () => (
  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', display: 'block' }}>
    © {new Date().getFullYear()} UAGRM · EXPOCIENCIA
  </Typography>
);

// ── Pasos del stepper ──────────────────────────────────────────────
const STEPS = ['Credenciales', 'Autenticación 2FA'];

export default function AuthLogin({ isDemo = false }) {
  const navigate = useNavigate();
  const { cargarPermisos, cargarUsuario } = useAuth();
  const [loginMutation] = useMutation(LOGIN_MUTATION);
  const [verificarTotp] = useMutation(VERIFICAR_TOTP);
  const [generarQr] = useMutation(GENERAR_QR);
  const [confirmarSetupYLogin] = useMutation(CONFIRMAR_SETUP_Y_LOGIN);

  const [showPassword, setShowPassword] = useState(false);

  // Flujo: 'credentials' → 'setup' (primer login) | 'totp' (ya configurado)
  const [step, setStep] = useState('credentials');
  const [pendingUsername, setPendingUsername] = useState('');

  // Setup QR
  const [qrBase64, setQrBase64] = useState('');
  const [secret, setSecret] = useState('');
  const [generatingQr, setGeneratingQr] = useState(false);
  const [setupCode, setSetupCode] = useState('');
  const [setupError, setSetupError] = useState('');
  const [confirmingSetup, setConfirmingSetup] = useState(false);

  // TOTP para usuarios que ya tienen 2FA
  const [totpCode, setTotpCode] = useState('');
  const [totpError, setTotpError] = useState('');
  const [verifyingTotp, setVerifyingTotp] = useState(false);

  const finishLogin = async (token) => {
    localStorage.setItem('token', token);
    await Promise.all([cargarPermisos(), cargarUsuario()]);
    navigate('/');
  };

  // ── Paso de credenciales → determinar siguiente pantalla ──
  const handleCredentials = async (values, { setErrors, setStatus, setSubmitting }) => {
    try {
      const { data } = await loginMutation({
        variables: { username: values.username, password: values.password }
      });
      const result = data?.loginConTotp;

      if (!result?.ok) {
        setErrors({ submit: result?.error || 'Credenciales incorrectas' });
        setSubmitting(false);
        return;
      }

      setPendingUsername(values.username);

      if (result.token) {
        // Login directo sin 2FA
        await finishLogin(result.token);
        return;
      }

      if (result.requires2fa) {
        setStep('totp');
        setSubmitting(false);
        return;
      }
    } catch {
      setErrors({ submit: 'Error de conexión con el servidor' });
      setSubmitting(false);
    }
  };

  // ── Confirmar setup + login ──
  const handleConfirmarSetup = async () => {
    if (setupCode.length !== 6) { setSetupError('Ingresa el código de 6 dígitos'); return; }
    setConfirmingSetup(true);
    setSetupError('');
    try {
      const { data } = await confirmarSetupYLogin({ variables: { username: pendingUsername, totpCode: setupCode } });
      if (data?.confirmarSetupYLogin?.ok && data?.confirmarSetupYLogin?.token) {
        finishLogin(data.confirmarSetupYLogin.token);
      } else {
        setSetupError(data?.confirmarSetupYLogin?.error || 'Código incorrecto');
      }
    } catch {
      setSetupError('Error de conexión');
    }
    setConfirmingSetup(false);
  };

  // ── Verificar TOTP (ya tiene 2FA) ──
  const handleVerificarTotp = async () => {
    if (totpCode.length !== 6) { setTotpError('Ingresa el código de 6 dígitos'); return; }
    setVerifyingTotp(true);
    setTotpError('');
    try {
      const { data } = await verificarTotp({ variables: { username: pendingUsername, totpCode } });
      if (data?.verificarTotp?.ok && data?.verificarTotp?.token) {
        finishLogin(data.verificarTotp.token);
      } else {
        setTotpError(data?.verificarTotp?.error || 'Código incorrecto');
      }
    } catch {
      setTotpError('Error de conexión');
    }
    setVerifyingTotp(false);
  };

  const goBack = () => {
    setStep('credentials');
    setTotpCode(''); setTotpError('');
    setSetupCode(''); setSetupError('');
    setQrBase64(''); setSecret('');
  };

  // ══════════════════════════════════════════════════════
  // PASO: VERIFICAR TOTP (ya configurado)
  // ══════════════════════════════════════════════════════
  if (step === 'totp') {
    return (
      <Grid container spacing={2.5}>
        <Grid size={12} sx={{ textAlign: 'center' }}>
          <Stepper activeStep={1} sx={{ mb: 2, '& .MuiStepLabel-label': { color: 'rgba(255,255,255,0.5)' }, '& .MuiStepLabel-label.Mui-active': { color: '#a5b4fc' }, '& .MuiStepConnector-line': { borderColor: 'rgba(255,255,255,0.2)' } }}>
            {STEPS.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
          </Stepper>
          <Box sx={{ mb: 1.5, display: 'flex', justifyContent: 'center' }}>
            <Box sx={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(99,102,241,0.5)' }}>
              <SafetyOutlined style={{ color: '#fff', fontSize: 26 }} />
            </Box>
          </Box>
          <Typography variant="h4" sx={{ color: '#fff', fontWeight: 800, mb: 0.5 }}>
            Verificación 2FA
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
            Abre tu app autenticadora<br />e ingresa el código de 6 dígitos
          </Typography>
        </Grid>

        <Grid size={12}>
          <Stack gap={0.75}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600, letterSpacing: 0.5, textAlign: 'center' }}>
              CÓDIGO DE VERIFICACIÓN
            </Typography>
            <OutlinedInput
              id="totp-code-input"
              type="text"
              value={totpCode}
              onChange={(e) => { setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setTotpError(''); }}
              placeholder="000000"
              fullWidth
              inputProps={{ maxLength: 6 }}
              sx={inputCode}
            />
            {totpError && <FormHelperText error sx={{ color: '#f87171 !important', ml: 0, textAlign: 'center' }}>{totpError}</FormHelperText>}
          </Stack>
        </Grid>

        <Grid size={12}>
          <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)' }}>
              📱 Usa <strong style={{ color: '#a5b4fc' }}>Google Authenticator</strong>, <strong style={{ color: '#a5b4fc' }}>Authy</strong> u otra app compatible
            </Typography>
          </Box>
        </Grid>

        <Grid size={12}>
          <AnimateButton>
            <Button disableElevation disabled={verifyingTotp || totpCode.length !== 6} fullWidth size="large" onClick={handleVerificarTotp} variant="contained" sx={gradientBtn}>
              {verifyingTotp ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Verificar e Ingresar →'}
            </Button>
          </AnimateButton>
        </Grid>

        <Grid size={12} sx={{ textAlign: 'center' }}>
          <Button variant="text" size="small" onClick={goBack} sx={{ color: 'rgba(255,255,255,0.35)', '&:hover': { color: 'rgba(255,255,255,0.6)' }, fontSize: '0.75rem' }}>
            ← Volver
          </Button>
        </Grid>
        <Grid size={12}><Footer /></Grid>
      </Grid>
    );
  }

  // ══════════════════════════════════════════════════════
  // PASO 1: CREDENCIALES
  // ══════════════════════════════════════════════════════
  return (
    <Formik
      initialValues={{ username: '', password: '', submit: null }}
      validationSchema={Yup.object().shape({
        username: Yup.string().max(255).required('El usuario es requerido'),
        password: Yup.string().required('La contraseña es requerida').max(255)
      })}
      onSubmit={handleCredentials}
    >
      {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
        <form noValidate onSubmit={handleSubmit}>
          <Grid container spacing={2.5}>
            <Grid size={12} sx={{ textAlign: 'center' }}>
              <Stepper activeStep={0} sx={{ mb: 2, '& .MuiStepLabel-label': { color: 'rgba(255,255,255,0.5)' }, '& .MuiStepLabel-label.Mui-active': { color: '#a5b4fc' }, '& .MuiStepConnector-line': { borderColor: 'rgba(255,255,255,0.2)' } }}>
                {STEPS.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
              </Stepper>
              <Typography variant="h3" sx={{ color: '#fff', fontWeight: 800, mb: 0.5 }}>Bienvenido 👋</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Ingresa tus credenciales para continuar</Typography>
            </Grid>

            <Grid size={12}>
              <Stack gap={0.75}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600, letterSpacing: 0.5 }}>USUARIO</Typography>
                <OutlinedInput
                  id="username-login" type="text" value={values.username} name="username"
                  onBlur={handleBlur} onChange={handleChange} placeholder="Ingresa tu usuario" fullWidth size="medium"
                  startAdornment={<InputAdornment position="start"><UserOutlined style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16 }} /></InputAdornment>}
                  error={Boolean(touched.username && errors.username)} sx={inputBase}
                />
                {touched.username && errors.username && <FormHelperText error sx={{ color: '#f87171 !important', ml: 0 }}>{errors.username}</FormHelperText>}
              </Stack>
            </Grid>

            <Grid size={12}>
              <Stack gap={0.75}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600, letterSpacing: 0.5 }}>CONTRASEÑA</Typography>
                <OutlinedInput
                  id="password-login" type={showPassword ? 'text' : 'password'} value={values.password} name="password"
                  onBlur={handleBlur} onChange={handleChange} placeholder="Ingresa tu contraseña" fullWidth
                  startAdornment={<InputAdornment position="start"><LockOutlined style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16 }} /></InputAdornment>}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton aria-label="toggle password visibility" onClick={() => setShowPassword(!showPassword)} onMouseDown={(e) => e.preventDefault()} edge="end" sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: '#a5b4fc' } }}>
                        {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                      </IconButton>
                    </InputAdornment>
                  }
                  error={Boolean(touched.password && errors.password)} sx={inputBase}
                />
                {touched.password && errors.password && <FormHelperText error sx={{ color: '#f87171 !important', ml: 0 }}>{errors.password}</FormHelperText>}
              </Stack>
            </Grid>

            {errors.submit && <Grid size={12}><ErrorBox msg={errors.submit} /></Grid>}

            <Grid size={12} sx={{ mt: 1 }}>
              <AnimateButton>
                <Button disableElevation disabled={isSubmitting} fullWidth size="large" type="submit" variant="contained" sx={gradientBtn}>
                  {isSubmitting ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Continuar →'}
                </Button>
              </AnimateButton>
            </Grid>

            <Grid size={12}><Footer /></Grid>
          </Grid>
        </form>
      )}
    </Formik>
  );
}

AuthLogin.propTypes = { isDemo: PropTypes.bool };
