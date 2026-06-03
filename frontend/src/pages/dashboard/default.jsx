import { useState, useMemo } from 'react';
import { useQuery, gql } from '@apollo/client';

// material-ui
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';

// project imports
import MainCard from 'components/MainCard';
import AnalyticEcommerce from 'components/cards/statistics/AnalyticEcommerce';
import RankingProyectosTable from 'sections/dashboard/default/RankingProyectosTable';
import EstadoProyectosChart from 'sections/dashboard/default/EstadoProyectosChart';
import DistribucionAreaChart from 'sections/dashboard/default/DistribucionAreaChart';

// assets
import FilterOutlined from '@ant-design/icons/FilterOutlined';
import TrophyOutlined from '@ant-design/icons/TrophyOutlined';
import BarChartOutlined from '@ant-design/icons/BarChartOutlined';
import PieChartOutlined from '@ant-design/icons/PieChartOutlined';

// ── GraphQL ──────────────────────────────────────────────────────────────────
const GET_DASHBOARD_STATS = gql`
  query {
    todosLosProyectos {
      idProyecto
      titulo
      estado
      fechaInscripcion
      ofertaEaCarrera {
        oferta {
          idOferta
          nombre
          modalidadArea {
            area { nombre }
          }
        }
      }
    }
    todosLosParticipantes {
      idParticipante
    }
    todosLosGanadoresPremios {
      idGanadorPremio
    }
    todosLosEventos {
      idEvento
      estado
    }
    todasLasActas {
      idActaEvaluacion
      notaFinal
      fecha
      proyecto {
        titulo
        fechaInscripcion
        ofertaEaCarrera {
          oferta {
            idOferta
            nombre
          }
        }
      }
      detallesEvaluacion {
        tribunal {
          nombre
          apellido
        }
      }
    }
  }
`;

// ==============================|| DASHBOARD - DEFAULT ||============================== //

