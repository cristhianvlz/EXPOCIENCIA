import React, { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import {
  Box, Typography, CircularProgress, Alert, Card, CardContent, Chip, Stack,
  Divider, Button, Tabs, Tab, Avatar, LinearProgress, Tooltip
} from '@mui/material';
import {
  ProjectOutlined, InfoCircleOutlined, DownloadOutlined, FilePdfOutlined,
  TrophyOutlined, StarOutlined, CheckCircleOutlined, ClockCircleOutlined,
  CloseCircleOutlined, PrinterOutlined, RiseOutlined, FileProtectOutlined
} from '@ant-design/icons';
import MainCard from 'components/MainCard';

// ── GQL ───────────────────────────────────────────────────────────────────────
const GET_MIS_PROYECTOS = gql`
  query {
    me {
      participante {
        proyectosInscritos {
          idProyecto titulo resumen estado fechaInscripcion fechaConfirmacion observacion archivo
          ofertaEaCarrera {
            carrera
            oferta { nombre }
            entidadAcademica { nombre }
          }
          candidatosPremio {
            idCandidatoPremio nota estado observacion
            premio {
              idPremio monto numeroGanadores
              area { nombre }
              evento {
                nombre
                membrete {
                  titulo subtitulo direccion
                  logoUnidad logoInstitucion firma selloAutoridad
                  piePagina1 piePagina2 piePagina3
                  firmantes { idFirmante nombre cargo firmaImagen orden estado }
                }
              }
              premioDescriptores { descriptor { descripcion } }
            }
            actaEvaluacion {
              idActaEvaluacion notaFinal
            }
            ganador {
              idGanadorPremio estado
              candidatoPremio {
                nota
                proyecto {
                  idProyecto titulo
                  ofertaEaCarrera { oferta { nombre } }
                  participantes { nombre apellido }
                  tutores { nombre apellido }
                }
                premio {
                  monto numeroGanadores
                  area { nombre }
                  evento {
                    nombre
                    membrete {
                      titulo subtitulo direccion
                      logoUnidad logoInstitucion firma selloAutoridad
                      piePagina1 piePagina2 piePagina3
                      firmantes { idFirmante nombre cargo firmaImagen orden estado }
                    }
                  }
                  premioDescriptores { descriptor { descripcion } }
                }
              }
              certificados {
                idCertificado fechaEmision
                plantilla { descripcion contenido orientacion }
              }
            }
          }
        }
      }
    }
  }
`;

// ── Print helper (replicates certificados.jsx logic) ─────────────────────────
const BACKEND_MEDIA = 'http://localhost:8000/media/';
const LUGAR_MAP: Record<number, string> = { 1: '1er Lugar', 2: '2do Lugar', 3: '3er Lugar' };

function resolverContenido(contenido: string, ganador: any): string {
  if (!ganador || !contenido) return contenido;
  const cp = ganador.candidatoPremio;
  const descriptores  = (cp.premio.premioDescriptores || []).map((pd: any) => pd.descriptor.descripcion).join(', ');
  const participantes = (cp.proyecto.participantes || []).map((p: any) => `${p.nombre} ${p.apellido}`).join(', ');
  const tutores       = (cp.proyecto.tutores || []).map((t: any) => `${t.nombre} ${t.apellido}`).join(', ');
  const oferta        = cp.proyecto?.ofertaEaCarrera?.oferta?.nombre || cp.premio.area.nombre;
  const lugar         = LUGAR_MAP[cp.premio.numeroGanadores] || `${cp.premio.numeroGanadores}° Lugar`;
  let resultado = contenido
    .replace(/\{\{Nombre_Proyecto\}\}/g, cp.proyecto.titulo)
    .replace(/\{\{Lugar\}\}/g, lugar)
    .replace(/\{\{Descriptor\}\}/g, descriptores || '—')
    .replace(/\{\{Oferta\}\}/g, oferta)
    .replace(/\{\{Area\}\}/g, cp.premio.area.nombre)
    .replace(/\{\{Evento\}\}/g, cp.premio.evento.nombre)
    .replace(/\{\{Nota\}\}/g, cp.nota)
    .replace(/\{\{Monto\}\}/g, cp.premio.monto || '—');
  resultado = participantes
    ? resultado.replace(/\{\{Participantes\}\}/g, participantes)
    : resultado.replace(/[^\n]*\{\{Participantes\}\}[^\n]*/g, '');
  resultado = tutores
    ? resultado.replace(/\{\{Tutores\}\}/g, tutores)
    : resultado.replace(/[^\n]*\{\{Tutores\}\}[^\n]*/g, '');
  return resultado.replace(/\n{3,}/g, '\n\n').trim();
}

const CERT_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; background: #fff; color: #222; }
  @page horizontal-page { size: A4 landscape; margin: 7mm; }
  @page vertical-page   { size: A4 portrait;  margin: 8mm; }
  .cert-page { page-break-after: always; page-break-inside: avoid; display: flex; flex-direction: column; overflow: hidden; }
  .cert-page.horizontal { page: horizontal-page; width: 283mm; height: 196mm; }
  .cert-page.vertical   { page: vertical-page;  width: 194mm; height: 281mm; }
  .cert-membrete-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 4px 12px 2px; flex-shrink: 0; }
  .cert-logo-box { width: 58px; min-width: 58px; text-align: center; }
  .cert-logo { max-width: 50px; max-height: 50px; object-fit: contain; }
  .cert-membrete-texto { flex: 1; text-align: center; }
  .cert-membrete-titulo { font-size: 11px; font-weight: bold; color: #1a237e; text-transform: uppercase; letter-spacing: 0.8px; }
  .cert-membrete-subtitulo { font-size: 9px; color: #444; margin-top: 1px; }
  .cert-membrete-dir { font-size: 8px; color: #888; margin-top: 1px; }
  .cert-membrete-line { height: 1.5px; background: linear-gradient(90deg, transparent, #1a237e 20%, #1a237e 80%, transparent); margin: 0 12px 3px; flex-shrink: 0; }
  .cert-box { border: 2.5px solid #1a237e; outline: 4px double #1a237e; outline-offset: -8px; margin: 0 12px; padding: 10px 40px 20px; flex: 1; min-height: 0; text-align: center; display: flex; flex-direction: column; overflow: hidden; }
  .cert-top-block { flex-shrink: 0; }
  .cert-deco-line { height: 1.5px; background: linear-gradient(90deg, transparent, #1a237e 20%, #1a237e 80%, transparent); margin: 0 25px 6px; }
  .cert-title { font-size: 24px; font-weight: bold; color: #1a237e; letter-spacing: 6px; margin-bottom: 4px; }
  .cert-descriptor { font-size: 12px; font-weight: bold; color: #c62828; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 2px; }
  .cert-event { font-size: 10px; color: #555; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 2px; }
  .cert-area { font-size: 9.5px; color: #888; margin-bottom: 5px; }
  .cert-body-block { flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; padding: 4px 8px; overflow: hidden; }
  .cert-body { font-size: 11.5px; line-height: 1.7; color: #333; }
  .cert-bottom-block { flex-shrink: 0; }
  .cert-bottom { display: flex; align-items: flex-end; justify-content: center; gap: 24px; flex-wrap: wrap; margin-bottom: 4px; }
  .cert-sello { width: 52px; height: 52px; object-fit: contain; opacity: 0.85; }
  .cert-firmantes { display: flex; gap: 22px; justify-content: center; flex-wrap: wrap; }
  .cert-firmante-item { display: flex; flex-direction: column; align-items: center; min-width: 100px; }
  .cert-firma-img { max-width: 82px; max-height: 34px; object-fit: contain; margin-bottom: 2px; }
  .cert-firma-espacio { height: 34px; }
  .cert-firmante-linea { width: 100px; height: 1px; background: #555; margin-bottom: 2px; }
  .cert-firmante-nombre { font-size: 9.5px; font-weight: bold; color: #222; text-align: center; }
  .cert-firmante-cargo { font-size: 8.5px; color: #555; text-align: center; }
  .cert-fecha { font-size: 9px; color: #999; text-align: center; margin-top: 3px; }
  .cert-pie-pagina { font-size: 8px; color: #888; text-align: center; padding: 2px 12px; border-top: 1px solid #ddd; margin-top: 3px; flex-shrink: 0; }
  @media print { html, body { margin: 0; } .cert-page { page-break-after: always; } }
`;

function buildCertPage(cert: any): string {
  const texto = resolverContenido(cert.plantilla.contenido, cert.ganadorPremio);
  const cp = cert.ganadorPremio.candidatoPremio;
  const descriptores = (cp.premio.premioDescriptores || []).map((pd: any) => pd.descriptor.descripcion).join(' · ');
  const membrete = cp.premio.evento?.membrete;
  const isHorizontal = cert.plantilla.orientacion !== 'vertical';
  const imgUrl = (path: string) => path ? `${BACKEND_MEDIA}${path}` : null;
  const logoUnidad      = imgUrl(membrete?.logoUnidad);
  const logoInstitucion = imgUrl(membrete?.logoInstitucion);
  const firmaGeneral    = imgUrl(membrete?.firma);
  const sello           = imgUrl(membrete?.selloAutoridad);
  const firmantesActivos = (membrete?.firmantes || []).filter((f: any) => f.estado).sort((a: any, b: any) => a.orden - b.orden);
  const headerHtml = membrete ? `
    <div class="cert-membrete-header">
      <div class="cert-logo-box">${logoUnidad ? `<img src="${logoUnidad}" class="cert-logo" alt="Logo Unidad" />` : ''}</div>
      <div class="cert-membrete-texto">
        <div class="cert-membrete-titulo">${membrete.titulo || ''}</div>
        ${membrete.subtitulo ? `<div class="cert-membrete-subtitulo">${membrete.subtitulo}</div>` : ''}
        ${membrete.direccion ? `<div class="cert-membrete-dir">${membrete.direccion}</div>` : ''}
      </div>
      <div class="cert-logo-box">${logoInstitucion ? `<img src="${logoInstitucion}" class="cert-logo" alt="Logo Institución" />` : ''}</div>
    </div>
    <div class="cert-membrete-line"></div>` : '';
  const firmantesHtml = (() => {
    if (firmantesActivos.length === 0 && !firmaGeneral) return '';
    const items = firmantesActivos.length > 0
      ? firmantesActivos.map((f: any) => { const fImg = f.firmaImagen ? imgUrl(f.firmaImagen) : firmaGeneral; return `<div class="cert-firmante-item">${fImg ? `<img src="${fImg}" class="cert-firma-img" alt="Firma" />` : '<div class="cert-firma-espacio"></div>'}<div class="cert-firmante-linea"></div><div class="cert-firmante-nombre">${f.nombre}</div><div class="cert-firmante-cargo">${f.cargo}</div></div>`; }).join('')
      : `<div class="cert-firmante-item"><img src="${firmaGeneral}" class="cert-firma-img" alt="Firma" /><div class="cert-firmante-linea"></div></div>`;
    return `<div class="cert-firmantes">${items}</div>`;
  })();
  const selloHtml = sello ? `<img src="${sello}" class="cert-sello" alt="Sello" />` : '';
  const piePaginas = [membrete?.piePagina1, membrete?.piePagina2, membrete?.piePagina3].filter(Boolean);
  const footerHtml = piePaginas.length > 0 ? `<div class="cert-pie-pagina">${piePaginas.join('  ·  ')}</div>` : '';
  return `<div class="cert-page ${isHorizontal ? 'horizontal' : 'vertical'}">${headerHtml}<div class="cert-box"><div class="cert-top-block"><div class="cert-deco-line"></div><div class="cert-title">CERTIFICADO</div>${descriptores ? `<div class="cert-descriptor">${descriptores}</div>` : ''}<div class="cert-event">${cp.premio.evento.nombre}</div><div class="cert-area">Área: ${cp.premio.area.nombre}</div><div class="cert-deco-line"></div></div><div class="cert-body-block"><div class="cert-body">${texto.replace(/\n/g, '<br/>')}</div></div><div class="cert-bottom-block"><div class="cert-deco-line"></div><div class="cert-bottom">${selloHtml}${firmantesHtml}</div><div class="cert-fecha">Fecha de emisión: ${new Date(cert.fechaEmision).toLocaleDateString('es-BO')}</div></div></div>${footerHtml}</div>`;
}

function imprimirCertificado(cert: any) {
  // El cert viene de candidatosPremio[].ganador.certificados[] 
  // Necesitamos adaptar la estructura para que ganadorPremio sea el ganador del candidato
  const certConGanador = {
    ...cert,
    ganadorPremio: cert._ganador,  // inyectado al llamar
  };
  const body = buildCertPage(certConGanador);
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Certificado</title><style>${CERT_CSS}</style></head><body>${body}</body></html>`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, '_blank');
  if (!win) { alert('Permite ventanas emergentes (pop-ups) para esta página.'); URL.revokeObjectURL(url); return; }
  win.addEventListener('load', () => { win.focus(); win.print(); URL.revokeObjectURL(url); }, { once: true });
}


// ── Types ─────────────────────────────────────────────────────────────────────
interface Proyecto {
  idProyecto: string;
  titulo: string;
  resumen?: string;
  estado: string;
  fechaInscripcion: string;
  fechaConfirmacion?: string;
  observacion?: string;
  archivo?: string;
  ofertaEaCarrera?: { carrera: string; entidadAcademica?: { nombre: string } };
  candidatosPremio?: CandidatoPremio[];
}

interface CandidatoPremio {
  idCandidatoPremio: string;
  nota: string;
  estado: string;
  observacion?: string;
  premio?: { idPremio: string; monto?: string; numeroGanadores: number; area?: { nombre: string }; evento?: { nombre: string }; descriptores?: { descripcion: string }[] };
  actaEvaluacion?: { idActaEvaluacion: string; notaFinal: string };
  ganador?: { idGanadorPremio: string; estado: boolean; certificados?: { idCertificado: string; fechaEmision: string; plantilla?: { descripcion: string } }[] };
}

// ── Constants ─────────────────────────────────────────────────────────────────
const ESTADO_CONFIG: Record<string, { label: string; color: 'info' | 'warning' | 'success' | 'error' | 'default'; icon: React.ReactNode; step: number }> = {
  inscrito:  { label: 'Inscrito',    color: 'info',    icon: <ClockCircleOutlined />,   step: 0 },
  revision:  { label: 'En Revisión', color: 'warning', icon: <ClockCircleOutlined />,   step: 1 },
  aprobado:  { label: 'Aprobado',    color: 'success', icon: <CheckCircleOutlined />,   step: 2 },
  rechazado: { label: 'Rechazado',   color: 'error',   icon: <CloseCircleOutlined />,   step: -1 },
};

const FLOW_STEPS = ['Inscrito', 'En Revisión', 'Aprobado', 'Evaluado', 'Premiado'];

const POSICION_LABELS: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: '🥇 1er Lugar', color: '#b8860b', bg: 'rgba(255,215,0,0.12)' },
  2: { label: '🥈 2do Lugar', color: '#708090', bg: 'rgba(192,192,192,0.12)' },
  3: { label: '🥉 3er Lugar', color: '#cd7f32', bg: 'rgba(205,127,50,0.12)' },
};

// ── Subcomponents ─────────────────────────────────────────────────────────────
function FlowProgress({ estado, hasEval, hasWinner }: { estado: string; hasEval: boolean; hasWinner: boolean }) {
  if (estado === 'rechazado') return null;
  let step = ESTADO_CONFIG[estado]?.step ?? 0;
  if (hasEval) step = 3;
  if (hasWinner) step = 4;
  const pct = Math.min(100, (step / (FLOW_STEPS.length - 1)) * 100);
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        {FLOW_STEPS.map((s, i) => (
          <Typography key={s} variant="caption"
            sx={{ fontWeight: i <= step ? 700 : 400, color: i <= step ? 'primary.main' : 'text.disabled', fontSize: 10 }}>
            {s}
          </Typography>
        ))}
      </Box>
      <LinearProgress variant="determinate" value={pct} sx={{ borderRadius: 4, height: 6 }} />
    </Box>
  );
}

function PremioCard({ candidato }: { candidato: CandidatoPremio }) {
  // La fuente de verdad definitiva es la existencia del registro GanadorPremio con estado=true,
  // independientemente del campo candidato.estado (puede quedar como 'candidato' en desempates).
  const esGanador = !!(candidato.ganador && candidato.ganador.estado !== false);
  const posicion = candidato.premio?.numeroGanadores ?? 0;
  const posConfig = POSICION_LABELS[posicion];
  const nota = candidato.actaEvaluacion?.notaFinal ?? candidato.nota;
  const certificados = candidato.ganador?.certificados ?? [];

  return (
    <Box sx={{
      p: 2, borderRadius: 2,
      border: '1px solid',
      borderColor: esGanador ? 'warning.main' : 'divider',
      bgcolor: esGanador ? 'rgba(255,215,0,0.06)' : 'action.hover',
      mb: 1.5,
    }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {esGanador
            ? <TrophyOutlined style={{ fontSize: 22, color: '#f5a623' }} />
            : <StarOutlined style={{ fontSize: 20, color: '#aaa' }} />}
          <Box>
            <Typography variant="subtitle2" fontWeight={700}>
              {candidato.premio?.evento?.nombre ?? 'Premio'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {candidato.premio?.area?.nombre}
              {candidato.premio?.descriptores?.map(d => ` · ${d.descripcion}`)}
            </Typography>
          </Box>
        </Box>
        {esGanador && posConfig && (
          <Chip label={posConfig.label} size="small"
            sx={{ fontWeight: 700, bgcolor: posConfig.bg, color: posConfig.color, border: `1px solid ${posConfig.color}` }} />
        )}
        {!esGanador && (
          <Chip label="Sin Premio" size="small" color="default" variant="outlined" />
        )}
      </Box>

      {/* Nota & Posición */}
      <Box sx={{ display: 'flex', gap: 2, mb: esGanador ? 1.5 : 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <RiseOutlined style={{ fontSize: 14, color: '#1890ff' }} />
          <Typography variant="caption" color="text.secondary">Nota Final:</Typography>
          <Typography variant="body2" fontWeight={700}>{parseFloat(nota ?? '0').toFixed(2)}</Typography>
        </Box>
        {candidato.premio?.monto && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="caption" color="text.secondary">Premio monetario:</Typography>
            <Typography variant="body2" fontWeight={700} color="success.main">Bs. {candidato.premio.monto}</Typography>
          </Box>
        )}
      </Box>

      {/* Certificados */}
      {esGanador && certificados.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
            Certificados disponibles
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
            {certificados.map((cert: any) => (
              <Button
                key={cert.idCertificado}
                variant="contained"
                color="warning"
                size="small"
                startIcon={<PrinterOutlined />}
                sx={{ bgcolor: '#f5a623', '&:hover': { bgcolor: '#e09518' }, fontWeight: 700 }}
                onClick={() => imprimirCertificado({ ...cert, _ganador: candidato.ganador })}
              >
                Imprimir Certificado{cert.plantilla?.descripcion ? ` — ${cert.plantilla.descripcion}` : ''}
              </Button>
            ))}
          </Box>
        </Box>
      )}

      {esGanador && certificados.length === 0 && (
        <Alert severity="info" sx={{ mt: 1, py: 0.5 }} icon={<FileProtectOutlined />}>
          <Typography variant="caption">¡Felicitaciones! Tu certificado será emitido próximamente por el comité organizador.</Typography>
        </Alert>
      )}
    </Box>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function MisProyectos() {
  const [tab, setTab] = useState(0);
  const { data, loading, error } = useQuery(GET_MIS_PROYECTOS, { fetchPolicy: 'network-only' });

  if (loading) return (
    <MainCard title="Mis Proyectos">
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
    </MainCard>
  );

  if (error) return (
    <MainCard title="Mis Proyectos">
      <Alert severity="error">Error al cargar tus proyectos.</Alert>
    </MainCard>
  );

  const todos: Proyecto[] = data?.me?.participante?.proyectosInscritos || [];

  const aprobados   = todos.filter(p => p.estado === 'aprobado');
  const rechazados  = todos.filter(p => p.estado === 'rechazado');
  const enRevision  = todos.filter(p => p.estado === 'revision' || p.estado === 'inscrito');
  const premiados   = todos.filter(p => p.candidatosPremio?.some(c => !!(c.ganador && c.ganador.estado !== false)));

  const tabData = [
    { label: 'Todos',       count: todos.length,      proyectos: todos,       emptyMsg: 'Aún no estás registrado en ningún proyecto.' },
    { label: 'En Revisión', count: enRevision.length,  proyectos: enRevision,  emptyMsg: 'No tienes proyectos en proceso de revisión.' },
    { label: 'Aprobados',   count: aprobados.length,   proyectos: aprobados,   emptyMsg: 'Ninguno de tus proyectos ha sido aprobado aún.' },
    { label: 'Rechazados',  count: rechazados.length,  proyectos: rechazados,  emptyMsg: 'No tienes proyectos rechazados.' },
    { label: '🏆 Premiados', count: premiados.length,  proyectos: premiados,   emptyMsg: 'Aún no has ganado ningún premio.' },
  ];

  const currentTab = tabData[tab];

  return (
    <MainCard title="Mis Proyectos">
      {/* ── Tabs ── */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}
          sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
          {tabData.map((t, i) => (
            <Tab key={i} label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                {t.label}
                {t.count > 0 && (
                  <Chip label={t.count} size="small"
                    color={i === 4 ? 'warning' : i === 2 ? 'success' : i === 3 ? 'error' : 'default'}
                    sx={{ height: 18, fontSize: 11, fontWeight: 700 }} />
                )}
              </Box>
            } />
          ))}
        </Tabs>
      </Box>

      {/* ── Content ── */}
      {currentTab.proyectos.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <ProjectOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />
          <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
            {currentTab.emptyMsg}
          </Typography>
        </Box>
      ) : (
        <Stack spacing={3}>
          {currentTab.proyectos.map((proyecto: Proyecto) => {
            const estadoCfg = ESTADO_CONFIG[proyecto.estado] || { label: proyecto.estado, color: 'default' as const, icon: null, step: 0 };
            const candidatos = proyecto.candidatosPremio ?? [];
            const hasEval = candidatos.some(c => c.actaEvaluacion?.notaFinal);
            const hasWinner = candidatos.some(c => !!(c.ganador && c.ganador.estado !== false));

            const fechaInscripcion = new Date(proyecto.fechaInscripcion).toLocaleDateString('es-BO', {
              year: 'numeric', month: 'long', day: 'numeric'
            });

            return (
              <Card key={proyecto.idProyecto} variant="outlined" sx={{
                borderRadius: 3,
                border: '1px solid',
                borderColor: hasWinner ? 'warning.main' : 'divider',
                boxShadow: hasWinner ? '0 4px 20px rgba(245,166,35,0.15)' : 'none',
              }}>
                <CardContent sx={{ p: 3 }}>

                  {/* Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <Avatar sx={{
                        bgcolor: hasWinner ? 'warning.lighter' : 'primary.lighter',
                        color: hasWinner ? 'warning.main' : 'primary.main',
                        width: 42, height: 42, mt: 0.25
                      }}>
                        {hasWinner ? <TrophyOutlined /> : <ProjectOutlined />}
                      </Avatar>
                      <Box>
                        <Typography variant="h5" fontWeight={700} gutterBottom sx={{ mb: 0.25 }}>
                          {proyecto.titulo}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {proyecto.ofertaEaCarrera?.entidadAcademica?.nombre}
                          {proyecto.ofertaEaCarrera?.carrera && ` • ${proyecto.ofertaEaCarrera.carrera}`}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          Inscrito el {fechaInscripcion}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      icon={<span style={{ fontSize: 14 }}>{estadoCfg.icon}</span>}
                      label={estadoCfg.label}
                      color={estadoCfg.color}
                      sx={{ fontWeight: 700 }}
                    />
                  </Box>

                  {/* Barra de progreso del flujo */}
                  <FlowProgress estado={proyecto.estado} hasEval={hasEval} hasWinner={hasWinner} />

                  <Divider sx={{ my: 2 }} />

                  {/* Resumen */}
                  {proyecto.resumen && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Resumen del Proyecto
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                        {proyecto.resumen}
                      </Typography>
                    </Box>
                  )}

                  {/* Observación del comité */}
                  {proyecto.observacion && (
                    <Alert icon={<InfoCircleOutlined />}
                      severity={proyecto.estado === 'rechazado' ? 'error' : 'info'}
                      sx={{ mb: 2, borderRadius: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>Observaciones del Comité:</Typography>
                      <Typography variant="body2">{proyecto.observacion}</Typography>
                    </Alert>
                  )}

                  {/* Archivo */}
                  {proyecto.archivo && (
                    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2, p: 2,
                              bgcolor: 'action.hover', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                      <FilePdfOutlined style={{ fontSize: 24, color: '#d32f2f' }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={500}>
                          {proyecto.archivo.split('/').pop()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">Documento adjunto</Typography>
                      </Box>
                      <Button variant="outlined" size="small" startIcon={<DownloadOutlined />}
                        href={`http://localhost:8000/media/${proyecto.archivo}`}
                        target="_blank" rel="noopener noreferrer">
                        Descargar
                      </Button>
                    </Box>
                  )}

                  {/* Sección de Resultados y Premiación */}
                  {candidatos.length > 0 && (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <TrophyOutlined style={{ color: '#f5a623', fontSize: 16 }} />
                        <Typography variant="subtitle2" fontWeight={700} color="text.secondary"
                          sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Resultados & Premiación
                        </Typography>
                      </Box>
                      {candidatos.map((c: CandidatoPremio) => (
                        <PremioCard key={c.idCandidatoPremio} candidato={c} />
                      ))}
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
