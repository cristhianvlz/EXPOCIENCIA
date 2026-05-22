// material-ui
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// project import
import MainCard from 'components/MainCard';

// ==============================|| DRAWER CONTENT - NAVIGATION CARD ||============================== //

export default function NavCard() {
  return (
    <Box sx={{ px: 2, pb: 2 }}>
      <MainCard
        sx={{
          bgcolor: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 3,
          boxShadow: 'none'
        }}
      >
        <Stack spacing={1.5} alignItems="center" sx={{ textAlign: 'center' }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#fff' }}>
            Actualiza a PRO
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
            Accede a más funciones y reportes avanzados
          </Typography>
          <Button
            variant="contained"
            size="small"
            fullWidth
            sx={{
              borderRadius: 2,
              fontWeight: 600,
              mt: 0.5,
              background: 'linear-gradient(135deg, #6C63FF 0%, #4F46E5 100%)',
              boxShadow: '0 4px 14px rgba(108, 99, 255, 0.45)',
              '&:hover': {
                background: 'linear-gradient(135deg, #7C74FF 0%, #6055F5 100%)'
              }
            }}
          >
            Actualizar
          </Button>
        </Stack>
      </MainCard>
    </Box>
  );
}