export default function DashboardDefault() {
  const [selectedOferta, setSelectedOferta] = useState('');
  const [selectedYear,   setSelectedYear]   = useState('');

  const { data, loading } = useQuery(GET_DASHBOARD_STATS, {
    fetchPolicy: 'network-only'
  });

  // ── Ofertas únicas (para el selector) ──────────────────────────────────────
  const ofertas = useMemo(() => {
    const map = new Map();
    (data?.todosLosProyectos || []).forEach((p) => {
      const o = p.ofertaEaCarrera?.oferta;
      if (o?.idOferta && !map.has(o.idOferta)) map.set(o.idOferta, o.nombre);
    });
    return Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre }));
  }, [data]);

  // ── Gestiones (años) únicas ─────────────────────────────────────────────────
  const years = useMemo(() => {
    const set = new Set();
    (data?.todosLosProyectos || []).forEach((p) => {
      if (p.fechaInscripcion) set.add(new Date(p.fechaInscripcion).getFullYear());
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [data]);

  // ── Proyectos filtrados ─────────────────────────────────────────────────────
  const filteredProyectos = useMemo(() => {
    return (data?.todosLosProyectos || []).filter((p) => {
      const matchOferta = !selectedOferta || p.ofertaEaCarrera?.oferta?.idOferta === selectedOferta;
      const matchYear   = !selectedYear   || (p.fechaInscripcion && new Date(p.fechaInscripcion).getFullYear() === Number(selectedYear));
      return matchOferta && matchYear;
    });
  }, [data, selectedOferta, selectedYear]);

  // ── Actas filtradas ─────────────────────────────────────────────────────────
  const filteredActas = useMemo(() => {
    return (data?.todasLasActas || []).filter((a) => {
      const matchOferta = !selectedOferta || a.proyecto?.ofertaEaCarrera?.oferta?.idOferta === selectedOferta;
      const matchYear   = !selectedYear   || (a.fecha && new Date(a.fecha).getFullYear() === Number(selectedYear));
      return matchOferta && matchYear;
    });
  }, [data, selectedOferta, selectedYear]);

  // ── Stat cards (sobre datos filtrados) ─────────────────────────────────────
  const totalAprobados    = filteredProyectos.filter((p) => p.estado === 'aprobado').length;
  const totalParticipantes = data?.todosLosParticipantes?.length || 0;
  const totalPremiados    = data?.todosLosGanadoresPremios?.length || 0;
  const totalEvaluaciones = filteredActas.reduce((acc, a) => acc + (a.detallesEvaluacion?.length || 0), 0);

  const hayFiltros = selectedOferta || selectedYear;

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>

      {/* ── Row 1 · Título ──────────────────────────────────────────────── */}
      <Grid sx={{ mb: -2.25 }} size={12}>
        <Typography variant="h5">Dashboard</Typography>
      </Grid>

      {/* ── Row 2 · Tarjetas de estadísticas ────────────────────────────── */}
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AnalyticEcommerce
          title="Proyectos Aprobados"
          count={loading ? '...' : totalAprobados.toString()}
          percentage={100}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AnalyticEcommerce
          title="Participantes Registrados"
          count={loading ? '...' : totalParticipantes.toString()}
          percentage={100}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AnalyticEcommerce
          title="Evaluaciones Realizadas"
          count={loading ? '...' : totalEvaluaciones.toString()}
          percentage={100}
          color="warning"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AnalyticEcommerce
          title="Proyectos Premiados"
          count={loading ? '...' : totalPremiados.toString()}
          percentage={100}
          color="warning"
        />
      </Grid>

      {/* ── Row 3 · Filtros ──────────────────────────────────────────────── */}
      <Grid size={12}>
        <MainCard>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mb: 2 }}>
            <FilterOutlined style={{ fontSize: '1rem', color: '#1890ff' }} />
            <Typography variant="h6">Filtros</Typography>
            {hayFiltros && (
              <Chip
                label="Limpiar filtros"
                size="small"
                variant="outlined"
                color="error"
                onDelete={() => { setSelectedOferta(''); setSelectedYear(''); }}
                onClick={() => { setSelectedOferta(''); setSelectedYear(''); }}
                sx={{ ml: 1 }}
              />
            )}
          </Stack>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <FormControl fullWidth size="small" disabled={loading}>
                <InputLabel id="oferta-label">Oferta</InputLabel>
                <Select
                  labelId="oferta-label"
                  value={selectedOferta}
                  label="Oferta"
                  onChange={(e) => setSelectedOferta(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Todas las ofertas</em>
                  </MenuItem>
                  {ofertas.map((o) => (
                    <MenuItem key={o.id} value={o.id}>
                      {o.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <FormControl fullWidth size="small" disabled={loading}>
                <InputLabel id="year-label">Gestión (año)</InputLabel>
                <Select
                  labelId="year-label"
                  value={selectedYear}
                  label="Gestión (año)"
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Todas las gestiones</em>
                  </MenuItem>
                  {years.map((y) => (
                    <MenuItem key={y} value={y}>
                      {y}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {hayFiltros && (
              <Grid size={{ xs: 12, sm: 'auto' }} sx={{ display: 'flex', alignItems: 'center' }}>
                <Button
                  size="small"
                  variant="text"
                  color="inherit"
                  onClick={() => { setSelectedOferta(''); setSelectedYear(''); }}
                >
                  Limpiar
                </Button>
              </Grid>
            )}
          </Grid>
        </MainCard>
      </Grid>

      {/* ── Row 4 · Ranking de Proyectos | Estado Proyectos ─────────────── */}
      <Grid size={{ xs: 12, md: 7, lg: 8 }}>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mb: 1.5 }}>
          <TrophyOutlined style={{ fontSize: '1.1rem', color: '#faad14' }} />
          <Typography variant="h5">Ranking de Proyectos</Typography>
          {hayFiltros && (
            <Chip label="Filtrado" size="small" color="primary" variant="outlined" />
          )}
        </Stack>
        <MainCard content={false}>
          {loading ? (
            <Box sx={{ p: 3 }}>
              <Typography color="text.secondary" variant="body2">Cargando ranking...</Typography>
            </Box>
          ) : (
            <RankingProyectosTable actas={filteredActas} />
          )}
        </MainCard>
      </Grid>

      <Grid size={{ xs: 12, md: 5, lg: 4 }}>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mb: 1.5 }}>
          <PieChartOutlined style={{ fontSize: '1.1rem', color: '#1890ff' }} />
          <Typography variant="h5">Estado de Proyectos</Typography>
          {hayFiltros && (
            <Chip label="Filtrado" size="small" color="primary" variant="outlined" />
          )}
        </Stack>
        <MainCard content={false}>
          {loading ? (
            <Box sx={{ p: 3 }}>
              <Typography color="text.secondary" variant="body2">Cargando...</Typography>
            </Box>
          ) : (
            <EstadoProyectosChart proyectos={filteredProyectos} />
          )}
        </MainCard>
      </Grid>

      {/* ── Row 5 · Distribución por Área ───────────────────────────────── */}
      <Grid size={12}>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mb: 1.5 }}>
          <BarChartOutlined style={{ fontSize: '1.1rem', color: '#52c41a' }} />
          <Typography variant="h5">Proyectos por Área</Typography>
          {hayFiltros && (
            <Chip label="Filtrado" size="small" color="primary" variant="outlined" />
          )}
        </Stack>
        <MainCard content={false}>
          {loading ? (
            <Box sx={{ p: 3 }}>
              <Typography color="text.secondary" variant="body2">Cargando distribución...</Typography>
            </Box>
          ) : (
            <Box sx={{ p: 2 }}>
              <DistribucionAreaChart proyectos={filteredProyectos} />
            </Box>
          )}
        </MainCard>
      </Grid>

    </Grid>
  );
}
