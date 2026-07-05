import { useNavigate } from 'react-router-dom';
import { useQuery, gql } from '@apollo/client';
import {
  Box, Typography, Grid, Chip, Divider, Stack, CircularProgress,
  Button, Avatar, Paper
} from '@mui/material';
import MainCard from 'components/MainCard';
import {
  UserOutlined, MailOutlined, SafetyOutlined, IdcardOutlined,
  PhoneOutlined, HomeOutlined, TeamOutlined, ArrowLeftOutlined
} from '@ant-design/icons';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const ME_QUERY = gql`
  query MePerfil {
    me {
      idUsuario
      username
      email
      is2faEnabled
      estado
      rol {
        nombre
      }
      participante {
        nombre
        apellido
        ci
        expedicion
        celular
        codigoEspecifico
      }
      tutor {
        nombre
        apellido
        ci
        expedicion
        celular
        codEmpleado
        direccion
      }
      tribunal {
        nombre
        apellido
        ci
        expedicion
        celular
        especialidad
        direccion
      }
      personal {
        nombre
        apellido
        ci
        expedicion
        celular
        cargo {
          idCargo
          nombre
        }
        direccion
      }
    }
  }
`;

const EXPEDICION_LABELS = {
  LP: 'La Paz', CB: 'Cochabamba', SC: 'Santa Cruz', OR: 'Oruro',
  PT: 'Potosí', CH: 'Chuquisaca', TJ: 'Tarija', BN: 'Beni', PD: 'Pando'
};

function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <Stack direction="row" alignItems="flex-start" gap={1.5} sx={{ py: 1 }}>
      <Box sx={{ mt: 0.25, color: 'text.secondary', fontSize: 16 }}>{icon}</Box>
      <Box>
        <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
          {label}
        </Typography>
        <Typography variant="body1" fontWeight={500}>{value}</Typography>
      </Box>
    </Stack>
  );
}

function Section({ title, children }) {
  return (
    <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 2 }}>
      <Typography variant="subtitle1" fontWeight={700} color="primary.main" mb={1.5}>{title}</Typography>
      <Divider sx={{ mb: 1.5 }} />
      {children}
    </Paper>
  );
}

function getPerfilData(me) {
  if (me?.participante) return { tipo: 'Participante', data: me.participante };
  if (me?.tutor) return { tipo: 'Tutor', data: me.tutor };
  if (me?.tribunal) return { tipo: 'Tribunal', data: me.tribunal };
  if (me?.personal) return { tipo: 'Personal', data: me.personal };
  return null;
}

function getNombreCompleto(me) {
  if (!me) return 'Usuario';
  const p = me.participante || me.tutor || me.tribunal || me.personal;
  if (p) return `${p.nombre} ${p.apellido}`;
  return me.username;
}

export default function VerPerfil() {
  const navigate = useNavigate();
  const { data, loading } = useQuery(ME_QUERY, { fetchPolicy: 'network-only' });
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

      <MainCard title="Mi Perfil">
        {/* Encabezado */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3, p: 2.5, borderRadius: 3, bgcolor: 'primary.lighter' }}>
          <Avatar
            sx={{ width: 72, height: 72, bgcolor: 'primary.main', fontSize: 28, fontWeight: 700 }}
          >
            {nombreCompleto.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight={800}>{nombreCompleto}</Typography>
            <Stack direction="row" gap={1} mt={0.5} flexWrap="wrap">
              <Chip label={rolNombre} color="primary" size="small" icon={<TeamOutlined />} />
              {perfil && (
                <Chip label={perfil.tipo} variant="outlined" size="small" color="default" />
              )}
              <Chip
                label={me?.is2faEnabled ? '2FA Activo' : '2FA Inactivo'}
                color={me?.is2faEnabled ? 'success' : 'default'}
                size="small"
                icon={me?.is2faEnabled ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
              />
            </Stack>
          </Box>
        </Box>

        {/* Datos de cuenta */}
        <Section title="Datos de Cuenta">
          <InfoRow icon={<UserOutlined />} label="Nombre de usuario" value={me?.username} />
          <InfoRow icon={<MailOutlined />} label="Correo electrónico" value={me?.email} />
          <InfoRow icon={<SafetyOutlined />} label="Autenticación 2FA"
            value={me?.is2faEnabled
              ? '✅ Habilitada — Tu cuenta tiene verificación en dos pasos'
              : '⚪ Deshabilitada — Puedes activarla desde Editar Perfil'}
          />
        </Section>

        {/* Datos personales */}
        {perfil && (
          <Section title="Datos Personales">
            <Grid container spacing={0.5}>
              <Grid item xs={12} sm={6}>
                <InfoRow icon={<UserOutlined />} label="Nombre completo"
                  value={`${perfil.data.nombre} ${perfil.data.apellido}`} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <InfoRow icon={<IdcardOutlined />} label="Cédula de Identidad"
                  value={perfil.data.ci
                    ? `${perfil.data.ci} ${EXPEDICION_LABELS[perfil.data.expedicion] ? `(${EXPEDICION_LABELS[perfil.data.expedicion]})` : ''}`
                    : null} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <InfoRow icon={<PhoneOutlined />} label="Celular" value={perfil.data.celular} />
              </Grid>
              {perfil.data.direccion && (
                <Grid item xs={12} sm={6}>
                  <InfoRow icon={<HomeOutlined />} label="Dirección" value={perfil.data.direccion} />
                </Grid>
              )}
              {perfil.tipo === 'Tutor' && (
                <Grid item xs={12} sm={6}>
                  <InfoRow icon={<IdcardOutlined />} label="Código de empleado" value={perfil.data.codEmpleado} />
                </Grid>
              )}
              {perfil.tipo === 'Tribunal' && (
                <Grid item xs={12} sm={6}>
                  <InfoRow icon={<TeamOutlined />} label="Especialidad" value={perfil.data.especialidad} />
                </Grid>
              )}
              {perfil.tipo === 'Personal' && (
                <Grid item xs={12} sm={6}>
                  <InfoRow icon={<TeamOutlined />} label="Cargo"
                    value={perfil.data.cargo?.nombre} />
                </Grid>
              )}
              {perfil.tipo === 'Participante' && perfil.data.codigoEspecifico && (
                <Grid item xs={12} sm={6}>
                  <InfoRow icon={<IdcardOutlined />} label="Código de participante" value={perfil.data.codigoEspecifico} />
                </Grid>
              )}
            </Grid>
          </Section>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
          <Button
            variant="contained"
            onClick={() => navigate('/perfil/editar')}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            Editar Perfil
          </Button>
        </Box>
      </MainCard>
    </Box>
  );
}
