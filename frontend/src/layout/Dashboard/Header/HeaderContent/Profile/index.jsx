import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, gql } from '@apollo/client';

// material-ui
import ButtonBase from '@mui/material/ButtonBase';
import CardContent from '@mui/material/CardContent';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';

// project imports
import ProfileTab from './ProfileTab';
import MainCard from 'components/MainCard';
import Transitions from 'components/@extended/Transitions';
import VerPerfilDialog, { getNombreCompleto } from './VerPerfilDialog';
import EditarPerfilDialog from './EditarPerfilDialog';
import { useAuth } from 'contexts/AuthContext';

// assets
import LogoutOutlined from '@ant-design/icons/LogoutOutlined';
import UserOutlined from '@ant-design/icons/UserOutlined';

// ── Query del usuario autenticado ─────────────────────────────────
const ME_QUERY = gql`
  query MeProfileHeader {
    me {
      idUsuario
      username
      email
      is2faEnabled
      rol { nombre }
      participante { nombre apellido ci expedicion celular codigoEspecifico }
      tutor { nombre apellido ci expedicion celular codEmpleado direccion }
      tribunal { nombre apellido ci expedicion celular especialidad direccion }
      personal { nombre apellido ci expedicion celular cargo { idCargo nombre } direccion }
    }
  }
`;

// ── Componente principal ──────────────────────────────────────────
export default function Profile() {
  const navigate = useNavigate();
  const { limpiarPermisos, limpiarUsuario } = useAuth();

  const { data, refetch } = useQuery(ME_QUERY, { fetchPolicy: 'cache-and-network' });
  const me = data?.me;
  const nombreCompleto = getNombreCompleto(me);
  const rolNombre = me?.rol?.nombre || '';
  const initial = nombreCompleto.charAt(0).toUpperCase();

  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [openLogout, setOpenLogout] = useState(false);
  const [openVer, setOpenVer] = useState(false);
  const [openEditar, setOpenEditar] = useState(false);

  const handleToggle = () => setOpen((prev) => !prev);
  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) return;
    setOpen(false);
  };

  const handleLogoutConfirm = () => {
    localStorage.removeItem('token');
    limpiarPermisos();
    limpiarUsuario();
    setOpenLogout(false);
    navigate('/login', { replace: true });
  };

  return (
    <Box sx={{ flexShrink: 0, ml: 'auto' }}>
      {/* Botón de perfil en el header (sin foto) */}
      <Tooltip title="Mi Perfil" disableInteractive>
        <ButtonBase
          ref={anchorRef}
          aria-controls={open ? 'profile-grow' : undefined}
          aria-haspopup="true"
          onClick={handleToggle}
          sx={(theme) => ({
            p: 0.3,
            borderRadius: '50%',
            transition: 'opacity 0.2s',
            '&:hover': { opacity: 0.85 },
            '&:focus-visible': { outline: `2px solid ${theme.vars.palette.secondary.dark}`, outlineOffset: 2 }
          })}
        >
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              bgcolor: 'action.selected',
              border: '1.5px solid',
              borderColor: open ? 'primary.main' : 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.85rem',
              fontWeight: 800,
              color: 'text.primary',
              userSelect: 'none',
              transition: 'border-color 0.2s'
            }}
          >
            {initial || <UserOutlined style={{ fontSize: 16 }} />}
          </Box>
        </ButtonBase>
      </Tooltip>

      {/* Dropdown */}
      <Popper
        placement="bottom-end"
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
        popperOptions={{ modifiers: [{ name: 'offset', options: { offset: [0, 9] } }] }}
      >
        {({ TransitionProps }) => (
          <Transitions type="grow" position="top-right" in={open} {...TransitionProps}>
            <Paper sx={(theme) => ({ boxShadow: theme.vars.customShadows.z1, width: 256, minWidth: 220 })}>
              <ClickAwayListener onClickAway={handleClose}>
                <MainCard elevation={0} border={false} content={false}>
                  {/* Cabecera del menú */}
                  <CardContent sx={{ px: 2.5, pt: 2.5, pb: 2 }}>
                    <Stack direction="row" gap={1.25} alignItems="center">
                      {/* Inicial en lugar de foto */}
                      <Box
                        sx={{
                          width: 38,
                          height: 38,
                          borderRadius: 1.5,
                          flexShrink: 0,
                          bgcolor: 'action.selected',
                          border: '1px solid',
                          borderColor: 'divider',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem',
                          fontWeight: 800,
                          color: 'text.primary',
                          userSelect: 'none'
                        }}
                      >
                        {initial || <UserOutlined style={{ fontSize: 16 }} />}
                      </Box>
                      <Stack sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" fontWeight={700} noWrap>{nombreCompleto}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>{rolNombre}</Typography>
                      </Stack>
                    </Stack>
                  </CardContent>

                  <Divider />

                  <ProfileTab
                    handleLogout={() => { setOpen(false); setOpenLogout(true); }}
                    onVerPerfil={() => { setOpen(false); setOpenVer(true); }}
                    onEditarPerfil={() => { setOpen(false); setOpenEditar(true); }}
                  />
                </MainCard>
              </ClickAwayListener>
            </Paper>
          </Transitions>
        )}
      </Popper>

      {/* Modal: Ver Perfil */}
      <VerPerfilDialog
        open={openVer}
        onClose={() => setOpenVer(false)}
        me={me}
        onEditarPerfil={() => setOpenEditar(true)}
      />

      {/* Modal: Editar Perfil */}
      <EditarPerfilDialog
        open={openEditar}
        onClose={() => setOpenEditar(false)}
        me={me}
        onRefetch={refetch}
      />

      {/* Modal: Confirmar Cerrar Sesión */}
      <Dialog
        open={openLogout}
        onClose={() => setOpenLogout(false)}
        PaperProps={{
          sx: { borderRadius: 3, maxWidth: 360, width: '100%', backgroundImage: 'none' }
        }}
      >
        <DialogContent sx={{ textAlign: 'center', pt: 4, pb: 2 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64,
              borderRadius: '50%',
              border: '1px solid',
              borderColor: 'error.main',
              mb: 2
            }}
          >
            <LogoutOutlined style={{ fontSize: 28, color: '#ff4d4f' }} />
          </Box>
          <Typography variant="h5" fontWeight={700} mb={1}>¿Cerrar Sesión?</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
            Estás a punto de salir del sistema.<br />¿Deseas continuar?
          </Typography>
        </DialogContent>
        <Divider sx={{ mx: 2.5 }} />
        <DialogActions sx={{ px: 3, py: 2, gap: 1.5 }}>
          <Button
            fullWidth
            onClick={() => setOpenLogout(false)}
            variant="outlined"
            color="inherit"
            sx={{ borderRadius: 2, fontWeight: 600, borderColor: 'divider', color: 'text.secondary', '&:hover': { borderColor: 'text.disabled' } }}
          >
            Cancelar
          </Button>
          <Button
            fullWidth
            onClick={handleLogoutConfirm}
            variant="contained"
            color="error"
            disableElevation
            startIcon={<LogoutOutlined />}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            Salir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
