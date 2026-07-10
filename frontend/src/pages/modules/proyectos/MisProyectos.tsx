import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
  Box, Typography, CircularProgress, Alert, Card, CardContent, Chip, Stack,
  Divider, Button, Tabs, Tab, Avatar, LinearProgress, Tooltip, Snackbar,
  Dialog, DialogContent, IconButton, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import {
  ProjectOutlined, InfoCircleOutlined, DownloadOutlined, FilePdfOutlined,
  TrophyOutlined, StarOutlined, CheckCircleOutlined, ClockCircleOutlined,
  CloseCircleOutlined, PrinterOutlined, RiseOutlined, FileProtectOutlined,
  DollarCircleOutlined, QrcodeOutlined, UploadOutlined, DownOutlined
} from '@ant-design/icons';
import MainCard from 'components/MainCard';

// ── GQL ───────────────────────────────────────────────────────────────────────
const GET_MIS_PROYECTOS = gql`
  query {
    me {
      participante {
        idParticipante
        proyectosInscritos {
          idProyecto titulo resumen estado fechaInscripcion fechaConfirmacion observacion archivo
          participantes {
            idParticipante nombre apellido codigoEspecifico ci expedicion celular
            usuario { email }
          }
          tutores {
            idTutor nombre apellido codEmpleado ci expedicion celular direccion
            usuario { email }
          }
          ofertaEaCarrera {
            oferta {
              categoriaEvento { evento { nombre version } categoria { nombre } }
              modalidadArea {
                modalidad { nombre }
                area { nombre }
              }
            }
            eaCarrera {
              entidadAcademica { nombre }
              carrera          { nombre plan }
            }
          }
          candidatosPremio {
            idCandidatoPremio nota estado observacion
            premio {
              idPremio monto numeroGanadores
              area { nombre }
              evento {
                nombre
                membretes {
                  titulo subtitulo direccion
                  logoUnidad logoInstitucion firma selloAutoridad
                  piePagina1 piePagina2 piePagina3
                  membreteFirmantes { idMembreteFirmante orden estado personal { idPersonal nombre apellido firmaImg cargo { nombre } } }
                }
              }
              premioDescriptores { descriptor { descripcion } }
            }
            actaEvaluacion {
              idActaEvaluacion notaFinal
            }
            ganador {
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
                  ofertaEaCarrera { oferta { categoriaEvento { evento { nombre version } categoria { nombre } } } }
                  participantes { nombre apellido }
                  tutores { nombre apellido }
                }
                premio {
                  monto numeroGanadores
                  area { nombre }
                  evento {
                    nombre
                    membretes {
                      titulo subtitulo direccion
                      logoUnidad logoInstitucion firma selloAutoridad
                      piePagina1 piePagina2 piePagina3
                      membreteFirmantes { idMembreteFirmante orden estado personal { idPersonal nombre apellido firmaImg cargo { nombre } } }
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

const SUBIR_QR_ASIGNACION = gql`
  mutation($idAsignacionPremio: ID!, $qrBase64: String!) {
    subirQrAsignacion(idAsignacionPremio: $idAsignacionPremio, qrBase64: $qrBase64) { ok error }
  }`;

// ── Print helper (replicates certificados.jsx logic) ─────────────────────────
const BACKEND_MEDIA = 'http://localhost:8000/media/';
const LUGAR_MAP: Record<number, string> = { 1: '1er Lugar', 2: '2do Lugar', 3: '3er Lugar' };

function resolverContenido(contenido: string, ganador: any): string {
  if (!ganador || !contenido) return contenido;
  const cp = ganador.candidatoPremio;
  const descriptores  = (cp.premio.premioDescriptores || []).map((pd: any) => pd.descriptor.descripcion).join(', ');
  const participantes = (cp.proyecto.participantes || []).map((p: any) => `${p.nombre} ${p.apellido}`).join(', ');
  const tutores       = (cp.proyecto.tutores || []).map((t: any) => `${t.nombre} ${t.apellido}`).join(', ');
  const oferta        = cp.proyecto?.ofertaEaCarrera?.oferta?.categoriaEvento?.evento?.nombre || cp.premio.area.nombre;
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
  const membrete = (cp.premio.evento?.membretes || [])[0];
  const isHorizontal = cert.plantilla.orientacion !== 'vertical';
  const imgUrl = (path: string) => path ? `${BACKEND_MEDIA}${path}` : null;
  const logoUnidad      = imgUrl(membrete?.logoUnidad);
  const logoInstitucion = imgUrl(membrete?.logoInstitucion);
  const firmaGeneral    = imgUrl(membrete?.firma);
  const sello           = imgUrl(membrete?.selloAutoridad);
  const firmantesActivos = (membrete?.membreteFirmantes || []).filter((f: any) => f.estado).sort((a: any, b: any) => a.orden - b.orden);
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
      ? firmantesActivos.map((f: any) => { const fImg = f.personal?.firmaImg ? imgUrl(f.personal.firmaImg) : firmaGeneral; return `<div class="cert-firmante-item">${fImg ? `<img src="${fImg}" class="cert-firma-img" alt="Firma" />` : '<div class="cert-firma-espacio"></div>'}<div class="cert-firmante-linea"></div><div class="cert-firmante-nombre">${f.personal?.nombre} ${f.personal?.apellido}</div><div class="cert-firmante-cargo">${f.personal?.cargo?.nombre || ''}</div></div>`; }).join('')
      : `<div class="cert-firmante-item"><img src="${firmaGeneral}" class="cert-firma-img" alt="Firma" /><div class="cert-firmante-linea"></div></div>`;
    return `<div class="cert-firmantes">${items}</div>`;
  })();
  const selloHtml = sello ? `<img src="${sello}" class="cert-sello" alt="Sello" />` : '';
  const piePaginas = [membrete?.piePagina1, membrete?.piePagina2, membrete?.piePagina3].filter(Boolean);
  const footerHtml = piePaginas.length > 0 ? `<div class="cert-pie-pagina">${piePaginas.join('  ·  ')}</div>` : '';
  return `<div class="cert-page ${isHorizontal ? 'horizontal' : 'vertical'}">${headerHtml}<div class="cert-box"><div class="cert-top-block"><div class="cert-deco-line"></div><div class="cert-title">CERTIFICADO</div>${descriptores ? `<div class="cert-descriptor">${descriptores}</div>` : ''}<div class="cert-event">${cp.premio.evento.nombre}</div><div class="cert-area">Área: ${cp.premio.area.nombre}</div><div class="cert-deco-line"></div></div><div class="cert-body-block"><div class="cert-body">${texto.replace(/\n/g, '<br/>')}</div></div><div class="cert-bottom-block"><div class="cert-deco-line"></div><div class="cert-bottom">${selloHtml}${firmantesHtml}</div><div class="cert-fecha">Fecha de emisión: ${new Date(cert.fechaEmision).toLocaleDateString('es-BO')}</div></div></div>${footerHtml}</div>`;
}

function imprimirCertificado(cert: any) {
  const certConGanador = {
    ...cert,
    ganadorPremio: cert._ganador,
  };
  const body = buildCertPage(certConGanador);
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Certificado</title><style>${CERT_CSS}</style></head><body>${body}</body></html>`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, '_blank');
  if (!win) { alert('Permite ventanas emergentes (pop-ups) para esta página.'); URL.revokeObjectURL(url); return; }
  win.addEventListener('load', () => { win.focus(); win.print(); URL.revokeObjectURL(url); }, { once: true });
}

