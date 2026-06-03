import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { PieChart } from '@mui/x-charts/PieChart';

// ==============================|| ESTADO PROYECTOS — DONUT CHART ||============================== //

export default function EstadoProyectosChart({ proyectos }) {
  const theme = useTheme();

  const revision  = proyectos?.filter((p) => p.estado === 'revision').length  || 0;
  const aprobado  = proyectos?.filter((p) => p.estado === 'aprobado').length  || 0;
  const rechazado = proyectos?.filter((p) => p.estado === 'rechazado').length || 0;
  const total = revision + aprobado + rechazado;

  const data = [
    { id: 0, value: aprobado,  label: 'Aprobado',   color: theme.palette.success.main },
    { id: 1, value: revision,  label: 'En Revisión', color: theme.palette.warning.main },
    { id: 2, value: rechazado, label: 'Rechazado',   color: theme.palette.error.main   }
  ].filter((d) => d.value > 0);

  if (total === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary" variant="body2">
          Sin proyectos registrados
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <PieChart
        series={[
          {
            data,
            innerRadius: 55,
            outerRadius: 90,
            paddingAngle: 3,
            cornerRadius: 5,
            cx: 110,
          }
        ]}
        height={220}
        width={320}
        slotProps={{ legend: { hidden: true } }}
        margin={{ top: 10, bottom: 10, left: 10, right: 10 }}
      />
      {/* Leyenda manual */}
      <Stack direction="row" sx={{ justifyContent: 'center', gap: 2, flexWrap: 'wrap', pb: 1 }}>
        {[
          { label: 'Aprobado',    count: aprobado,  color: theme.palette.success.main },
          { label: 'En Revisión', count: revision,  color: theme.palette.warning.main },
          { label: 'Rechazado',   count: rechazado, color: theme.palette.error.main   }
        ].map(({ label, count, color }) => (
          <Stack key={label} direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color }} />
            <Typography variant="caption" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="caption" fontWeight={700}>
              {count}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

EstadoProyectosChart.propTypes = {
  proyectos: PropTypes.array
};
