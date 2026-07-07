import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
  Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Snackbar, Alert, CircularProgress, Chip, Typography, Stack, Divider,
  FormControl, InputLabel, Select, MenuItem, Tooltip, Tabs, Tab, Grid, Card, CardContent
} from '@mui/material';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, TrophyOutlined,
  TagOutlined, GoldOutlined, TeamOutlined, CheckCircleOutlined, CloseCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import MainCard from 'components/MainCard';

// Diálogo de confirmación reutilizable (reemplaza window.confirm)
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

// ── GQL ──────────────────────────────────────────────────────────────────────
const GET_DATA = gql`
  query {
    todosSLosTiposDescriptores: todosLosTiposDescriptores { idTipoDescriptor nombre estado }
    todosLosDescriptores { idDescriptor descripcion estado tipoDescriptor { idTipoDescriptor nombre } }
    todosLosPremios {
      idPremio monto numeroGanadores estado
      evento { idEvento nombre }
      area { idArea nombre }
      premioDescriptores { id descriptor { idDescriptor descripcion tipoDescriptor { nombre } } }
      candidatos { idCandidatoPremio estado activo }
    }
    todosLosCandidatosPremios {
      idCandidatoPremio nota observacion estado activo
      premio { idPremio monto evento { nombre } area { nombre }
        premioDescriptores { descriptor { descripcion } }
      }
      proyecto {
        idProyecto titulo
        ofertaEaCarrera { oferta { idOferta categoriaEvento { evento { idEvento nombre version } categoria { nombre } } modalidadArea { area { idArea nombre } modalidad { nombre } } } }
      }
      actaEvaluacion { idActaEvaluacion notaFinal observacion }
      ganador { idGanadorPremio estado }
    }
    todosLosGanadoresPremios {
      idGanadorPremio estado
      candidatoPremio {
        idCandidatoPremio nota observacion
        actaEvaluacion { idActaEvaluacion observacion }
        proyecto {
          idProyecto titulo resumen estado archivo fechaInscripcion fechaConfirmacion
          participantes { idParticipante nombre apellido ci }
          tutores { idTutor nombre apellido ci }
          ofertaEaCarrera {
            oferta {
              idOferta
              categoriaEvento { evento { idEvento nombre version } categoria { nombre } }
              modalidadArea { modalidad { nombre } area { idArea nombre } }
            }
          }
        }
        premio {
          idPremio monto numeroGanadores
          evento { nombre }
          area { nombre }
          premioDescriptores { descriptor { descripcion } }
        }
        actaEvaluacion {
          idActaEvaluacion
          detallesEvaluacion {
            puntuacion
            yaEvaluo
            tribunal { nombre apellido }
          }
        }
      }
    }
    todasLasActas {
      idActaEvaluacion notaFinal desempatePrioridad fecha
      detallesEvaluacion {
        puntuacion
        yaEvaluo
        tribunal { nombre apellido }
      }
      proyecto {
        idProyecto titulo estado resumen archivo fechaInscripcion fechaConfirmacion
        participantes { idParticipante nombre apellido ci }
        tutores { idTutor nombre apellido ci }
        ofertaEaCarrera {
          oferta {
            idOferta
            categoriaEvento { evento { idEvento nombre version } categoria { nombre } }
            modalidadArea { modalidad { nombre } area { idArea nombre } }
          }
        }
      }
    }
    todasLasOfertas {
      idOferta estado
      categoriaEvento {
        evento { idEvento nombre version }
      }
      modalidadArea {
        area { idArea nombre }
      }
    }
    todosLosEventos { idEvento nombre estado }
    todasLasAreas { idArea nombre estado }
    todosLosCronogramas {
      idCronograma fechaFin estado
      actividad { nombreActividad }
      evento { idEvento nombre }
    }
  }
`;

const CERRAR_ACTA_RESULTADOS = gql`
  mutation($idOferta: ID!) {
    cerrarActaResultados(idOferta: $idOferta) {
      ok error
      ganadores { idCandidatoPremio nota estado proyecto { titulo } premio { idPremio numeroGanadores } }
      empates  { idCandidatoPremio nota estado proyecto { titulo } premio { idPremio numeroGanadores } }
    }
  }
`;

// TipoDescriptor mutations
const CREAR_TIPO = gql`mutation($nombre: String!) { crearTipoDescriptor(nombre: $nombre) { ok error } }`;
const EDITAR_TIPO = gql`mutation($idTipoDescriptor: ID!, $nombre: String, $estado: Boolean) {
  editarTipoDescriptor(idTipoDescriptor: $idTipoDescriptor, nombre: $nombre, estado: $estado) { ok error }
}`;
const ELIMINAR_TIPO = gql`mutation($idTipoDescriptor: ID!) { eliminarTipoDescriptor(idTipoDescriptor: $idTipoDescriptor) { ok error } }`;

// Descriptor mutations
const CREAR_DESC = gql`mutation($idTipoDescriptor: ID!, $descripcion: String!) {
  crearDescriptor(idTipoDescriptor: $idTipoDescriptor, descripcion: $descripcion) { ok error }
}`;
const EDITAR_DESC = gql`mutation($idDescriptor: ID!, $idTipoDescriptor: ID, $descripcion: String, $estado: Boolean) {
  editarDescriptor(idDescriptor: $idDescriptor, idTipoDescriptor: $idTipoDescriptor, descripcion: $descripcion, estado: $estado) { ok error }
}`;
const ELIMINAR_DESC = gql`mutation($idDescriptor: ID!) { eliminarDescriptor(idDescriptor: $idDescriptor) { ok error } }`;

// Premio mutations
const CREAR_PREMIO = gql`mutation($idOferta: ID!, $monto: Decimal, $numeroGanadores: Int!, $idDescriptores: [ID]) {
  crearPremio(idOferta: $idOferta, monto: $monto, numeroGanadores: $numeroGanadores, idDescriptores: $idDescriptores) { ok error }
}`;
const EDITAR_PREMIO = gql`mutation($idPremio: ID!, $idEvento: ID, $idArea: ID, $monto: Decimal, $numeroGanadores: Int, $estado: Boolean, $idDescriptores: [ID]) {
  editarPremio(idPremio: $idPremio, idEvento: $idEvento, idArea: $idArea, monto: $monto, numeroGanadores: $numeroGanadores, estado: $estado, idDescriptores: $idDescriptores) { ok error }
}`;
const ELIMINAR_PREMIO = gql`mutation($idPremio: ID!) { eliminarPremio(idPremio: $idPremio) { ok error } }`;



const EDIT_ACTA = gql`
  mutation($idActaEvaluacion: ID!, $notaFinal: Decimal, $observacion: String, $consolidada: Boolean, $desempatePrioridad: Int) {
    editarActaEvaluacion(idActaEvaluacion: $idActaEvaluacion, notaFinal: $notaFinal, observacion: $observacion, consolidada: $consolidada, desempatePrioridad: $desempatePrioridad) {
      ok error
    }
  }
`;

// CandidatoPremio mutations
const EDITAR_CANDIDATO = gql`mutation($idCandidatoPremio: ID!, $estado: String, $activo: Boolean) {
  editarCandidatoPremio(idCandidatoPremio: $idCandidatoPremio, estado: $estado, activo: $activo) { ok error }
}`;

// GanadorPremio mutations
const CREAR_GANADOR = gql`mutation($idCandidatoPremio: ID!) {
  crearGanadorPremio(idCandidatoPremio: $idCandidatoPremio) { ok error }
}`;

// ── Helpers ───────────────────────────────────────────────────────────────────
const estadoColor = { candidato: 'warning', ganador: 'success', descartado: 'error' };

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;
}

