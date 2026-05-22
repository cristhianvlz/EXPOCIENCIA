import { Typography, Box } from '@mui/material';
import MainCard from 'components/MainCard';

export default function AcademicoPage() {
  return (
    <MainCard title="Módulo Académico">
      <Box sx={{ p: 2 }}>
        <Typography variant="body1">
          Esta es la plantilla para el módulo Académico. Su funcionalidad se conectará cuando el backend esté listo.
        </Typography>
      </Box>
    </MainCard>
  );
}
