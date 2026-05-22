import PropTypes from 'prop-types';
// material-ui
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// assets
import EditOutlined from '@ant-design/icons/EditOutlined';
import UserOutlined from '@ant-design/icons/UserOutlined';
import LogoutOutlined from '@ant-design/icons/LogoutOutlined';

// ==============================|| HEADER PROFILE - PROFILE TAB ||============================== //

export default function ProfileTab({ handleLogout, onVerPerfil, onEditarPerfil }) {
  return (
    <List component="nav" sx={{ p: 0, '& .MuiListItemIcon-root': { minWidth: 32 } }}>
      <ListItemButton onClick={onEditarPerfil} sx={{ py: 1.1 }}>
        <ListItemIcon sx={{ color: 'text.secondary' }}>
          <EditOutlined style={{ fontSize: 16 }} />
        </ListItemIcon>
        <ListItemText
          primary={
            <Typography variant="body2" fontWeight={500}>Editar Perfil</Typography>
          }
        />
      </ListItemButton>

      <ListItemButton onClick={onVerPerfil} sx={{ py: 1.1 }}>
        <ListItemIcon sx={{ color: 'text.secondary' }}>
          <UserOutlined style={{ fontSize: 16 }} />
        </ListItemIcon>
        <ListItemText
          primary={
            <Typography variant="body2" fontWeight={500}>Ver Perfil</Typography>
          }
        />
      </ListItemButton>

      <Divider sx={{ my: 1 }} />

      <Box sx={{ px: 1, pb: 1 }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: 2,
            py: 1,
            color: 'error.main',
            '&:hover': { bgcolor: 'error.lighter' }
          }}
        >
          <ListItemIcon sx={{ color: 'inherit' }}>
            <LogoutOutlined style={{ fontSize: 16 }} />
          </ListItemIcon>
          <ListItemText
            primary={
              <Typography variant="body2" fontWeight={700}>Cerrar Sesión</Typography>
            }
          />
        </ListItemButton>
      </Box>
    </List>
  );
}

ProfileTab.propTypes = {
  handleLogout: PropTypes.func,
  onVerPerfil: PropTypes.func,
  onEditarPerfil: PropTypes.func
};
