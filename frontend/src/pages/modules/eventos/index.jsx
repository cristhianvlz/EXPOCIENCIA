import { Typography, Box } from '@mui/material';
import MainCard from 'components/MainCard';

export default function EventosPage() {
  return (
    <MainCard title="Módulo de Eventos">
      <Box sx={{ p: 2 }}>
        <Typography variant="body1">
          Esta es la plantilla para el módulo de Eventos. Su funcionalidad se conectará cuando el backend esté listo.
        </Typography>
      </Box>
    </MainCard>
  );
}
