import React, { useState } from 'react';
import {
  Box,
  Tab,
  Tabs,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  MenuItem,
  FormControlLabel,
  Switch,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  useTheme,
  TablePagination,
  CircularProgress,
  Pagination,
  Select
} from '@mui/material';
import { EditOutlined, DeleteOutlined, UserOutlined, ReloadOutlined, StopOutlined, RedoOutlined } from '@ant-design/icons';
import MainCard from 'components/MainCard';
import { useMutation, useQuery, gql } from '@apollo/client';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

// --- QUERIES ---
const OBTENER_PROYECTOS = gql`
  query ObtenerProyectos {
    todosLosProyectos {
      idProyecto
      titulo
    }
  }
`;

const OBTENER_PARTICIPANTES = gql`
  query ObtenerParticipantes {
    todosLosParticipantes {
      idParticipante
      nombre
      apellido
      ci
      expedicion
      celular
      estado
      codigoEspecifico
      tutor {
        idTutor
      }
      participanteExt {
        idParticipanteExt
        direccion
        institucion
      }
    }
  }
`;

const OBTENER_TUTORES = gql`
  query ObtenerTutores {
    todosLosTutores {
      idTutor
      codEmpleado
      nombre
      apellido
      ci
      expedicion
      celular
      direccion
      estado
    }
  }
`;

const OBTENER_TRIBUNALES = gql`
  query ObtenerTribunales {
    todosLosTribunales {
      idTribunal
      especialidad
      nombre
      apellido
      ci
      expedicion
      celular
      direccion
      estado
    }
  }
`;

// --- MUTATIONS ---
const CREAR_USUARIO = gql`
  mutation CrearUsuario($username: String!, $email: String!, $password: String!) {
    crearUsuario(username: $username, email: $email, password: $password) {
      usuario {
        idUsuario
      }
      ok
      error
    }
  }
`;

const CREAR_PARTICIPANTE = gql`
  mutation CrearParticipante(
    $idUsuario: ID!
    $codigoEspecifico: String!
    $nombre: String!
    $apellido: String!
    $celular: String!
    $ci: String!
    $expedicion: String!
    $direccion: String
    $institucion: String
    $idProyecto: ID
    $idTutor: ID
  ) {
    crearParticipante(
      idUsuario: $idUsuario
      codigoEspecifico: $codigoEspecifico
      nombre: $nombre
      apellido: $apellido
      celular: $celular
      ci: $ci
      expedicion: $expedicion
      direccion: $direccion
      institucion: $institucion
      idProyecto: $idProyecto
      idTutor: $idTutor
    ) {
      participante {
        idParticipante
      }
      ok
      error
    }
  }
`;

const EDITAR_PARTICIPANTE = gql`
  mutation EditarParticipante(
    $idParticipante: ID!
    $codigoEspecifico: String
    $nombre: String
    $apellido: String
    $celular: String
    $ci: String
    $expedicion: String
    $direccion: String
    $institucion: String
    $idProyecto: ID
    $idTutor: ID
    $estado: Boolean
  ) {
    editarParticipante(
      idParticipante: $idParticipante
      codigoEspecifico: $codigoEspecifico
      nombre: $nombre
      apellido: $apellido
      celular: $celular
      ci: $ci
      expedicion: $expedicion
      direccion: $direccion
      institucion: $institucion
      idProyecto: $idProyecto
      idTutor: $idTutor
      estado: $estado
    ) {
      ok
      error
    }
  }
`;

const ELIMINAR_PARTICIPANTE = gql`
  mutation EliminarParticipante($idParticipante: ID!) {
    eliminarParticipante(idParticipante: $idParticipante) {
      ok
      error
    }
  }
`;

const CREAR_TUTOR = gql`
  mutation CrearTutor(
    $idUsuario: ID!
    $codEmpleado: String!
    $nombre: String!
    $apellido: String!
    $celular: String!
    $direccion: String!
    $ci: String!
    $expedicion: String!
    $idProyecto: ID
  ) {
    crearTutor(
      idUsuario: $idUsuario
      codEmpleado: $codEmpleado
      nombre: $nombre
      apellido: $apellido
      celular: $celular
      direccion: $direccion
      ci: $ci
      expedicion: $expedicion
      idProyecto: $idProyecto
    ) {
      tutor {
        idTutor
      }
      ok
      error
    }
  }
`;

const EDITAR_TUTOR = gql`
  mutation EditarTutor(
    $idTutor: ID!
    $codEmpleado: String
    $nombre: String
    $apellido: String
    $celular: String
    $direccion: String
    $ci: String
    $expedicion: String
    $idProyecto: ID
    $estado: Boolean
  ) {
    editarTutor(
      idTutor: $idTutor
      codEmpleado: $codEmpleado
      nombre: $nombre
      apellido: $apellido
      celular: $celular
      direccion: $direccion
      ci: $ci
      expedicion: $expedicion
      idProyecto: $idProyecto
      estado: $estado
    ) {
      ok
      error
    }
  }
`;

const ELIMINAR_TUTOR = gql`
  mutation EliminarTutor($idTutor: ID!) {
    eliminarTutor(idTutor: $idTutor) {
      ok
      error
    }
  }
`;

const CREAR_TRIBUNAL = gql`
  mutation CrearTribunal(
    $idUsuario: ID!
    $especialidad: String!
    $nombre: String!
    $apellido: String!
    $celular: String!
    $ci: String!
    $expedicion: String!
    $direccion: String!
  ) {
    crearTribunal(
      idUsuario: $idUsuario
      especialidad: $especialidad
      nombre: $nombre
      apellido: $apellido
      celular: $celular
      ci: $ci
      expedicion: $expedicion
      direccion: $direccion
    ) {
      tribunal {
        idTribunal
      }
      ok
      error
    }
  }
`;

const EDITAR_TRIBUNAL = gql`
  mutation EditarTribunal(
    $idTribunal: ID!
    $especialidad: String
    $nombre: String
    $apellido: String
    $celular: String
    $ci: String
    $expedicion: String
    $direccion: String
    $estado: Boolean
  ) {
    editarTribunal(
      idTribunal: $idTribunal
      especialidad: $especialidad
      nombre: $nombre
      apellido: $apellido
      celular: $celular
      ci: $ci
      expedicion: $expedicion
      direccion: $direccion
      estado: $estado
    ) {
      ok
      error
    }
  }
`;

const ELIMINAR_TRIBUNAL = gql`
  mutation EliminarTribunal($idTribunal: ID!) {
    eliminarTribunal(idTribunal: $idTribunal) {
      ok
      error
    }
  }
`;

const OBTENER_PERSONAL = gql`
  query ObtenerPersonal {
    todoElPersonal {
      idPersonal
      nombre
      apellido
      ci
      expedicion
      cargo
      direccion
      celular
      estado
      usuario {
        idUsuario
      }
    }
  }
`;

const CREAR_PERSONAL = gql`
  mutation CrearPersonal(
    $idUsuario: ID!
    $nombre: String!
    $apellido: String!
    $ci: String!
    $expedicion: String!
    $cargo: String!
    $direccion: String!
    $celular: String!
  ) {
    crearPersonal(
      idUsuario: $idUsuario
      nombre: $nombre
      apellido: $apellido
      ci: $ci
      expedicion: $expedicion
      cargo: $cargo
      direccion: $direccion
      celular: $celular
    ) {
      personal {
        idPersonal
      }
      ok
      error
    }
  }
`;

const EDITAR_PERSONAL = gql`
  mutation EditarPersonal(
    $idPersonal: ID!
    $nombre: String
    $apellido: String
    $ci: String
    $expedicion: String
    $cargo: String
    $direccion: String
    $celular: String
    $estado: Boolean
  ) {
    editarPersonal(
      idPersonal: $idPersonal
      nombre: $nombre
      apellido: $apellido
      ci: $ci
      expedicion: $expedicion
      cargo: $cargo
      direccion: $direccion
      celular: $celular
      estado: $estado
    ) {
      ok
      error
    }
  }
`;

const ELIMINAR_PERSONAL = gql`
  mutation EliminarPersonal($idPersonal: ID!) {
    eliminarPersonal(idPersonal: $idPersonal) {
      ok
      error
    }
  }
`;

