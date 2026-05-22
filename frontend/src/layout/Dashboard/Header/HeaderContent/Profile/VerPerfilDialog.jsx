import { forwardRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Grid, Chip, Stack, Divider, Button, IconButton, Slide
} from '@mui/material';
import CloseOutlined from '@ant-design/icons/CloseOutlined';

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const EXPEDICION = {
  LP: 'La Paz', CB: 'Cochabamba', SC: 'Santa Cruz', OR: 'Oruro',
  PT: 'Potosí', CH: 'Chuquisaca', TJ: 'Tarija', BN: 'Beni', PD: 'Pando'
};
const CARGO = {
  SECRETARIA: 'Secretaria', DECANO: 'Decano', VICEDECANO: 'Vicedecano',
  RECTOR: 'Rector', VICERECTOR: 'Vicerector'
};

function InfoPair({ label, value }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <Box>
      <Typography
        variant="caption"
        sx={{ color: 'text.disabled', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '0.65rem', display: 'block', mb: 0.3 }}
      >
        {label}
      </Typography>
      <Typography variant="body2" color="text.primary" fontWeight={500}>
        {value}
      </Typography>
    </Box>
  );
}

function getPerfilData(me) {
  if (me?.participante) return { tipo: 'Participante', d: me.participante };
  if (me?.tutor) return { tipo: 'Tutor', d: me.tutor };
  if (me?.tribunal) return { tipo: 'Tribunal', d: me.tribunal };
  if (me?.personal) return { tipo: 'Personal', d: me.personal };
  return null;
}

export function getNombreCompleto(me) {
  if (!me) return 'Usuario';
  const p = me.participante || me.tutor || me.tribunal || me.personal;
  if (p?.nombre && p?.apellido) return `${p.nombre} ${p.apellido}`;
  return me.username || 'Usuario';
}

export default function VerPerfilDialog({ open, onClose, me, onEditarPerfil }) {
  const nombre = getNombreCompleto(me);
  const perfil = getPerfilData(me);
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
          <Typography variant="h6" fontWeight={700}>Mi Perfil</Typography>
          <IconButton onClick={onClose} size="small" sx={{ color: 'text.disabled', '&:hover': { color: 'text.primary' } }}>
            <CloseOutlined style={{ fontSize: 15 }} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ px: 3, py: 2.5 }}>
        {/* Identidad */}
        <Box
          sx={{
            display: 'flex', alignItems: 'center', gap: 2, mb: 3,
            p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider',
            bgcolor: 'action.hover'
          }}
        >
          <Box
            sx={{
              width: 50, height: 50, borderRadius: 2, flexShrink: 0,
              bgcolor: 'action.selected', border: '1px solid', borderColor: 'divider',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.25rem', fontWeight: 800, color: 'text.primary',
              userSelect: 'none'
            }}
          >
            {initial}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700} noWrap>{nombre}</Typography>
            <Stack direction="row" gap={0.75} mt={0.6} flexWrap="wrap" alignItems="center">
              <Chip
                label={rolNombre}
                size="small"
                variant="outlined"
                sx={{ height: 20, fontSize: '0.67rem', fontWeight: 600, borderColor: 'divider', color: 'text.secondary' }}
              />
              {perfil && (
                <Chip
                  label={perfil.tipo}
                  size="small"
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.67rem', fontWeight: 600, borderColor: 'divider', color: 'text.secondary' }}
                />
              )}
              <Stack direction="row" alignItems="center" gap={0.5} sx={{ ml: 0.25 }}>
                <Box
                  sx={{
                    width: 7, height: 7, borderRadius: '50%',
                    bgcolor: me?.is2faEnabled ? 'success.main' : 'text.disabled',
                    flexShrink: 0
                  }}
                />
                <Typography
                  variant="caption"
                  fontWeight={600}
                  sx={{ color: me?.is2faEnabled ? 'success.main' : 'text.disabled', fontSize: '0.67rem' }}
                >
                  2FA {me?.is2faEnabled ? 'Activo' : 'Inactivo'}
                </Typography>
              </Stack>
            </Stack>
          </Box>
        </Box>

        {/* Cuenta */}
        <Typography variant="overline" color="text.disabled" fontWeight={700} letterSpacing={1.2} display="block" mb={1}>
          Datos de Cuenta
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <InfoPair label="Nombre de usuario" value={me?.username} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <InfoPair label="Correo electrónico" value={me?.email} />
          </Grid>
          <Grid item xs={12}>
            <InfoPair
              label="Autenticación de dos factores"
              value={me?.is2faEnabled
                ? 'Habilitada — tu cuenta está protegida con verificación en dos pasos'
                : 'Deshabilitada — actívala en Editar Perfil para mayor seguridad'
              }
            />
          </Grid>
        </Grid>

        {/* Datos personales */}
        {perfil && (
          <>
            <Typography variant="overline" color="text.disabled" fontWeight={700} letterSpacing={1.2} display="block" mb={1}>
              Datos Personales
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <InfoPair label="Nombre completo" value={`${perfil.d.nombre} ${perfil.d.apellido}`} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <InfoPair
                  label="Cédula de Identidad"
                  value={perfil.d.ci
                    ? `${perfil.d.ci}${EXPEDICION[perfil.d.expedicion] ? ` (${EXPEDICION[perfil.d.expedicion]})` : ''}`
                    : null}
                />
              </Grid>
              {perfil.d.celular && (
                <Grid item xs={12} sm={6}>
                  <InfoPair label="Celular" value={perfil.d.celular} />
                </Grid>
              )}
              {perfil.d.direccion && (
                <Grid item xs={12} sm={6}>
                  <InfoPair label="Dirección" value={perfil.d.direccion} />
                </Grid>
              )}
              {perfil.tipo === 'Tutor' && perfil.d.codEmpleado && (
                <Grid item xs={12} sm={6}>
                  <InfoPair label="Código de empleado" value={perfil.d.codEmpleado} />
                </Grid>
              )}
              {perfil.tipo === 'Tribunal' && perfil.d.especialidad && (
                <Grid item xs={12} sm={6}>
                  <InfoPair label="Especialidad" value={perfil.d.especialidad} />
                </Grid>
              )}
              {perfil.tipo === 'Personal' && perfil.d.cargo && (
                <Grid item xs={12} sm={6}>
                  <InfoPair label="Cargo" value={CARGO[perfil.d.cargo] || perfil.d.cargo} />
                </Grid>
              )}
              {perfil.tipo === 'Participante' && perfil.d.codigoEspecifico && (
                <Grid item xs={12} sm={6}>
                  <InfoPair label="Código de participante" value={perfil.d.codigoEspecifico} />
                </Grid>
              )}
            </Grid>
          </>
        )}
      </DialogContent>

      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={onClose}
          color="inherit"
          sx={{ color: 'text.secondary', fontWeight: 600 }}
        >
          Cerrar
        </Button>
        <Button
          variant="contained"
          disableElevation
          onClick={() => { onClose(); if (onEditarPerfil) onEditarPerfil(); }}
          sx={{ borderRadius: 2, fontWeight: 700, px: 2.5 }}
        >
          Editar Perfil
        </Button>
      </DialogActions>
    </Dialog>
  );
}
