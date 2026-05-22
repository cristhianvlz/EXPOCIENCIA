import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { LockOutlined } from '@ant-design/icons';
import MainCard from 'components/MainCard';

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <MainCard>
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <LockOutlined style={{ fontSize: 64, color: '#ff4d4f' }} />
        <Typography variant="h3" sx={{ mt: 2, mb: 1 }}>
          Acceso denegado
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          No tienes permiso para acceder a esta sección. Contacta al administrador si crees que es un error.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/')}>
          Volver al inicio
        </Button>
      </Box>
    </MainCard>
  );
}