// ── Comprobante de división de premio (individual por participante) ────────────
const COMP_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Times New Roman', Georgia, serif; background: #fff; color: #222; }
  @page comp-page { size: A4 portrait; margin: 15mm; }
  .comp-page { page: comp-page; width: 180mm; height: 267mm; display: flex; flex-direction: column; overflow: hidden; page-break-after: always; }
  .comp-membrete-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 4px 0 3px; flex-shrink: 0; }
  .comp-logo-box { width: 55px; min-width: 55px; text-align: center; }
  .comp-logo { max-width: 50px; max-height: 50px; object-fit: contain; }
  .comp-membrete-texto { flex: 1; text-align: center; }
  .comp-membrete-titulo { font-size: 12px; font-weight: bold; color: #1a237e; text-transform: uppercase; letter-spacing: 0.5px; }
  .comp-membrete-subtitulo { font-size: 9px; color: #444; margin-top: 1px; }
  .comp-membrete-dir { font-size: 8px; color: #888; margin-top: 1px; }
  .comp-membrete-line { height: 1.5px; background: linear-gradient(90deg, transparent, #1a237e 10%, #1a237e 90%, transparent); margin: 2px 0 5px; flex-shrink: 0; }
  .comp-box { border: 2px solid #1a237e; outline: 4px double #1a237e; outline-offset: -7px; flex: 1; min-height: 0; display: flex; flex-direction: column; padding: 16px 24px 20px; overflow: hidden; text-align: center; }
  .comp-deco-line { height: 1.5px; background: linear-gradient(90deg, transparent, #1a237e 15%, #1a237e 85%, transparent); margin: 0 20px 8px; }
  .comp-title { font-size: 20px; font-weight: bold; color: #1a237e; letter-spacing: 4px; margin-bottom: 3px; }
  .comp-subtitle { font-size: 13px; font-weight: bold; color: #c62828; letter-spacing: 2px; margin-bottom: 8px; }
  .comp-content { flex: 1; min-height: 0; padding: 6px 0; }
  .comp-info-table { width: 100%; border-collapse: collapse; margin-bottom: 18px; text-align: left; }
  .comp-info-table tr { border-bottom: 1px dotted #ddd; }
  .comp-lbl { font-size: 10.5px; color: #555; font-weight: 600; padding: 5px 12px 5px 0; width: 115px; vertical-align: top; }
  .comp-val { font-size: 11px; color: #222; padding: 5px 0; }
  .comp-amount-box { border: 2px solid #1a237e; border-radius: 4px; padding: 14px 24px; text-align: center; background: linear-gradient(135deg, #e8eaf6 0%, #f1f8e9 100%); margin: 0 12px; }
  .comp-amount-label { font-size: 11px; color: #1a237e; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 6px; }
  .comp-amount-value { font-size: 34px; font-weight: bold; color: #1b5e20; letter-spacing: 2px; margin-bottom: 4px; }
  .comp-amount-pct { font-size: 11px; color: #555; }
  .comp-firma-section { display: flex; justify-content: center; align-items: flex-end; gap: 40px; margin-top: 16px; flex-shrink: 0; }
  .comp-sello { width: 52px; height: 52px; object-fit: contain; opacity: 0.85; }
  .comp-firma-item { display: flex; flex-direction: column; align-items: center; }
  .comp-firma-img { max-width: 90px; max-height: 38px; object-fit: contain; margin-bottom: 2px; }
  .comp-firma-linea { width: 130px; height: 1px; background: #555; margin-bottom: 3px; }
  .comp-firma-nombre { font-size: 9.5px; font-weight: bold; color: #222; }
  .comp-firma-cargo  { font-size: 8.5px; color: #555; }
  .comp-fecha { font-size: 9px; color: #999; text-align: center; margin-top: 6px; flex-shrink: 0; }
  .comp-pie-pagina { font-size: 8px; color: #888; text-align: center; padding: 2px 0; border-top: 1px solid #ddd; margin-top: 4px; flex-shrink: 0; }
  @media print { html, body { margin: 0; } .comp-page { page-break-after: always; } }
`;

const LUGAR_MAP_COMP: Record<number, string> = { 1: '1er Lugar', 2: '2do Lugar', 3: '3er Lugar' };

function buildComprobantePago(asig: any, ganador: any): string {
  const cp = ganador.candidatoPremio;
  const membrete = (cp.premio.evento?.membretes || [])[0];
  const imgUrl = (path: string) => path ? `${BACKEND_MEDIA}${path}` : null;

  const logoUnidad      = imgUrl(membrete?.logoUnidad);
  const logoInstitucion = imgUrl(membrete?.logoInstitucion);
  const sello           = imgUrl(membrete?.selloAutoridad);
  const firmaGeneral    = imgUrl(membrete?.firma);

  const piePaginas = [membrete?.piePagina1, membrete?.piePagina2, membrete?.piePagina3].filter(Boolean);
  const descriptores = (cp.premio.premioDescriptores || []).map((pd: any) => pd.descriptor.descripcion).join(' · ');
  const lugar        = LUGAR_MAP_COMP[cp.premio.numeroGanadores] || `${cp.premio.numeroGanadores}° Lugar`;
  const montoTotal   = parseFloat(cp.premio.monto);
  const montoAsig    = parseFloat(asig.montoAsignado);
  const pct          = parseFloat(asig.porcentaje);
  const fecha        = new Date().toLocaleDateString('es-BO', { year: 'numeric', month: 'long', day: 'numeric' });
  const fmt = (n: number) => n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

  const firmantesActivos = (membrete?.membreteFirmantes || []).filter((f: any) => f.estado).sort((a: any, b: any) => a.orden - b.orden);
  const firmaItemsHtml = firmantesActivos.length > 0
    ? firmantesActivos.map((f: any) => {
        const fImg = f.personal?.firmaImg ? imgUrl(f.personal.firmaImg) : firmaGeneral;
        return `<div class="comp-firma-item">
          ${fImg ? `<img src="${fImg}" class="comp-firma-img" alt="Firma" />` : '<div style="height:38px"></div>'}
          <div class="comp-firma-linea"></div>
          <div class="comp-firma-nombre">${f.personal?.nombre} ${f.personal?.apellido}</div>
          <div class="comp-firma-cargo">${f.personal?.cargo?.nombre || ''}</div>
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
      ${piePaginas.length ? `<div class="comp-pie-pagina">${(piePaginas as string[]).join('  ·  ')}</div>` : ''}
    </div>`;
}

function imprimirMiComprobante(asig: any, ganador: any) {
  const body = buildComprobantePago(asig, ganador);
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Comprobante de Asignación</title><style>${COMP_CSS}</style></head><body>${body}</body></html>`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, '_blank');
  if (!win) { alert('Permite ventanas emergentes (pop-ups) para esta página.'); URL.revokeObjectURL(url); return; }
  win.addEventListener('load', () => { win.focus(); win.print(); URL.revokeObjectURL(url); }, { once: true });
}

const FORM_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; background: #fff; color: #111; font-size: 12px; }
  @page form-page { size: A4 portrait; margin: 15mm; }
  .form-page { page: form-page; width: 180mm; display: flex; flex-direction: column; overflow: hidden; page-break-after: always; }
  .form-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; border-bottom: 2px solid #1a237e; padding-bottom: 8px; margin-bottom: 15px; }
  .form-logo { max-width: 60px; max-height: 60px; object-fit: contain; }
  .form-header-text { flex: 1; text-align: center; }
  .form-header-title { font-size: 14px; font-weight: bold; color: #1a237e; text-transform: uppercase; letter-spacing: 0.5px; }
  .form-header-sub { font-size: 10px; color: #444; margin-top: 2px; font-weight: bold; }
  .form-section-title { font-size: 12px; font-weight: bold; color: #1a237e; border-bottom: 1px solid #1a237e; padding-bottom: 4px; margin-bottom: 8px; text-transform: uppercase; margin-top: 15px; }
  .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 10px; }
  .form-grid-full { grid-column: span 2; }
  .form-field { display: flex; flex-direction: column; border: 1px solid #ddd; padding: 6px; border-radius: 4px; }
  .form-label { font-size: 9px; font-weight: bold; color: #666; text-transform: uppercase; margin-bottom: 2px; }
  .form-value { font-size: 11px; color: #222; font-weight: 500; }
  .form-table { width: 100%; border-collapse: collapse; margin-top: 5px; margin-bottom: 10px; }
  .form-table th { background-color: #f5f5f5; border: 1px solid #ddd; padding: 6px; font-size: 10px; font-weight: bold; text-align: left; text-transform: uppercase; color: #333; }
  .form-table td { border: 1px solid #ddd; padding: 6px; font-size: 11px; }
  .form-signatures { display: flex; justify-content: space-around; margin-top: 40px; margin-bottom: 20px; }
  .form-sig-line { width: 130px; height: 1px; background: #333; margin-bottom: 4px; }
  .form-sig-item { display: flex; flex-direction: column; align-items: center; text-align: center; }
  .form-sig-name { font-size: 10px; font-weight: bold; }
  .form-sig-role { font-size: 8px; color: #666; text-transform: uppercase; }
  @media print { html, body { margin: 0; } .form-page { page-break-after: always; } }
`;

function buildFormularioInscripcion(proyecto: any): string {
  const oec = proyecto.ofertaEaCarrera;
  const ev = oec?.oferta?.categoriaEvento?.evento;
  const cat = oec?.oferta?.categoriaEvento?.categoria;
  const ea = oec?.eaCarrera?.entidadAcademica;
  const carr = oec?.eaCarrera?.carrera;
  const mod = oec?.oferta?.modalidadArea?.modalidad;
  const area = oec?.oferta?.modalidadArea?.area;
  const logo = '/uagrm-logo.png';
  const fecha = new Date(proyecto.fechaInscripcion).toLocaleDateString('es-BO', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const partsRows = (proyecto.participantes || []).map((p: any) => `
    <tr>
      <td>${p.codigoEspecifico || '—'}</td>
      <td><strong>${p.nombre} ${p.apellido}</strong></td>
      <td>${carr?.nombre || '—'} ${carr?.plan ? `· Plan ${carr.plan}` : ''}</td>
      <td>${p.usuario?.email || '—'}</td>
      <td>${p.ci} ${p.expedicion || ''}</td>
      <td>${p.celular || '—'}</td>
    </tr>
  `).join('');

  const tutsRows = (proyecto.tutores || []).map((t: any) => `
    <tr>
      <td>${t.codEmpleado || '—'}</td>
      <td><strong>${t.nombre} ${t.apellido}</strong></td>
      <td>${t.direccion || '—'}</td>
      <td>${t.usuario?.email || '—'}</td>
      <td>${t.ci} ${t.expedicion || ''}</td>
      <td>${t.celular || '—'}</td>
    </tr>
  `).join('');



  return `
    <div class="form-page">
      <div class="form-header">
        <img src="${logo}" class="form-logo" alt="UAGRM" onError="this.style.display='none'" />
        <div class="form-header-text">
          <div class="form-header-title">Formulario Oficial de Inscripción</div>
          <div class="form-header-sub">U.A.G.R.M. — EXPOCIENCIA ${ev?.nombre ? ev.nombre.toUpperCase() : ''}</div>
          <div style="font-size: 8px; color: #666; margin-top:1px;">ID Proyecto: ${proyecto.idProyecto} · Fecha: ${fecha}</div>
        </div>
        <div style="width:60px"></div>
      </div>

      <div class="form-section-title">Datos del Proyecto de Investigación</div>
      <div class="form-grid">
        <div class="form-field form-grid-full">
          <span class="form-label">Título del Proyecto</span>
          <span class="form-value" style="font-size: 13px; font-weight: bold; color: #1a237e;">${proyecto.titulo}</span>
        </div>
        <div class="form-field">
          <span class="form-label">Categoría</span>
          <span class="form-value">${cat?.nombre || 'Feria Científica'}</span>
        </div>
        <div class="form-field">
          <span class="form-label">Facultad</span>
          <span class="form-value">${ea?.nombre || '—'}</span>
        </div>
        <div class="form-field">
          <span class="form-label">Área de Conocimiento</span>
          <span class="form-value">${area?.nombre || '—'}</span>
        </div>
        <div class="form-field">
          <span class="form-label">Modalidad del Proyecto</span>
          <span class="form-value">${mod?.nombre || '—'}</span>
        </div>
      </div>

      <div class="form-section-title">Datos de los Participantes del Proyecto</div>
      <table class="form-table">
        <thead>
          <tr>
            <th>Registro</th>
            <th>Nombre Completo</th>
            <th>Carrera / Plan</th>
            <th>Correo Electrónico</th>
            <th>C.I.</th>
            <th>Celular</th>
          </tr>
        </thead>
        <tbody>
          ${partsRows || '<tr><td colspan="6" style="text-align:center">Sin participantes registrados</td></tr>'}
        </tbody>
      </table>

      <div class="form-section-title">Datos del Docente Guía o Tutor</div>
      <table class="form-table">
        <thead>
          <tr>
            <th>Cód. Docente</th>
            <th>Nombre Completo</th>
            <th>Dirección de Domicilio</th>
            <th>Correo Electrónico</th>
            <th>C.I.</th>
            <th>Celular</th>
          </tr>
        </thead>
        <tbody>
          ${tutsRows || '<tr><td colspan="6" style="text-align:center">Sin tutores registrados</td></tr>'}
        </tbody>
      </table>

      <div style="margin-top: 15px; border: 1px solid #ddd; padding: 8px; border-radius: 4px; background: #fafafa;">
        <span class="form-label" style="display:block; margin-bottom: 2px;">Observaciones Administrativas</span>
        <span class="form-value" style="color: #666; font-style: italic;">
          ${proyecto.observacion || 'Ninguna observación.'}
        </span>
      </div>


    </div>
  `;
}

const DECI_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Times New Roman', Georgia, serif; background: #fff; color: #111; font-size: 14px; line-height: 1.8; }
  @page dec-page { size: A4 portrait; margin: 25mm 20mm; }
  .dec-page { page: dec-page; width: 170mm; min-height: 247mm; display: flex; flex-direction: column; overflow: hidden; page-break-after: always; }
  .dec-title { font-size: 22px; font-weight: bold; text-align: center; text-transform: uppercase; margin-bottom: 30px; letter-spacing: 1px; color: #111; }
  .dec-text { text-align: justify; margin-bottom: 20px; text-indent: 30px; }
  .dec-list { margin-left: 20px; margin-bottom: 20px; text-align: justify; }
  .dec-list-item { margin-bottom: 10px; list-style-type: decimal; }
  .dec-signature-box { display: flex; flex-direction: column; align-items: center; margin-top: auto; padding-top: 50px; text-align: center; }
  .dec-sig-line { width: 220px; height: 1px; background: #111; margin-bottom: 8px; }
  .dec-sig-name { font-size: 14px; font-weight: bold; }
  .dec-sig-ci { font-size: 13px; color: #444; }
  @media print { html, body { margin: 0; } .dec-page { page-break-after: always; } }
`;

function buildDeclaracionJurada(proyecto: any, miIdParticipante?: string): string {
  const oec = proyecto.ofertaEaCarrera;
  const ev = oec?.oferta?.categoriaEvento?.evento;
  const parts = proyecto.participantes || [];
  const tuts = proyecto.tutores || [];
  
  const declarantes = [
    ...parts
      .filter((p: any) => !miIdParticipante || String(p.idParticipante) === String(miIdParticipante))
      .map((p: any) => ({
        nombreCompleto: `${p.nombre} ${p.apellido}`,
        ci: p.ci,
        expedicion: p.expedicion || '',
        tipo: 'INTEGRANTE EXPOSITOR',
        domicilio: 'Santa Cruz de la Sierra'
      })),
    ...tuts
      .filter((t: any) => !miIdParticipante)
      .map((t: any) => ({
        nombreCompleto: `${t.nombre} ${t.apellido}`,
        ci: t.ci,
        expedicion: t.expedicion || '',
        tipo: 'DOCENTE TUTOR GUÍA',
        domicilio: t.direccion || 'Santa Cruz de la Sierra'
      }))
  ];

  const now = new Date();
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const dia = now.getDate();
  const mes = meses[now.getMonth()];
  const gestion = now.getFullYear();

  return declarantes.map((dec) => `
    <div class="dec-page">
      <div class="dec-title">Declaración Jurada de Veracidad</div>
      
      <p class="dec-text">
        Yo, <strong>${dec.nombreCompleto}</strong>, con Cédula de Identidad N.º <strong>${dec.ci} ${dec.expedicion}</strong>, mayor de edad, en mi calidad de <strong>${dec.tipo}</strong> del proyecto científico denominado <strong>"${proyecto.titulo}"</strong> postulado en la feria científica <strong>"Expociencia UAGRM ${ev?.nombre || ''}"</strong>, con domicilio en la ciudad de <strong>${dec.domicilio}</strong>, por medio del presente documento y en pleno uso de mis facultades, <strong>DECLARO BAJO JURAMENTO</strong> lo siguiente:
      </p>

      <ol class="dec-list">
        <li class="dec-list-item">
          Que toda la información y documentación proporcionada para la inscripción del proyecto de investigación científica es completamente verdadera, fidedigna y correcta.
        </li>
        <li class="dec-list-item">
          Que los datos y resultados consignados en el desarrollo del proyecto corresponden a la realidad científica o técnica del trabajo y pueden ser verificados y auditados de manera inmediata por el comité organizador de la universidad o las autoridades competentes cuando lo consideren pertinente.
        </li>
        <li class="dec-list-item">
          Que asumo plena y total responsabilidad legal y administrativa por la veracidad del contenido del proyecto y de la presente declaración, aceptando libremente las consecuencias jurídicas y reglamentarias de la U.A.G.R.M. en caso de comprobarse cualquier falsedad, plagio o irregularidad en los datos presentados.
        </li>
      </ol>

      <p class="dec-text">
        La presente declaración jurada de veracidad se suscribe de manera libre, voluntaria y consciente para los fines legales que correspondan.
      </p>

      <p class="dec-text" style="margin-top: 15px;">
        Lugar y fecha: Santa Cruz de la Sierra, ${dia} de ${mes} de ${gestion}.
      </p>

      <div class="dec-signature-box" style="align-items: flex-start; text-align: left; margin-top: 40px; padding-top: 10px;">
        <p style="margin-bottom: 50px;"><strong>Firma del declarante:</strong></p>
        <div class="dec-sig-line" style="width: 300px; height: 1px; background: #111; margin-bottom: 12px;"></div>
        <div><strong>Nombre completo:</strong> ${dec.nombreCompleto}</div>
        <div style="text-transform: uppercase;"><strong>Cargo / Rol:</strong> ${dec.tipo}</div>
        <div><strong>C.I. N.º:</strong> ${dec.ci} ${dec.expedicion}</div>
      </div>
    </div>
  `).join('');
}

function imprimirFormularioInscripcion(proyecto: any) {
  const body = buildFormularioInscripcion(proyecto);
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Formulario de Inscripcion</title><style>${FORM_CSS}</style></head><body>${body}</body></html>`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, '_blank');
  if (!win) { alert('Permite ventanas emergentes (pop-ups) para esta página.'); URL.revokeObjectURL(url); return; }
  win.addEventListener('load', () => { win.focus(); win.print(); URL.revokeObjectURL(url); }, { once: true });
}

function imprimirDeclaracionesJuradas(proyecto: any, miIdParticipante?: string) {
  const body = buildDeclaracionJurada(proyecto, miIdParticipante);
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Declaración Jurada</title><style>${DECI_CSS}</style></head><body>${body}</body></html>`;
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
  participantes?: any[];
  tutores?: any[];
  ofertaEaCarrera?: {
    oferta?: {
      categoriaEvento?: { evento?: { nombre: string; version: string }; categoria?: { nombre: string } };
      modalidadArea?: { modalidad?: { nombre: string }; area?: { nombre: string } };
    };
    eaCarrera?: { entidadAcademica?: { nombre: string }; carrera?: { nombre: string; plan?: string } };
  };
  candidatosPremio?: CandidatoPremio[];
}

interface AsignacionPremio {
  idAsignacionPremio: string;
  participante: { idParticipante: string; nombre: string; apellido: string; ci: string };
  montoAsignado: string;
  porcentaje: string;
  impresa: boolean;
  metodoPago: 'pendiente' | 'qr' | 'efectivo';
  qrImagen: string;
  estadoPago: 'sin_configurar' | 'configurado' | 'pagado';
  fechaPago: string | null;
  comprobantePagoImagen: string;
}

interface CandidatoPremio {
  idCandidatoPremio: string;
  nota: string;
  estado: string;
  observacion?: string;
  premio?: { idPremio: string; monto?: string; numeroGanadores: number; area?: { nombre: string }; evento?: { nombre: string }; descriptores?: { descripcion: string }[] };
  actaEvaluacion?: { idActaEvaluacion: string; notaFinal: string };
  ganador?: { idGanadorPremio: string; estado: boolean; asignaciones?: AsignacionPremio[]; certificados?: { idCertificado: string; fechaEmision: string; plantilla?: { descripcion: string } }[] };
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

const PAGO_ESTADO_CFG = {
  sin_configurar: { label: 'Pendiente de configuración', color: 'default' as const },
  configurado:    { label: 'Pendiente de pago',          color: 'warning' as const },
  pagado:         { label: 'Pago recibido ✓',            color: 'success' as const },
};

function QrUploadSection({ asignacion, refetch }: { asignacion: AsignacionPremio; refetch: () => void }) {
  const [subirQr, { loading }] = useMutation(SUBIR_QR_ASIGNACION);
  const [notif, setNotif] = useState<{ open: boolean; msg: string; sev: 'success' | 'error' }>({ open: false, msg: '', sev: 'success' });
  const [verificando, setVerificando] = useState(false);
  const [openComprobante, setOpenComprobante] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const showNotif = (msg: string, sev: 'success' | 'error') => setNotif({ open: true, msg, sev });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showNotif('Solo se aceptan imágenes', 'error'); return; }
    if (file.size > 2 * 1024 * 1024) { showNotif('La imagen no debe superar 2 MB', 'error'); return; }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      try {
        const res = await subirQr({ variables: { idAsignacionPremio: asignacion.idAsignacionPremio, qrBase64: base64 } });
        if (res.data?.subirQrAsignacion?.ok) { showNotif('QR subido correctamente', 'success'); refetch(); }
        else showNotif(res.data?.subirQrAsignacion?.error || 'Error al subir QR', 'error');
      } catch (err: any) { showNotif(err.message, 'error'); }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const isPagado   = asignacion.estadoPago === 'pagado';
  const hasQr      = !!asignacion.qrImagen;
  const esEfectivo = asignacion.metodoPago === 'efectivo';
  const metodoPendiente = !asignacion.metodoPago || asignacion.metodoPago === 'pendiente';
  const estadoCfg  = PAGO_ESTADO_CFG[asignacion.estadoPago] ?? PAGO_ESTADO_CFG.sin_configurar;

  return (
    <Box sx={{ mt: 2, p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
      {/* Cabecera: título + estado */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <QrcodeOutlined style={{ fontSize: 16, color: '#1890ff' }} />
          <Typography variant="caption" fontWeight={700} color="primary.main" sx={{ textTransform: 'uppercase' }}>
            Información de Pago
          </Typography>
        </Box>
        <Chip label={estadoCfg.label} size="small" color={estadoCfg.color} />
      </Box>

      {/* Método asignado por el administrador */}
      {!metodoPendiente && (
        <Chip
          label={esEfectivo ? 'Método: Efectivo' : 'Método: QR'}
          size="small"
          color={esEfectivo ? 'default' : 'primary'}
          variant="outlined"
          sx={{ mb: 1, fontSize: 11 }}
        />
      )}
      {metodoPendiente && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          El administrador aún no ha configurado el método de pago.
        </Typography>
      )}

      {/* Pago recibido */}
      {isPagado && (
        <Box sx={{ mt: 2 }}>
          <Alert severity="success" sx={{ py: 1, px: 2, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'success.light', bgcolor: 'rgba(82, 196, 26, 0.08)' }} icon={<CheckCircleOutlined style={{ fontSize: 18 }} />}>
            <Typography variant="body2" fontWeight={600} color="success.dark">
              {asignacion.fechaPago
                ? `Pago recibido el ${new Date(asignacion.fechaPago).toLocaleDateString('es-BO', { year: 'numeric', month: 'long', day: 'numeric' })}`
                : 'Pago recibido exitosamente'}
            </Typography>
          </Alert>
          {asignacion.comprobantePagoImagen && (
            <Box>
              <Button 
                variant="outlined" 
                size="small" 
                color="inherit" 
                onClick={() => setOpenComprobante(true)}
                startIcon={<FileProtectOutlined />}
                sx={{ borderRadius: 6, textTransform: 'none', px: 3 }}
              >
                Ver comprobante de pago
              </Button>
              <Dialog open={openComprobante} onClose={() => setOpenComprobante(false)} maxWidth="md" fullWidth>
                <DialogContent sx={{ p: 1, position: 'relative', bgcolor: '#f0f2f5' }}>
                  <IconButton onClick={() => setOpenComprobante(false)} sx={{ position: 'absolute', right: 8, top: 8, bgcolor: 'rgba(255,255,255,0.8)' }}>
                    <CloseCircleOutlined />
                  </IconButton>
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <img
                      src={asignacion.comprobantePagoImagen}
                      alt="Comprobante de pago"
                      style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                  </Box>
                </DialogContent>
              </Dialog>
            </Box>
          )}
        </Box>
      )}

      {/* Estado del pago cuando no está pagado */}
      {!isPagado && (
        <Box>
          <Button size="small" variant="text" color="inherit"
            disabled={verificando}
            onClick={async () => {
              setVerificando(true);
              try { await refetch(); } finally { setVerificando(false); }
            }}
            sx={{ fontSize: 10, mb: 1, color: 'text.disabled', textTransform: 'none' }}>
            {verificando ? 'Verificando...' : 'Verificar estado de pago'}
          </Button>

          {metodoPendiente && (
            <Alert severity="warning" sx={{ py: 0.5, mb: 1 }} icon={<ClockCircleOutlined />}>
              <Typography variant="caption">
                El administrador aún no ha configurado el método de pago. Por favor espera a que se asigne el método para continuar.
              </Typography>
            </Alert>
          )}

          {esEfectivo && (
            <Alert severity="info" sx={{ py: 0.5, mb: 1 }} icon={<DollarCircleOutlined />}>
              <Typography variant="caption">
                El método de pago asignado es Efectivo. Por favor, comunícate con el comité organizador o acércate a las oficinas para realizar el cobro manual.
              </Typography>
            </Alert>
          )}

          {asignacion.metodoPago === 'qr' && (
            <Box>
              <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
              {hasQr ? (
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <img src={asignacion.qrImagen} alt="Tu QR"
                    style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: 6, border: '1px solid #d9d9d9' }} />
                  <Box>
                    <Typography variant="caption" color="success.main" fontWeight={600} sx={{ display: 'block' }}>
                      QR subido correctamente
                    </Typography>
                    <Button size="small" variant="outlined" startIcon={<UploadOutlined />}
                      disabled={loading} onClick={() => inputRef.current?.click()}
                      sx={{ mt: 0.5, fontSize: 11 }}>
                      Reemplazar QR
                    </Button>
                  </Box>
                </Stack>
              ) : (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    El pago se realizará mediante transferencia. Sube tu código QR de cobro para continuar.
                  </Typography>
                  <Button size="small" variant="contained" startIcon={<UploadOutlined />}
                    disabled={loading} onClick={() => inputRef.current?.click()}
                    sx={{ fontWeight: 700 }}>
                    {loading ? 'Subiendo...' : 'Subir mi QR de cobro'}
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </Box>
      )}

      <Snackbar open={notif.open} autoHideDuration={4000} onClose={() => setNotif(n => ({ ...n, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={notif.sev} onClose={() => setNotif(n => ({ ...n, open: false }))} sx={{ width: '100%' }}>
          {notif.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function PremioCard({ candidato, miIdParticipante, refetch }: { candidato: CandidatoPremio; miIdParticipante: string; refetch: () => void }) {
  const esGanador = !!(candidato.ganador && candidato.ganador.estado !== false);
  const posicion = candidato.premio?.numeroGanadores ?? 0;
  const posConfig = POSICION_LABELS[posicion];
  const nota = candidato.actaEvaluacion?.notaFinal ?? candidato.nota;
  const certificados = candidato.ganador?.certificados ?? [];

  // Buscar la asignación monetaria que corresponde al participante actual
  const asignaciones = candidato.ganador?.asignaciones ?? [];
  const miAsignacion = miIdParticipante
    ? asignaciones.find(a => String(a.participante.idParticipante) === String(miIdParticipante))
    : null;

  const fmt = (n: string | number) =>
    parseFloat(String(n)).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <Box sx={{
      p: 2.5, borderRadius: 2,
      border: '1px solid',
      borderColor: 'divider',
      bgcolor: 'background.paper',
      position: 'relative',
      overflow: 'hidden',
      mb: 1.5,
      '&::before': esGanador ? {
        content: '""',
        position: 'absolute',
        top: 0, left: 0, bottom: 0,
        width: 4,
        bgcolor: 'warning.main'
      } : {}
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

      {/* Nota & Premio monetario total */}
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

      {/* Certificados de honor */}
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

      {/* Comprobante de división de premio monetario */}
      {esGanador && miAsignacion && (
        <Box sx={{
          mt: 2, p: 2, borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'action.hover',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: miAsignacion.impresa ? 1 : 0 }}>
            <DollarCircleOutlined style={{ fontSize: 16, color: '#8c8c8c' }} />
            <Typography variant="caption" fontWeight={700} color="text.primary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Premio Monetario — Tu Asignación
            </Typography>
          </Box>

          {miAsignacion.impresa ? (
            <>
              <Box sx={{ display: 'flex', gap: 2, mb: 1, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Monto asignado</Typography>
                  <Typography variant="body1" fontWeight={700} color="text.primary">
                    Bs. {fmt(miAsignacion.montoAsignado)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Porcentaje</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {parseFloat(miAsignacion.porcentaje).toFixed(2)}%
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="outlined"
                color="inherit"
                size="small"
                startIcon={<PrinterOutlined />}
                sx={{ fontWeight: 600, textTransform: 'none', borderRadius: 6 }}
                onClick={() => imprimirMiComprobante(miAsignacion, candidato.ganador)}
              >
                Imprimir mi Comprobante de Asignación
              </Button>

              <QrUploadSection asignacion={miAsignacion} refetch={refetch} />
            </>
          ) : (
            <Alert severity="warning" sx={{ py: 0.5, mt: 0.5 }} icon={<DollarCircleOutlined />}>
              <Typography variant="caption">
                Tu comprobante de asignación monetaria está siendo procesado por el comité organizador.
              </Typography>
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function MisProyectos() {
  const [tab, setTab] = useState(0);
  const { data, loading, error, refetch } = useQuery(GET_MIS_PROYECTOS, { fetchPolicy: 'no-cache' });

  useEffect(() => {
    const onFocus = () => refetch();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refetch]);

  if (loading && !data) return (
    <MainCard title="Mis Proyectos">
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
    </MainCard>
  );

  if (error && !data) return (
    <MainCard title="Mis Proyectos">
      <Alert severity="error">Error al cargar tus proyectos.</Alert>
    </MainCard>
  );

  const todos: Proyecto[] = data?.me?.participante?.proyectosInscritos || [];
  const miIdParticipante: string = String(data?.me?.participante?.idParticipante ?? '');

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
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
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
              <Accordion key={proyecto.idProyecto} variant="outlined" sx={{
                borderRadius: '12px !important',
                border: '1px solid',
                borderColor: hasWinner ? 'warning.main' : 'divider',
                boxShadow: hasWinner ? '0 4px 20px rgba(245,166,35,0.15)' : 'none',
                '&:before': { display: 'none' },
                '&.Mui-expanded': { m: 0 },
                overflow: 'hidden'
              }}>
                <AccordionSummary
                  expandIcon={<DownOutlined />}
                  sx={{ 
                    p: 3, 
                    '& .MuiAccordionSummary-content': { display: 'block', m: '0 !important', pr: 2 } 
                  }}
                >
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
                          {proyecto.ofertaEaCarrera?.eaCarrera?.entidadAcademica?.nombre}
                          {proyecto.ofertaEaCarrera?.eaCarrera?.carrera?.nombre && ` • ${proyecto.ofertaEaCarrera.eaCarrera.carrera.nombre}`}
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
                </AccordionSummary>

                <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
                  <Divider sx={{ mb: 2 }} />

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
                        href={`http://${window.location.hostname}:8000/media/${proyecto.archivo}`}
                        target="_blank" rel="noopener noreferrer">
                        Descargar
                      </Button>
                    </Box>
                  )}

                  {/* Documentos Oficiales de Inscripción (si está aprobado) */}
                  {proyecto.estado === 'aprobado' && (
                    <Box sx={{ mb: 2.5, p: 2, borderRadius: 2, border: '1px solid', borderColor: 'success.light', bgcolor: 'rgba(76,175,80,0.04)' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <FileProtectOutlined style={{ color: '#4caf50', fontSize: 16 }} />
                        <Typography variant="subtitle2" fontWeight={700} color="success.main"
                          sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Documentos Oficiales de Inscripción
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          startIcon={<PrinterOutlined />}
                          onClick={() => imprimirFormularioInscripcion(proyecto)}
                          sx={{ fontWeight: 600 }}
                        >
                          Imprimir Formulario de Inscripción
                        </Button>
                        <Button
                          variant="outlined"
                          color="success"
                          size="small"
                          startIcon={<PrinterOutlined />}
                          onClick={() => imprimirDeclaracionesJuradas(proyecto, miIdParticipante)}
                          sx={{ fontWeight: 600 }}
                        >
                          Imprimir mi Declaración Jurada
                        </Button>
                      </Box>
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
                      <Box sx={{ 
                        maxHeight: 450, 
                        overflowY: 'auto', 
                        pr: 1,
                        mr: -1, // Compensar el padding
                        '&::-webkit-scrollbar': { width: 6 },
                        '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 3 }
                      }}>
                        {candidatos.map((c: CandidatoPremio) => (
                          <PremioCard key={c.idCandidatoPremio} candidato={c} miIdParticipante={miIdParticipante} refetch={refetch} />
                        ))}
                      </Box>
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Stack>
      )}
    </MainCard>
  );
}
