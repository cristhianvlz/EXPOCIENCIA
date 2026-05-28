import React from 'react';
import { useQuery, gql } from '@apollo/client';
import {
  Box, Typography, CircularProgress, Alert, Card, CardContent, Chip, Stack,
  Divider, Button
} from '@mui/material';
import { ProjectOutlined, InfoCircleOutlined, DownloadOutlined, FilePdfOutlined } from '@ant-design/icons';
import MainCard from 'components/MainCard';

const GET_MIS_PROYECTOS = gql`
  query {
    me {
      participante {
        proyectosInscritos {
          idProyecto
          titulo
          resumen
          estado
          fechaInscripcion
          fechaConfirmacion
          observacion
          archivo
          ofertaEaCarrera {
            carrera
            entidadAcademica { nombre }
          }
        }
      }
    }
  }
`;

const ESTADO_CONFIG: Record<string, { label: string, color: 'info' | 'warning' | 'success' | 'error' | 'default' }> = {
  revision:  { label: 'En Revisión', color: 'warning' },
  aprobado:  { label: 'Aprobado',    color: 'success' },
  rechazado: { label: 'Rechazado',   color: 'error' },
};

export default function MisProyectos() {
  const { data, loading, error } = useQuery(GET_MIS_PROYECTOS, { fetchPolicy: 'network-only' });

  if (loading) {
    return (
      <MainCard title="Mis Proyectos">
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      </MainCard>
    );
  }

  if (error) {
    return (
      <MainCard title="Mis Proyectos">
        <Alert severity="error">Error al cargar tus proyectos.</Alert>
      </MainCard>
    );
  }

  const proyectos = data?.me?.participante?.proyectosInscritos || [];

  return (
    <MainCard title="Mis Proyectos">
      {proyectos.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <ProjectOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />
          <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
            Aún no estás registrado en ningún proyecto.
          </Typography>
        </Box>
      ) : (
        <Stack spacing={3}>
          {proyectos.map((proyecto: any) => {
            const estadoCfg = ESTADO_CONFIG[proyecto.estado] || { label: proyecto.estado, color: 'default' };
            const fechaInscripcion = new Date(proyecto.fechaInscripcion).toLocaleDateString('es-BO', {
              year: 'numeric', month: 'long', day: 'numeric'
            });

            return (
              <Card key={proyecto.idProyecto} variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h5" fontWeight={600} gutterBottom>
                        {proyecto.titulo}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {proyecto.ofertaEaCarrera?.entidadAcademica?.nombre} • {proyecto.ofertaEaCarrera?.carrera}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                        Inscrito el {fechaInscripcion}
                      </Typography>
                    </Box>
                    <Chip label={estadoCfg.label} color={estadoCfg.color} size="small" sx={{ fontWeight: 'bold' }} />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {proyecto.resumen && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Resumen del Proyecto
                      </Typography>
                      <Typography variant="body2">
                        {proyecto.resumen}
                      </Typography>
                    </Box>
                  )}

                  {proyecto.observacion && (
                    <Alert icon={<InfoCircleOutlined />} severity={proyecto.estado === 'rechazado' ? 'error' : 'info'} sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Observaciones del Comité:
                      </Typography>
                      <Typography variant="body2">
                        {proyecto.observacion}
                      </Typography>
                    </Alert>
                  )}

                  {proyecto.archivo && (
                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                      <FilePdfOutlined style={{ fontSize: 24, color: '#d32f2f' }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={500}>
                          {proyecto.archivo.split('/').pop()}
                        </Typography>
                      </Box>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<DownloadOutlined />}
                        href={`http://localhost:8000/media/${proyecto.archivo}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Descargar
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}
    </MainCard>
  );
}