const OBTENER_ROLES = gql`
  query ObtenerRoles {
    todosLosRoles {
      idRol
      nombre
    }
  }
`;

const ASIGNAR_ROL_A_USUARIO = gql`
  mutation AsignarRolAUsuario($idUsuario: ID!, $idRol: ID) {
    asignarRolAUsuario(idUsuario: $idUsuario, idRol: $idRol) {
      ok
      error
    }
  }
`;

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`perfiles-tabpanel-${index}`} aria-labelledby={`perfiles-tab-${index}`} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `perfiles-tab-${index}`,
    'aria-controls': `perfiles-tabpanel-${index}`
  };
}

const EXPEDICION_CHOICES = [
  { value: 'LP', label: 'La Paz' },
  { value: 'CB', label: 'Cochabamba' },
  { value: 'SC', label: 'Santa Cruz' },
  { value: 'OR', label: 'Oruro' },
  { value: 'PT', label: 'Potosí' },
  { value: 'CH', label: 'Chuquisaca' },
  { value: 'TJ', label: 'Tarija' },
  { value: 'BN', label: 'Beni' },
  { value: 'PD', label: 'Pando' }
];

const CARGO_CHOICES = [
  { value: 'SECRETARIA', label: 'Secretaria' },
  { value: 'DECANO', label: 'Decano' },
  { value: 'VICEDECANO', label: 'Vicedecano' },
  { value: 'RECTOR', label: 'Rector' },
  { value: 'VICERECTOR', label: 'Vicerector' }
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5, mt: 3.5, '&:first-of-type': { mt: 1.5 } }}>
      <Typography
        sx={{
          fontSize: '0.72rem',
          fontWeight: 600,
          color: '#475569',
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          '&::before': {
            content: '""',
            display: 'inline-block',
            width: '3px',
            height: '11px',
            bgcolor: '#0F172A',
            borderRadius: '2px'
          }
        }}
      >
        {children}
      </Typography>
      <Box sx={{ flex: 1, height: '1px', bgcolor: '#F1F5F9' }} />
    </Box>
  );
}

function detectField(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('username') || m.includes('nombre de usuario') || m.includes('este nombre')) return 'username';
  if (m.includes('email') || m.includes('correo')) return 'email';
  if (m.includes('password') || m.includes('contraseña')) return 'password';
  if (m.includes(' ci') || m.includes('cédula') || m.includes('cedula') || m.includes('identificaci')) return 'ci';
  if (m.includes('empleado') || m.includes('cod_empleado')) return 'cod_empleado';
  if (m.includes('especialidad')) return 'especialidad';
  if (m.includes('celular') || m.includes('teléfono') || m.includes('telefono')) return 'celular';
  return '';
}

function StatusIcon({ type }: { type: string }) {
  if (type === 'error') return <StopOutlined style={{ fontSize: 50, color: '#ff4d4f' }} />;
  return <RedoOutlined style={{ fontSize: 50, color: '#52c41a' }} />;
}

function ConfirmDialog({ open, title, message, onConfirm, onClose, loading, type = 'error' }: any) {
  const isError = type === 'error';
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.12)' } }}>
      <Box sx={{ pt: 5, pb: 1, textAlign: 'center', position: 'relative' }}>
        <Box sx={{
          position: 'absolute', left: '50%', top: 16, transform: 'translateX(-50%)',
          width: 130, height: 130, borderRadius: '50%',
          background: isError 
            ? 'radial-gradient(circle, rgba(255,77,79,0.1) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(82,196,26,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <StatusIcon type={type} />
      </Box>
      <Box sx={{ px: 4, pt: 1.5, pb: 0.5, textAlign: 'center' }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 0.75 }}>{title}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{message}</Typography>
      </Box>
      <Box sx={{ px: 3.5, py: 3, display: 'flex', gap: 1.5, justifyContent: 'center' }}>
        <Button onClick={onClose} disabled={loading} variant="outlined" sx={{ minWidth: 100, borderRadius: 2 }}>Cancelar</Button>
        <Button onClick={onConfirm} disabled={loading} variant="contained"
          sx={{
            minWidth: 100, borderRadius: 2,
            background: isError ? 'linear-gradient(135deg, #ff4d4f, #b91c1c)' : 'linear-gradient(135deg, #52c41a, #237804)',
            boxShadow: isError ? '0 4px 14px rgba(255,77,79,0.4)' : '0 4px 14px rgba(82,196,26,0.4)',
          }}>
          {loading ? <CircularProgress size={20} color="inherit" /> : (isError ? 'Eliminar' : 'Restaurar')}
        </Button>
      </Box>
    </Dialog>
  );
}

function CustomPagination({ count, rowsPerPage, page, onPageChange, onRowsPerPageChange }: any) {
  const totalPages = Math.ceil(count / rowsPerPage);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" color="text.secondary">Mostrar</Typography>
        <Select
          size="small"
          value={rowsPerPage}
          onChange={onRowsPerPageChange}
          sx={{
            minWidth: 65,
            height: 32,
            borderRadius: '6px',
            bgcolor: 'transparent',
            '.MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255,255,255,0.1)',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255,255,255,0.2)',
            },
            '.MuiSelect-select': {
              py: 0.5,
              px: 1.5,
              fontSize: '0.875rem',
              color: 'text.primary',
            }
          }}
        >
          <MenuItem value={5}>5</MenuItem>
          <MenuItem value={10}>10</MenuItem>
          <MenuItem value={25}>25</MenuItem>
        </Select>
        <Typography variant="body2" color="text.secondary">registros</Typography>
      </Box>
      <Pagination 
        count={totalPages} 
        page={page + 1} 
        onChange={(e, value) => onPageChange(e, value - 1)}
        shape="rounded"
        color="primary"
        sx={{
          '& .MuiPaginationItem-root': {
            bgcolor: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'text.secondary',
            borderRadius: '6px',
            minWidth: 32,
            height: 32,
          },
          '& .Mui-selected': {
            bgcolor: '#1677ff !important',
            color: '#fff',
            border: 'none',
            boxShadow: '0 2px 8px rgba(22, 119, 255, 0.4)',
          }
        }}
      />
    </Box>
  );
}

