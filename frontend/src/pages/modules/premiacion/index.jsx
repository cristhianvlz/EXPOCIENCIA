import { Typography, Box } from '@mui/material';
import MainCard from 'components/MainCard';

export default function PremiacionPage() {
  return (
    <MainCard title="Módulo de Premiación">
      <Box sx={{ p: 2 }}>
        <Typography variant="body1">
          Esta es la plantilla para el módulo de Premiación. Su funcionalidad se conectará cuando el backend esté listo.
        </Typography>
      </Box>
    </MainCard>
  );
}
