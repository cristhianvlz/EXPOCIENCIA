import { Typography, Box } from '@mui/material';
import MainCard from 'components/MainCard';

export default function EvaluacionesPage() {
  return (
    <MainCard title="Módulo de Evaluaciones">
      <Box sx={{ p: 2 }}>
        <Typography variant="body1">
          Esta es la plantilla para el módulo de Evaluaciones. Su funcionalidad se conectará cuando el backend esté listo.
        </Typography>
      </Box>
    </MainCard>
  );
}