const PerfilesPage: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);

  // Filters & Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchNombre, setSearchNombre] = useState('');
  const [searchApellido, setSearchApellido] = useState('');
  const [searchCI, setSearchCI] = useState('');
  const [searchEstado, setSearchEstado] = useState('Todos');

  // Modal states
  const [openParticipante, setOpenParticipante] = useState(false);
  const [openTutor, setOpenTutor] = useState(false);
  const [openTribunal, setOpenTribunal] = useState(false);

  // Active records for editing
  const [activeParticipante, setActiveParticipante] = useState<any>(null);
  const [activeTutor, setActiveTutor] = useState<any>(null);
  const [activeTribunal, setActiveTribunal] = useState<any>(null);
  const [activePersonal, setActivePersonal] = useState<any>(null);

  // Modal state for Personal
  const [openPersonal, setOpenPersonal] = useState(false);

  // Role selector for Personal
  const [selectedRolPersonal, setSelectedRolPersonal] = useState<string>('');

  // External Participant toggle
  const [isExterno, setIsExterno] = useState(false);

  // Inline form errors + field highlight
  const [errorParticipante, setErrorParticipante] = useState('');
  const [errorTutor, setErrorTutor] = useState('');
  const [errorTribunal, setErrorTribunal] = useState('');
  const [errorPersonal, setErrorPersonal] = useState('');

  const [errorFieldParticipante, setErrorFieldParticipante] = useState('');
  const [errorFieldTutor, setErrorFieldTutor] = useState('');
  const [errorFieldTribunal, setErrorFieldTribunal] = useState('');
  const [errorFieldPersonal, setErrorFieldPersonal] = useState('');

  // Floating snackbar for errors
  const [snackErr, setSnackErr] = useState({ open: false, msg: '' });

  // Usuario ya creado pero perfil falló — reutilizar en siguiente intento
  const [pendingUserParticipante, setPendingUserParticipante] = useState<string | null>(null);
  const [pendingUserTutor, setPendingUserTutor] = useState<string | null>(null);
  const [pendingUserTribunal, setPendingUserTribunal] = useState<string | null>(null);
  const [pendingUserPersonal, setPendingUserPersonal] = useState<string | null>(null);

  // Queries
  const { data: dataParticipantes, refetch: refetchParticipantes } = useQuery(OBTENER_PARTICIPANTES);
  const { data: dataTutores, refetch: refetchTutores } = useQuery(OBTENER_TUTORES);
  const { data: dataTribunales, refetch: refetchTribunales } = useQuery(OBTENER_TRIBUNALES);
  const { data: dataProyectos } = useQuery(OBTENER_PROYECTOS);
  const { data: dataPersonal, refetch: refetchPersonal } = useQuery(OBTENER_PERSONAL);
  const { data: dataRoles } = useQuery(OBTENER_ROLES);

  // Mutations
  const [crearUsuario] = useMutation(CREAR_USUARIO);
  const [asignarRolAUsuario] = useMutation(ASIGNAR_ROL_A_USUARIO);

  const [crearParticipante] = useMutation(CREAR_PARTICIPANTE);
  const [editarParticipante] = useMutation(EDITAR_PARTICIPANTE);
  const [eliminarParticipante] = useMutation(ELIMINAR_PARTICIPANTE);

  const [crearTutor] = useMutation(CREAR_TUTOR);
  const [editarTutor] = useMutation(EDITAR_TUTOR);
  const [eliminarTutor] = useMutation(ELIMINAR_TUTOR);

  const [crearTribunal] = useMutation(CREAR_TRIBUNAL);
  const [editarTribunal] = useMutation(EDITAR_TRIBUNAL);
  const [eliminarTribunal] = useMutation(ELIMINAR_TRIBUNAL);

  const [crearPersonal] = useMutation(CREAR_PERSONAL);
  const [editarPersonal] = useMutation(EDITAR_PERSONAL);
  const [eliminarPersonal] = useMutation(ELIMINAR_PERSONAL);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setPage(0);
    setSearchNombre('');
    setSearchApellido('');
    setSearchCI('');
    setSearchEstado('Todos');
  };

  const [confirmDlg, setConfirmDlg] = useState({ open: false, title: '', message: '', onConfirm: async () => {}, type: 'error' });
  const [confirming, setConfirming] = useState(false);

  const handleToggleEstado = (row: any, tipo: string, idKey: string, eliminarMutation: any, editarMutation: any, refetchFn: any) => {
    const isActiva = row.estado;
    const nombre = `${row.nombre || ''} ${row.apellido || ''}`.trim() || `el ${tipo.toLowerCase()}`;
    setConfirmDlg({
      open: true,
      title: isActiva ? `¿Eliminar ${tipo}?` : `¿Restaurar ${tipo}?`,
      message: isActiva 
        ? `¿Deseas eliminar a ${nombre}? Esta acción lo marcará como inactivo.` 
        : `¿Deseas restaurar a ${nombre}? Volverá a estar activo en el sistema.`,
      type: isActiva ? 'error' : 'success',
      onConfirm: async () => {
        setConfirming(true);
        try {
          const res = isActiva
            ? await eliminarMutation({ variables: { [idKey]: row[idKey] } })
            : await editarMutation({ variables: { [idKey]: row[idKey], estado: true } });
          const key = isActiva ? `eliminar${tipo}` : `editar${tipo}`;
          if (res.data[key]?.ok) {
            setSnackErr({ open: true, msg: `${tipo} ${isActiva ? 'eliminado' : 'restaurado'} exitosamente.` });
            refetchFn();
          } else {
            setSnackErr({ open: true, msg: res.data[key]?.error || 'Error en la operación' });
          }
        } catch (err: any) {
          setSnackErr({ open: true, msg: err.message });
        }
        setConfirming(false);
        setConfirmDlg(p => ({ ...p, open: false }));
      }
    });
  };

  const applyFilters = (data: any[]) => {
    if (!data) return [];
    return data.filter((item: any) => {
      const matchNombre = searchNombre ? item.nombre?.toLowerCase().includes(searchNombre.toLowerCase()) : true;
      const matchApellido = searchApellido ? item.apellido?.toLowerCase().includes(searchApellido.toLowerCase()) : true;
      const matchCI = searchCI ? item.ci?.toLowerCase().includes(searchCI.toLowerCase()) : true;
      const matchEstado = searchEstado !== 'Todos' ? (searchEstado === 'Activo' ? item.estado : !item.estado) : true;
      return matchNombre && matchApellido && matchCI && matchEstado;
    });
  };

  const renderFilters = () => (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      <Grid item xs={12} sm={3}>
        <TextField fullWidth size="small" label="Nombre" value={searchNombre} onChange={e => { setSearchNombre(e.target.value); setPage(0); }} />
      </Grid>
      <Grid item xs={12} sm={3}>
        <TextField fullWidth size="small" label="Apellidos" value={searchApellido} onChange={e => { setSearchApellido(e.target.value); setPage(0); }} />
      </Grid>
      <Grid item xs={12} sm={3}>
        <TextField fullWidth size="small" label="C.I." value={searchCI} onChange={e => { setSearchCI(e.target.value); setPage(0); }} />
      </Grid>
      <Grid item xs={12} sm={3}>
        <TextField fullWidth size="small" select label="Estado" value={searchEstado} onChange={e => { setSearchEstado(e.target.value); setPage(0); }}>
          <MenuItem value="Todos">Todos</MenuItem>
          <MenuItem value="Activo">Activo</MenuItem>
          <MenuItem value="Inactivo">Inactivo</MenuItem>
        </TextField>
      </Grid>
    </Grid>
  );

  const showErr = (setMsg: (s: string) => void, setField: (s: string) => void, msg: string) => {
    setMsg(msg);
    setField(detectField(msg));
    setSnackErr({ open: true, msg });
  };

  // --- HANDLERS PARTICIPANTE ---
  const handleOpenParticipante = (row: any = null) => {
    if (row) {
      setActiveParticipante(row);
      setIsExterno(!!row.participanteExt);
    } else {
      setActiveParticipante(null);
      setIsExterno(false);
    }
    setErrorParticipante('');
    setErrorFieldParticipante('');
    setPendingUserParticipante(null);
    setOpenParticipante(true);
  };

  const handleSubmitParticipante = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorParticipante('');
    setErrorFieldParticipante('');
    const formData = new FormData(e.currentTarget);

    try {
      if (activeParticipante) {
        const resPart = await editarParticipante({
          variables: {
            idParticipante: activeParticipante.idParticipante,
            codigoEspecifico: formData.get('codigo_especifico') as string,
            nombre: formData.get('nombre') as string,
            apellido: formData.get('apellido') as string,
            ci: formData.get('ci') as string,
            expedicion: formData.get('expedicion') as string,
            celular: formData.get('celular') as string,
            direccion: isExterno ? (formData.get('direccion') as string) : null,
            institucion: isExterno ? (formData.get('institucion') as string) : null,
            idProyecto: formData.get('id_proyecto') || null,
            idTutor: formData.get('id_tutor') || null
          }
        });
        if (!resPart.data.editarParticipante.ok) {
          showErr(
            setErrorParticipante,
            setErrorFieldParticipante,
            resPart.data.editarParticipante.error || 'Error al actualizar el participante.'
          );
        } else {
          MySwal.fire('¡Éxito!', 'Participante actualizado exitosamente.', 'success');
          setOpenParticipante(false);
          refetchParticipantes();
        }
      } else {
        let idUsuario = pendingUserParticipante;

        if (!idUsuario) {
          const username = formData.get('username') as string;
          const email = formData.get('email') as string;
          const password = formData.get('password') as string;

          const resUsuario = await crearUsuario({ variables: { username, email, password } });
          if (!resUsuario.data.crearUsuario.ok) {
            showErr(setErrorParticipante, setErrorFieldParticipante, resUsuario.data.crearUsuario.error || 'Error al crear el usuario.');
            return;
          }
          idUsuario = resUsuario.data.crearUsuario.usuario.idUsuario;
          setPendingUserParticipante(idUsuario);
        }

        const resPart = await crearParticipante({
          variables: {
            idUsuario,
            codigoEspecifico: formData.get('codigo_especifico') as string,
            nombre: formData.get('nombre') as string,
            apellido: formData.get('apellido') as string,
            ci: formData.get('ci') as string,
            expedicion: formData.get('expedicion') as string,
            celular: formData.get('celular') as string,
            direccion: isExterno ? (formData.get('direccion') as string) : null,
            institucion: isExterno ? (formData.get('institucion') as string) : null,
            idProyecto: formData.get('id_proyecto') || null,
            idTutor: formData.get('id_tutor') || null
          }
        });

        if (!resPart.data.crearParticipante.ok) {
          showErr(
            setErrorParticipante,
            setErrorFieldParticipante,
            resPart.data.crearParticipante.error || 'Error al registrar el participante.'
          );
        } else {
          const rolParticipante = dataRoles?.todosLosRoles?.find((r: any) => r.nombre === 'Participante');
          if (rolParticipante) {
            try {
              await asignarRolAUsuario({ variables: { idUsuario, idRol: rolParticipante.idRol } });
            } catch (_) {}
          }
          MySwal.fire('¡Éxito!', 'Participante registrado exitosamente.', 'success');
          setOpenParticipante(false);
          refetchParticipantes();
        }
      }
    } catch (err: any) {
      console.error(err);
      showErr(setErrorParticipante, setErrorFieldParticipante, err.message || 'Error de red o servidor.');
    }
  };

  // --- HANDLERS TUTOR ---
  const handleOpenTutor = (row: any = null) => {
    setActiveTutor(row);
    setErrorTutor('');
    setErrorFieldTutor('');
    setPendingUserTutor(null);
    setOpenTutor(true);
  };

  const handleSubmitTutor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorTutor('');
    setErrorFieldTutor('');
    const formData = new FormData(e.currentTarget);

    try {
      if (activeTutor) {
        const resTutor = await editarTutor({
          variables: {
            idTutor: activeTutor.idTutor,
            codEmpleado: formData.get('cod_empleado') as string,
            nombre: formData.get('nombre') as string,
            apellido: formData.get('apellido') as string,
            ci: formData.get('ci') as string,
            expedicion: formData.get('expedicion') as string,
            celular: formData.get('celular') as string,
            direccion: (formData.get('direccion') as string) || '',
            idProyecto: formData.get('id_proyecto') || null
          }
        });
        if (!resTutor.data.editarTutor.ok) {
          showErr(setErrorTutor, setErrorFieldTutor, resTutor.data.editarTutor.error || 'Error al actualizar el tutor.');
        } else {
          MySwal.fire('¡Éxito!', 'Tutor actualizado exitosamente.', 'success');
          setOpenTutor(false);
          refetchTutores();
        }
      } else {
        let idUsuario = pendingUserTutor;

        if (!idUsuario) {
          const username = formData.get('username') as string;
          const email = formData.get('email') as string;
          const password = formData.get('password') as string;

          const resUsuario = await crearUsuario({ variables: { username, email, password } });
          if (!resUsuario.data.crearUsuario.ok) {
            showErr(setErrorTutor, setErrorFieldTutor, resUsuario.data.crearUsuario.error || 'Error al crear el usuario.');
            return;
          }
          idUsuario = resUsuario.data.crearUsuario.usuario.idUsuario;
          setPendingUserTutor(idUsuario);
        }

        const resTutor = await crearTutor({
          variables: {
            idUsuario,
            codEmpleado: formData.get('cod_empleado') as string,
            nombre: formData.get('nombre') as string,
            apellido: formData.get('apellido') as string,
            ci: formData.get('ci') as string,
            expedicion: formData.get('expedicion') as string,
            celular: formData.get('celular') as string,
            direccion: (formData.get('direccion') as string) || '',
            idProyecto: formData.get('id_proyecto') || null
          }
        });

        if (!resTutor.data.crearTutor.ok) {
          showErr(setErrorTutor, setErrorFieldTutor, resTutor.data.crearTutor.error || 'Error al registrar el tutor.');
        } else {
          const rolTutor = dataRoles?.todosLosRoles?.find((r: any) => r.nombre === 'Tutor');
          if (rolTutor) {
            try {
              await asignarRolAUsuario({ variables: { idUsuario, idRol: rolTutor.idRol } });
            } catch (_) {}
          }
          MySwal.fire('¡Éxito!', 'Tutor registrado exitosamente.', 'success');
          setOpenTutor(false);
          refetchTutores();
        }
      }
    } catch (err: any) {
      console.error(err);
      showErr(setErrorTutor, setErrorFieldTutor, err.message || 'Error de red o servidor.');
    }
  };

  // --- HANDLERS TRIBUNAL ---
  const handleOpenTribunal = (row: any = null) => {
    setActiveTribunal(row);
    setErrorTribunal('');
    setErrorFieldTribunal('');
    setPendingUserTribunal(null);
    setOpenTribunal(true);
  };

  const handleSubmitTribunal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorTribunal('');
    const formData = new FormData(e.currentTarget);

    try {
      if (activeTribunal) {
        const resTribunal = await editarTribunal({
          variables: {
            idTribunal: activeTribunal.idTribunal,
            especialidad: formData.get('especialidad') as string,
            nombre: formData.get('nombre') as string,
            apellido: formData.get('apellido') as string,
            ci: formData.get('ci') as string,
            expedicion: formData.get('expedicion') as string,
            celular: formData.get('celular') as string,
            direccion: (formData.get('direccion') as string) || ''
          }
        });
        if (!resTribunal.data.editarTribunal.ok) {
          showErr(setErrorTribunal, setErrorFieldTribunal, resTribunal.data.editarTribunal.error || 'Error al actualizar el tribunal.');
        } else {
          MySwal.fire('¡Éxito!', 'Tribunal actualizado exitosamente.', 'success');
          setOpenTribunal(false);
          refetchTribunales();
        }
      } else {
        let idUsuario = pendingUserTribunal;

        if (!idUsuario) {
          const username = formData.get('username') as string;
          const email = formData.get('email') as string;
          const password = formData.get('password') as string;

          const resUsuario = await crearUsuario({ variables: { username, email, password } });
          if (!resUsuario.data.crearUsuario.ok) {
            showErr(setErrorTribunal, setErrorFieldTribunal, resUsuario.data.crearUsuario.error || 'Error al crear el usuario.');
            return;
          }
          idUsuario = resUsuario.data.crearUsuario.usuario.idUsuario;
          setPendingUserTribunal(idUsuario);
        }

        const resTribunal = await crearTribunal({
          variables: {
            idUsuario,
            especialidad: formData.get('especialidad') as string,
            nombre: formData.get('nombre') as string,
            apellido: formData.get('apellido') as string,
            ci: formData.get('ci') as string,
            expedicion: formData.get('expedicion') as string,
            celular: formData.get('celular') as string,
            direccion: (formData.get('direccion') as string) || ''
          }
        });

        if (!resTribunal.data.crearTribunal.ok) {
          showErr(setErrorTribunal, setErrorFieldTribunal, resTribunal.data.crearTribunal.error || 'Error al registrar el tribunal.');
        } else {
          const rolTribunal = dataRoles?.todosLosRoles?.find((r: any) => r.nombre === 'Tribunal');
          if (rolTribunal) {
            try {
              await asignarRolAUsuario({ variables: { idUsuario, idRol: rolTribunal.idRol } });
            } catch (_) {}
          }
          MySwal.fire('¡Éxito!', 'Tribunal registrado exitosamente.', 'success');
          setOpenTribunal(false);
          refetchTribunales();
        }
      }
    } catch (err: any) {
      console.error(err);
      showErr(setErrorTribunal, setErrorFieldTribunal, err.message || 'Error de red o servidor.');
    }
  };

  // --- HANDLERS PERSONAL ---
  const handleOpenPersonal = (row: any = null) => {
    setActivePersonal(row);
    setErrorPersonal('');
    setErrorFieldPersonal('');
    setPendingUserPersonal(null);
    setSelectedRolPersonal('');
    setOpenPersonal(true);
  };

  const handleSubmitPersonal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorPersonal('');
    const formData = new FormData(e.currentTarget);

    try {
      if (activePersonal) {
        const res = await editarPersonal({
          variables: {
            idPersonal: activePersonal.idPersonal,
            nombre: formData.get('nombre') as string,
            apellido: formData.get('apellido') as string,
            ci: formData.get('ci') as string,
            expedicion: formData.get('expedicion') as string,
            cargo: formData.get('cargo') as string,
            direccion: formData.get('direccion') as string,
            celular: formData.get('celular') as string
          }
        });
        if (!res.data.editarPersonal.ok) {
          showErr(setErrorPersonal, setErrorFieldPersonal, res.data.editarPersonal.error || 'Error al actualizar el personal.');
        } else {
          MySwal.fire('¡Éxito!', 'Personal actualizado exitosamente.', 'success');
          setOpenPersonal(false);
          refetchPersonal();
        }
      } else {
        let idUsuario = pendingUserPersonal;

        if (!idUsuario) {
          const username = formData.get('username') as string;
          const email = formData.get('email') as string;
          const password = formData.get('password') as string;

          const resUsuario = await crearUsuario({ variables: { username, email, password } });
          if (!resUsuario.data.crearUsuario.ok) {
            showErr(setErrorPersonal, setErrorFieldPersonal, resUsuario.data.crearUsuario.error || 'Error al crear el usuario.');
            return;
          }
          idUsuario = resUsuario.data.crearUsuario.usuario.idUsuario;
          setPendingUserPersonal(idUsuario);
        }

        const res = await crearPersonal({
          variables: {
            idUsuario,
            nombre: formData.get('nombre') as string,
            apellido: formData.get('apellido') as string,
            ci: formData.get('ci') as string,
            expedicion: formData.get('expedicion') as string,
            cargo: formData.get('cargo') as string,
            direccion: formData.get('direccion') as string,
            celular: formData.get('celular') as string
          }
        });

        if (!res.data.crearPersonal.ok) {
          showErr(setErrorPersonal, setErrorFieldPersonal, res.data.crearPersonal.error || 'Error al registrar el personal.');
        } else {
          if (selectedRolPersonal) {
            try {
              await asignarRolAUsuario({ variables: { idUsuario, idRol: selectedRolPersonal } });
            } catch (_) {}
          }
          MySwal.fire('¡Éxito!', 'Personal registrado exitosamente.', 'success');
          setOpenPersonal(false);
          refetchPersonal();
        }
      }
    } catch (err: any) {
      console.error(err);
      showErr(setErrorPersonal, setErrorFieldPersonal, err.message || 'Error de red o servidor.');
    }
  };

  const renderChip = (label: string, color: 'success' | 'error' | 'warning' | 'info') => (
    <Chip label={label} color={color} size="small" variant="outlined" sx={{ borderWidth: 1, opacity: 0.85, fontWeight: 500 }} />
  );

  return (
    <MainCard title="Directorio y Perfiles">
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="perfiles tabs">
            <Tab label="Participantes" {...a11yProps(0)} />
            <Tab label="Tutores" {...a11yProps(1)} />
            <Tab label="Tribunales" {...a11yProps(2)} />
            <Tab label="Personal" {...a11yProps(3)} />
          </Tabs>
        </Box>

        {/* ======================= PARTICIPANTES ======================= */}
        <CustomTabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h5">Gestión de Participantes</Typography>
            <Button variant="contained" color="primary" onClick={() => handleOpenParticipante()}>
              + Nuevo Participante
            </Button>
          </Box>
          {renderFilters()}
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Nombre Completo</TableCell>
                  <TableCell>C.I.</TableCell>
                  <TableCell>Celular</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dataParticipantes?.todosLosParticipantes ? (
                  applyFilters(dataParticipantes.todosLosParticipantes)
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row: any) => (
                    <TableRow key={row.idParticipante}>
                      <TableCell>{row.idParticipante}</TableCell>
                      <TableCell>
                        {row.nombre} {row.apellido}
                      </TableCell>
                      <TableCell>
                        {row.ci} {row.expedicion}
                      </TableCell>
                      <TableCell>{row.celular}</TableCell>
                      <TableCell>
                        {renderChip(row.participanteExt ? 'Externo' : 'Interno', row.participanteExt ? 'warning' : 'info')}
                      </TableCell>
                      <TableCell>{renderChip(row.estado ? 'Activo' : 'Inactivo', row.estado ? 'success' : 'error')}</TableCell>
                      <TableCell align="right">
                        <IconButton color="primary" onClick={() => handleOpenParticipante(row)}>
                          <EditOutlined />
                        </IconButton>
                        {row.estado ? (
                          <IconButton color="error" onClick={() => handleToggleEstado(row, 'Participante', 'idParticipante', eliminarParticipante, editarParticipante, refetchParticipantes)} title="Eliminar">
                            <DeleteOutlined />
                          </IconButton>
                        ) : (
                          <IconButton color="success" onClick={() => handleToggleEstado(row, 'Participante', 'idParticipante', eliminarParticipante, editarParticipante, refetchParticipantes)} title="Restaurar">
                            <ReloadOutlined />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No hay participantes registrados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <CustomPagination
              count={applyFilters(dataParticipantes?.todosLosParticipantes || []).length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(e: any, newPage: number) => setPage(newPage)}
              onRowsPerPageChange={(e: any) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            />
          </TableContainer>
        </CustomTabPanel>

        {/* ======================= TUTORES ======================= */}
        <CustomTabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h5">Gestión de Tutores</Typography>
            <Button variant="contained" color="primary" onClick={() => handleOpenTutor()}>
              + Nuevo Tutor
            </Button>
          </Box>
          {renderFilters()}
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Cód. Empleado</TableCell>
                  <TableCell>Nombre Completo</TableCell>
                  <TableCell>C.I.</TableCell>
                  <TableCell>Celular</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dataTutores?.todosLosTutores ? (
                  applyFilters(dataTutores.todosLosTutores)
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row: any) => (
                    <TableRow key={row.idTutor}>
                      <TableCell>{row.idTutor}</TableCell>
                      <TableCell>{row.codEmpleado}</TableCell>
                      <TableCell>
                        {row.nombre} {row.apellido}
                      </TableCell>
                      <TableCell>
                        {row.ci} {row.expedicion}
                      </TableCell>
                      <TableCell>{row.celular}</TableCell>
                      <TableCell>{renderChip(row.estado ? 'Activo' : 'Inactivo', row.estado ? 'success' : 'error')}</TableCell>
                      <TableCell align="right">
                        <IconButton color="primary" onClick={() => handleOpenTutor(row)}>
                          <EditOutlined />
                        </IconButton>
                        {row.estado ? (
                          <IconButton color="error" onClick={() => handleToggleEstado(row, 'Tutor', 'idTutor', eliminarTutor, editarTutor, refetchTutores)} title="Eliminar">
                            <DeleteOutlined />
                          </IconButton>
                        ) : (
                          <IconButton color="success" onClick={() => handleToggleEstado(row, 'Tutor', 'idTutor', eliminarTutor, editarTutor, refetchTutores)} title="Restaurar">
                            <ReloadOutlined />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No hay tutores registrados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <CustomPagination
              count={applyFilters(dataTutores?.todosLosTutores || []).length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(e: any, newPage: number) => setPage(newPage)}
              onRowsPerPageChange={(e: any) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            />
          </TableContainer>
        </CustomTabPanel>

        {/* ======================= TRIBUNALES ======================= */}
        <CustomTabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h5">Gestión de Tribunales</Typography>
            <Button variant="contained" color="primary" onClick={() => handleOpenTribunal()}>
              + Nuevo Tribunal
            </Button>
          </Box>
          {renderFilters()}
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Nombre Completo</TableCell>
                  <TableCell>Especialidad</TableCell>
                  <TableCell>C.I.</TableCell>
                  <TableCell>Celular</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dataTribunales?.todosLosTribunales ? (
                  applyFilters(dataTribunales.todosLosTribunales)
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row: any) => (
                    <TableRow key={row.idTribunal}>
                      <TableCell>{row.idTribunal}</TableCell>
                      <TableCell>
                        {row.nombre} {row.apellido}
                      </TableCell>
                      <TableCell>{row.especialidad}</TableCell>
                      <TableCell>
                        {row.ci} {row.expedicion}
                      </TableCell>
                      <TableCell>{row.celular}</TableCell>
                      <TableCell>{renderChip(row.estado ? 'Activo' : 'Inactivo', row.estado ? 'success' : 'error')}</TableCell>
                      <TableCell align="right">
                        <IconButton color="primary" onClick={() => handleOpenTribunal(row)}>
                          <EditOutlined />
                        </IconButton>
                        {row.estado ? (
                          <IconButton color="error" onClick={() => handleToggleEstado(row, 'Tribunal', 'idTribunal', eliminarTribunal, editarTribunal, refetchTribunales)} title="Eliminar">
                            <DeleteOutlined />
                          </IconButton>
                        ) : (
                          <IconButton color="success" onClick={() => handleToggleEstado(row, 'Tribunal', 'idTribunal', eliminarTribunal, editarTribunal, refetchTribunales)} title="Restaurar">
                            <ReloadOutlined />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No hay tribunales registrados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <CustomPagination
              count={applyFilters(dataTribunales?.todosLosTribunales || []).length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(e: any, newPage: number) => setPage(newPage)}
              onRowsPerPageChange={(e: any) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            />
          </TableContainer>
        </CustomTabPanel>
        {/* ======================= PERSONAL ======================= */}
        <CustomTabPanel value={tabValue} index={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h5">Gestión de Personal</Typography>
            <Button variant="contained" color="primary" onClick={() => handleOpenPersonal()}>
              + Nuevo Personal
            </Button>
          </Box>
          {renderFilters()}
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Nombre Completo</TableCell>
                  <TableCell>C.I.</TableCell>
                  <TableCell>Cargo</TableCell>
                  <TableCell>Celular</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dataPersonal?.todoElPersonal ? (
                  applyFilters(dataPersonal.todoElPersonal)
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row: any) => (
                    <TableRow key={row.idPersonal}>
                      <TableCell>{row.idPersonal}</TableCell>
                      <TableCell>
                        {row.nombre} {row.apellido}
                      </TableCell>
                      <TableCell>
                        {row.ci} {row.expedicion}
                      </TableCell>
                      <TableCell>{row.cargo}</TableCell>
                      <TableCell>{row.celular}</TableCell>
                      <TableCell>{renderChip(row.estado ? 'Activo' : 'Inactivo', row.estado ? 'success' : 'error')}</TableCell>
                      <TableCell align="right">
                        <IconButton color="primary" onClick={() => handleOpenPersonal(row)}>
                          <EditOutlined />
                        </IconButton>
                        {row.estado ? (
                          <IconButton color="error" onClick={() => handleToggleEstado(row, 'Personal', 'idPersonal', eliminarPersonal, editarPersonal, refetchPersonal)} title="Eliminar">
                            <DeleteOutlined />
                          </IconButton>
                        ) : (
                          <IconButton color="success" onClick={() => handleToggleEstado(row, 'Personal', 'idPersonal', eliminarPersonal, editarPersonal, refetchPersonal)} title="Restaurar">
                            <ReloadOutlined />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No hay personal registrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <CustomPagination
              count={applyFilters(dataPersonal?.todoElPersonal || []).length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(e: any, newPage: number) => setPage(newPage)}
              onRowsPerPageChange={(e: any) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            />
          </TableContainer>
        </CustomTabPanel>
      </Box>

      {/* ======================= MODAL PARTICIPANTE ======================= */}
      <Dialog open={openParticipante} onClose={() => setOpenParticipante(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmitParticipante}>
          <DialogTitle sx={{ pb: 2, fontSize: '1.25rem', fontWeight: 600 }}>
            {activeParticipante ? 'Editar Participante' : 'Registrar Participante'}
          </DialogTitle>
          <DialogContent dividers sx={{ bgcolor: 'background.default', p: { xs: 2, md: 3 } }}>
            {!activeParticipante && (
              <Paper
                elevation={0}
                sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 2, p: 3, mb: 3 }}
              >
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem', mb: 0.5 }}>
                    Datos de Usuario
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Credenciales de acceso al sistema
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      name="username"
                      fullWidth
                      label="Username"
                      required
                      size="small"
                      error={errorFieldParticipante === 'username'}
                      helperText={errorFieldParticipante === 'username' ? errorParticipante : undefined}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      name="email"
                      fullWidth
                      label="Email"
                      type="email"
                      required
                      size="small"
                      error={errorFieldParticipante === 'email'}
                      helperText={errorFieldParticipante === 'email' ? errorParticipante : undefined}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      name="password"
                      fullWidth
                      label="Password"
                      type="password"
                      required
                      size="small"
                      error={errorFieldParticipante === 'password'}
                      helperText={errorFieldParticipante === 'password' ? errorParticipante : undefined}
                    />
                  </Grid>
                </Grid>
              </Paper>
            )}

            <Paper
              elevation={0}
              sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 2, p: 3, mb: 3 }}
            >
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem', mb: 0.5 }}>
                  Datos Personales
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Información básica del participante
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField name="nombre" defaultValue={activeParticipante?.nombre} fullWidth label="Nombres" required size="small" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="apellido"
                    defaultValue={activeParticipante?.apellido}
                    fullWidth
                    label="Apellidos"
                    required
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    name="ci"
                    defaultValue={activeParticipante?.ci}
                    fullWidth
                    label="C.I."
                    required
                    size="small"
                    error={errorFieldParticipante === 'ci'}
                    helperText={errorFieldParticipante === 'ci' ? errorParticipante : undefined}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    name="expedicion"
                    defaultValue={activeParticipante?.expedicion || 'LP'}
                    fullWidth
                    select
                    label="Expedición"
                    size="small"
                  >
                    {EXPEDICION_CHOICES.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField name="celular" defaultValue={activeParticipante?.celular} fullWidth label="Celular" required size="small" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="codigo_especifico"
                    defaultValue={activeParticipante?.codigoEspecifico}
                    fullWidth
                    label="Código Específico (Matrícula/Registro)"
                    required
                    size="small"
                  />
                </Grid>
                {/*<Grid item xs={12}>
                  <TextField
                    name="id_proyecto"
                    defaultValue={activeParticipante?.proyecto?.idProyecto || ''}
                    fullWidth
                    select
                    label="Proyecto"
                    size="small"
                  >
                    <MenuItem value="">
                      <em>Ninguno</em>
                    </MenuItem>
                    {dataProyectos?.todosLosProyectos?.map((p: any) => (
                      <MenuItem key={p.idProyecto} value={p.idProyecto}>
                        {p.titulo}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="id_tutor"
                    defaultValue={activeParticipante?.tutor?.idTutor || ''}
                    fullWidth
                    select
                    label="Tutor"
                    size="small"
                  >
                    <MenuItem value="">
                      <em>Ninguno</em>
                    </MenuItem>
                    {dataTutores?.todosLosTutores?.map((t: any) => (
                      <MenuItem key={t.idTutor} value={t.idTutor}>
                        {t.nombre} {t.apellido}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>*/}
              </Grid>
            </Paper>

            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 2, p: 3 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem', mb: 0.5 }}>
                  Datos Adicionales
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Información complementaria e institucional
                </Typography>
              </Box>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={isExterno ? 4 : 12}>
                  <FormControlLabel
                    control={<Switch checked={isExterno} onChange={(e) => setIsExterno(e.target.checked)} color="warning" />}
                    label="¿Es Participante Externo?"
                  />
                </Grid>
                {isExterno && (
                  <>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        name="institucion"
                        defaultValue={activeParticipante?.participanteExt?.institucion}
                        fullWidth
                        label="Institución de Origen"
                        required
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        name="direccion"
                        defaultValue={activeParticipante?.participanteExt?.direccion}
                        fullWidth
                        label="Dirección"
                        required
                        size="small"
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </Paper>
          </DialogContent>
          <DialogActions sx={{ p: 2, px: 3, bgcolor: 'background.paper' }}>
            <Button onClick={() => setOpenParticipante(false)} color="secondary" variant="outlined">
              Cancelar
            </Button>
            <Button type="submit" variant="contained" sx={{ px: 4 }}>
              {activeParticipante ? 'Actualizar Participante' : 'Guardar Participante'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ======================= MODAL TUTOR ======================= */}
      <Dialog open={openTutor} onClose={() => setOpenTutor(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmitTutor}>
          <DialogTitle sx={{ pb: 2, fontSize: '1.25rem', fontWeight: 600 }}>{activeTutor ? 'Editar Tutor' : 'Registrar Tutor'}</DialogTitle>
          <DialogContent dividers sx={{ bgcolor: 'background.default', p: { xs: 2, md: 3 } }}>
            {!activeTutor && (
              <Paper
                elevation={0}
                sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 2, p: 3, mb: 3 }}
              >
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem', mb: 0.5 }}>
                    Datos de Usuario
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Credenciales de acceso al sistema
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      name="username"
                      fullWidth
                      label="Username"
                      required
                      size="small"
                      error={errorFieldTutor === 'username'}
                      helperText={errorFieldTutor === 'username' ? errorTutor : undefined}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      name="email"
                      fullWidth
                      label="Email"
                      type="email"
                      required
                      size="small"
                      error={errorFieldTutor === 'email'}
                      helperText={errorFieldTutor === 'email' ? errorTutor : undefined}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      name="password"
                      fullWidth
                      label="Password"
                      type="password"
                      required
                      size="small"
                      error={errorFieldTutor === 'password'}
                      helperText={errorFieldTutor === 'password' ? errorTutor : undefined}
                    />
                  </Grid>
                </Grid>
              </Paper>
            )}

            <Paper
              elevation={0}
              sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 2, p: 3, mb: 3 }}
            >
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem', mb: 0.5 }}>
                  Datos Personales
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Información básica del tutor
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField name="nombre" defaultValue={activeTutor?.nombre} fullWidth label="Nombres" required size="small" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField name="apellido" defaultValue={activeTutor?.apellido} fullWidth label="Apellidos" required size="small" />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    name="ci"
                    defaultValue={activeTutor?.ci}
                    fullWidth
                    label="C.I."
                    required
                    size="small"
                    error={errorFieldTutor === 'ci'}
                    helperText={errorFieldTutor === 'ci' ? errorTutor : undefined}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    name="expedicion"
                    defaultValue={activeTutor?.expedicion || 'LP'}
                    fullWidth
                    select
                    label="Expedición"
                    size="small"
                  >
                    {EXPEDICION_CHOICES.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField name="celular" defaultValue={activeTutor?.celular} fullWidth label="Celular" required size="small" />
                </Grid>
              </Grid>
            </Paper>

            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 2, p: 3 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem', mb: 0.5 }}>
                  Datos Institucionales
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Información laboral del tutor
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="cod_empleado"
                    defaultValue={activeTutor?.codEmpleado}
                    fullWidth
                    label="Código de Empleado"
                    required
                    size="small"
                    error={errorFieldTutor === 'cod_empleado'}
                    helperText={errorFieldTutor === 'cod_empleado' ? errorTutor : undefined}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField name="direccion" defaultValue={activeTutor?.direccion} fullWidth label="Dirección Particular" size="small" />
                </Grid>
                {/*<Grid item xs={12}>
                  <TextField
                    name="id_proyecto"
                    defaultValue={activeTutor?.proyecto?.idProyecto || ''}
                    fullWidth
                    select
                    label="Proyecto"
                    size="small"
                  >
                    <MenuItem value="">
                      <em>Ninguno</em>
                    </MenuItem>
                    {dataProyectos?.todosLosProyectos?.map((p: any) => (
                      <MenuItem key={p.idProyecto} value={p.idProyecto}>
                        {p.titulo}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>*/}
              </Grid>
            </Paper>
          </DialogContent>
          <DialogActions sx={{ p: 2, px: 3, bgcolor: 'background.paper' }}>
            <Button onClick={() => setOpenTutor(false)} color="secondary" variant="outlined">
              Cancelar
            </Button>
            <Button type="submit" variant="contained" sx={{ px: 4 }}>
              {activeTutor ? 'Actualizar Tutor' : 'Guardar Tutor'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ======================= MODAL TRIBUNAL ======================= */}
      <Dialog
        open={openTribunal}
        onClose={() => setOpenTribunal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05), 0 10px 10px -5px rgba(0,0,0,0.02)',
            overflow: 'hidden'
          }
        }}
      >
        <form onSubmit={handleSubmitTribunal}>
          {/* Header minimalista y formal */}
          <Box
            sx={{
              bgcolor: '#ffffff',
              px: 3,
              py: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid',
              borderColor: '#F1F5F9'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '6px',
                  bgcolor: '#F1F5F9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <UserOutlined style={{ color: '#475569', fontSize: 15 }} />
              </Box>
              <Box>
                <Typography sx={{ color: '#0F172A', fontWeight: 600, fontSize: '1.05rem', lineHeight: 1.2 }}>
                  {activeTribunal ? 'Editar Miembro del Tribunal' : 'Registrar Miembro del Tribunal'}
                </Typography>
                <Typography sx={{ color: '#64748B', fontSize: '0.72rem', mt: 0.2 }}>Directorio Académico</Typography>
              </Box>
            </Box>
            <Chip
              label="Tribunal"
              size="small"
              variant="outlined"
              sx={{
                borderRadius: '6px',
                fontWeight: 500,
                fontSize: '0.72rem',
                color: '#475569',
                borderColor: '#E2E8F0',
                bgcolor: '#F8FAFC'
              }}
            />
          </Box>

          <DialogContent sx={{ bgcolor: '#fff', px: 3, pt: 2, pb: 2 }}>
            {!activeTribunal && (
              <>
                <SectionLabel>Credenciales de acceso</SectionLabel>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      name="username"
                      fullWidth
                      label="Usuario"
                      required
                      size="small"
                      error={errorFieldTribunal === 'username'}
                      helperText={errorFieldTribunal === 'username' ? errorTribunal : undefined}
                      InputProps={{
                        sx: {
                          borderRadius: '6px',
                          bgcolor: '#F8FAFC',
                          transition: 'all 0.15s ease',
                          '&:hover': { bgcolor: '#F1F5F9' },
                          '&.Mui-focused': { bgcolor: '#FFF' }
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      name="email"
                      fullWidth
                      label="Correo electrónico"
                      type="email"
                      required
                      size="small"
                      error={errorFieldTribunal === 'email'}
                      helperText={errorFieldTribunal === 'email' ? errorTribunal : undefined}
                      InputProps={{
                        sx: {
                          borderRadius: '6px',
                          bgcolor: '#F8FAFC',
                          transition: 'all 0.15s ease',
                          '&:hover': { bgcolor: '#F1F5F9' },
                          '&.Mui-focused': { bgcolor: '#FFF' }
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      name="password"
                      fullWidth
                      label="Contraseña"
                      type="password"
                      required
                      size="small"
                      error={errorFieldTribunal === 'password'}
                      helperText={errorFieldTribunal === 'password' ? errorTribunal : undefined}
                      InputProps={{
                        sx: {
                          borderRadius: '6px',
                          bgcolor: '#F8FAFC',
                          transition: 'all 0.15s ease',
                          '&:hover': { bgcolor: '#F1F5F9' },
                          '&.Mui-focused': { bgcolor: '#FFF' }
                        }
                      }}
                    />
                  </Grid>
                </Grid>
              </>
            )}

            <SectionLabel>Datos personales</SectionLabel>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="nombre"
                  defaultValue={activeTribunal?.nombre}
                  fullWidth
                  label="Nombres"
                  required
                  size="small"
                  InputProps={{
                    sx: {
                      borderRadius: '6px',
                      bgcolor: '#F8FAFC',
                      transition: 'all 0.15s ease',
                      '&:hover': { bgcolor: '#F1F5F9' },
                      '&.Mui-focused': { bgcolor: '#FFF' }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="apellido"
                  defaultValue={activeTribunal?.apellido}
                  fullWidth
                  label="Apellidos"
                  required
                  size="small"
                  InputProps={{
                    sx: {
                      borderRadius: '6px',
                      bgcolor: '#F8FAFC',
                      transition: 'all 0.15s ease',
                      '&:hover': { bgcolor: '#F1F5F9' },
                      '&.Mui-focused': { bgcolor: '#FFF' }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="ci"
                  defaultValue={activeTribunal?.ci}
                  fullWidth
                  label="Cédula de Identidad"
                  required
                  size="small"
                  error={errorFieldTribunal === 'ci'}
                  helperText={errorFieldTribunal === 'ci' ? errorTribunal : undefined}
                  InputProps={{
                    sx: {
                      borderRadius: '6px',
                      bgcolor: '#F8FAFC',
                      transition: 'all 0.15s ease',
                      '&:hover': { bgcolor: '#F1F5F9' },
                      '&.Mui-focused': { bgcolor: '#FFF' }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="expedicion"
                  defaultValue={activeTribunal?.expedicion || 'LP'}
                  fullWidth
                  select
                  label="Expedición"
                  size="small"
                  InputProps={{
                    sx: {
                      borderRadius: '6px',
                      bgcolor: '#F8FAFC',
                      transition: 'all 0.15s ease',
                      '&:hover': { bgcolor: '#F1F5F9' },
                      '&.Mui-focused': { bgcolor: '#FFF' }
                    }
                  }}
                >
                  {EXPEDICION_CHOICES.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="celular"
                  defaultValue={activeTribunal?.celular}
                  fullWidth
                  label="Teléfono / Celular"
                  required
                  size="small"
                  error={errorFieldTribunal === 'celular'}
                  helperText={errorFieldTribunal === 'celular' ? errorTribunal : undefined}
                  InputProps={{
                    sx: {
                      borderRadius: '6px',
                      bgcolor: '#F8FAFC',
                      transition: 'all 0.15s ease',
                      '&:hover': { bgcolor: '#F1F5F9' },
                      '&.Mui-focused': { bgcolor: '#FFF' }
                    }
                  }}
                />
              </Grid>
            </Grid>

            <SectionLabel>Perfil académico</SectionLabel>
            <Grid container spacing={2} sx={{ mb: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="especialidad"
                  defaultValue={activeTribunal?.especialidad}
                  fullWidth
                  label="Área de especialidad"
                  required
                  size="small"
                  error={errorFieldTribunal === 'especialidad'}
                  helperText={errorFieldTribunal === 'especialidad' ? errorTribunal : undefined}
                  InputProps={{
                    sx: {
                      borderRadius: '6px',
                      bgcolor: '#F8FAFC',
                      transition: 'all 0.15s ease',
                      '&:hover': { bgcolor: '#F1F5F9' },
                      '&.Mui-focused': { bgcolor: '#FFF' }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="direccion"
                  defaultValue={activeTribunal?.direccion}
                  fullWidth
                  label="Dirección particular"
                  size="small"
                  InputProps={{
                    sx: {
                      borderRadius: '6px',
                      bgcolor: '#F8FAFC',
                      transition: 'all 0.15s ease',
                      '&:hover': { bgcolor: '#F1F5F9' },
                      '&.Mui-focused': { bgcolor: '#FFF' }
                    }
                  }}
                />
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2.5, bgcolor: '#FCFCFD', borderTop: '1px solid', borderColor: '#F1F5F9' }}>
            <Button
              onClick={() => setOpenTribunal(false)}
              variant="text"
              sx={{
                color: '#475569',
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.85rem',
                mr: 1,
                '&:hover': { bgcolor: '#F1F5F9' }
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{
                px: 3.5,
                py: 0.8,
                bgcolor: '#0F172A',
                color: '#FFF',
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.85rem',
                borderRadius: '6px',
                boxShadow: 'none',
                '&:hover': { bgcolor: '#1E293B', boxShadow: 'none' }
              }}
            >
              {activeTribunal ? 'Guardar Cambios' : 'Registrar Miembro'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      {/* ======================= MODAL PERSONAL ======================= */}
      <Dialog open={openPersonal} onClose={() => setOpenPersonal(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmitPersonal}>
          <DialogTitle sx={{ pb: 2, fontSize: '1.25rem', fontWeight: 600 }}>
            {activePersonal ? 'Editar Personal' : 'Registrar Personal'}
          </DialogTitle>
          <DialogContent dividers sx={{ bgcolor: 'background.default', p: { xs: 2, md: 3 } }}>
            {!activePersonal && (
              <Paper
                elevation={0}
                sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 2, p: 3, mb: 3 }}
              >
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem', mb: 0.5 }}>
                    Datos de Usuario
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Credenciales de acceso al sistema
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      name="username"
                      fullWidth
                      label="Username"
                      required
                      size="small"
                      error={errorFieldPersonal === 'username'}
                      helperText={errorFieldPersonal === 'username' ? errorPersonal : undefined}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      name="email"
                      fullWidth
                      label="Email"
                      type="email"
                      required
                      size="small"
                      error={errorFieldPersonal === 'email'}
                      helperText={errorFieldPersonal === 'email' ? errorPersonal : undefined}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      name="password"
                      fullWidth
                      label="Password"
                      type="password"
                      required
                      size="small"
                      error={errorFieldPersonal === 'password'}
                      helperText={errorFieldPersonal === 'password' ? errorPersonal : undefined}
                    />
                  </Grid>
                </Grid>
              </Paper>
            )}

            <Paper
              elevation={0}
              sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 2, p: 3, mb: 3 }}
            >
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem', mb: 0.5 }}>
                  Datos Personales
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Información básica del personal
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField name="nombre" defaultValue={activePersonal?.nombre} fullWidth label="Nombres" required size="small" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField name="apellido" defaultValue={activePersonal?.apellido} fullWidth label="Apellidos" required size="small" />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    name="ci"
                    defaultValue={activePersonal?.ci}
                    fullWidth
                    label="C.I."
                    required
                    size="small"
                    error={errorFieldPersonal === 'ci'}
                    helperText={errorFieldPersonal === 'ci' ? errorPersonal : undefined}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    name="expedicion"
                    defaultValue={activePersonal?.expedicion || 'LP'}
                    fullWidth
                    select
                    label="Expedición"
                    size="small"
                  >
                    {EXPEDICION_CHOICES.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField name="celular" defaultValue={activePersonal?.celular} fullWidth label="Celular" required size="small" />
                </Grid>
              </Grid>
            </Paper>

            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 2, p: 3 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem', mb: 0.5 }}>
                  Datos Institucionales
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Cargo, rol y ubicación
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="cargo"
                    defaultValue={activePersonal?.cargo || 'SECRETARIA'}
                    fullWidth
                    select
                    label="Cargo"
                    required
                    size="small"
                  >
                    {CARGO_CHOICES.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField name="direccion" defaultValue={activePersonal?.direccion} fullWidth label="Dirección" required size="small" />
                </Grid>
                {!activePersonal && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      select
                      label="Rol del sistema"
                      size="small"
                      value={selectedRolPersonal}
                      onChange={(e) => setSelectedRolPersonal(e.target.value)}
                      helperText="Selecciona el rol de acceso que tendrá este usuario en el sistema"
                    >
                      <MenuItem value="">
                        <em>Sin rol</em>
                      </MenuItem>
                      {dataRoles?.todosLosRoles?.map((rol: any) => (
                        <MenuItem key={rol.idRol} value={rol.idRol}>
                          {rol.nombre}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                )}
              </Grid>
            </Paper>
          </DialogContent>
          <DialogActions sx={{ p: 2, px: 3, bgcolor: 'background.paper' }}>
            <Button onClick={() => setOpenPersonal(false)} color="secondary" variant="outlined">
              Cancelar
            </Button>
            <Button type="submit" variant="contained" sx={{ px: 4 }}>
              {activePersonal ? 'Actualizar Personal' : 'Guardar Personal'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ── Snackbar flotante de errores ── */}
      <Snackbar
        open={snackErr.open}
        autoHideDuration={5000}
        onClose={() => setSnackErr((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ mt: 7 }}
      >
        <Alert
          severity="error"
          variant="filled"
          onClose={() => setSnackErr((p) => ({ ...p, open: false }))}
          sx={{ minWidth: 320, fontWeight: 500, boxShadow: 6 }}
        >
          {snackErr.msg}
        </Alert>
      </Snackbar>
      <ConfirmDialog {...confirmDlg} onClose={() => setConfirmDlg(p => ({ ...p, open: false }))} loading={confirming} />
    </MainCard>
  );
};

export default PerfilesPage;
