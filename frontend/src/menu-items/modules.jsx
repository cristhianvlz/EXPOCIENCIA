import { UserOutlined, BookOutlined, CalendarOutlined, ProjectOutlined, CheckSquareOutlined, TrophyOutlined } from '@ant-design/icons';

const icons = {
  UserOutlined,
  BookOutlined,
  CalendarOutlined,
  ProjectOutlined,
  CheckSquareOutlined,
  TrophyOutlined
};

const modules = {
  id: 'group-modules',
  title: 'Módulos del Sistema',
  type: 'group',
  children: [
    {
      id: 'usuarios',
      title: 'Módulo de Usuario',
      type: 'collapse',
      icon: icons.UserOutlined,
      children: [
        { id: 'gestion-usuarios',      title: 'Gestión de Usuarios', type: 'item', url: '/usuarios/gestion',  permission: 'usuarios.gestion' },
        { id: 'roles-permisos',        title: 'Roles y Permisos',    type: 'item', url: '/usuarios/roles',    permission: 'usuarios.roles' },
        { id: 'perfiles-directorio',   title: 'Perfiles',            type: 'item', url: '/usuarios/perfiles', permission: 'usuarios.perfiles' }
      ]
    },
    {
      id: 'eventos',
      title: 'Módulo de Eventos',
      type: 'collapse',
      icon: icons.CalendarOutlined,
      children: [
        { id: 'gestion-eventos', title: 'Gestión de Eventos',      type: 'item', url: '/eventos/gestion',    permission: 'eventos.gestion' },
        { id: 'cronograma',      title: 'Cronograma y Actividades', type: 'item', url: '/eventos/cronograma', permission: 'eventos.cronograma' },
        { id: 'membretes',       title: 'Membretes y Firmas',       type: 'item', url: '/eventos/membretes',  permission: 'eventos.membretes' }
      ]
    },
    {
      id: 'academico',
      title: 'Módulo Académico',
      type: 'collapse',
      icon: icons.BookOutlined,
      children: [
        { id: 'catalogos-base',     title: 'Catálogos Base',     type: 'item', url: '/academico/facultades', permission: 'academico.facultades' },
        { id: 'ofertas-academicas', title: 'Ofertas Académicas', type: 'item', url: '/academico/ofertas',    permission: 'academico.ofertas' }
      ]
    },
    {
      id: 'proyectos',
      title: 'Módulo de Proyectos',
      type: 'collapse',
      icon: icons.ProjectOutlined,
      children: [
        { id: 'inscripcion-proyectos', title: 'Inscripción de Proyectos', type: 'item', url: '/proyectos/inscripcion', permission: 'proyectos.inscripcion' },
        { id: 'revision-proyectos',    title: 'Revisión y Aprobación',    type: 'item', url: '/proyectos/revision',    permission: 'proyectos.revision' },
        { id: 'mis-proyectos',         title: 'Mis Proyectos',            type: 'item', url: '/proyectos/mis-proyectos', permission: 'proyectos.mis_proyectos' }
      ]
    },
    {
      id: 'evaluaciones',
      title: 'Módulo de Evaluación',
      type: 'collapse',
      icon: icons.CheckSquareOutlined,
      children: [
        { id: 'planillas-rubricas',  title: 'Planillas y Rúbricas',  type: 'item', url: '/evaluaciones/planillas',  permission: 'evaluaciones.planillas' },
        { id: 'actas-evaluacion',    title: 'Actas de Evaluación',   type: 'item', url: '/evaluaciones/actas',      permission: 'evaluaciones.actas' },
        { id: 'panel-calificacion',  title: 'Panel de Calificación', type: 'item', url: '/evaluaciones/calificar',  permission: 'evaluaciones.calificar' },
        { id: 'resultados',          title: 'Resultados y Notas',    type: 'item', url: '/evaluaciones/resultados', permission: 'evaluaciones.resultados' }
      ]
    },
    {
      id: 'premiacion',
      title: 'Módulo de Premiación',
      type: 'collapse',
      icon: icons.TrophyOutlined,
      children: [
        { id: 'cuadro-honor',  title: 'Cuadro de Honor',        type: 'item', url: '/premiacion/cuadro-honor',  permission: 'premiacion.cuadro_honor' },
        { id: 'certificados',  title: 'Emisión de Certificados', type: 'item', url: '/premiacion/certificados', permission: 'premiacion.certificados' }
      ]
    }
  ]
};

export default modules;