// ── Tab 1: Gestión de Premios ─────────────────────────────────────────────────
function GestionPremiosTab({ tipos, descriptores, premios, ofertas, eventos, areas, refetch, showNotif }) {
  const [crearTipo] = useMutation(CREAR_TIPO);
  const [editarTipo] = useMutation(EDITAR_TIPO);
  const [eliminarTipo] = useMutation(ELIMINAR_TIPO);
  const [crearDesc] = useMutation(CREAR_DESC);
  const [editarDesc] = useMutation(EDITAR_DESC);
  const [eliminarDesc] = useMutation(ELIMINAR_DESC);
  const [crearPremio] = useMutation(CREAR_PREMIO);
  const [editarPremio] = useMutation(EDITAR_PREMIO);
  const [eliminarPremio] = useMutation(ELIMINAR_PREMIO);


  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', onOk: null });
  const askConfirm = (title, message, onOk) => setConfirm({ open: true, title, message, onOk });
  const closeConfirm = () => setConfirm(p => ({ ...p, open: false }));

  // TipoDescriptor dialog
  const [tipoDialog, setTipoDialog] = useState({ open: false, item: null });
  const [tipoForm, setTipoForm] = useState('');

  // Descriptor dialog
  const [descDialog, setDescDialog] = useState({ open: false, item: null });
  const [descForm, setDescForm] = useState({ idTipoDescriptor: '', descripcion: '' });

  // Premio dialog
  const [premioDialog, setPremioDialog] = useState({ open: false, item: null });
  const [premioForm, setPremioForm] = useState({ idOferta: '', monto: '', numeroGanadores: 1, idDescriptores: [] });

  // Grupos de premios expandidos/colapsados
  const [premiosExpandidos, setPremiosExpandidos] = useState(new Set());
  const togglePremioGrupo = (key) => setPremiosExpandidos(prev => {
    const next = new Set(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });



  // ── TipoDescriptor handlers ──
  const openTipoDialog = (item = null) => {
    setTipoForm(item ? item.nombre : '');
    setTipoDialog({ open: true, item });
  };
  const handleSaveTipo = async () => {
    setSaving(true);
    try {
      let res;
      if (tipoDialog.item) {
        res = (await editarTipo({ variables: { idTipoDescriptor: tipoDialog.item.idTipoDescriptor, nombre: tipoForm } })).data?.editarTipoDescriptor;
      } else {
        res = (await crearTipo({ variables: { nombre: tipoForm } })).data?.crearTipoDescriptor;
      }
      if (res?.ok) { showNotif('Tipo guardado'); refetch(); setTipoDialog({ open: false, item: null }); }
      else showNotif(res?.error || 'Error', 'error');
    } catch { showNotif('Error de conexión', 'error'); }
    setSaving(false);
  };
  const handleDeleteTipo = (id) => {
    askConfirm('Desactivar tipo', '¿Desactivar este tipo de descriptor?', async () => {
      try {
        const res = (await eliminarTipo({ variables: { idTipoDescriptor: id } })).data?.eliminarTipoDescriptor;
        if (res?.ok) { showNotif('Tipo desactivado'); refetch(); }
        else showNotif(res?.error || 'Error', 'error');
      } catch { showNotif('Error de conexión', 'error'); }
    });
  };

  // ── Descriptor handlers ──
  const openDescDialog = (item = null) => {
    setDescForm(item ? { idTipoDescriptor: item.tipoDescriptor.idTipoDescriptor, descripcion: item.descripcion } : { idTipoDescriptor: '', descripcion: '' });
    setDescDialog({ open: true, item });
  };
  const handleSaveDesc = async () => {
    setSaving(true);
    try {
      let res;
      if (descDialog.item) {
        res = (await editarDesc({ variables: { idDescriptor: descDialog.item.idDescriptor, ...descForm } })).data?.editarDescriptor;
      } else {
        res = (await crearDesc({ variables: descForm })).data?.crearDescriptor;
      }
      if (res?.ok) { showNotif('Descriptor guardado'); refetch(); setDescDialog({ open: false, item: null }); }
      else showNotif(res?.error || 'Error', 'error');
    } catch { showNotif('Error de conexión', 'error'); }
    setSaving(false);
  };
  const handleDeleteDesc = (id) => {
    askConfirm('Desactivar descriptor', '¿Desactivar este descriptor?', async () => {
      try {
        const res = (await eliminarDesc({ variables: { idDescriptor: id } })).data?.eliminarDescriptor;
        if (res?.ok) { showNotif('Descriptor desactivado'); refetch(); }
        else showNotif(res?.error || 'Error', 'error');
      } catch { showNotif('Error de conexión', 'error'); }
    });
  };

  // ── Premio handlers ──
  const positionLabel = (n) => {
    const num = parseInt(n);
    if (num === 1) return '1er lugar';
    if (num === 2) return '2do lugar';
    if (num === 3) return '3er lugar';
    return `${num}° lugar`;
  };

  const openPremioDialog = (item = null) => {
    if (item) {
      // Buscar la oferta que coincide con evento + área del premio
      const matchingOferta = ofertas.find(o =>
        o.categoriaEvento?.evento?.idEvento === item.evento?.idEvento &&
        o.modalidadArea?.area?.idArea === item.area?.idArea
      );
      setPremioForm({
        idOferta: matchingOferta?.idOferta || '',
        monto: item.monto ?? '',
        numeroGanadores: item.numeroGanadores,
        idDescriptores: item.premioDescriptores?.map(pd => pd.descriptor.idDescriptor) || [],
      });
    } else {
      setPremioForm({ idOferta: '', monto: '', numeroGanadores: 1, idDescriptores: [] });
    }
    setPremioDialog({ open: true, item });
  };

  const handleSavePremio = async () => {
    setSaving(true);
    try {
      let res;
      const montoVal = premioForm.monto !== '' ? parseFloat(premioForm.monto) : null;
      if (premioDialog.item) {
        // Derivar idEvento + idArea desde la oferta seleccionada
        const ofertaSel = ofertas.find(o => o.idOferta === premioForm.idOferta);
        res = (await editarPremio({
          variables: {
            idPremio: premioDialog.item.idPremio,
            idEvento: ofertaSel?.categoriaEvento?.evento?.idEvento,
            idArea: ofertaSel?.modalidadArea?.area?.idArea,
            monto: montoVal,
            numeroGanadores: parseInt(premioForm.numeroGanadores),
            idDescriptores: premioForm.idDescriptores,
          }
        })).data?.editarPremio;
      } else {
        res = (await crearPremio({
          variables: {
            idOferta: premioForm.idOferta,
            monto: montoVal,
            numeroGanadores: parseInt(premioForm.numeroGanadores),
            idDescriptores: premioForm.idDescriptores.length > 0 ? premioForm.idDescriptores : undefined,
          }
        })).data?.crearPremio;
      }
      if (res?.ok) { showNotif('Premio guardado'); refetch(); setPremioDialog({ open: false, item: null }); }
      else showNotif(res?.error || 'Error', 'error');
    } catch { showNotif('Error de conexión', 'error'); }
    setSaving(false);
  };
  const handleDeletePremio = (id) => {
    askConfirm(
      'Eliminar Premio',
      'Esta acción eliminará el premio permanentemente y no se puede deshacer. ¿Confirmas?',
      async () => {
        try {
          const res = (await eliminarPremio({ variables: { idPremio: id } })).data?.eliminarPremio;
          if (res?.ok) { showNotif('Premio eliminado correctamente'); refetch(); }
          else showNotif(res?.error || 'Error', 'error');
        } catch { showNotif('Error de conexión', 'error'); }
      }
    );
  };



  const tiposActivos = tipos.filter(t => t.estado);
  const descActivos = descriptores.filter(d => d.estado);

  return (
    <Box>
      {/* TipoDescriptor + Descriptor */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={5}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6">Tipo de Premio</Typography>
            <Button size="small" variant="outlined" startIcon={<PlusOutlined />} onClick={() => openTipoDialog()}>Nuevo</Button>
          </Box>
          <TableContainer component={Paper} elevation={0} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell align="center">Estado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tipos.map(t => (
                  <TableRow key={t.idTipoDescriptor} hover>
                    <TableCell>{t.nombre}</TableCell>
                    <TableCell align="center">
                      <Chip label={t.estado ? 'Activo' : 'Inactivo'} size="small" color={t.estado ? 'success' : 'default'} />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Editar">
                        <IconButton size="small" color="primary" onClick={() => openTipoDialog(t)}><EditOutlined /></IconButton>
                      </Tooltip>
                      <Tooltip title="Desactivar">
                        <IconButton size="small" color="error" onClick={() => handleDeleteTipo(t.idTipoDescriptor)}><DeleteOutlined /></IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {tipos.length === 0 && (
                  <TableRow><TableCell colSpan={3} align="center" sx={{ py: 3, color: 'text.secondary' }}>Sin tipos registrados.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        <Grid item xs={12} md={7}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6">Premios</Typography>
            <Button size="small" variant="outlined" startIcon={<PlusOutlined />} onClick={() => openDescDialog()}>Nuevo</Button>
          </Box>
          <TableContainer component={Paper} elevation={0} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell align="center">Estado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {descriptores.map(d => (
                  <TableRow key={d.idDescriptor} hover>
                    <TableCell>{d.descripcion}</TableCell>
                    <TableCell><Chip label={d.tipoDescriptor.nombre} size="small" variant="outlined" icon={<TagOutlined style={{ fontSize: 11 }} />} /></TableCell>
                    <TableCell align="center">
                      <Chip label={d.estado ? 'Activo' : 'Inactivo'} size="small" color={d.estado ? 'success' : 'default'} />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Editar">
                        <IconButton size="small" color="primary" onClick={() => openDescDialog(d)}><EditOutlined /></IconButton>
                      </Tooltip>
                      <Tooltip title="Desactivar">
                        <IconButton size="small" color="error" onClick={() => handleDeleteDesc(d.idDescriptor)}><DeleteOutlined /></IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {descriptores.length === 0 && (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>Sin descriptores registrados.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      <Divider sx={{ mb: 3 }} />

      {/* Premios agrupados por oferta */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Premios</Typography>
        <Button variant="contained" startIcon={<PlusOutlined />} onClick={() => openPremioDialog()}>Nuevo Premio</Button>
      </Box>
      {(() => {
        // Asociar cada premio con su oferta (matching evento + área)
        const premiosConOferta = premios.map(p => ({
          ...p,
          _oferta: ofertas.find(o =>
            o.categoriaEvento?.evento?.idEvento === p.evento?.idEvento &&
            o.modalidadArea?.area?.idArea === p.area?.idArea
          ) || null,
        }));

        // Agrupar por oferta
        const grupos = premiosConOferta.reduce((acc, p) => {
          const key = p._oferta?.idOferta || `evento_${p.evento?.idEvento}_area_${p.area?.idArea}`;
          if (!acc[key]) acc[key] = { oferta: p._oferta, evento: p.evento, area: p.area, premios: [] };
          acc[key].premios.push(p);
          return acc;
        }, {});

        const gruposList = Object.values(grupos);

        if (gruposList.length === 0) {
          return (
            <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
              Sin premios registrados.
            </Box>
          );
        }

        return gruposList.map((grupo, gi) => {
          const key = grupo.oferta?.idOferta || `g_${gi}`;
          const isOpen = premiosExpandidos.has(key);
          return (
            <Box key={key} sx={{ mb: 2 }}>
              {/* Cabecera colapsable */}
              <Box sx={{
                px: 2, py: 1.25,
                borderRadius: isOpen ? '8px 8px 0 0' : 1.5,
                background: 'linear-gradient(135deg, rgba(114,46,209,0.08), rgba(114,46,209,0.02))',
                border: '1px solid rgba(114,46,209,0.25)',
                display: 'flex', alignItems: 'center', gap: 1.5,
                cursor: 'default',
              }}>
                <GoldOutlined style={{ color: '#722ed1', fontSize: 17 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" fontWeight={700} color="secondary.main">
                    {grupo.oferta?.categoriaEvento?.evento?.nombre
                      ? `${grupo.oferta.categoriaEvento.evento.nombre} v${grupo.oferta.categoriaEvento.evento.version || ''} · ${grupo.oferta.categoriaEvento?.categoria?.nombre || ''}`
                      : `${grupo.evento?.nombre} — ${grupo.area?.nombre}`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {grupo.evento?.nombre}
                    {grupo.oferta?.categoriaEvento?.evento?.version
                      ? ` v${grupo.oferta.categoriaEvento.evento.version}`
                      : ''}
                  </Typography>
                </Box>
                <Chip
                  label={isOpen
                    ? `▲ ${grupo.premios.length} premio(s)`
                    : `▼ ${grupo.premios.length} premio(s)`}
                  size="small"
                  color="secondary"
                  variant={isOpen ? 'filled' : 'outlined'}
                  onClick={() => togglePremioGrupo(key)}
                  sx={{ cursor: 'pointer', fontWeight: 600, userSelect: 'none' }}
                />
              </Box>

              {isOpen && (
                <TableContainer component={Paper} elevation={0}
                  sx={{ border: '1px solid rgba(114,46,209,0.25)', borderTop: 'none', borderRadius: '0 0 8px 8px' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell align="center" width={140}>Lugar</TableCell>
                        <TableCell>Descriptores</TableCell>
                        <TableCell align="center">Monto</TableCell>
                        <TableCell align="right" width={120}>Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {grupo.premios
                        .slice()
                        .sort((a, b) => a.numeroGanadores - b.numeroGanadores)
                        .map(p => (
                          <TableRow key={p.idPremio} hover>
                            <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                              <Typography fontWeight={700} fontSize={14}>
                                {posLabel(p.numeroGanadores)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" flexWrap="wrap" gap={0.5}>
                                {(p.premioDescriptores || []).map(pd => (
                                  <Chip key={pd.id} label={pd.descriptor.descripcion} size="small" variant="outlined" color="secondary" />
                                ))}
                                {(p.premioDescriptores || []).length === 0 && (
                                  <Typography variant="caption" color="text.secondary">Sin descriptores</Typography>
                                )}
                              </Stack>
                            </TableCell>
                            <TableCell align="center">
                              {(() => {
                                if (!p.monto) return <Typography fontWeight={600}>—</Typography>;
                                const esDolar = (p.premioDescriptores || []).some(pd => 
                                  pd.descriptor.descripcion.toLowerCase().includes('dolar') || 
                                  pd.descriptor.descripcion.toLowerCase().includes('dólar') || 
                                  pd.descriptor.descripcion.toLowerCase().includes('usd')
                                );
                                const simbolo = esDolar ? '$us.' : 'Bs.';
                                return <Typography fontWeight={600}>{simbolo} {p.monto}</Typography>;
                              })()}
                            </TableCell>
                            <TableCell align="right">
                              <Stack direction="row" justifyContent="flex-end">

                                <Tooltip title="Editar">
                                  <IconButton size="small" color="primary" onClick={() => openPremioDialog(p)}><EditOutlined /></IconButton>
                                </Tooltip>
                                <Tooltip title="Eliminar">
                                  <IconButton size="small" color="error" onClick={() => handleDeletePremio(p.idPremio)}><DeleteOutlined /></IconButton>
                                </Tooltip>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          );
        });
      })()}

      {/* ── Dialogs ── */}
      {/* TipoDescriptor Dialog */}
      <Dialog open={tipoDialog.open} onClose={() => setTipoDialog({ open: false, item: null })} maxWidth="xs" fullWidth>
        <DialogTitle>{tipoDialog.item ? 'Editar Tipo' : 'Nuevo Tipo de Descriptor'}</DialogTitle>
        <DialogContent dividers>
          <TextField label="Nombre del tipo" fullWidth value={tipoForm} onChange={e => setTipoForm(e.target.value)} sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTipoDialog({ open: false, item: null })} color="secondary">Cancelar</Button>
          <Button variant="contained" disabled={!tipoForm.trim() || saving} onClick={handleSaveTipo}>
            {saving ? <CircularProgress size={22} color="inherit" /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Descriptor Dialog */}
      <Dialog open={descDialog.open} onClose={() => setDescDialog({ open: false, item: null })} maxWidth="xs" fullWidth>
        <DialogTitle>{descDialog.item ? 'Editar Descriptor' : 'Nuevo Descriptor'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel>Tipo</InputLabel>
              <Select value={descForm.idTipoDescriptor} label="Tipo" onChange={e => setDescForm(p => ({ ...p, idTipoDescriptor: e.target.value }))}>
                {tiposActivos.map(t => <MenuItem key={t.idTipoDescriptor} value={t.idTipoDescriptor}>{t.nombre}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Descripción" fullWidth value={descForm.descripcion} onChange={e => setDescForm(p => ({ ...p, descripcion: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDescDialog({ open: false, item: null })} color="secondary">Cancelar</Button>
          <Button variant="contained" disabled={!descForm.idTipoDescriptor || !descForm.descripcion.trim() || saving} onClick={handleSaveDesc}>
            {saving ? <CircularProgress size={22} color="inherit" /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Premio Dialog — mismo formulario para crear y editar */}
      {(() => {
        // Validar si el lugar ya está ocupado para la oferta seleccionada
        const ofertaSel = ofertas.find(o => o.idOferta === premioForm.idOferta);
        const lugarOcupado = !!(
          ofertaSel &&
          premioForm.numeroGanadores &&
          premios.some(p =>
            p.evento?.idEvento === ofertaSel.categoriaEvento?.evento?.idEvento &&
            p.area?.idArea    === ofertaSel.modalidadArea?.area?.idArea &&
            parseInt(p.numeroGanadores) === parseInt(premioForm.numeroGanadores) &&
            (!premioDialog.item || p.idPremio !== premioDialog.item.idPremio)
          )
        );

        return (
          <Dialog open={premioDialog.open} onClose={() => setPremioDialog({ open: false, item: null })} maxWidth="sm" fullWidth>
            <DialogTitle>{premioDialog.item ? 'Editar Premio' : 'Nuevo Premio'}</DialogTitle>
            <DialogContent dividers>
              <Stack spacing={2} sx={{ pt: 1 }}>
                {/* Oferta */}
                <FormControl fullWidth required>
                  <InputLabel>Oferta académica</InputLabel>
                  <Select
                    value={premioForm.idOferta}
                    label="Oferta académica"
                    onChange={e => setPremioForm(p => ({ ...p, idOferta: e.target.value }))}
                  >
                    {ofertas.filter(o => o.estado).map(o => (
                      <MenuItem key={o.idOferta} value={o.idOferta}>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>{o.nombre}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {o.categoriaEvento?.evento?.nombre}
                            {o.categoriaEvento?.evento?.version ? ` — v${o.categoriaEvento.evento.version}` : ''}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Descriptores / Premios (Múltiple) */}
                <FormControl fullWidth>
                  <InputLabel>Premios (Certificados, etc.)</InputLabel>
                  <Select
                    multiple
                    value={premioForm.idDescriptores}
                    label="Premios (Certificados, etc.)"
                    onChange={e => {
                      const value = e.target.value;
                      setPremioForm(p => ({ ...p, idDescriptores: typeof value === 'string' ? value.split(',') : value }));
                    }}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          const desc = descriptores.find(d => d.idDescriptor === value);
                          return <Chip key={value} label={desc ? desc.descripcion : value} size="small" />;
                        })}
                      </Box>
                    )}
                  >
                    {descriptores.filter(d => d.estado).map(d => (
                      <MenuItem key={d.idDescriptor} value={d.idDescriptor}>
                        {d.descripcion} ({d.tipoDescriptor.nombre})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Monto */}
                <TextField
                  label="Monto numérico (Ej: 5000)"
                  type="number"
                  fullWidth
                  value={premioForm.monto}
                  helperText="Opcional — dejar vacío si el premio no es monetario"
                  inputProps={{ min: 0, step: 0.01 }}
                  onChange={e => setPremioForm(p => ({ ...p, monto: e.target.value }))}
                />

                {/* Lugar */}
                <TextField
                  label="Lugar (posición)"
                  type="number"
                  fullWidth
                  required
                  error={lugarOcupado}
                  value={premioForm.numeroGanadores}
                  helperText={
                    lugarOcupado
                      ? `⚠ Ya existe un premio para el ${positionLabel(premioForm.numeroGanadores)} en esta oferta`
                      : `Este premio es para el ${positionLabel(premioForm.numeroGanadores)}`
                  }
                  inputProps={{ min: 1, max: 3 }}
                  onChange={e => setPremioForm(p => ({ ...p, numeroGanadores: e.target.value }))}
                  FormHelperTextProps={{ sx: lugarOcupado ? { color: 'error.main', fontWeight: 600 } : {} }}
                />

                {/* Alerta visible cuando el lugar está ocupado */}
                {lugarOcupado && (
                  <Alert
                    severity="error"
                    icon={<ExclamationCircleOutlined style={{ fontSize: 18 }} />}
                  >
                    El <strong>{positionLabel(premioForm.numeroGanadores)}</strong> ya tiene un premio registrado
                    para esta oferta. Elige otro lugar o edita el premio existente.
                  </Alert>
                )}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setPremioDialog({ open: false, item: null })} color="secondary">Cancelar</Button>
              <Button
                variant="contained"
                disabled={!premioForm.idOferta || !premioForm.numeroGanadores || lugarOcupado || saving}
                onClick={handleSavePremio}
              >
                {saving ? <CircularProgress size={22} color="inherit" /> : 'Guardar'}
              </Button>
            </DialogActions>
          </Dialog>
        );
      })()}

      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        onConfirm={() => { confirm.onOk?.(); closeConfirm(); }}
        onCancel={closeConfirm}
      />

    </Box>
  );
}

// ── Tab 2: Ranking ────────────────────────────────────────────────────────────
function RankingTab({ actas, premios, ganadores, refetch, showNotif }) {
  const [expandidos, setExpandidos] = useState(new Set());
  const [detalleActa, setDetalleActa] = useState(null);
  
  const toggleExpandido = (key) => setExpandidos(prev => {
    const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next;
  });

  const actasConNota = [...actas].filter(a => parseFloat(a.notaFinal) > 0);
  const actasPorOferta = actasConNota.reduce((acc, acta) => {
    const oferta = acta.proyecto?.ofertaEaCarrera?.oferta;
    const key = oferta?.idOferta || 'sin_oferta';
    if (!acc[key]) acc[key] = { oferta, actas: [] };
    acc[key].actas.push(acta);
    return acc;
  }, {});
  const gruposOferta = Object.values(actasPorOferta).map(g => ({
    ...g,
    actas: [...g.actas].sort((a, b) => parseFloat(b.notaFinal) - parseFloat(a.notaFinal)),
  }));

  const totalActas = actasConNota.length;
  const todasNotas = actasConNota.map(a => parseFloat(a.notaFinal));
  const notaMax = todasNotas.length > 0 ? Math.max(...todasNotas) : 0;
  const notaMin = todasNotas.length > 0 ? Math.min(...todasNotas) : 0;
  const premiosActivos = premios.filter(p => p.estado);

  // IDs de ofertas que ya tienen al menos un ganador confirmado
  const ofertasConGanador = new Set(
    ganadores.map(g => g.candidatoPremio?.proyecto?.ofertaEaCarrera?.oferta?.idOferta).filter(Boolean)
  );

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Proyectos evaluados', value: totalActas, color: 'primary.lighter' },
          { label: 'Nota más alta', value: notaMax || '—', color: 'success.lighter' },
          { label: 'Nota más baja', value: notaMin || '—', color: 'warning.lighter' },
          { label: 'Total premios activos', value: premiosActivos.length, color: 'secondary.lighter' },
        ].map(c => (
          <Grid item xs={6} sm={3} key={c.label}>
            <Card variant="outlined" sx={{ bgcolor: c.color }}>
              <CardContent sx={{ py: '12px !important', px: 2 }}>
                <Typography variant="h5" fontWeight={700}>{c.value}</Typography>
                <Typography variant="caption" color="text.secondary">{c.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {gruposOferta.length === 0 ? (
        <Alert severity="info">No hay actas con nota final registrada.</Alert>
      ) : gruposOferta.map(grupo => {
        const key = grupo.oferta?.idOferta || 'sin_oferta';
        const isOpen = expandidos.has(key);
        const maxNotaGrupo = parseFloat(grupo.actas[0]?.notaFinal) || 1;
        const actaCerrada = ofertasConGanador.has(grupo.oferta?.idOferta);
        return (
          <Box key={key} sx={{ mb: 2 }}>
            {/* Cabecera colapsable */}
            <Box sx={{
              px: 2, py: 1.25,
              borderRadius: isOpen ? '8px 8px 0 0' : 1.5,
              background: 'linear-gradient(135deg, rgba(24,144,255,0.08), rgba(24,144,255,0.02))',
              border: '1px solid rgba(24,144,255,0.25)',
              display: 'flex', alignItems: 'center', gap: 1.5,
              cursor: 'default',
            }}>
              <TrophyOutlined style={{ color: '#1677ff', fontSize: 17 }} />
              <Typography variant="subtitle2" fontWeight={700} color="primary.main" sx={{ flex: 1 }}>
                {grupo.oferta?.categoriaEvento?.evento?.nombre
                  ? `${grupo.oferta.categoriaEvento.evento.nombre} v${grupo.oferta.categoriaEvento.evento.version || ''} · ${grupo.oferta.categoriaEvento?.categoria?.nombre || ''}`
                  : 'Sin Oferta'}
              </Typography>
              {actaCerrada && (
                <Chip
                  label="Acta cerrada"
                  color="success"
                  icon={<CheckCircleOutlined style={{ fontSize: 13 }} />}
                  size="small"
                  sx={{ mr: 1 }}
                />
              )}
              <Chip
                label={isOpen
                  ? `▲ ${grupo.actas.length} proyecto(s)`
                  : `▼ ${grupo.actas.length} proyecto(s)`}
                size="small"
                color="primary"
                variant={isOpen ? 'filled' : 'outlined'}
                onClick={() => toggleExpandido(key)}
                sx={{ cursor: 'pointer', fontWeight: 600, userSelect: 'none', flexShrink: 0 }}
              />
            </Box>

            {/* Tabla colapsable */}
            {isOpen && (
              <TableContainer component={Paper} elevation={0}
                sx={{ border: '1px solid rgba(24,144,255,0.25)', borderTop: 'none', borderRadius: '0 0 8px 8px' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell width={60} align="center">Pos.</TableCell>
                      <TableCell>Proyecto</TableCell>
                      <TableCell>Fecha Evaluación</TableCell>
                      <TableCell align="center">Nota Final</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {grupo.actas.map((acta, idx) => {
                      const nota = parseFloat(acta.notaFinal);
                      const pct = maxNotaGrupo > 0 ? (nota / maxNotaGrupo) * 100 : 0;
                      const medalColor = idx === 0 ? '#faad14' : idx === 1 ? '#bfbfbf' : idx === 2 ? '#d46b08' : 'inherit';
                      return (
                        <TableRow 
                          key={acta.idActaEvaluacion} 
                          hover 
                          onClick={() => setDetalleActa({ acta, lugar: idx + 1 })}
                          sx={{ 
                            bgcolor: idx < 3 ? 'action.hover' : 'inherit',
                            cursor: 'pointer', 
                            '&:hover': { bgcolor: 'action.selected' } 
                          }}
                        >
                          <TableCell align="center">
                            <Typography fontWeight={700} sx={{ color: medalColor, fontSize: idx < 3 ? 18 : 14 }}>
                              {idx < 3 ? ['🥇', '🥈', '🥉'][idx] : idx + 1}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>{acta.proyecto.titulo}</Typography>
                            <Chip label={acta.proyecto.estado} size="small" sx={{ mt: 0.3 }}
                              color={{ aprobado: 'success', inscrito: 'info', revision: 'warning', rechazado: 'error' }[acta.proyecto.estado] || 'default'} />
                          </TableCell>
                          <TableCell><Typography variant="body2">{acta.fecha}</Typography></TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                              <Box sx={{ width: 80, height: 6, bgcolor: 'action.hover', borderRadius: 3, overflow: 'hidden' }}>
                                <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: idx === 0 ? 'warning.main' : 'primary.main', borderRadius: 3 }} />
                              </Box>
                              <Typography fontWeight={700} color={idx === 0 ? 'warning.main' : 'primary.main'}>{nota}</Typography>
                            </Box>
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

      <DetalleProyectoModal 
        item={detalleActa?.acta} 
        tipo="acta" 
        lugar={detalleActa?.lugar} 
        onClose={() => setDetalleActa(null)} 
      />
    </Box>
  );
}

// ── Tab 3: Ganadores ──────────────────────────────────────────────────────────
const posLabel = (n) => ({ 1: '🥇 1er Lugar', 2: '🥈 2do Lugar', 3: '🥉 3er Lugar' }[n] || `${n}° Lugar`);

// ── Modal de detalle del ganador/proyecto ────────────────────────────────────
function DetalleProyectoModal({ item, tipo = 'ganador', lugar = null, onClose }) {
  if (!item) return null;
  
  let proyecto, premio, nota, observacion, detalles = [];
  if (tipo === 'ganador') {
    const cp = item.candidatoPremio;
    proyecto = cp?.proyecto;
    premio = cp?.premio;
    nota = cp?.nota;
    observacion = cp?.observacion;
    detalles = cp?.actaEvaluacion?.detallesEvaluacion || [];
  } else if (tipo === 'candidato') {
    const cp = item;
    proyecto = cp?.proyecto;
    premio = cp?.premio;
    nota = cp?.nota;
    observacion = cp?.observacion;
    detalles = cp?.actaEvaluacion?.detallesEvaluacion || [];
  } else {
    proyecto = item.proyecto;
    nota = item.notaFinal;
    detalles = item.detallesEvaluacion || [];
  }

  const oferta = proyecto?.ofertaEaCarrera?.oferta;
  const evento = oferta?.categoriaEvento?.evento;
  const area = oferta?.modalidadArea?.area;
  const pos = tipo === 'ganador' ? premio?.numeroGanadores : lugar;

  const medalColors = { 1: '#faad14', 2: '#8c8c8c', 3: '#d46b08' };
  const medalBg    = { 1: 'rgba(250,173,20,0.10)', 2: 'rgba(140,140,140,0.10)', 3: 'rgba(212,107,8,0.10)' };
  const medalEmoji = { 1: '🥇', 2: '🥈', 3: '🥉' };

  const SectionLabel = ({ icon, label }) => (
    <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:1.5, mt:2.5 }}>
      <Typography sx={{ fontSize:16 }}>{icon}</Typography>
      <Typography variant="subtitle2" fontWeight={700} color="text.secondary"
        sx={{ textTransform:'uppercase', letterSpacing:0.8, fontSize:'0.7rem' }}>
        {label}
      </Typography>
      <Box sx={{ flex:1, height:'1px', bgcolor:'divider', ml:1 }} />
    </Box>
  );

  const archivoUrl = proyecto?.archivo
    ? (proyecto.archivo.startsWith('http') ? proyecto.archivo : `http://localhost:8000/media/${proyecto.archivo}`)
    : null;

  return (
    <Dialog
      open={!!item}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.20)',
        }
      }}
    >
      {/* Encabezado con medalla */}
      <Box sx={{
        background: medalBg[pos] || 'rgba(24,144,255,0.08)',
        borderBottom: `3px solid ${medalColors[pos] || '#1890ff'}`,
        px: 3, py: 2.5,
        display: 'flex', alignItems: 'center', gap: 2
      }}>
        <Typography sx={{ fontSize: pos <= 3 ? 48 : 32, lineHeight:1 }}>
          {medalEmoji[pos] || '🏆'}
        </Typography>
        <Box sx={{ flex:1 }}>
          <Typography variant="h5" fontWeight={800} sx={{ color: pos <= 3 ? (medalColors[pos] || '#1890ff') : 'primary.main', lineHeight:1.2 }}>
            {pos ? posLabel(pos) : 'Detalle del Proyecto'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt:0.5 }}>
            Nota final:&nbsp;
            <Typography component="span" fontWeight={700} color={pos <= 3 ? (medalColors[pos] || 'primary.main') : 'primary.main'}>
              {parseFloat(nota || 0).toFixed(2)}
            </Typography>
          </Typography>
        </Box>
        <Stack direction="row" gap={0.75} flexWrap="wrap" justifyContent="flex-end">
          {premio?.monto && (
            <Chip label={`Bs. ${premio.monto}`} color="warning" size="small" sx={{ fontWeight:700 }} />
          )}
          {(premio?.premioDescriptores || []).map(pd => (
            <Chip key={pd.descriptor?.descripcion} label={pd.descriptor?.descripcion} size="small" variant="outlined" />
          ))}
        </Stack>
      </Box>

      <DialogContent sx={{ px:3, py:2, maxHeight:'65vh', overflowY:'auto' }}>
        {/* Proyecto */}
        <SectionLabel icon="📋" label="Datos del Proyecto" />
        <Typography variant="h6" fontWeight={700} sx={{ lineHeight:1.3 }}>{proyecto?.titulo}</Typography>
        {proyecto?.resumen && (
          <Typography variant="body2" color="text.secondary" sx={{ mt:1, lineHeight:1.7, whiteSpace: 'pre-wrap' }}>
            {proyecto.resumen}
          </Typography>
        )}
        <Stack direction="row" gap={1} sx={{ mt:1.5 }} flexWrap="wrap">
          {proyecto?.fechaInscripcion && (
            <Chip
              label={`Inscrito: ${new Date(proyecto.fechaInscripcion).toLocaleDateString('es-BO')}`}
              size="small" variant="outlined"
            />
          )}
          {proyecto?.fechaConfirmacion && (
            <Chip
              label={`Aprobado: ${new Date(proyecto.fechaConfirmacion).toLocaleDateString('es-BO')}`}
              size="small" variant="outlined" color="success"
            />
          )}
        </Stack>

        {/* Evento / Oferta */}
        <SectionLabel icon="🎓" label="Evento y Área" />
        <Stack spacing={0.75}>
          <Box sx={{ display:'flex', gap:1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth:90 }}>Evento:</Typography>
            <Typography variant="body2" fontWeight={600}>{evento?.nombre || premio?.evento?.nombre || '—'}</Typography>
          </Box>
          <Box sx={{ display:'flex', gap:1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth:90 }}>Oferta:</Typography>
            <Typography variant="body2" fontWeight={600}>{oferta?.categoriaEvento?.evento?.nombre ? `${oferta.categoriaEvento.evento.nombre} v${oferta.categoriaEvento.evento.version || ''}` : '—'}</Typography>
          </Box>
          <Box sx={{ display:'flex', gap:1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth:90 }}>Categoría:</Typography>
            <Typography variant="body2" fontWeight={600}>{oferta?.categoriaEvento?.categoria?.nombre || '—'}</Typography>
          </Box>
          <Box sx={{ display:'flex', gap:1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth:90 }}>Modalidad:</Typography>
            <Typography variant="body2" fontWeight={600}>{oferta?.modalidadArea?.modalidad?.nombre || '—'}</Typography>
          </Box>
          <Box sx={{ display:'flex', gap:1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth:90 }}>Área:</Typography>
            <Typography variant="body2" fontWeight={600}>{area?.nombre || premio?.area?.nombre || '—'}</Typography>
          </Box>
        </Stack>

        {/* Integrantes */}
        <SectionLabel icon="👥" label="Integrantes" />
        {(proyecto?.participantes || []).length === 0 ? (
          <Typography variant="body2" color="text.secondary">Sin integrantes registrados.</Typography>
        ) : (
          <Stack spacing={1}>
            {(proyecto?.participantes || []).map(p => (
              <Box key={p.idParticipante} sx={{
                display:'flex', alignItems:'center', gap:1.5,
                p:1.25, borderRadius:2, bgcolor:'action.hover'
              }}>
                <Box sx={{
                  width:36, height:36, borderRadius:'50%', bgcolor:'primary.main',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color:'white', fontWeight:700, fontSize:15, flexShrink:0
                }}>
                  {(p.nombre || '?').charAt(0).toUpperCase()}
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight={600}>{p.nombre} {p.apellido}</Typography>
                  {p.ci && <Typography variant="caption" color="text.secondary">CI: {p.ci}</Typography>}
                </Box>
              </Box>
            ))}
          </Stack>
        )}

        {/* Tutores */}
        <SectionLabel icon="👨‍🏫" label="Tutor(es)" />
        {(proyecto?.tutores || []).length === 0 ? (
          <Typography variant="body2" color="text.secondary">Sin tutores asignados.</Typography>
        ) : (
          <Stack spacing={1}>
            {(proyecto?.tutores || []).map(t => (
              <Box key={t.idTutor} sx={{
                display:'flex', alignItems:'center', gap:1.5,
                p:1.25, borderRadius:2, bgcolor:'action.hover'
              }}>
                <Box sx={{
                  width:36, height:36, borderRadius:'50%', bgcolor:'secondary.main',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color:'white', fontWeight:700, fontSize:15, flexShrink:0
                }}>
                  {(t.nombre || '?').charAt(0).toUpperCase()}
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight={600}>{t.nombre} {t.apellido}</Typography>
                  {t.ci && <Typography variant="caption" color="text.secondary">CI: {t.ci}</Typography>}
                </Box>
              </Box>
            ))}
          </Stack>
        )}

        {/* Tribunal Evaluador */}
        <SectionLabel icon="⚖️" label="Tribunal Evaluador" />
        {detalles.length === 0 ? (
          <Typography variant="body2" color="text.secondary">Sin tribunal asignado o evaluado.</Typography>
        ) : (
          <Stack spacing={1}>
            {detalles.map((d, i) => (
              <Box key={i} sx={{
                display:'flex', alignItems:'center', gap:1.5,
                p:1.25, borderRadius:2, bgcolor:'action.hover',
                borderLeft: '4px solid',
                borderLeftColor: d.yaEvaluo ? 'success.main' : 'warning.main'
              }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {d.tribunal?.nombre} {d.tribunal?.apellido}
                  </Typography>
                  <Typography variant="caption" color={d.yaEvaluo ? 'success.main' : 'warning.main'} fontWeight={600}>
                    {d.yaEvaluo ? `Calificó (Nota: ${d.puntuacion})` : 'Aún no calificó'}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Stack>
        )}

        {/* Documento */}
        {archivoUrl && (
          <>
            <SectionLabel icon="📄" label="Documento del Proyecto" />
            <Button
              variant="outlined"
              fullWidth
              href={archivoUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ borderRadius:2, textTransform:'none', fontWeight:600, py:1.25 }}
            >
              📥 Descargar / Ver Documento
            </Button>
          </>
        )}

        {/* Observación desempate */}
        {observacion && (
          <>
            <SectionLabel icon="📝" label="Observación de Desempate" />
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle:'italic' }}>
              &ldquo;{observacion}&rdquo;
            </Typography>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px:3, py:2, borderTop:'1px solid', borderColor:'divider' }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{ borderRadius:2, px:4, textTransform:'none', fontWeight:600, boxShadow:'none' }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function GanadoresTab({ actas, ganadores, empates, refetch, showNotif }) {
  const [cerrarActa] = useMutation(CERRAR_ACTA_RESULTADOS);
  const [editarCandidato] = useMutation(EDITAR_CANDIDATO);
  const [crearGanador] = useMutation(CREAR_GANADOR);
  const [editarActa] = useMutation(EDIT_ACTA);
  
  const [saving, setSaving] = useState(false);
  const [cerrarDialog, setCerrarDialog] = useState({ open: false, oferta: null });
  const [desempateDialog, setDesempateDialog] = useState({ open: false, candidato: null, otros: [], observacion: '' });
  const [desempatePrevioDialog, setDesempatePrevioDialog] = useState({ open: false, acta: null, rankingPrevio: [], observacion: '' });
  
  const [expandidos, setExpandidos] = useState(new Set());
  const [detalleGanador, setDetalleGanador] = useState(null);
  const [detalleCandidato, setDetalleCandidato] = useState(null);
  const toggleExpandido = (key) => setExpandidos(prev => {
    const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next;
  });

  const handleCerrarActa = async () => {
    if (!cerrarDialog.oferta) return;
    setSaving(true);
    try {
      const res = (await cerrarActa({
        variables: { idOferta: cerrarDialog.oferta.idOferta },
      })).data?.cerrarActaResultados;
      if (res?.ok) {
        const g = res.ganadores?.length || 0;
        const e = res.empates?.length || 0;
        const msg = g > 0
          ? `${g} ganador(es) adjudicado(s) automáticamente.${e > 0 ? ` ${e} empate(s) requieren resolución manual.` : ''}`
          : e > 0
          ? `${e} proyecto(s) empatados — resuélvelos en esta pantalla.`
          : 'Acta cerrada. No hay proyectos suficientes para los premios configurados.';
        showNotif(msg, e > 0 && g === 0 ? 'warning' : 'success');
        refetch();
        setCerrarDialog({ open: false, oferta: null });
      } else {
        showNotif(res?.error || 'Error al cerrar acta', 'error');
      }
    } catch { showNotif('Error de conexión', 'error'); }
    setSaving(false);
  };

  const handleElegirGanador = async () => {
    const { candidato, otros, observacion } = desempateDialog;
    if (!candidato) return;
    setSaving(true);
    try {
      const resGanador = (await crearGanador({ variables: { idCandidatoPremio: candidato.idCandidatoPremio } })).data?.crearGanadorPremio;
      if (!resGanador?.ok) { showNotif(resGanador?.error || 'Error', 'error'); setSaving(false); return; }
      
      await editarCandidato({ variables: { idCandidatoPremio: candidato.idCandidatoPremio, estado: 'ganador', observacion } });
      
      for (const otro of otros) {
        if (otro.idCandidatoPremio !== candidato.idCandidatoPremio) {
          await editarCandidato({ variables: { idCandidatoPremio: otro.idCandidatoPremio, estado: 'descartado' } });
        }
      }

      // Re-run cerrarActa to automatically process and assign the next place prizes
      const idOferta = candidato.proyecto.ofertaEaCarrera.oferta.idOferta;
      await cerrarActa({ variables: { idOferta } });

      showNotif('Ganador adjudicado exitosamente');
      refetch();
      setDesempateDialog({ open: false, candidato: null, otros: [], observacion: '' });
    } catch { showNotif('Error de conexión', 'error'); }
    setSaving(false);
  };

  const handleRomperEmpatePrevio = async () => {
    const { acta, rankingPrevio: rp, observacion } = desempatePrevioDialog;
    if (!acta) return;
    setSaving(true);
    try {
      // Marcar el ganador elegido con prioridad 1 (sin tocar nota_final)
      const resGanador = (await editarActa({
        variables: { idActaEvaluacion: acta.idActaEvaluacion, desempatePrioridad: 1, observacion }
      })).data?.editarActaEvaluacion;
      if (!resGanador?.ok) { showNotif(resGanador?.error || 'Error al desempatar', 'error'); setSaving(false); return; }

      // Marcar los demás empatados con prioridad 2 (misma notaFinal, distinto acta)
      const empatados = rp.filter(a =>
        a.idActaEvaluacion !== acta.idActaEvaluacion &&
        parseFloat(a.notaFinal) === parseFloat(acta.notaFinal)
      );
      for (const otro of empatados) {
        await editarActa({ variables: { idActaEvaluacion: otro.idActaEvaluacion, desempatePrioridad: 2 } });
      }

      showNotif('Desempate registrado. La nota del docente no fue modificada.');
      refetch();
      setDesempatePrevioDialog({ open: false, acta: null, rankingPrevio: [], observacion: '' });
    } catch { showNotif('Error de conexión', 'error'); }
    setSaving(false);
  };

  const actasConNota = [...actas].filter(a => parseFloat(a.notaFinal) > 0);
  const actasPorOferta = actasConNota.reduce((acc, acta) => {
    const oferta = acta.proyecto?.ofertaEaCarrera?.oferta;
    const key = oferta?.idOferta || 'sin_oferta';
    if (!acc[key]) acc[key] = { oferta, actas: [] };
    acc[key].actas.push(acta);
    return acc;
  }, {});
  const gruposOferta = Object.values(actasPorOferta);

  const ofertasCerradas = new Set([
    ...ganadores.map(g => g.candidatoPremio?.proyecto?.ofertaEaCarrera?.oferta?.idOferta),
    ...empates.map(e => e.proyecto?.ofertaEaCarrera?.oferta?.idOferta)
  ].filter(Boolean));

  return (
    <Box>
      {gruposOferta.length === 0 ? (
        <Alert severity="info">No hay actas con nota final registrada.</Alert>
      ) : gruposOferta.map(grupo => {
        const oferta = grupo.oferta;
        const key = oferta?.idOferta || 'sin_oferta';
        const isOpen = expandidos.has(key);
        const actaCerrada = ofertasCerradas.has(oferta?.idOferta);
        
        const ganadoresOferta = ganadores.filter(g => g.candidatoPremio?.proyecto?.ofertaEaCarrera?.oferta?.idOferta === oferta?.idOferta)
                                         .sort((a, b) => (a.candidatoPremio?.premio?.numeroGanadores || 99) - (b.candidatoPremio?.premio?.numeroGanadores || 99));
        
        const empatesOferta = empates.filter(e => e.proyecto?.ofertaEaCarrera?.oferta?.idOferta === oferta?.idOferta);
        const empatesPorPremio = empatesOferta.reduce((acc, c) => {
          const pkey = c.premio?.idPremio || 'sin_premio';
          if (!acc[pkey]) acc[pkey] = { premio: c.premio, candidatos: [] };
          acc[pkey].candidatos.push(c);
          return acc;
        }, {});
        const gruposEmpate = Object.values(empatesPorPremio);

        return (
          <Box key={key} sx={{ mb: 3 }}>
            <Box sx={{
              px: 2, py: 1.5,
              borderRadius: isOpen ? '8px 8px 0 0' : 1.5,
              background: actaCerrada ? 'linear-gradient(135deg, rgba(56,158,13,0.10), rgba(56,158,13,0.03))' : 'linear-gradient(135deg, rgba(24,144,255,0.08), rgba(24,144,255,0.02))',
              border: `1px solid ${actaCerrada ? 'rgba(56,158,13,0.30)' : 'rgba(24,144,255,0.25)'}`,
              display: 'flex', alignItems: 'center', gap: 1.5,
            }}>
              {actaCerrada ? <GoldOutlined style={{ color: '#389e0d', fontSize: 18 }} /> : <TrophyOutlined style={{ color: '#1890ff', fontSize: 18 }} />}
              <Typography variant="subtitle2" fontWeight={700} color={actaCerrada ? "success.dark" : "primary.main"} sx={{ flex: 1 }}>
                {oferta?.categoriaEvento
                  ? `${oferta.categoriaEvento.evento?.nombre} v${oferta.categoriaEvento.evento?.version} · ${oferta.categoriaEvento.categoria?.nombre}`
                  : 'Sin Oferta'}
              </Typography>
              
              {actaCerrada ? (
                <Chip label="Acta cerrada" color="success" icon={<CheckCircleOutlined style={{ fontSize: 13 }} />} size="small" sx={{ mr: 1 }} />
              ) : (
                <Button size="small" variant="contained" color="warning" startIcon={<CheckCircleOutlined />} onClick={() => setCerrarDialog({ open: true, oferta })} sx={{ mr: 1 }}>
                  Cerrar Acta
                </Button>
              )}
              
              <Chip
                label={isOpen ? `▲ Ocultar` : `▼ Mostrar`}
                size="small"
                color={actaCerrada ? "success" : "primary"}
                variant={isOpen ? 'filled' : 'outlined'}
                onClick={() => toggleExpandido(key)}
                sx={{ cursor: 'pointer', fontWeight: 600, userSelect: 'none' }}
              />
            </Box>

            {isOpen && (
              <Paper elevation={0} sx={{ border: `1px solid ${actaCerrada ? 'rgba(56,158,13,0.30)' : 'rgba(24,144,255,0.25)'}`, borderTop: 'none', borderRadius: '0 0 8px 8px', p: 2 }}>
                {!actaCerrada ? (() => {
                  const rankingPrevio = [...grupo.actas].sort((a, b) => {
                    const notaDiff = parseFloat(b.notaFinal) - parseFloat(a.notaFinal);
                    if (notaDiff !== 0) return notaDiff;
                    const pa = a.desempatePrioridad ?? 999;
                    const pb = b.desempatePrioridad ?? 999;
                    return pa - pb;
                  });
                  return (
                    <Box>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        El acta de esta oferta aún no ha sido cerrada. Cierra el acta para determinar los ganadores. A continuación se muestran los posibles ganadores según las notas consolidadas:
                      </Alert>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor: 'action.hover' }}>
                              <TableCell width={60} align="center">POS</TableCell>
                              <TableCell>PROYECTO</TableCell>
                              <TableCell align="center" width={150}>NOTA</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {rankingPrevio.map((acta, idx) => {
                              const empatados = rankingPrevio.filter((a, i) => i !== idx && parseFloat(a.notaFinal) === parseFloat(acta.notaFinal) && parseFloat(acta.notaFinal) > 0);
                              const isEmpate = empatados.length > 0 && acta.desempatePrioridad == null;
                              const empateResuelto = empatados.length > 0 && acta.desempatePrioridad != null;
                              return (
                                <TableRow key={acta.idActaEvaluacion}>
                                  <TableCell align="center">
                                    <Typography fontWeight={700} color="text.secondary">{idx + 1}°</Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" fontWeight={500}>{acta.proyecto.titulo}</Typography>
                                  </TableCell>
                                  <TableCell align="center">
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                      <Chip
                                        label={parseFloat(acta.notaFinal).toFixed(2)}
                                        size="small"
                                        color={isEmpate ? "warning" : empateResuelto ? "success" : "primary"}
                                        variant={isEmpate || empateResuelto ? "contained" : "outlined"}
                                        sx={{ minWidth: 60, fontWeight: 700 }}
                                      />
                                      {isEmpate && (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                          <Typography variant="caption" color="warning.main" fontWeight={700}>Empate</Typography>
                                          <Button size="small" variant="contained" color="warning" sx={{ p: '2px 6px', minWidth: 'auto', fontSize: '10px' }} onClick={() => setDesempatePrevioDialog({ open: true, acta, rankingPrevio, observacion: '' })} disabled={saving}>
                                            Elegir ganador
                                          </Button>
                                        </Box>
                                      )}
                                      {empateResuelto && (
                                        <Typography variant="caption" color="success.main" fontWeight={700}>
                                          {acta.desempatePrioridad === 1 ? 'Ganador' : 'Desempate resuelto'}
                                        </Typography>
                                      )}
                                    </Box>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  );
                })() : (
                  <>
                    {gruposEmpate.length > 0 && (
                      <Box sx={{ mb: 3 }}>
                        <Alert severity="warning" sx={{ mb: 2 }}>
                          Hay empate(s) pendientes de resolución. Elige el ganador.
                        </Alert>
                        {gruposEmpate.map(ge => (
                          <Box key={ge.premio?.idPremio} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'warning.light', borderRadius: 1 }}>
                            <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1 }}>
                              <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: 16 }} />
                              <Typography fontWeight={700} color="warning.main">
                                Empate — {posLabel(ge.premio?.numeroGanadores)}
                              </Typography>
                            </Stack>
                            <Stack spacing={1}>
                              {ge.candidatos.map(c => (
                                <Box key={c.idCandidatoPremio} 
                                  onClick={() => setDetalleCandidato(c)}
                                  sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1, cursor: 'pointer', '&:hover': { bgcolor: 'action.selected' } }}>
                                  <Box sx={{ flex: 1 }}>
                                    <Typography variant="body2" fontWeight={600}>{c.proyecto.titulo}</Typography>
                                    <Typography variant="caption" color="text.secondary">Nota: {c.nota}</Typography>
                                  </Box>
                                  <Button size="small" variant="contained" color="success" startIcon={<CheckCircleOutlined />} disabled={saving} 
                                    onClick={(e) => { e.stopPropagation(); setDesempateDialog({ open: true, candidato: c, otros: ge.candidatos, observacion: '' }); }}>
                                    Elegir como Ganador
                                  </Button>
                                </Box>
                              ))}
                            </Stack>
                          </Box>
                        ))}
                      </Box>
                    )}

                    {ganadoresOferta.length > 0 ? (
                      <TableContainer component={Box}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell width={160} align="center">Lugar</TableCell>
                              <TableCell>Proyecto</TableCell>
                              <TableCell align="center">Nota</TableCell>
                              <TableCell>Premio</TableCell>
                              <TableCell>Observación (Desempate)</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {ganadoresOferta.map(g => {
                              const cp = g.candidatoPremio;
                              const pos = cp?.premio?.numeroGanadores;
                              return (
                                <TableRow
                                  key={g.idGanadorPremio}
                                  hover
                                  onClick={() => setDetalleGanador(g)}
                                  sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.selected' } }}
                                >
                                  <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                                    <Typography fontWeight={700} fontSize={pos <= 3 ? 16 : 14}>
                                      {posLabel(pos)}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" fontWeight={600}>{cp?.proyecto?.titulo}</Typography>
                                  </TableCell>
                                  <TableCell align="center">
                                    <Chip label={cp?.nota} color="primary" size="small" />
                                  </TableCell>
                                  <TableCell>
                                    <Stack direction="row" gap={0.5} flexWrap="wrap">
                                      {cp?.premio?.monto && (
                                        <Chip label={`Bs. ${cp.premio.monto}`} size="small" color="warning" variant="outlined" />
                                      )}
                                      {(cp?.premio?.premioDescriptores || []).map(pd => (
                                        <Chip key={pd.descriptor?.descripcion} label={pd.descriptor?.descripcion} size="small" variant="outlined" />
                                      ))}
                                    </Stack>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="caption" color="text.secondary">{cp?.observacion || cp?.actaEvaluacion?.observacion || '—'}</Typography>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      gruposEmpate.length === 0 && <Typography variant="body2" color="text.secondary">No hay ganadores para esta oferta.</Typography>
                    )}
                  </>
                )}
              </Paper>
            )}
          </Box>
        );
      })}

      <Dialog open={cerrarDialog.open} onClose={() => setCerrarDialog({ open: false, oferta: null })} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" gap={1}>
            <TrophyOutlined style={{ color: '#faad14' }} />
            Cerrar Acta
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 2 }}>
            Se cerrará el acta para esta oferta de manera definitiva. Se asignarán automáticamente los ganadores y empates.
          </Alert>
          <Typography variant="body2">
            Oferta: <strong>{cerrarDialog.oferta?.categoriaEvento?.evento?.nombre ? `${cerrarDialog.oferta.categoriaEvento.evento.nombre} · ${cerrarDialog.oferta.categoriaEvento?.categoria?.nombre || ''}` : '—'}</strong>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCerrarDialog({ open: false, oferta: null })} color="secondary">Cancelar</Button>
          <Button variant="contained" color="warning" disabled={saving} onClick={handleCerrarActa}>
            {saving ? <CircularProgress size={22} color="inherit" /> : 'Confirmar y Cerrar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={desempateDialog.open} onClose={() => setDesempateDialog({ open: false, candidato: null, otros: [], observacion: '' })} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" gap={1}>
            <ExclamationCircleOutlined style={{ color: '#faad14' }} />
            Resolver Empate
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 2 }}>
            ¿Confirmas a <strong>{desempateDialog.candidato?.proyecto?.titulo}</strong> como ganador de este lugar? Los demás empatados quedarán descartados.
          </Alert>
          <TextField
            fullWidth
            label="Observación / Justificación del desempate"
            multiline
            rows={3}
            placeholder="Ej. Se eligió este proyecto por tener mayor puntuación en originalidad..."
            value={desempateDialog.observacion}
            onChange={e => setDesempateDialog(p => ({ ...p, observacion: e.target.value }))}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDesempateDialog({ open: false, candidato: null, otros: [], observacion: '' })} color="secondary">Cancelar</Button>
          <Button variant="contained" color="success" disabled={saving || !desempateDialog.observacion.trim()} onClick={handleElegirGanador}>
            {saving ? <CircularProgress size={22} color="inherit" /> : 'Confirmar Ganador'}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={desempatePrevioDialog.open} onClose={() => setDesempatePrevioDialog({ open: false, acta: null, rankingPrevio: [], observacion: '' })} maxWidth="sm" fullWidth>
        <DialogTitle>Resolución de Empate</DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 2 }}>
            Este proyecto quedará marcado como ganador del desempate. <strong>La nota del docente no se modifica.</strong> La decisión queda registrada para auditoría.
          </Alert>
          <Typography gutterBottom>Has seleccionado a <strong>{desempatePrevioDialog.acta?.proyecto?.titulo}</strong> como ganador del desempate.</Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Ingresa una justificación obligatoria para validar esta decisión:
          </Typography>
          <TextField
            fullWidth multiline rows={3}
            placeholder="Ej: Se desempató por mejor presentación técnica según criterio del jurado principal."
            value={desempatePrevioDialog.observacion}
            onChange={e => setDesempatePrevioDialog(p => ({ ...p, observacion: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDesempatePrevioDialog({ open: false, acta: null, rankingPrevio: [], observacion: '' })} color="secondary">Cancelar</Button>
          <Button variant="contained" color="success" disabled={saving || !desempatePrevioDialog.observacion.trim()} onClick={handleRomperEmpatePrevio}>
            {saving ? <CircularProgress size={22} color="inherit" /> : 'Confirmar Desempate'}
          </Button>
        </DialogActions>
      </Dialog>

      <DetalleProyectoModal item={detalleGanador} tipo="ganador" onClose={() => setDetalleGanador(null)} />
      <DetalleProyectoModal item={detalleCandidato} tipo="candidato" onClose={() => setDetalleCandidato(null)} />

    </Box>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CuadroHonorPage() {
  const { data, loading, error, refetch } = useQuery(GET_DATA, { fetchPolicy: 'network-only' });
  const [tab, setTab] = useState(0);
  const [notif, setNotif] = useState({ open: false, msg: '', sev: 'success' });
  const showNotif = (msg, sev = 'success') => setNotif({ open: true, msg, sev });

  const tipos = data?.todosSLosTiposDescriptores || [];
  const descriptores = data?.todosLosDescriptores || [];
  const premios = data?.todosLosPremios || [];
  const actas = data?.todasLasActas || [];
  const ganadores = data?.todosLosGanadoresPremios?.filter(g => g.estado) || [];
  const empates = data?.todosLosCandidatosPremios?.filter(c => c.activo && c.estado?.toLowerCase() === 'candidato') || [];
  const ofertas = data?.todasLasOfertas || [];
  const eventos = data?.todosLosEventos || [];
  const areas = data?.todasLasAreas || [];
  const cronogramas = data?.todosLosCronogramas || [];

  return (
    <MainCard title="Cuadro de Honor y Premios">
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error">Error al cargar: {error.message}</Alert>
      ) : (
        <>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 0 }}>
            <Tab label="Gestión de Premios" icon={<GoldOutlined />} iconPosition="start" />
            <Tab label="Ranking / Candidatos" icon={<TrophyOutlined />} iconPosition="start" />
            <Tab
              label="Ganadores"
              icon={empates.length > 0
                ? <Chip label={empates.length} size="small" color="warning" sx={{ height: 18, fontSize: '0.65rem' }} />
                : <CheckCircleOutlined />}
              iconPosition="start"
            />
          </Tabs>

          <TabPanel value={tab} index={0}>
            <GestionPremiosTab tipos={tipos} descriptores={descriptores} premios={premios} ofertas={ofertas} eventos={eventos} areas={areas} refetch={refetch} showNotif={showNotif} />
          </TabPanel>
          <TabPanel value={tab} index={1}>
            <RankingTab actas={actas} premios={premios} ganadores={ganadores} refetch={refetch} showNotif={showNotif} />
          </TabPanel>
          <TabPanel value={tab} index={2}>
            <GanadoresTab actas={actas} ganadores={ganadores} empates={empates} refetch={refetch} showNotif={showNotif} />
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
