import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
  Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Snackbar, Alert, CircularProgress, Chip, Typography, Stack, Divider,
  FormControl, InputLabel, Select, MenuItem, Tooltip, Tabs, Tab, ToggleButtonGroup, ToggleButton,
  InputAdornment
} from '@mui/material';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, FilePdfOutlined,
  PrinterOutlined, FileTextOutlined, ExclamationCircleOutlined, DollarCircleOutlined,
  QrcodeOutlined, CheckOutlined, WalletOutlined, SearchOutlined, CloseOutlined, TrophyOutlined
} from '@ant-design/icons';
import MainCard from 'components/MainCard';

const BACKEND_MEDIA = 'http://localhost:8000/media/';

// ── GQL ──────────────────────────────────────────────────────────────────────
const GET_DATA = gql`
  query {
    todasLasPlantillas {
      idPlantilla descripcion contenido orientacion estado
    }
    todosLosCertificados {
      idCertificado fechaEmision estado
      plantilla { idPlantilla descripcion contenido orientacion }
      ganadorPremio {
        idGanadorPremio estado
        candidatoPremio {
          nota
          proyecto {
            idProyecto titulo
            ofertaEaCarrera { oferta { idOferta nombre } }
            participantes { nombre apellido }
            tutores { nombre apellido }
          }
          premio {
            monto numeroGanadores
            evento {
              nombre
              membrete {
                titulo subtitulo direccion
                logoUnidad logoInstitucion firma selloAutoridad
                piePagina1 piePagina2 piePagina3
                firmantes { idFirmante nombre cargo firmaImagen orden estado }
              }
            }
            area { nombre }
            premioDescriptores { descriptor { descripcion } }
          }
        }
      }
    }
    todosLosGanadoresPremios {
      idGanadorPremio estado
      asignaciones {
        idAsignacionPremio
        participante { idParticipante nombre apellido ci }
        montoAsignado porcentaje impresa
        metodoPago qrImagen estadoPago fechaPago comprobantePagoImagen
      }
      candidatoPremio {
        nota
        proyecto {
          idProyecto titulo
          ofertaEaCarrera { oferta { idOferta nombre } }
          participantes { idParticipante nombre apellido ci }
          tutores { nombre apellido }
        }
        premio {
          monto numeroGanadores
          evento {
            nombre
            membrete {
              titulo subtitulo direccion
              logoUnidad logoInstitucion firma selloAutoridad
              piePagina1 piePagina2 piePagina3
              firmantes { idFirmante nombre cargo firmaImagen orden estado }
            }
          }
          area { nombre }
          premioDescriptores { descriptor { descripcion } }
        }
      }
    }
  }
`;

const CREAR_PLANTILLA = gql`mutation($descripcion: String!, $contenido: String!, $orientacion: String) {
  crearPlantilla(descripcion: $descripcion, contenido: $contenido, orientacion: $orientacion) { ok error }
}`;
const EDITAR_PLANTILLA = gql`mutation($idPlantilla: ID!, $descripcion: String, $contenido: String, $orientacion: String, $estado: Boolean) {
  editarPlantilla(idPlantilla: $idPlantilla, descripcion: $descripcion, contenido: $contenido, orientacion: $orientacion, estado: $estado) { ok error }
}`;
const ELIMINAR_PLANTILLA = gql`mutation($idPlantilla: ID!) { eliminarPlantilla(idPlantilla: $idPlantilla) { ok error } }`;

const CREAR_CERTIFICADO = gql`mutation($idGanadorPremio: ID!, $idPlantilla: ID!) {
  crearCertificado(idGanadorPremio: $idGanadorPremio, idPlantilla: $idPlantilla) { ok error }
}`;
const ELIMINAR_CERTIFICADO = gql`mutation($idCertificado: ID!) { eliminarCertificado(idCertificado: $idCertificado) { ok error } }`;

const GUARDAR_DIVISION = gql`
  mutation($idGanadorPremio: ID!, $asignaciones: [AsignacionInput!]!) {
    guardarDivisionPremio(idGanadorPremio: $idGanadorPremio, asignaciones: $asignaciones) { ok error }
  }`;
const MARCAR_DIVISION_IMPRESA = gql`
  mutation($idGanadorPremio: ID!) {
    marcarDivisionImpresa(idGanadorPremio: $idGanadorPremio) { ok error }
  }`;
const CONFIGURAR_METODO_PAGO = gql`
  mutation($idAsignacionPremio: ID!, $metodoPago: String!) {
    configurarMetodoPago(idAsignacionPremio: $idAsignacionPremio, metodoPago: $metodoPago) { ok error }
  }`;
const MARCAR_ASIGNACION_PAGADA = gql`
  mutation($idAsignacionPremio: ID!) {
    marcarAsignacionPagada(idAsignacionPremio: $idAsignacionPremio) { ok error }
  }`;
const SUBIR_COMPROBANTE_PAGO = gql`
  mutation($idAsignacionPremio: ID!, $comprobanteBase64: String!) {
    subirComprobantePago(idAsignacionPremio: $idAsignacionPremio, comprobanteBase64: $comprobanteBase64) { ok error }
  }`;

// ── Helpers ───────────────────────────────────────────────────────────────────
function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;
}

function ConfirmDialog({ open, title, message, confirmLabel = 'Confirmar', confirmColor = 'error', onConfirm, onCancel }) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" gap={1}>
          <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: 20 }} />
          {title}
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ pt: 1 }}>{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="secondary">Cancelar</Button>
        <Button variant="contained" color={confirmColor} onClick={onConfirm}>{confirmLabel}</Button>
      </DialogActions>
    </Dialog>
  );
}

const posLabel = (n) => ({ 1: '🥇 1er Lugar', 2: '🥈 2do Lugar', 3: '🥉 3er Lugar' }[n] || `${n}° Lugar`);

const VARIABLES_HINT = [
  { token: '{{Nombre_Proyecto}}', desc: 'Título del proyecto' },
  { token: '{{Lugar}}',           desc: 'Posición obtenida (1er Lugar / 2do Lugar / 3er Lugar)' },
  { token: '{{Descriptor}}',      desc: 'Tipo de premio (ej. Bolivianos, Certificado)' },
  { token: '{{Oferta}}',          desc: 'Nombre de la oferta académica' },
  { token: '{{Area}}',            desc: 'Área del premio' },
  { token: '{{Evento}}',          desc: 'Nombre del evento' },
  { token: '{{Nota}}',            desc: 'Nota obtenida por el proyecto' },
  { token: '{{Monto}}',           desc: 'Monto del premio en Bs.' },
  { token: '{{Participantes}}',   desc: 'Nombres completos de los integrantes del proyecto' },
  { token: '{{Tutores}}',         desc: 'Nombres completos de los tutores del proyecto' },
];

const LUGAR_MAP = { 1: '1er Lugar', 2: '2do Lugar', 3: '3er Lugar' };

function resolverContenido(contenido, ganador) {
  if (!ganador || !contenido) return contenido;
  const cp = ganador.candidatoPremio;
  const descriptores  = (cp.premio.premioDescriptores || []).map(pd => pd.descriptor.descripcion).join(', ');
  const participantes = (cp.proyecto.participantes || []).map(p => `${p.nombre} ${p.apellido}`).join(', ');
  const tutores       = (cp.proyecto.tutores || []).map(t => `${t.nombre} ${t.apellido}`).join(', ');
  const oferta        = cp.proyecto?.ofertaEaCarrera?.oferta?.nombre || cp.premio.area.nombre;
  const lugar         = LUGAR_MAP[cp.premio.numeroGanadores] || `${cp.premio.numeroGanadores}° Lugar`;

  let resultado = contenido
    .replace(/\{\{Nombre_Proyecto\}\}/g, cp.proyecto.titulo)
    .replace(/\{\{Lugar\}\}/g,           lugar)
    .replace(/\{\{Descriptor\}\}/g,      descriptores || '—')
    .replace(/\{\{Oferta\}\}/g,          oferta)
    .replace(/\{\{Area\}\}/g,            cp.premio.area.nombre)
    .replace(/\{\{Evento\}\}/g,          cp.premio.evento.nombre)
    .replace(/\{\{Nota\}\}/g,            cp.nota)
    .replace(/\{\{Monto\}\}/g,           cp.premio.monto || '—');

  // Si no hay participantes/tutores, eliminar la línea completa que los contiene
  if (participantes) {
    resultado = resultado.replace(/\{\{Participantes\}\}/g, participantes);
  } else {
    resultado = resultado.replace(/[^\n]*\{\{Participantes\}\}[^\n]*/g, '');
  }
  if (tutores) {
    resultado = resultado.replace(/\{\{Tutores\}\}/g, tutores);
  } else {
    resultado = resultado.replace(/[^\n]*\{\{Tutores\}\}[^\n]*/g, '');
  }

  // Eliminar líneas en blanco consecutivas (> 1) que queden tras eliminar tokens
  return resultado.replace(/\n{3,}/g, '\n\n').trim();
}

// ── Generación de HTML del certificado ───────────────────────────────────────
function buildCertPage(cert) {
  const texto = resolverContenido(cert.plantilla.contenido, cert.ganadorPremio);
  const cp = cert.ganadorPremio.candidatoPremio;
  const descriptores = (cp.premio.premioDescriptores || []).map(pd => pd.descriptor.descripcion).join(' · ');
  const membrete = cp.premio.evento?.membrete;
  const isHorizontal = cert.plantilla.orientacion?.toLowerCase() !== 'vertical';

  const imgUrl = (path) => path ? `${BACKEND_MEDIA}${path}` : null;
  const logoUnidad      = imgUrl(membrete?.logoUnidad);
  const logoInstitucion = imgUrl(membrete?.logoInstitucion);
  const firmaGeneral    = imgUrl(membrete?.firma);
  const sello           = imgUrl(membrete?.selloAutoridad);

  const firmantesActivos = (membrete?.firmantes || [])
    .filter(f => f.estado)
    .sort((a, b) => a.orden - b.orden);

  // Cabecera institucional (membrete)
  const headerHtml = membrete ? `
    <div class="cert-membrete-header">
      <div class="cert-logo-box">
        ${logoUnidad ? `<img src="${logoUnidad}" class="cert-logo" alt="Logo Unidad" />` : ''}
      </div>
      <div class="cert-membrete-texto">
        <div class="cert-membrete-titulo">${membrete.titulo || ''}</div>
        ${membrete.subtitulo ? `<div class="cert-membrete-subtitulo">${membrete.subtitulo}</div>` : ''}
        ${membrete.direccion ? `<div class="cert-membrete-dir">${membrete.direccion}</div>` : ''}
      </div>
      <div class="cert-logo-box">
        ${logoInstitucion ? `<img src="${logoInstitucion}" class="cert-logo" alt="Logo Institución" />` : ''}
      </div>
    </div>
    <div class="cert-membrete-line"></div>
  ` : '';

  // Firmantes
  const firmantesHtml = (() => {
    if (firmantesActivos.length === 0 && !firmaGeneral) return '';
    const items = firmantesActivos.length > 0
      ? firmantesActivos.map(f => {
          const fImg = f.firmaImagen ? imgUrl(f.firmaImagen) : firmaGeneral;
          return `
            <div class="cert-firmante-item">
              ${fImg ? `<img src="${fImg}" class="cert-firma-img" alt="Firma" />` : '<div class="cert-firma-espacio"></div>'}
              <div class="cert-firmante-linea"></div>
              <div class="cert-firmante-nombre">${f.nombre}</div>
              <div class="cert-firmante-cargo">${f.cargo}</div>
            </div>`;
        }).join('')
      : `<div class="cert-firmante-item">
           <img src="${firmaGeneral}" class="cert-firma-img" alt="Firma" />
           <div class="cert-firmante-linea"></div>
         </div>`;
    return `<div class="cert-firmantes">${items}</div>`;
  })();

  const selloHtml = sello
    ? `<img src="${sello}" class="cert-sello" alt="Sello de autoridad" />`
    : '';

  // Pie de página institucional
  const piePaginas = [membrete?.piePagina1, membrete?.piePagina2, membrete?.piePagina3].filter(Boolean);
  const footerHtml = piePaginas.length > 0
    ? `<div class="cert-pie-pagina">${piePaginas.join('  ·  ')}</div>`
    : '';

  return `
    <div class="cert-page ${isHorizontal ? 'horizontal' : 'vertical'}">
      ${headerHtml}
      <div class="cert-box">

        <!-- Bloque superior: título y clasificación -->
        <div class="cert-top-block">
          <div class="cert-deco-line"></div>
          <div class="cert-title">CERTIFICADO</div>
          ${descriptores ? `<div class="cert-descriptor">${descriptores}</div>` : ''}
          <div class="cert-event">${cp.premio.evento.nombre}</div>
          <div class="cert-area">Área: ${cp.premio.area.nombre}</div>
          <div class="cert-deco-line"></div>
        </div>

        <!-- Bloque central: cuerpo del texto -->
        <div class="cert-body-block">
          <div class="cert-body">${texto.replace(/\n/g, '<br/>')}</div>
        </div>

        <!-- Bloque inferior: sello, firmas y fecha -->
        <div class="cert-bottom-block">
          <div class="cert-deco-line"></div>
          <div class="cert-bottom">
            ${selloHtml}
            ${firmantesHtml}
          </div>
          <div class="cert-fecha">Fecha de emisión: ${new Date(cert.fechaEmision).toLocaleDateString('es-BO')}</div>
        </div>

      </div>
      ${footerHtml}
    </div>`;
}

