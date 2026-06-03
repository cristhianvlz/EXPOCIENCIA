import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { BarChart } from '@mui/x-charts/BarChart';

// ==============================|| DISTRIBUCIÓN POR ÁREA — BAR CHART ||============================== //

export default function DistribucionAreaChart({ proyectos }) {
  const theme = useTheme();

  // Agrupar proyectos por área (oferta → modalidadArea → area → nombre)
  const areaMap = {};
  (proyectos || []).forEach((p) => {
    const areaNombre =
      p.ofertaEaCarrera?.oferta?.modalidadArea?.area?.nombre || 'Sin área';
    areaMap[areaNombre] = (areaMap[areaNombre] || 0) + 1;
  });

  const entries = Object.entries(areaMap).sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary" variant="body2">
          Sin datos de áreas
        </Typography>
      </Box>
    );
  }

  // Truncar nombres largos para el eje X
  const labels = entries.map(([name]) =>
    name.length > 14 ? name.slice(0, 13) + '…' : name
  );
  const values = entries.map(([, count]) => count);
  const fullLabels = entries.map(([name]) => name);

  return (
    <Box>
      <BarChart
        hideLegend
        height={230}
        series={[{ data: values, label: 'Proyectos' }]}
        xAxis={[{
          data: labels,
          scaleType: 'band',
          tickSize: 7,
          disableLine: true,
          categoryGapRatio: 0.4,
          tickLabelStyle: { fontSize: 11 }
        }]}
        yAxis={[{ position: 'none' }]}
        slotProps={{ bar: { rx: 5, ry: 5 } }}
        axisHighlight={{ x: 'none' }}
        margin={{ left: 10, right: 10, top: 10, bottom: 40 }}
        colors={[theme.palette.primary.main]}
        tooltip={{
          trigger: 'item',
          itemContent: ({ dataIndex }) => (
            dataIndex !== undefined ? `${fullLabels[dataIndex]}: ${values[dataIndex]}` : ''
          )
        }}
        sx={{
          '& .MuiBarElement-root:hover': { opacity: 0.7 },
          '& .MuiChartsAxis-root.MuiChartsAxis-directionX .MuiChartsAxis-tick': { stroke: 'transparent' }
        }}
      />
    </Box>
  );
}

DistribucionAreaChart.propTypes = {
  proyectos: PropTypes.array
};