const CERT_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; background: #fff; color: #222; }

  /* ── Tamaños de página (dimensiones exactas = tamaño A4 menos márgenes @page) ── */
  @page horizontal-page { size: A4 landscape; margin: 7mm; }
  @page vertical-page   { size: A4 portrait;  margin: 8mm; }

  .cert-page {
    page-break-after: always;
    page-break-inside: avoid;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  /* A4 landscape 297×210mm - 2×7mm = 283×196mm */
  .cert-page.horizontal { page: horizontal-page; width: 283mm; height: 196mm; }
  /* A4 portrait 210×297mm - 2×8mm = 194×281mm */
  .cert-page.vertical   { page: vertical-page;  width: 194mm; height: 281mm; }

  /* ── Cabecera institucional (membrete) ── */
  .cert-membrete-header {
    display: flex; align-items: center; justify-content: space-between;
    gap: 8px; padding: 4px 12px 2px; flex-shrink: 0;
  }
  .cert-logo-box { width: 58px; min-width: 58px; text-align: center; }
  .cert-logo { max-width: 50px; max-height: 50px; object-fit: contain; }
  .cert-membrete-texto { flex: 1; text-align: center; }
  .cert-membrete-titulo {
    font-size: 11px; font-weight: bold; color: #1a237e;
    text-transform: uppercase; letter-spacing: 0.8px;
  }
  .cert-membrete-subtitulo { font-size: 9px; color: #444; margin-top: 1px; }
  .cert-membrete-dir       { font-size: 8px; color: #888; margin-top: 1px; }
  .cert-membrete-line {
    height: 1.5px;
    background: linear-gradient(90deg, transparent, #1a237e 20%, #1a237e 80%, transparent);
    margin: 0 12px 3px;
    flex-shrink: 0;
  }

  /* ── Caja principal del certificado ── */
  .cert-box {
    border: 2.5px solid #1a237e;
    outline: 4px double #1a237e;
    outline-offset: -8px;
    margin: 0 12px;
    /* padding-bottom >= outline-offset + outline-width/2 + clearance: 8+4+8=20px */
    padding: 10px 40px 20px;
    flex: 1;
    min-height: 0;
    text-align: center;
    display: flex;
    flex-direction: column;
    overflow: hidden;          /* impide que el contenido sobresalga del borde */
  }

  /* ── Bloque superior: título ── */
  .cert-top-block { flex-shrink: 0; }

  .cert-deco-line {
    height: 1.5px;
    background: linear-gradient(90deg, transparent, #1a237e 20%, #1a237e 80%, transparent);
    margin: 0 25px 6px;
  }

  .cert-title {
    font-size: 24px; font-weight: bold; color: #1a237e;
    letter-spacing: 6px; margin-bottom: 4px;
  }
  .cert-descriptor {
    font-size: 12px; font-weight: bold; color: #c62828;
    letter-spacing: 2px; text-transform: uppercase; margin-bottom: 2px;
  }
  .cert-event {
    font-size: 10px; color: #555;
    letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 2px;
  }
  .cert-area { font-size: 9.5px; color: #888; margin-bottom: 5px; }

  /* ── Bloque central: texto principal ── */
  .cert-body-block {
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px 8px;
    overflow: hidden;
  }
  .cert-body {
    font-size: 11.5px; line-height: 1.7; color: #333;
  }

  /* ── Bloque inferior: sello + firmantes + fecha ── */
  .cert-bottom-block { flex-shrink: 0; }

  .cert-bottom {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: 24px;
    flex-wrap: wrap;
    margin-bottom: 4px;
  }
  .cert-sello { width: 52px; height: 52px; object-fit: contain; opacity: 0.85; }

  .cert-firmantes { display: flex; gap: 22px; justify-content: center; flex-wrap: wrap; }
  .cert-firmante-item {
    display: flex; flex-direction: column; align-items: center; min-width: 100px;
  }
  .cert-firma-img     { max-width: 82px; max-height: 34px; object-fit: contain; margin-bottom: 2px; }
  .cert-firma-espacio { height: 34px; }
  .cert-firmante-linea {
    width: 100px; height: 1px; background: #555; margin-bottom: 2px;
  }
  .cert-firmante-nombre { font-size: 9.5px; font-weight: bold; color: #222; text-align: center; }
  .cert-firmante-cargo  { font-size: 8.5px; color: #555; text-align: center; }

  .cert-fecha { font-size: 9px; color: #999; text-align: center; margin-top: 3px; }

  /* ── Pie de página institucional ── */
  .cert-pie-pagina {
    font-size: 8px; color: #888; text-align: center;
    padding: 2px 12px;
    border-top: 1px solid #ddd;
    margin-top: 3px;
    flex-shrink: 0;
  }

  @media print {
    html, body { margin: 0; }
    .cert-page { page-break-after: always; }
  }
`;

// ── Comprobantes de división de premio ────────────────────────────────────────
const COMP_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Times New Roman', Georgia, serif; background: #fff; color: #222; }

  @page comp-page { size: A4 portrait; margin: 15mm; }

  .comp-page {
    page: comp-page;
    width: 180mm; height: 267mm;
    display: flex; flex-direction: column;
    overflow: hidden;
    page-break-after: always;
  }

  .comp-membrete-header {
    display: flex; align-items: center; justify-content: space-between;
    gap: 8px; padding: 4px 0 3px; flex-shrink: 0;
  }
  .comp-logo-box { width: 55px; min-width: 55px; text-align: center; }
  .comp-logo { max-width: 50px; max-height: 50px; object-fit: contain; }
  .comp-membrete-texto { flex: 1; text-align: center; }
  .comp-membrete-titulo { font-size: 12px; font-weight: bold; color: #1a237e; text-transform: uppercase; letter-spacing: 0.5px; }
  .comp-membrete-subtitulo { font-size: 9px; color: #444; margin-top: 1px; }
  .comp-membrete-dir { font-size: 8px; color: #888; margin-top: 1px; }
  .comp-membrete-line {
    height: 1.5px;
    background: linear-gradient(90deg, transparent, #1a237e 10%, #1a237e 90%, transparent);
    margin: 2px 0 5px; flex-shrink: 0;
  }

  .comp-box {
    border: 2px solid #1a237e;
    outline: 4px double #1a237e;
    outline-offset: -7px;
    flex: 1; min-height: 0;
    display: flex; flex-direction: column;
    padding: 16px 24px 20px;
    overflow: hidden;
    text-align: center;
  }

  .comp-deco-line {
    height: 1.5px;
    background: linear-gradient(90deg, transparent, #1a237e 15%, #1a237e 85%, transparent);
    margin: 0 20px 8px;
  }
  .comp-title { font-size: 20px; font-weight: bold; color: #1a237e; letter-spacing: 4px; margin-bottom: 3px; }
  .comp-subtitle { font-size: 13px; font-weight: bold; color: #c62828; letter-spacing: 2px; margin-bottom: 8px; }

  .comp-content { flex: 1; min-height: 0; padding: 6px 0; }

  .comp-info-table { width: 100%; border-collapse: collapse; margin-bottom: 18px; text-align: left; }
  .comp-info-table tr { border-bottom: 1px dotted #ddd; }
  .comp-lbl { font-size: 10.5px; color: #555; font-weight: 600; padding: 5px 12px 5px 0; width: 115px; vertical-align: top; }
  .comp-val { font-size: 11px; color: #222; padding: 5px 0; }

  .comp-amount-box {
    border: 2px solid #1a237e; border-radius: 4px;
    padding: 14px 24px; text-align: center;
    background: linear-gradient(135deg, #e8eaf6 0%, #f1f8e9 100%);
    margin: 0 12px;
  }
  .comp-amount-label { font-size: 11px; color: #1a237e; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 6px; }
  .comp-amount-value { font-size: 34px; font-weight: bold; color: #1b5e20; letter-spacing: 2px; margin-bottom: 4px; }
  .comp-amount-pct { font-size: 11px; color: #555; }

  .comp-firma-section {
    display: flex; justify-content: center; align-items: flex-end;
    gap: 40px; margin-top: 16px; flex-shrink: 0;
  }
  .comp-sello { width: 52px; height: 52px; object-fit: contain; opacity: 0.85; }
  .comp-firma-item { display: flex; flex-direction: column; align-items: center; }
  .comp-firma-img { max-width: 90px; max-height: 38px; object-fit: contain; margin-bottom: 2px; }
  .comp-firma-linea { width: 130px; height: 1px; background: #555; margin-bottom: 3px; }
  .comp-firma-nombre { font-size: 9.5px; font-weight: bold; color: #222; }
  .comp-firma-cargo  { font-size: 8.5px; color: #555; }

  .comp-fecha { font-size: 9px; color: #999; text-align: center; margin-top: 6px; flex-shrink: 0; }

  .comp-pie-pagina {
    font-size: 8px; color: #888; text-align: center;
    padding: 2px 0; border-top: 1px solid #ddd;
    margin-top: 4px; flex-shrink: 0;
  }

  @media print {
    html, body { margin: 0; }
    .comp-page { page-break-after: always; }
  }
`;

function buildComprobantePago(asig, ganador) {
  const cp = ganador.candidatoPremio;
  const membrete = cp.premio.evento?.membrete;
  const imgUrl = (path) => path ? `${BACKEND_MEDIA}${path}` : null;

  const logoUnidad      = imgUrl(membrete?.logoUnidad);
  const logoInstitucion = imgUrl(membrete?.logoInstitucion);
  const sello           = imgUrl(membrete?.selloAutoridad);
  const firmaGeneral    = imgUrl(membrete?.firma);

  const piePaginas = [membrete?.piePagina1, membrete?.piePagina2, membrete?.piePagina3].filter(Boolean);
  const descriptores = (cp.premio.premioDescriptores || []).map(pd => pd.descriptor.descripcion).join(' · ');
  const lugar        = LUGAR_MAP[cp.premio.numeroGanadores] || `${cp.premio.numeroGanadores}° Lugar`;
  const montoTotal   = parseFloat(cp.premio.monto);
  const montoAsig    = parseFloat(asig.montoAsignado);
  const pct          = parseFloat(asig.porcentaje);
  const fecha        = new Date().toLocaleDateString('es-BO', { year: 'numeric', month: 'long', day: 'numeric' });

  const fmt = (n) => n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const headerHtml = membrete ? `
    <div class="comp-membrete-header">
      <div class="comp-logo-box">${logoUnidad ? `<img src="${logoUnidad}" class="comp-logo" alt="Logo" />` : ''}</div>
      <div class="comp-membrete-texto">
        <div class="comp-membrete-titulo">${membrete.titulo || ''}</div>
        ${membrete.subtitulo ? `<div class="comp-membrete-subtitulo">${membrete.subtitulo}</div>` : ''}
        ${membrete.direccion ? `<div class="comp-membrete-dir">${membrete.direccion}</div>` : ''}
      </div>
      <div class="comp-logo-box">${logoInstitucion ? `<img src="${logoInstitucion}" class="comp-logo" alt="Logo" />` : ''}</div>
    </div>
    <div class="comp-membrete-line"></div>` : '';

  // Firmantes del membrete (si existen) o firma general
  const firmantesActivos = (membrete?.firmantes || []).filter(f => f.estado).sort((a, b) => a.orden - b.orden);
  const firmaItemsHtml = firmantesActivos.length > 0
    ? firmantesActivos.map(f => {
        const fImg = f.firmaImagen ? imgUrl(f.firmaImagen) : firmaGeneral;
        return `<div class="comp-firma-item">
          ${fImg ? `<img src="${fImg}" class="comp-firma-img" alt="Firma" />` : '<div style="height:38px"></div>'}
          <div class="comp-firma-linea"></div>
          <div class="comp-firma-nombre">${f.nombre}</div>
          <div class="comp-firma-cargo">${f.cargo}</div>
        </div>`;
      }).join('')
    : firmaGeneral
      ? `<div class="comp-firma-item">
           <img src="${firmaGeneral}" class="comp-firma-img" alt="Firma" />
           <div class="comp-firma-linea"></div>
         </div>`
      : '';

  return `
    <div class="comp-page">
      ${headerHtml}
      <div class="comp-box">
        <div class="comp-deco-line"></div>
        <div class="comp-title">COMPROBANTE DE ASIGNACIÓN</div>
        <div class="comp-subtitle">DE PREMIO MONETARIO</div>
        <div class="comp-deco-line"></div>

        <div class="comp-content">
          <table class="comp-info-table">
            <tr><td class="comp-lbl">Participante:</td><td class="comp-val"><strong>${asig.participante.nombre} ${asig.participante.apellido}</strong></td></tr>
            <tr><td class="comp-lbl">C.I.:</td><td class="comp-val">${asig.participante.ci}</td></tr>
            <tr><td class="comp-lbl">Proyecto:</td><td class="comp-val">"${cp.proyecto.titulo}"</td></tr>
            <tr><td class="comp-lbl">Evento:</td><td class="comp-val">${cp.premio.evento?.nombre || ''}</td></tr>
            <tr><td class="comp-lbl">Área:</td><td class="comp-val">${cp.premio.area?.nombre || ''}</td></tr>
            <tr><td class="comp-lbl">Premio:</td><td class="comp-val">${lugar}${descriptores ? ' — ' + descriptores : ''}</td></tr>
          </table>

          <div class="comp-amount-box">
            <div class="comp-amount-label">MONTO ASIGNADO</div>
            <div class="comp-amount-value">Bs. ${fmt(montoAsig)}</div>
            <div class="comp-amount-pct">${pct.toFixed(2)}% del premio total de Bs. ${fmt(montoTotal)}</div>
          </div>
        </div>

        <div class="comp-firma-section">
          ${sello ? `<img src="${sello}" class="comp-sello" alt="Sello" />` : ''}
          ${firmaItemsHtml}
        </div>
        <div class="comp-fecha">Santa Cruz de la Sierra, ${fecha}</div>
      </div>
      ${piePaginas.length ? `<div class="comp-pie-pagina">${piePaginas.join('  ·  ')}</div>` : ''}
    </div>`;
}

function imprimirComprobantes(ganador, showNotif) {
  const asigs = ganador.asignaciones || [];
  if (!asigs.length) return;
  const body = asigs.map(a => buildComprobantePago(a, ganador)).join('');
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Comprobantes — ${ganador.candidatoPremio.proyecto.titulo}</title><style>${COMP_CSS}</style></head><body>${body}</body></html>`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, '_blank');
  if (!win) {
    showNotif('El navegador bloqueó la ventana emergente. Permite pop-ups.', 'warning');
    URL.revokeObjectURL(url);
    return;
  }
  win.addEventListener('load', () => { win.focus(); win.print(); URL.revokeObjectURL(url); }, { once: true });
}

function imprimirComprobantePagado(asig, ganador, fechaPagoStr, showNotif) {
  const cp       = ganador.candidatoPremio;
  const membrete = cp.premio.evento?.membrete;
  const imgUrl   = (path) => path ? `${BACKEND_MEDIA}${path}` : null;

  const fechaObj  = fechaPagoStr ? new Date(fechaPagoStr) : new Date();
  const fechaPago = fechaObj.toLocaleDateString('es-BO', { year: 'numeric', month: 'long', day: 'numeric' });
  const horaPago  = fechaObj.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const refNum    = `COMP-${fechaObj.getFullYear()}-${String(asig.idAsignacionPremio).padStart(5, '0')}`;

  const lugar           = LUGAR_MAP[cp.premio.numeroGanadores] || `${cp.premio.numeroGanadores}° Lugar`;
  const fmt             = n => parseFloat(n).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const montoAsig       = parseFloat(asig.montoAsignado);
  const metodoPagoLabel = asig.metodoPago === 'qr' ? 'Código QR' : asig.metodoPago === 'efectivo' ? 'Efectivo' : '—';

  const logoUnidad      = imgUrl(membrete?.logoUnidad);
  const logoInstitucion = imgUrl(membrete?.logoInstitucion);
  const sello           = imgUrl(membrete?.selloAutoridad);
  const firmaGeneral    = imgUrl(membrete?.firma);
  const piePaginas      = [membrete?.piePagina1, membrete?.piePagina2, membrete?.piePagina3].filter(Boolean);

  const headerHtml = membrete ? `
    <div class="mbr-header">
      <div class="mbr-logo">${logoUnidad ? `<img src="${logoUnidad}" class="mbr-img" alt="Logo" />` : ''}</div>
      <div class="mbr-texto">
        <div class="mbr-titulo">${membrete.titulo || ''}</div>
        ${membrete.subtitulo ? `<div class="mbr-sub">${membrete.subtitulo}</div>` : ''}
        ${membrete.direccion ? `<div class="mbr-dir">${membrete.direccion}</div>` : ''}
      </div>
      <div class="mbr-logo">${logoInstitucion ? `<img src="${logoInstitucion}" class="mbr-img" alt="Logo" />` : ''}</div>
    </div>
    <div class="mbr-line"></div>` : '';

  const firmantesActivos = (membrete?.firmantes || []).filter(f => f.estado).sort((a, b) => a.orden - b.orden);
  const firmaItemsHtml = firmantesActivos.length > 0
    ? firmantesActivos.map(f => {
        const fImg = f.firmaImagen ? imgUrl(f.firmaImagen) : firmaGeneral;
        return `<div class="firma-item">
          ${fImg ? `<img src="${fImg}" class="firma-img" alt="Firma" />` : '<div style="height:38px"></div>'}
          <div class="firma-linea"></div>
          <div class="firma-nombre">${f.nombre}</div>
          <div class="firma-cargo">${f.cargo}</div>
        </div>`;
      }).join('')
    : firmaGeneral
      ? `<div class="firma-item"><img src="${firmaGeneral}" class="firma-img" alt="Firma" /><div class="firma-linea"></div></div>`
      : '';

  const COMP_PAGO_CSS = `
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:Arial,Helvetica,sans-serif; background:#fff; color:#222; }
    @page { size:A4 portrait; margin:15mm; }
    .pago-page { width:180mm; min-height:240mm; display:flex; flex-direction:column; }
    .mbr-header { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:4px 0 3px; }
    .mbr-logo { width:55px; min-width:55px; text-align:center; }
    .mbr-img { max-width:50px; max-height:50px; object-fit:contain; }
    .mbr-texto { flex:1; text-align:center; }
    .mbr-titulo { font-size:12px; font-weight:bold; color:#1a237e; text-transform:uppercase; letter-spacing:0.5px; }
    .mbr-sub { font-size:9px; color:#444; margin-top:1px; }
    .mbr-dir { font-size:8px; color:#888; margin-top:1px; }
    .mbr-line { height:1.5px; background:linear-gradient(90deg,transparent,#1a237e 10%,#1a237e 90%,transparent); margin:2px 0 5px; }
    .pago-box { border:2px solid #1a237e; outline:4px double #1a237e; outline-offset:-7px; flex:1; display:flex; flex-direction:column; padding:16px 22px 20px; }
    .title-row { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:14px; }
    .title-block .main-title { font-size:17px; font-weight:bold; color:#1a237e; letter-spacing:2px; }
    .title-block .sub-title { font-size:9px; color:#c62828; letter-spacing:1px; text-transform:uppercase; margin-top:3px; }
    .title-block .ref-num { font-size:8.5px; color:#666; margin-top:5px; font-family:monospace; letter-spacing:1px; }
    .pagado-badge { background:#e8f5e9; border:2px solid #2e7d32; color:#1b5e20; border-radius:6px; padding:7px 14px; text-align:center; font-size:11px; font-weight:bold; letter-spacing:2px; min-width:78px; }
    .pagado-badge .check { font-size:18px; display:block; margin-bottom:2px; }
    .sec-title { font-size:8px; font-weight:bold; letter-spacing:2px; text-transform:uppercase; color:#1a237e; border-bottom:1.5px solid #1a237e; padding-bottom:3px; margin:10px 0 5px; }
    .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:0 20px; }
    .field { padding:5px 0; border-bottom:1px dotted #ddd; }
    .field .lbl { font-size:8px; color:#aaa; text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:2px; }
    .field .val { font-size:11px; color:#222; font-weight:600; }
    .field-full { padding:5px 0; border-bottom:1px dotted #ddd; }
    .field-full .lbl { font-size:8px; color:#aaa; text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:2px; }
    .field-full .val { font-size:11px; color:#222; font-weight:600; }
    .amount-box { border:2px solid #2e7d32; border-radius:6px; padding:14px 24px; text-align:center; background:linear-gradient(135deg,#e8f5e9 0%,#f1f8e9 100%); margin:14px 0 10px; }
    .amount-lbl { font-size:8.5px; color:#2e7d32; text-transform:uppercase; letter-spacing:2px; margin-bottom:5px; }
    .amount-val { font-size:36px; font-weight:bold; color:#1b5e20; letter-spacing:2px; margin-bottom:4px; font-family:Georgia,serif; }
    .amount-note { font-size:10px; color:#555; }
    .firma-section { display:flex; justify-content:center; align-items:flex-end; gap:40px; margin-top:16px; }
    .firma-sello { width:52px; height:52px; object-fit:contain; opacity:0.85; }
    .firma-item { display:flex; flex-direction:column; align-items:center; }
    .firma-img { max-width:90px; max-height:38px; object-fit:contain; margin-bottom:2px; }
    .firma-linea { width:130px; height:1px; background:#555; margin-bottom:3px; }
    .firma-nombre { font-size:9.5px; font-weight:bold; color:#222; }
    .firma-cargo { font-size:8.5px; color:#555; }
    .pie-fecha { font-size:8.5px; color:#aaa; text-align:center; margin-top:10px; }
    .pie-pagina { font-size:8px; color:#888; text-align:center; padding:4px 0; border-top:1px solid #ddd; margin-top:6px; }
    @media print { html,body{margin:0;} .pago-page{page-break-after:always;} }
  `;

  const body = `
    <div class="pago-page">
      ${headerHtml}
      <div class="pago-box">
        <div class="title-row">
          <div class="title-block">
            <div class="main-title">COMPROBANTE DE PAGO</div>
            <div class="sub-title">Constancia de pago de premio monetario</div>
            <div class="ref-num">N° ${refNum}</div>
          </div>
          <div class="pagado-badge">
            <span class="check">✓</span>
            PAGADO
          </div>
        </div>

        <div class="sec-title">Datos del Beneficiario</div>
        <div class="grid2">
          <div class="field">
            <span class="lbl">Nombre completo</span>
            <span class="val">${asig.participante.nombre} ${asig.participante.apellido}</span>
          </div>
          <div class="field">
            <span class="lbl">Cédula de Identidad</span>
            <span class="val">${asig.participante.ci}</span>
          </div>
        </div>
        <div class="field-full">
          <span class="lbl">Proyecto</span>
          <span class="val">"${cp.proyecto.titulo}"</span>
        </div>
        <div class="grid2">
          <div class="field">
            <span class="lbl">Evento</span>
            <span class="val">${cp.premio.evento?.nombre || '—'}</span>
          </div>
          <div class="field">
            <span class="lbl">Área</span>
            <span class="val">${cp.premio.area?.nombre || '—'}</span>
          </div>
        </div>
        <div class="field-full">
          <span class="lbl">Premio</span>
          <span class="val">${lugar}</span>
        </div>

        <div class="sec-title">Datos de la Transacción</div>
        <div class="grid2">
          <div class="field">
            <span class="lbl">Método de pago</span>
            <span class="val">${metodoPagoLabel}</span>
          </div>
          <div class="field">
            <span class="lbl">Estado</span>
            <span class="val" style="color:#1b5e20;">✓ Completado</span>
          </div>
          <div class="field">
            <span class="lbl">Fecha de pago</span>
            <span class="val">${fechaPago}</span>
          </div>
          <div class="field">
            <span class="lbl">Hora</span>
            <span class="val">${horaPago}</span>
          </div>
        </div>

        <div class="amount-box">
          <div class="amount-lbl">Monto Pagado</div>
          <div class="amount-val">Bs. ${fmt(montoAsig)}</div>
          <div class="amount-note">Monto acreditado mediante ${metodoPagoLabel}</div>
        </div>

        <div class="firma-section">
          ${sello ? `<img src="${sello}" class="firma-sello" alt="Sello" />` : ''}
          ${firmaItemsHtml}
        </div>
        <div class="pie-fecha">Santa Cruz de la Sierra, ${fechaPago} — ${horaPago}</div>
      </div>
      ${piePaginas.length ? `<div class="pie-pagina">${piePaginas.join('  ·  ')}</div>` : ''}
    </div>`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Comprobante de Pago — ${asig.participante.nombre} ${asig.participante.apellido}</title><style>${COMP_PAGO_CSS}</style></head><body>${body}</body></html>`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, '_blank');
  if (!win) { showNotif('El navegador bloqueó la ventana emergente. Permite pop-ups.', 'warning'); URL.revokeObjectURL(url); return; }
  win.addEventListener('load', () => { win.focus(); win.print(); URL.revokeObjectURL(url); }, { once: true });
}

function imprimirCertificados(certs, showNotif) {
  if (!certs.length) return;
  const body = certs.map(buildCertPage).join('');
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Certificados — Expociencia</title><style>${CERT_CSS}</style></head><body>${body}</body></html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');

  if (!win) {
    showNotif('El navegador bloqueó la ventana emergente. Permite pop-ups para esta página.', 'warning');
    URL.revokeObjectURL(url);
    return;
  }
  win.addEventListener('load', () => {
    win.focus();
    win.print();
    URL.revokeObjectURL(url);
  }, { once: true });
}

// ── Tab 1: Plantillas ─────────────────────────────────────────────────────────
function PlantillasTab({ plantillas, refetch, showNotif }) {
  const [crearPlantilla] = useMutation(CREAR_PLANTILLA);
  const [editarPlantilla] = useMutation(EDITAR_PLANTILLA);
  const [eliminarPlantilla] = useMutation(ELIMINAR_PLANTILLA);

  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState({ open: false, item: null });
  const [form, setForm] = useState({ descripcion: '', contenido: '', orientacion: 'horizontal' });
  const [preview, setPreview] = useState(null);
  const [confirm, setConfirm] = useState({ open: false, id: null });

  const openDialog = (item = null) => {
    setForm(item
      ? { descripcion: item.descripcion, contenido: item.contenido, orientacion: item.orientacion?.toLowerCase() || 'horizontal' }
      : { descripcion: '', contenido: '', orientacion: 'horizontal' });
    setDialog({ open: true, item });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let res;
      if (dialog.item) {
        res = (await editarPlantilla({ variables: { idPlantilla: dialog.item.idPlantilla, ...form } })).data?.editarPlantilla;
      } else {
        res = (await crearPlantilla({ variables: form })).data?.crearPlantilla;
      }
      if (res?.ok) { showNotif('Plantilla guardada'); refetch(); setDialog({ open: false, item: null }); }
      else showNotif(res?.error || 'Error', 'error');
    } catch { showNotif('Error de conexión', 'error'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    try {
      const res = (await eliminarPlantilla({ variables: { idPlantilla: confirm.id } })).data?.eliminarPlantilla;
      if (res?.ok) { showNotif('Plantilla desactivada'); refetch(); }
      else showNotif(res?.error || 'Error', 'error');
    } catch { showNotif('Error de conexión', 'error'); }
    setConfirm({ open: false, id: null });
  };

  const insertToken = (token) => setForm(p => ({ ...p, contenido: p.contenido + token }));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Plantillas de Certificado</Typography>
        <Button variant="contained" startIcon={<PlusOutlined />} onClick={() => openDialog()}>Nueva Plantilla</Button>
      </Box>

      <TableContainer component={Paper} elevation={0}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width={60}>ID</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell width={110} align="center">Formato</TableCell>
              <TableCell>Contenido (vista previa)</TableCell>
              <TableCell align="center">Estado</TableCell>
              <TableCell align="right" width={140}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {plantillas.map(p => (
              <TableRow key={p.idPlantilla} hover>
                <TableCell>{p.idPlantilla}</TableCell>
                <TableCell><Typography fontWeight={500}>{p.descripcion}</Typography></TableCell>
                <TableCell align="center">
                  <Chip
                    label={p.orientacion?.toLowerCase() === 'vertical' ? 'Vertical' : 'Horizontal'}
                    size="small"
                    color={p.orientacion?.toLowerCase() === 'vertical' ? 'secondary' : 'info'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary"
                    sx={{ fontFamily: 'monospace', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {p.contenido}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip label={p.estado ? 'Activa' : 'Inactiva'} size="small" color={p.estado ? 'success' : 'default'} />
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" justifyContent="flex-end" flexWrap="nowrap">
                    <Tooltip title="Ver plantilla">
                      <IconButton size="small" color="secondary" onClick={() => setPreview(p)}><FileTextOutlined /></IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton size="small" color="primary" onClick={() => openDialog(p)}><EditOutlined /></IconButton>
                    </Tooltip>
                    <Tooltip title="Desactivar">
                      <IconButton size="small" color="error" onClick={() => setConfirm({ open: true, id: p.idPlantilla })}><DeleteOutlined /></IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {plantillas.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>Sin plantillas registradas.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Editor Dialog */}
      <Dialog open={dialog.open} onClose={() => setDialog({ open: false, item: null })} maxWidth="md" fullWidth>
        <DialogTitle>{dialog.item ? 'Editar Plantilla' : 'Nueva Plantilla'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Descripción de la plantilla" fullWidth value={form.descripcion}
              onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))} />

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                Formato del certificado
              </Typography>
              <ToggleButtonGroup
                value={form.orientacion}
                exclusive
                onChange={(_, v) => v && setForm(p => ({ ...p, orientacion: v }))}
                size="small"
              >
                <ToggleButton value="horizontal">Horizontal (A4 apaisado)</ToggleButton>
                <ToggleButton value="vertical">Vertical (A4 retrato)</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                Variables disponibles (clic para insertar):
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mb: 1 }}>
                {VARIABLES_HINT.map(v => (
                  <Tooltip key={v.token} title={v.desc}>
                    <Chip label={v.token} size="small" variant="outlined" color="primary"
                      onClick={() => insertToken(v.token)} sx={{ cursor: 'pointer', fontFamily: 'monospace' }} />
                  </Tooltip>
                ))}
              </Stack>
            </Box>
            <TextField label="Contenido del certificado" fullWidth multiline rows={8} value={form.contenido}
              onChange={e => setForm(p => ({ ...p, contenido: e.target.value }))}
              placeholder="Ej: Se otorga el presente certificado a los integrantes del proyecto {{Nombre_Proyecto}} por haber obtenido {{Descriptor}} en el área de {{Area}} en {{Evento}}, con una nota de {{Nota}}."
              inputProps={{ style: { lineHeight: 1.8 } }} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog({ open: false, item: null })} color="secondary">Cancelar</Button>
          <Button variant="contained" disabled={!form.descripcion.trim() || !form.contenido.trim() || saving} onClick={handleSave}>
            {saving ? <CircularProgress size={22} color="inherit" /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!preview} onClose={() => setPreview(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Vista previa — {preview?.descripcion}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1}>
            <Chip
              label={preview?.orientacion === 'vertical' ? 'Formato Vertical' : 'Formato Horizontal'}
              size="small"
              color={preview?.orientacion === 'vertical' ? 'secondary' : 'info'}
              variant="outlined"
              sx={{ width: 'fit-content' }}
            />
            <Box sx={{ p: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, minHeight: 120 }}>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.9 }}>{preview?.contenido}</Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreview(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirm.open}
        title="Desactivar plantilla"
        message="¿Estás seguro de que deseas desactivar esta plantilla? Ya no estará disponible para nuevos certificados."
        confirmLabel="Desactivar"
        onConfirm={handleDelete}
        onCancel={() => setConfirm({ open: false, id: null })}
      />
    </Box>
  );
}

// ── Tab 2: Certificados ───────────────────────────────────────────────────────
function CertificadosTab({ certificados, ganadores, plantillas, refetch, showNotif }) {
  const [crearCertificado] = useMutation(CREAR_CERTIFICADO);
  const [eliminarCertificado] = useMutation(ELIMINAR_CERTIFICADO);

  const [saving, setSaving] = useState(false);
  const [batchSaving, setBatchSaving] = useState(false);
  const [genDialog, setGenDialog] = useState({ open: false });
  const [batchDialog, setBatchDialog] = useState({ open: false });
  const [form, setForm] = useState({ idGanadorPremio: '', idPlantilla: '' });
  const [batchPlantilla, setBatchPlantilla] = useState('');
  const [confirm, setConfirm] = useState({ open: false, id: null });
  const [printAllConfirm, setPrintAllConfirm] = useState(false);
  const [expandidos, setExpandidos] = useState(new Set());
  const toggleExpandido = (key) => setExpandidos(prev => {
    const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next;
  });

  const plantillasActivas = plantillas.filter(p => p.estado);
  const ganadoresActivos  = ganadores.filter(g => g.estado);
  const certActivos       = certificados.filter(c => c.estado);

  const ganadoresConCert = new Set(certActivos.map(c => c.ganadorPremio?.idGanadorPremio));
  const ganadores_pendientes = ganadoresActivos.filter(g => !ganadoresConCert.has(g.idGanadorPremio));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = (await crearCertificado({ variables: form })).data?.crearCertificado;
      if (res?.ok) {
        showNotif('Certificado generado exitosamente');
        refetch();
        setGenDialog({ open: false });
        setForm({ idGanadorPremio: '', idPlantilla: '' });
      } else showNotif(res?.error || 'Error al generar', 'error');
    } catch { showNotif('Error de conexión', 'error'); }
    setSaving(false);
  };

  const handleBatchGenerate = async () => {
    if (!batchPlantilla || ganadores_pendientes.length === 0) return;
    setBatchSaving(true);
    let ok = 0; let err = 0;
    for (const g of ganadores_pendientes) {
      try {
        const res = (await crearCertificado({
          variables: { idGanadorPremio: g.idGanadorPremio, idPlantilla: batchPlantilla }
        })).data?.crearCertificado;
        res?.ok ? ok++ : err++;
      } catch { err++; }
    }
    refetch();
    showNotif(`${ok} certificado(s) generado(s)${err > 0 ? `. ${err} error(es).` : '.'}`, err > 0 ? 'warning' : 'success');
    setBatchDialog({ open: false });
    setBatchPlantilla('');
    setBatchSaving(false);
  };

  const handleDelete = async () => {
    try {
      const res = (await eliminarCertificado({ variables: { idCertificado: confirm.id } })).data?.eliminarCertificado;
      if (res?.ok) { showNotif('Certificado eliminado'); refetch(); }
      else showNotif(res?.error || 'Error', 'error');
    } catch { showNotif('Error de conexión', 'error'); }
    setConfirm({ open: false, id: null });
  };

  const handleSelectGanador = (idGanador) => {
    const g = ganadores.find(x => x.idGanadorPremio === idGanador);
    const pos = g?.candidatoPremio?.premio?.numeroGanadores;
    let sugerida = '';
    if (pos) {
      const keywords = { 1: ['1er', 'primer', 'primero'], 2: ['2do', 'segundo'], 3: ['3er', 'tercero'] }[pos] || [];
      const match = plantillasActivas.find(pl =>
        keywords.some(k => pl.descripcion.toLowerCase().includes(k))
      );
      if (match) sugerida = match.idPlantilla;
    }
    setForm(p => ({ ...p, idGanadorPremio: idGanador, idPlantilla: sugerida || p.idPlantilla }));
  };

  const selectedGanador   = ganadores.find(g => g.idGanadorPremio === form.idGanadorPremio);
  const selectedPlantilla = plantillas.find(p => p.idPlantilla === form.idPlantilla);
  const previewTexto = selectedGanador && selectedPlantilla
    ? resolverContenido(selectedPlantilla.contenido, selectedGanador) : null;

  // Membrete del ganador seleccionado (para mostrar en vista previa)
  const previewMembrete = selectedGanador?.candidatoPremio?.premio?.evento?.membrete;

  const certPorOferta = certActivos.reduce((acc, cert) => {
    const oferta = cert.ganadorPremio?.candidatoPremio?.proyecto?.ofertaEaCarrera?.oferta;
    const key = oferta?.idOferta || 'sin_oferta';
    if (!acc[key]) acc[key] = { oferta, certs: [] };
    acc[key].certs.push(cert);
    return acc;
  }, {});
  const gruposCert = Object.values(certPorOferta);

  return (
    <Box>
      {ganadores_pendientes.length > 0 && (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          action={
            <Button size="small" color="warning" variant="contained"
              onClick={() => setBatchDialog({ open: true })}>
              Generar Pendientes ({ganadores_pendientes.length})
            </Button>
          }
        >
          <strong>{ganadores_pendientes.length}</strong> ganador(es) aún no tienen certificado emitido.
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Certificados Emitidos</Typography>
        <Stack direction="row" gap={1}>
          <Button variant="outlined" startIcon={<PrinterOutlined />}
            onClick={() => setPrintAllConfirm(true)} disabled={certActivos.length === 0}>
            Imprimir Todos ({certActivos.length})
          </Button>
          <Button variant="contained" startIcon={<PlusOutlined />} onClick={() => setGenDialog({ open: true })}>
            Generar Certificado
          </Button>
        </Stack>
      </Box>

      {gruposCert.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>Sin certificados generados.</Box>
      ) : gruposCert.map(grupo => {
        const key = grupo.oferta?.idOferta || 'sin_oferta';
        const isOpen = expandidos.has(key);
        const certsOrdenados = [...grupo.certs].sort((a, b) =>
          (a.ganadorPremio?.candidatoPremio?.premio?.numeroGanadores || 99) -
          (b.ganadorPremio?.candidatoPremio?.premio?.numeroGanadores || 99)
        );
        return (
          <Box key={key} sx={{ mb: 2 }}>
            <Box sx={{
              px: 2, py: 1.25,
              borderRadius: isOpen ? '8px 8px 0 0' : 1.5,
              background: 'linear-gradient(135deg, rgba(24,144,255,0.08), rgba(24,144,255,0.02))',
              border: '1px solid rgba(24,144,255,0.25)',
              display: 'flex', alignItems: 'center', gap: 1.5,
            }}>
              <FilePdfOutlined style={{ color: '#1890ff', fontSize: 17 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                  {grupo.oferta?.nombre || 'Sin Oferta'}
                </Typography>
              </Box>
              <Tooltip title={`Imprimir los ${grupo.certs.length} certificado(s) de esta oferta`}>
                <IconButton size="small" color="primary"
                  onClick={() => imprimirCertificados(grupo.certs, showNotif)}>
                  <PrinterOutlined />
                </IconButton>
              </Tooltip>
              <Chip
                label={isOpen ? `▲ ${grupo.certs.length} certificado(s)` : `▼ ${grupo.certs.length} certificado(s)`}
                size="small" color="primary"
                variant={isOpen ? 'filled' : 'outlined'}
                onClick={() => toggleExpandido(key)}
                sx={{ cursor: 'pointer', fontWeight: 600, userSelect: 'none' }}
              />
            </Box>

            {isOpen && (
              <TableContainer component={Paper} elevation={0}
                sx={{ border: '1px solid rgba(24,144,255,0.25)', borderTop: 'none', borderRadius: '0 0 8px 8px' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell width={120} align="center">Lugar</TableCell>
                      <TableCell>Proyecto</TableCell>
                      <TableCell>Plantilla</TableCell>
                      <TableCell width={90} align="center">Formato</TableCell>
                      <TableCell>Membrete</TableCell>
                      <TableCell align="center">Nota</TableCell>
                      <TableCell>Fecha Emisión</TableCell>
                      <TableCell align="right" width={90}>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {certsOrdenados.map(cert => {
                      const cp = cert.ganadorPremio.candidatoPremio;
                      const membrete = cp.premio?.evento?.membrete;
                      return (
                        <TableRow key={cert.idCertificado} hover>
                          <TableCell align="center">
                            <Typography fontWeight={700} fontSize={14}>
                              {posLabel(cp.premio?.numeroGanadores)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>{cp.proyecto.titulo}</Typography>
                            <Typography variant="caption" color="text.secondary">{cp.premio.area.nombre}</Typography>
                          </TableCell>
                          <TableCell>{cert.plantilla.descripcion}</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={cert.plantilla.orientacion?.toLowerCase() === 'vertical' ? 'Vertical' : 'Horizontal'}
                              size="small"
                              color={cert.plantilla.orientacion?.toLowerCase() === 'vertical' ? 'secondary' : 'info'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {membrete?.titulo || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={cp.nota} color="primary" size="small" />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{new Date(cert.fechaEmision).toLocaleDateString('es-BO')}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="Imprimir">
                              <IconButton size="small" color="primary"
                                onClick={() => imprimirCertificados([cert], showNotif)}>
                                <PrinterOutlined />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Eliminar">
                              <IconButton size="small" color="error"
                                onClick={() => setConfirm({ open: true, id: cert.idCertificado })}>
                                <DeleteOutlined />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        );
      })}

      {/* ── Generar uno ── */}
      <Dialog open={genDialog.open}
        onClose={() => { setGenDialog({ open: false }); setForm({ idGanadorPremio: '', idPlantilla: '' }); }}
        maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" gap={1}>
            <FilePdfOutlined style={{ color: '#ff4d4f' }} />
            Generar Certificado
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel>Ganador</InputLabel>
              <Select value={form.idGanadorPremio} label="Ganador"
                onChange={e => handleSelectGanador(e.target.value)}>
                {ganadores_pendientes.map(g => {
                  const cp = g.candidatoPremio;
                  return (
                    <MenuItem key={g.idGanadorPremio} value={g.idGanadorPremio}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight={500}>{cp.proyecto.titulo}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {posLabel(cp.premio?.numeroGanadores)} — {cp.proyecto?.ofertaEaCarrera?.oferta?.nombre || cp.premio.area.nombre} · Nota: {cp.nota}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>

            {/* Membrete del evento seleccionado */}
            {previewMembrete && (
              <Alert severity="info" icon={false} sx={{ py: 0.5 }}>
                <Typography variant="caption">
                  <strong>Membrete:</strong> {previewMembrete.titulo}
                  {previewMembrete.firmantes?.filter(f => f.estado).length > 0 && (
                    <> · <strong>Firmantes:</strong> {previewMembrete.firmantes.filter(f => f.estado).map(f => f.nombre).join(', ')}</>
                  )}
                </Typography>
              </Alert>
            )}

            <FormControl fullWidth required>
              <InputLabel>Plantilla</InputLabel>
              <Select value={form.idPlantilla} label="Plantilla"
                onChange={e => setForm(p => ({ ...p, idPlantilla: e.target.value }))}>
                {plantillasActivas.map(pl => (
                  <MenuItem key={pl.idPlantilla} value={pl.idPlantilla}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{pl.descripcion}</span>
                      <Chip
                        label={pl.orientacion?.toLowerCase() === 'vertical' ? 'Vertical' : 'Horizontal'}
                        size="small"
                        color={pl.orientacion?.toLowerCase() === 'vertical' ? 'secondary' : 'info'}
                        variant="outlined"
                      />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              {form.idPlantilla && selectedGanador && (() => {
                const pos = selectedGanador.candidatoPremio?.premio?.numeroGanadores;
                const keywords = { 1: ['1er', 'primer'], 2: ['2do', 'segundo'], 3: ['3er', 'tercero'] }[pos] || [];
                const isSuggested = keywords.some(k => selectedPlantilla?.descripcion?.toLowerCase().includes(k));
                return isSuggested
                  ? <Typography variant="caption" color="success.main">✓ Plantilla sugerida para {LUGAR_MAP[pos]}</Typography>
                  : null;
              })()}
            </FormControl>

            {previewTexto && (
              <>
                <Divider />
                <Typography variant="subtitle2">Vista previa del contenido</Typography>
                <Box sx={{ p: 3, border: '4px double', borderColor: 'primary.main', borderRadius: 1,
                  textAlign: 'center', bgcolor: 'background.paper' }}>
                  <Typography variant="h5" fontWeight={700} letterSpacing={3} color="primary.main" sx={{ mb: 1 }}>
                    CERTIFICADO
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 2 }}>
                    {previewTexto}
                  </Typography>
                </Box>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setGenDialog({ open: false }); setForm({ idGanadorPremio: '', idPlantilla: '' }); }} color="secondary">Cancelar</Button>
          <Button variant="contained" disabled={!form.idGanadorPremio || !form.idPlantilla || saving} onClick={handleSave}>
            {saving ? <CircularProgress size={22} color="inherit" /> : 'Generar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Generar en lote ── */}
      <Dialog open={batchDialog.open} onClose={() => setBatchDialog({ open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" gap={1}>
            <FilePdfOutlined style={{ color: '#faad14' }} />
            Generar Certificados Pendientes
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Alert severity="info">
              Se generará un certificado para los <strong>{ganadores_pendientes.length}</strong> ganador(es) sin certificado usando la plantilla seleccionada.
            </Alert>
            <Box>
              {ganadores_pendientes.map(g => {
                const cp = g.candidatoPremio;
                const membrete = cp.premio?.evento?.membrete;
                return (
                  <Box key={g.idGanadorPremio} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography fontSize={16}>{posLabel(cp.premio?.numeroGanadores)}</Typography>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={500}>{cp.proyecto.titulo}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {cp.proyecto?.ofertaEaCarrera?.oferta?.nombre || cp.premio.area.nombre} · Nota: {cp.nota}
                        {membrete && <> · Membrete: {membrete.titulo}</>}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
            <FormControl fullWidth required>
              <InputLabel>Plantilla para todos</InputLabel>
              <Select value={batchPlantilla} label="Plantilla para todos"
                onChange={e => setBatchPlantilla(e.target.value)}>
                {plantillasActivas.map(pl => (
                  <MenuItem key={pl.idPlantilla} value={pl.idPlantilla}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{pl.descripcion}</span>
                      <Chip
                        label={pl.orientacion?.toLowerCase() === 'vertical' ? 'Vertical' : 'Horizontal'}
                        size="small"
                        color={pl.orientacion?.toLowerCase() === 'vertical' ? 'secondary' : 'info'}
                        variant="outlined"
                      />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBatchDialog({ open: false })} color="secondary">Cancelar</Button>
          <Button variant="contained" color="warning" disabled={!batchPlantilla || batchSaving} onClick={handleBatchGenerate}>
            {batchSaving ? <CircularProgress size={22} color="inherit" /> : `Generar ${ganadores_pendientes.length} certificado(s)`}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirm.open}
        title="Eliminar certificado"
        message="¿Eliminar este certificado?"
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setConfirm({ open: false, id: null })}
      />

      <ConfirmDialog
        open={printAllConfirm}
        title="Imprimir todos los certificados"
        message={`Se abrirá una ventana de impresión con ${certActivos.length} certificado(s). ¿Continuar?`}
        confirmLabel="Imprimir"
        confirmColor="primary"
        onConfirm={() => { setPrintAllConfirm(false); imprimirCertificados(certActivos, showNotif); }}
        onCancel={() => setPrintAllConfirm(false)}
      />
    </Box>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
// ── División de Premio Monetario ──────────────────────────────────────────────
function getDivisionStatus(ganador) {
  const asigs = ganador.asignaciones || [];
  if (!asigs.length) return 'sin_dividir';
  const allPrinted = asigs.every(a => a.impresa);
  if (allPrinted) return 'impresa';
  return 'dividida';
}

const STATUS_CHIP = {
  sin_dividir: { label: 'Sin dividir',  color: 'default' },
  dividida:    { label: 'Dividida',     color: 'warning' },
  impresa:     { label: 'Impresa 🔒',   color: 'success' },
};

function DivisionDialog({ open, ganador, onClose, onSaved, showNotif }) {
  const participantes = ganador?.candidatoPremio?.proyecto?.participantes || [];
  const montoTotal    = parseFloat(ganador?.candidatoPremio?.premio?.monto || 0);
  const status        = ganador ? getDivisionStatus(ganador) : 'sin_dividir';
  const locked        = status === 'impresa';

  const mkRow = (p, monto, pct) => ({
    idParticipante: p.idParticipante,
    nombre: `${p.nombre} ${p.apellido}`,
    monto: monto.toFixed(2),
    porcentaje: pct.toFixed(2),
  });

  const initRows = () => {
    const asigs = ganador?.asignaciones || [];
    if (asigs.length) {
      return participantes.map(p => {
        const a = asigs.find(a => a.participante.idParticipante === p.idParticipante);
        return mkRow(p, a ? parseFloat(a.montoAsignado) : 0, a ? parseFloat(a.porcentaje) : 0);
      });
    }
    // default: partes iguales
    const n = participantes.length || 1;
    return participantes.map(p => mkRow(p, montoTotal / n, 100 / n));
  };

  const [mode, setMode]   = useState('igual');
  const [rows, setRows]   = useState([]);
  const [saving, setSaving] = useState(false);
  const [guardar]         = useMutation(GUARDAR_DIVISION);

  useEffect(() => {
    if (open && ganador) {
      const has = (ganador.asignaciones || []).length > 0;
      setMode(has ? 'manual' : 'igual');
      setRows(initRows());
    }
  }, [open, ganador]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyEqual = () => {
    const n = participantes.length || 1;
    const base = montoTotal / n;
    setRows(rows.map((r, i) => {
      const m = i === n - 1 ? montoTotal - base * (n - 1) : base;
      return { ...r, monto: m.toFixed(2), porcentaje: (m / montoTotal * 100).toFixed(2) };
    }));
  };

  const handleModeChange = (_, v) => {
    if (!v) return;
    setMode(v);
    if (v === 'igual') applyEqual();
  };

  const updateMonto = (idx, val) => {
    const m = parseFloat(val) || 0;
    setRows(rows.map((r, i) => i === idx
      ? { ...r, monto: val, porcentaje: montoTotal ? (m / montoTotal * 100).toFixed(2) : '0.00' }
      : r
    ));
  };

  const updatePct = (idx, val) => {
    const p = parseFloat(val) || 0;
    setRows(rows.map((r, i) => i === idx
      ? { ...r, porcentaje: val, monto: (p / 100 * montoTotal).toFixed(2) }
      : r
    ));
  };

  const totalMonto  = rows.reduce((s, r) => s + (parseFloat(r.monto) || 0), 0);
  const totalPct    = rows.reduce((s, r) => s + (parseFloat(r.porcentaje) || 0), 0);
  const sumOk       = Math.abs(totalMonto - montoTotal) <= 0.02;

  const handleSave = async () => {
    if (!sumOk) return;
    setSaving(true);
    try {
      const asignaciones = rows.map(r => ({
        idParticipante: r.idParticipante,
        montoAsignado:  parseFloat(r.monto),
        porcentaje:     parseFloat(r.porcentaje),
        observacion:    '',
      }));
      const res = await guardar({ variables: { idGanadorPremio: ganador.idGanadorPremio, asignaciones } });
      if (res.data?.guardarDivisionPremio?.ok) {
        showNotif('División guardada correctamente', 'success');
        onSaved();
        onClose();
      } else {
        showNotif(res.data?.guardarDivisionPremio?.error || 'Error al guardar', 'error');
      }
    } catch (e) {
      showNotif(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!ganador) return null;
  const cp = ganador.candidatoPremio;
  const descriptores = (cp.premio.premioDescriptores || []).map(pd => pd.descriptor.descripcion).join(' · ');
  const lugar = LUGAR_MAP[cp.premio.numeroGanadores] || `${cp.premio.numeroGanadores}° Lugar`;
  const fmt = (n) => parseFloat(n).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" gap={1}>
            <Box component="span" sx={{ color: 'success.main', display: 'inline-flex' }}>
              <DollarCircleOutlined style={{ fontSize: 20 }} />
            </Box>
            División de Premio — {cp.proyecto.titulo}
          </Stack>
          {locked && <Chip label="Impresa 🔒 (no editable)" size="small" color="success"
            variant="outlined" sx={{ borderRadius: '999px', fontWeight: 700 }} />}
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        {/* Info del premio */}
        <Box sx={{ mb: 2, p: 1.5, bgcolor: 'action.selected', borderRadius: 1 }}>
          <Stack direction="row" gap={3} flexWrap="wrap">
            <Typography variant="body2"><strong>Evento:</strong> {cp.premio.evento?.nombre}</Typography>
            <Typography variant="body2"><strong>Área:</strong> {cp.premio.area?.nombre}</Typography>
            <Typography variant="body2"><strong>Premio:</strong> {lugar}{descriptores ? ' — ' + descriptores : ''}</Typography>
            <Typography variant="body2"><strong>Monto total:</strong> Bs. {fmt(montoTotal)}</Typography>
          </Stack>
        </Box>

        {!locked && (
          <Stack direction="row" alignItems="center" gap={2} sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">Modo:</Typography>
            <ToggleButtonGroup size="small" value={mode} exclusive onChange={handleModeChange}>
              <ToggleButton value="igual">Partes iguales</ToggleButton>
              <ToggleButton value="manual">Manual</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        )}

        {/* Tabla de asignaciones */}
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Participante</TableCell>
              <TableCell align="right" sx={{ width: 160 }}>Monto (Bs.)</TableCell>
              <TableCell align="right" sx={{ width: 130 }}>Porcentaje (%)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={r.idParticipante}>
                <TableCell>{r.nombre}</TableCell>
                <TableCell align="right">
                  {locked ? (
                    <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 700 }}>Bs. {fmt(r.monto)}</Typography>
                  ) : (
                    <TextField
                      size="small" type="number" value={r.monto}
                      onChange={e => updateMonto(i, e.target.value)}
                      disabled={mode === 'igual'}
                      inputProps={{ min: 0, step: 0.01, style: { textAlign: 'right' } }}
                      InputProps={{ startAdornment: <InputAdornment position="start">Bs.</InputAdornment> }}
                      sx={{ width: 140 }}
                    />
                  )}
                </TableCell>
                <TableCell align="right">
                  {locked ? (
                    <Typography variant="body2">{parseFloat(r.porcentaje).toFixed(2)}%</Typography>
                  ) : (
                    <TextField
                      size="small" type="number" value={r.porcentaje}
                      onChange={e => updatePct(i, e.target.value)}
                      disabled={mode === 'igual'}
                      inputProps={{ min: 0, max: 100, step: 0.01, style: { textAlign: 'right' } }}
                      InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                      sx={{ width: 110 }}
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableBody>
            <TableRow sx={{ borderTop: '2px solid', borderColor: sumOk ? 'success.main' : 'error.main' }}>
              <TableCell><strong>TOTAL</strong></TableCell>
              <TableCell align="right">
                <Typography variant="body2" fontWeight={700} color={sumOk ? 'success.main' : 'error.main'}>
                  Bs. {fmt(totalMonto)}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2" fontWeight={700} color={sumOk ? 'success.main' : 'error.main'}>
                  {totalPct.toFixed(2)}%
                </Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        {!sumOk && (
          <Alert severity="error" sx={{ mt: 1 }}>
            La suma (Bs. {fmt(totalMonto)}) no coincide con el monto total del premio (Bs. {fmt(montoTotal)}).
            Diferencia: Bs. {fmt(Math.abs(totalMonto - montoTotal))}.
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="secondary">Cerrar</Button>
        {!locked && (
          <Button variant="contained" color="primary" disabled={!sumOk || saving}
            onClick={handleSave} startIcon={saving ? <CircularProgress size={16} /> : null}>
            {saving ? 'Guardando…' : 'Guardar División'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

const ESTADO_PAGO_CFG = {
  sin_configurar: { label: 'Sin configurar', color: 'default' },
  configurado:    { label: 'Pendiente pago', color: 'warning' },
  pagado:         { label: 'Pagado',          color: 'success' },
};

function GestionPagosDialog({ open, ganador, onClose, refetch, showNotif, localPagos, updatePago }) {
  const [configurarMetodo, { loading: configuring }]       = useMutation(CONFIGURAR_METODO_PAGO);
  const [marcarPagada, { loading: marking }]               = useMutation(MARCAR_ASIGNACION_PAGADA);
  const [subirComprobante, { loading: subiendoComp }]      = useMutation(SUBIR_COMPROBANTE_PAGO);
  const [qrModal, setQrModal]                     = useState(null);
  const [confirmPagoId, setConfirmPagoId]         = useState(null);
  const [comprobanteModal, setComprobanteModal]   = useState(null);
  const [localComprobantes, setLocalComprobantes] = useState({});
  const [compUploadId, setCompUploadId]           = useState(null);
  const compInputRef                              = useRef(null);

  // Al cerrar el dialog limpiar solo el confirm pendiente
  useEffect(() => { if (!open) setConfirmPagoId(null); }, [open]);

  const handleSubirComprobante = (idAsignacion) => {
    setCompUploadId(idAsignacion);
    compInputRef.current?.click();
  };

  const handleComprobanteFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !compUploadId) return;
    if (!file.type.startsWith('image/')) { showNotif('Solo se aceptan imágenes', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { showNotif('La imagen no debe superar 5 MB', 'error'); return; }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result;
      try {
        const res = await subirComprobante({ variables: { idAsignacionPremio: compUploadId, comprobanteBase64: base64 } });
        if (res.data?.subirComprobantePago?.ok) {
          setLocalComprobantes(prev => ({ ...prev, [compUploadId]: base64 }));
          showNotif('Foto del comprobante guardada', 'success');
          refetch();
        } else showNotif(res.data?.subirComprobantePago?.error || 'Error al subir', 'error');
      } catch (err) { showNotif(err.message, 'error'); }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const asigs    = ganador?.asignaciones || [];
  const montoTotal = parseFloat(ganador?.candidatoPremio?.premio?.monto || 0);
  const fmt      = n => parseFloat(n).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Lectura que prioriza estado local (persiste en DivisionTab) sobre el prop del servidor
  const getMetodo = (a) => localPagos[a.idAsignacionPremio]?.metodo ?? a.metodoPago ?? 'pendiente';
  const getEstado = (a) => localPagos[a.idAsignacionPremio]?.estado ?? a.estadoPago  ?? 'sin_configurar';
  const getFecha  = (a) => localPagos[a.idAsignacionPremio]?.fecha  ?? a.fechaPago   ?? null;

  const pagados = asigs.filter(a => getEstado(a) === 'pagado').length;
  const allPaid = asigs.length > 0 && pagados === asigs.length;

  const handleMetodoChange = async (idAsignacion, metodo) => {
    const estadoActual = localPagos[idAsignacion]?.estado ?? asigs.find(a => a.idAsignacionPremio === idAsignacion)?.estadoPago ?? 'sin_configurar';
    updatePago(idAsignacion, {
      metodo,
      ...(metodo !== 'pendiente' && estadoActual === 'sin_configurar' ? { estado: 'configurado' } : {}),
    });
    try {
      const res = await configurarMetodo({ variables: { idAsignacionPremio: idAsignacion, metodoPago: metodo } });
      if (res.data?.configurarMetodoPago?.ok) { showNotif('Método de pago actualizado', 'success'); refetch(); }
      else {
        updatePago(idAsignacion, { metodo: undefined, estado: undefined });
        showNotif(res.data?.configurarMetodoPago?.error || 'Error', 'error');
      }
    } catch (e) {
      updatePago(idAsignacion, { metodo: undefined, estado: undefined });
      showNotif(e.message, 'error');
    }
  };

  const handleMarcarPagada = async (idAsignacion) => {
    const now = new Date().toISOString();
    updatePago(idAsignacion, { estado: 'pagado', fecha: now });
    setConfirmPagoId(null);
    try {
      const res = await marcarPagada({ variables: { idAsignacionPremio: idAsignacion } });
      if (res.data?.marcarAsignacionPagada?.ok) { showNotif('Pago registrado exitosamente', 'success'); refetch(); }
      else {
        updatePago(idAsignacion, { estado: undefined, fecha: undefined });
        showNotif(res.data?.marcarAsignacionPagada?.error || 'Error', 'error');
      }
    } catch (e) {
      updatePago(idAsignacion, { estado: undefined, fecha: undefined });
      showNotif(e.message, 'error');
    }
  };

  return (
    <>
      <input
        ref={compInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleComprobanteFileChange}
      />
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" gap={1.5}>
              <WalletOutlined style={{ fontSize: 22, color: '#1890ff' }} />
              <Box>
                <Typography variant="h6" sx={{ lineHeight: 1.2 }}>Gestión de Pagos</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {ganador?.candidatoPremio?.proyecto?.titulo}
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={`${pagados} / ${asigs.length} pagados`}
                size="small"
                variant="outlined"
                color={allPaid ? 'success' : pagados > 0 ? 'warning' : 'default'}
                sx={{ borderRadius: '999px', fontWeight: 700 }}
              />
              {allPaid && (
                <Chip label="Completado ✓" size="small" color="success" variant="outlined"
                  sx={{ borderRadius: '999px', fontWeight: 700 }} />
              )}
            </Stack>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 2, p: 1.5, bgcolor: 'action.selected', borderRadius: 1 }}>
            <Stack direction="row" gap={3} flexWrap="wrap">
              <Typography variant="body2">
                <strong>Evento:</strong> {ganador?.candidatoPremio?.premio?.evento?.nombre}
              </Typography>
              <Typography variant="body2">
                <strong>Monto total:</strong> Bs. {fmt(montoTotal)}
              </Typography>
              <Typography variant="body2">
                <strong>Participantes:</strong> {asigs.length}
              </Typography>
            </Stack>
          </Box>

          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell>Participante</TableCell>
                <TableCell>CI</TableCell>
                <TableCell align="right">Monto</TableCell>
                <TableCell align="center">Método de pago</TableCell>
                <TableCell align="center">QR</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell align="center">Acción</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {asigs.map(a => {
                const metodoActual = getMetodo(a);
                const estadoActual = getEstado(a);
                const fechaActual  = getFecha(a);
                const isPagado     = estadoActual === 'pagado';
                const hasQr        = !!a.qrImagen;
                const cfg          = ESTADO_PAGO_CFG[estadoActual] || ESTADO_PAGO_CFG.sin_configurar;
                const isConfirming = confirmPagoId === a.idAsignacionPremio;

                return (
                  <TableRow key={a.idAsignacionPremio} hover
                    sx={{ bgcolor: isPagado ? 'rgba(82,196,26,0.05)' : undefined }}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {a.participante.nombre} {a.participante.apellido}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{a.participante.ci}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={700} color="success.main">
                        Bs. {fmt(a.montoAsignado)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {isPagado ? (
                        <Chip
                          label={metodoActual === 'qr' ? 'QR' : metodoActual === 'efectivo' ? 'Efectivo' : '—'}
                          size="small" variant="outlined"
                        />
                      ) : (
                        <Select
                          value={metodoActual}
                          size="small"
                          disabled={configuring}
                          onChange={e => handleMetodoChange(a.idAsignacionPremio, e.target.value)}
                          sx={{ minWidth: 130, fontSize: 13 }}
                        >
                          <MenuItem value="pendiente"><em>Seleccionar</em></MenuItem>
                          <MenuItem value="qr">QR</MenuItem>
                          <MenuItem value="efectivo">Efectivo</MenuItem>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {hasQr ? (
                        <Tooltip title="Ver QR del participante">
                          <IconButton size="small" color="primary" onClick={() => setQrModal(a.qrImagen)}>
                            <QrcodeOutlined />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Typography variant="caption" color="text.disabled">Sin QR</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={cfg.label} size="small" color={cfg.color}
                        variant="outlined" sx={{ borderRadius: '999px', fontWeight: 600 }} />
                    </TableCell>
                    <TableCell align="center">
                      {isPagado ? (
                        <Stack spacing={0.5} alignItems="center">
                          <Typography variant="caption" color="success.main" fontWeight={700}>
                            {fechaActual ? new Date(fechaActual).toLocaleDateString('es-BO') : '—'}
                          </Typography>
                          <Chip
                            label="Imprimir comprobante"
                            size="small"
                            color="success"
                            variant="outlined"
                            onClick={() => imprimirComprobantePagado({ ...a, metodoPago: metodoActual }, ganador, fechaActual, showNotif)}
                            sx={{ cursor: 'pointer', borderRadius: '999px', fontSize: 10, fontWeight: 700 }}
                          />
                          {(localComprobantes[a.idAsignacionPremio] || a.comprobantePagoImagen) ? (
                            <>
                              <Chip
                                label="Ver foto pago"
                                size="small"
                                color="info"
                                variant="outlined"
                                onClick={() => setComprobanteModal(localComprobantes[a.idAsignacionPremio] || a.comprobantePagoImagen)}
                                sx={{ cursor: 'pointer', borderRadius: '999px', fontSize: 10 }}
                              />
                              <Chip
                                label={subiendoComp && compUploadId === a.idAsignacionPremio ? 'Subiendo...' : 'Reemplazar foto'}
                                size="small"
                                variant="outlined"
                                disabled={subiendoComp}
                                onClick={() => handleSubirComprobante(a.idAsignacionPremio)}
                                sx={{ cursor: 'pointer', borderRadius: '999px', fontSize: 10 }}
                              />
                            </>
                          ) : (
                            <Chip
                              label={subiendoComp && compUploadId === a.idAsignacionPremio ? 'Subiendo...' : 'Subir foto pago'}
                              size="small"
                              variant="outlined"
                              disabled={subiendoComp}
                              onClick={() => handleSubirComprobante(a.idAsignacionPremio)}
                              sx={{ cursor: 'pointer', borderRadius: '999px', fontSize: 10 }}
                            />
                          )}
                        </Stack>
                      ) : isConfirming ? (
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <Chip label="Confirmar" size="small" color="success"
                            onClick={() => handleMarcarPagada(a.idAsignacionPremio)}
                            sx={{ cursor: 'pointer', fontWeight: 700, borderRadius: '999px',
                                  border: '1.5px solid #52c41a', bgcolor: 'transparent', color: '#52c41a' }} />
                          <Chip label="Cancelar" size="small"
                            onClick={() => setConfirmPagoId(null)}
                            sx={{ cursor: 'pointer', borderRadius: '999px',
                                  border: '1.5px solid', borderColor: 'divider' }} />
                        </Stack>
                      ) : (
                        <Tooltip title={
                          metodoActual === 'pendiente'
                            ? 'Selecciona el método de pago primero'
                            : 'Marcar como pagado'
                        }>
                          <span>
                            <Button
                              size="small" variant="outlined" color="success"
                              disabled={metodoActual === 'pendiente' || marking}
                              startIcon={<CheckOutlined />}
                              onClick={() => setConfirmPagoId(a.idAsignacionPremio)}
                              sx={{ borderRadius: '999px', fontWeight: 700, textTransform: 'none',
                                    border: '1.5px solid' }}
                            >
                              Pagar
                            </Button>
                          </span>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="secondary">Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Visor QR */}
      <Dialog open={!!qrModal} onClose={() => setQrModal(null)} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" gap={1}>
            <QrcodeOutlined style={{ color: '#1890ff' }} />
            QR de cobro del participante
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', p: 3 }}>
          {qrModal && (
            <img src={qrModal} alt="QR de pago"
              style={{ maxWidth: '100%', maxHeight: 380, borderRadius: 8, border: '1px solid #e8e8e8' }} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrModal(null)}>Cerrar</Button>
          {qrModal && (
            <Button variant="outlined" color="primary" component="a" href={qrModal} download="qr_pago.png">
              Descargar QR
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Visor foto comprobante */}
      <Dialog open={!!comprobanteModal} onClose={() => setComprobanteModal(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Foto del comprobante de pago</DialogTitle>
        <DialogContent sx={{ textAlign: 'center', p: 2 }}>
          {comprobanteModal && (
            <img src={comprobanteModal} alt="Comprobante de pago"
              style={{ maxWidth: '100%', maxHeight: 500, borderRadius: 8, border: '1px solid #e8e8e8' }} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setComprobanteModal(null)}>Cerrar</Button>
          {comprobanteModal && (
            <Button variant="outlined" color="primary" component="a" href={comprobanteModal} download="comprobante_pago.jpg">
              Descargar
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}

function DivisionTab({ ganadores, refetch, showNotif }) {
  const monetarios = ganadores.filter(g => g.estado && g.candidatoPremio?.premio?.monto != null);
  const [dialogGanador, setDialogGanador] = useState(null);
  const [printConfirm, setPrintConfirm]   = useState(null);
  const [pagosDialogId, setPagosDialogId] = useState(null);
  const pagosGanador = pagosDialogId ? monetarios.find(g => g.idGanadorPremio === pagosDialogId) || null : null;
  // Estado local persistente de pagos (sobrevive open/close del dialog)
  const [localPagos, setLocalPagos] = useState({});
  const updatePago = (id, updates) =>
    setLocalPagos(prev => ({ ...prev, [id]: { ...(prev[id] || {}), ...updates } }));
  const [marcar] = useMutation(MARCAR_DIVISION_IMPRESA);

  const [searchTerm, setSearchTerm] = useState('');
  const [expandidos, setExpandidos] = useState(new Set());
  const toggleExpandido = (key) => setExpandidos(prev => {
    const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next;
  });

  const handleImprimir = async (ganador) => {
    imprimirComprobantes(ganador, showNotif);
    try {
      const res = await marcar({ variables: { idGanadorPremio: ganador.idGanadorPremio } });
      if (res.data?.marcarDivisionImpresa?.ok) {
        showNotif('División marcada como impresa', 'success');
        refetch();
      }
    } catch (e) {
      showNotif(e.message, 'error');
    }
  };

  if (!monetarios.length) {
    return (
      <Box sx={{ textAlign: 'center', p: 6, color: 'text.secondary' }}>
        <DollarCircleOutlined style={{ fontSize: 48, marginBottom: 12 }} />
        <Typography>No hay ganadores con premios monetarios registrados.</Typography>
      </Box>
    );
  }

  // Filtrado por búsqueda
  const term = searchTerm.toLowerCase().trim();
  const filtered = monetarios.filter(g => {
    if (!term) return true;
    const cp = g.candidatoPremio;
    const title = cp?.proyecto?.titulo?.toLowerCase() || '';
    const evento = cp?.premio?.evento?.nombre?.toLowerCase() || '';
    const oferta = cp?.proyecto?.ofertaEaCarrera?.oferta?.nombre?.toLowerCase() || '';
    const area = cp?.premio?.area?.nombre?.toLowerCase() || '';
    return title.includes(term) || evento.includes(term) || oferta.includes(term) || area.includes(term);
  });

  // Agrupación por Oferta (fallback a Evento)
  const gruposOferta = filtered.reduce((acc, g) => {
    const cp = g.candidatoPremio;
    const oferta = cp?.proyecto?.ofertaEaCarrera?.oferta?.nombre || cp?.premio?.evento?.nombre || 'Sin Oferta';
    if (!acc[oferta]) acc[oferta] = [];
    acc[oferta].push(g);
    return acc;
  }, {});

  const grupos = Object.entries(gruposOferta).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, gap: 2, mb: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
          Registra y emite los comprobantes de asignación de monto monetario para cada participante.
          Una vez impresos, la división queda bloqueada.
        </Typography>

        <TextField
          size="small"
          placeholder="Buscar proyecto, oferta, evento..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ minWidth: 300, bgcolor: 'background.paper' }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchOutlined /></InputAdornment>,
            endAdornment: searchTerm ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchTerm('')}>
                  <CloseOutlined style={{ fontSize: 14 }} />
                </IconButton>
              </InputAdornment>
            ) : null
          }}
        />
      </Box>

      {grupos.length === 0 ? (
        <Alert severity="info">No se encontraron resultados para "{searchTerm}".</Alert>
      ) : grupos.map(([ofertaNombre, premios]) => {
        const isOpen = expandidos.has(ofertaNombre);
        // Comprobar si hay impresas para estilos
        const allImpresas = premios.every(p => getDivisionStatus(p) === 'impresa');
        
        return (
          <Box key={ofertaNombre} sx={{ mb: 2 }}>
            <Box sx={{
              px: 2, py: 1.5,
              borderRadius: isOpen ? '8px 8px 0 0' : 1.5,
              background: allImpresas 
                ? 'linear-gradient(135deg, rgba(56,158,13,0.10), rgba(56,158,13,0.03))' 
                : 'linear-gradient(135deg, rgba(24,144,255,0.08), rgba(24,144,255,0.02))',
              border: `1px solid ${allImpresas ? 'rgba(56,158,13,0.30)' : 'rgba(24,144,255,0.25)'}`,
              display: 'flex', alignItems: 'center', gap: 1.5,
            }}>
              <TrophyOutlined style={{ color: allImpresas ? '#389e0d' : '#1890ff', fontSize: 18 }} />
              <Typography variant="subtitle2" fontWeight={700} color={allImpresas ? "success.dark" : "primary.main"} sx={{ flex: 1 }}>
                {ofertaNombre}
              </Typography>
              <Chip
                label={isOpen ? `▲ ${premios.length} premio(s)` : `▼ ${premios.length} premio(s)`}
                size="small"
                color={allImpresas ? "success" : "primary"}
                variant={isOpen ? 'filled' : 'outlined'}
                onClick={() => toggleExpandido(ofertaNombre)}
                sx={{ cursor: 'pointer', fontWeight: 600, userSelect: 'none' }}
              />
            </Box>

            {isOpen && (
              <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${allImpresas ? 'rgba(56,158,13,0.30)' : 'rgba(24,144,255,0.25)'}`, borderTop: 'none', borderRadius: '0 0 8px 8px' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell>Proyecto</TableCell>
                      <TableCell>Evento</TableCell>
                      <TableCell>Área</TableCell>
                      <TableCell>Premio</TableCell>
                      <TableCell align="right">Monto total</TableCell>
                      <TableCell align="center">Participantes</TableCell>
                      <TableCell align="center">Estado</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {premios.map(g => {
                      const cp     = g.candidatoPremio;
                      const status = getDivisionStatus(g);
                      const chip   = STATUS_CHIP[status];
                      const locked = status === 'impresa';
                      const asigs  = g.asignaciones || [];
                      const hasDivision = asigs.length > 0;
                      const pagadosCount = asigs.filter(a => (localPagos[a.idAsignacionPremio]?.estado ?? a.estadoPago) === 'pagado').length;
                      const monto  = parseFloat(cp.premio.monto);
                      const lugar  = LUGAR_MAP[cp.premio.numeroGanadores] || `${cp.premio.numeroGanadores}° Lugar`;
                      const fmt    = (n) => n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

                      return (
                        <TableRow key={g.idGanadorPremio} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>{cp.proyecto.titulo}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{cp.premio.evento?.nombre}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{cp.premio.area?.nombre}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{lugar}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={700} color="success.main">Bs. {fmt(monto)}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {(cp.proyecto.participantes || []).length}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Stack spacing={0.5} alignItems="center">
                              <Chip label={chip.label} size="small" color={chip.color}
                                variant="outlined" sx={{ borderRadius: '999px', fontWeight: 700 }} />
                              {locked && hasDivision && (
                                <Chip
                                  label={`${pagadosCount}/${asigs.length} pag.`}
                                  size="small"
                                  color={pagadosCount === asigs.length ? 'success' : pagadosCount > 0 ? 'warning' : 'default'}
                                  variant="outlined"
                                  sx={{ fontSize: 10, borderRadius: '999px' }}
                                />
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell align="center">
                            <Stack direction="row" gap={0.5} justifyContent="center">
                              <Tooltip title={locked ? 'Ver división (bloqueada)' : hasDivision ? 'Editar división' : 'Dividir premio'}>
                                <IconButton size="small" color="primary"
                                  onClick={() => setDialogGanador(g)}>
                                  <DollarCircleOutlined />
                                </IconButton>
                              </Tooltip>
                              {hasDivision && (
                                <Tooltip title="Imprimir comprobantes">
                                  <IconButton size="small" color="secondary"
                                    onClick={() => setPrintConfirm(g)}>
                                    <PrinterOutlined />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {locked && (
                                <Tooltip title="Gestionar pagos de participantes">
                                  <IconButton size="small" color="success"
                                    onClick={() => setPagosDialogId(g.idGanadorPremio)}>
                                    <WalletOutlined />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        );
      })}

      <DivisionDialog
        open={!!dialogGanador}
        ganador={dialogGanador}
        onClose={() => setDialogGanador(null)}
        onSaved={refetch}
        showNotif={showNotif}
      />

      <ConfirmDialog
        open={!!printConfirm}
        title="Imprimir comprobantes"
        message={
          getDivisionStatus(printConfirm || {}) === 'impresa'
            ? 'Esta división ya fue marcada como impresa. ¿Deseas reimprimir igualmente?'
            : 'Se imprimirá un comprobante por cada participante y la división quedará bloqueada. ¿Continuar?'
        }
        confirmLabel="Imprimir"
        confirmColor="primary"
        onConfirm={() => { handleImprimir(printConfirm); setPrintConfirm(null); }}
        onCancel={() => setPrintConfirm(null)}
      />

      <GestionPagosDialog
        open={!!pagosDialogId}
        ganador={pagosGanador}
        onClose={() => setPagosDialogId(null)}
        refetch={refetch}
        showNotif={showNotif}
        localPagos={localPagos}
        updatePago={updatePago}
      />
    </Box>
  );
}

export default function CertificadosPage() {
  const { data, loading, error, refetch } = useQuery(GET_DATA, { fetchPolicy: 'network-only' });
  const [tab, setTab] = useState(0);
  const [notif, setNotif] = useState({ open: false, msg: '', sev: 'success' });
  const showNotif = (msg, sev = 'success') => setNotif({ open: true, msg, sev });

  const plantillas = data?.todasLasPlantillas || [];
  const certificados = data?.todosLosCertificados || [];
  const ganadores = data?.todosLosGanadoresPremios || [];

  return (
    <MainCard title="Emisión de Certificados">
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error">Error al cargar: {error.message}</Alert>
      ) : (
        <>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 0 }}>
            <Tab label="Plantillas de Texto" icon={<FileTextOutlined />} iconPosition="start" />
            <Tab label="Certificados" icon={<FilePdfOutlined />} iconPosition="start" />
            <Tab label="División de Premios" icon={<DollarCircleOutlined />} iconPosition="start" />
          </Tabs>

          <TabPanel value={tab} index={0}>
            <PlantillasTab plantillas={plantillas} refetch={refetch} showNotif={showNotif} />
          </TabPanel>
          <TabPanel value={tab} index={1}>
            <CertificadosTab
              certificados={certificados} ganadores={ganadores} plantillas={plantillas}
              refetch={refetch} showNotif={showNotif}
            />
          </TabPanel>
          <TabPanel value={tab} index={2}>
            <DivisionTab ganadores={ganadores} refetch={refetch} showNotif={showNotif} />
          </TabPanel>
        </>
      )}

      <Snackbar open={notif.open} autoHideDuration={4000}
        onClose={() => setNotif(p => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={notif.sev} variant="filled">{notif.msg}</Alert>
      </Snackbar>
    </MainCard>
  );
}
