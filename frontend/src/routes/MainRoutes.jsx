import { lazy } from 'react';

// project imports
import Loadable from 'components/Loadable';
import DashboardLayout from 'layout/Dashboard';
import AuthGuard from './AuthGuard';
import PermissionGuard from './PermissionGuard';

// render- Dashboard
const DashboardDefault = Loadable(lazy(() => import('pages/dashboard/default')));

// render - color
const Color = Loadable(lazy(() => import('pages/component-overview/color')));
const Typography = Loadable(lazy(() => import('pages/component-overview/typography')));
const Shadow = Loadable(lazy(() => import('pages/component-overview/shadows')));

// render - modules
const UsuariosGestion = Loadable(lazy(() => import('pages/modules/usuarios')));
const UsuariosRoles = Loadable(lazy(() => import('pages/modules/usuarios/roles')));
const UsuariosPerfiles = Loadable(lazy(() => import('pages/modules/usuarios/perfiles')));
const AcademicoCatalogos  = Loadable(lazy(() => import('pages/modules/academico/facultades')));
const AcademicoEstructuras = Loadable(lazy(() => import('pages/modules/academico/areas')));
const AcademicoOfertas    = Loadable(lazy(() => import('pages/modules/academico/ofertas')));
const GestionEventos = Loadable(lazy(() => import('pages/modules/eventos/gestion')));
const CronogramaActividades = Loadable(lazy(() => import('pages/modules/eventos/cronograma')));
const MembretesFirmas = Loadable(lazy(() => import('pages/modules/eventos/membretes')));
const Proyectos            = Loadable(lazy(() => import('pages/modules/proyectos')));
const ProyectosInscripcion = Loadable(lazy(() => import('pages/modules/proyectos/inscripcion')));
const ProyectosRevision    = Loadable(lazy(() => import('pages/modules/proyectos/revision')));
const MisProyectos         = Loadable(lazy(() => import('pages/modules/proyectos/MisProyectos')));
const EvaluacionesPlanillas  = Loadable(lazy(() => import('pages/modules/evaluaciones/planillas')));
const EvaluacionesActas      = Loadable(lazy(() => import('pages/modules/evaluaciones/actas')));
const EvaluacionesCalificar  = Loadable(lazy(() => import('pages/modules/evaluaciones/calificar')));
const EvaluacionesResultados = Loadable(lazy(() => import('pages/modules/evaluaciones/resultados')));
const PremiacionCuadroHonor = Loadable(lazy(() => import('pages/modules/premiacion/cuadro-honor')));
const PremiacionCertificados = Loadable(lazy(() => import('pages/modules/premiacion/certificados')));
const Unauthorized = Loadable(lazy(() => import('pages/unauthorized')));

// render - perfil
const VerPerfil = Loadable(lazy(() => import('pages/perfil/ver')));
const EditarPerfil = Loadable(lazy(() => import('pages/perfil/editar')));

// render - sample page
const SamplePage = Loadable(lazy(() => import('pages/extra-pages/sample-page')));

// ==============================|| MAIN ROUTING ||============================== //

const guard = (code, element) => (
  <PermissionGuard code={code}>{element}</PermissionGuard>
);

const MainRoutes = {
  path: '/',
  element: (
    <AuthGuard>
      <DashboardLayout />
    </AuthGuard>
  ),
  children: [
    { path: '/',             element: <DashboardDefault /> },
    { path: 'dashboard/default', element: <DashboardDefault /> },
    { path: 'typography',    element: <Typography /> },
    { path: 'color',         element: <Color /> },
    { path: 'shadow',        element: <Shadow /> },
    { path: 'sample-page',   element: <SamplePage /> },
    { path: 'unauthorized',  element: <Unauthorized /> },
    {
      path: 'perfil',
      children: [
        { path: 'ver',    element: <VerPerfil /> },
        { path: 'editar', element: <EditarPerfil /> }
      ]
    },
    {
      path: 'usuarios',
      children: [
        { path: 'gestion',  element: guard('usuarios.gestion',  <UsuariosGestion />) },
        { path: 'roles',    element: guard('usuarios.roles',    <UsuariosRoles />) },
        { path: 'perfiles', element: guard('usuarios.perfiles', <UsuariosPerfiles />) }
      ]
    },
    {
      path: 'academico',
      children: [
        { path: 'facultades', element: guard('academico.facultades', <AcademicoCatalogos />) },
        { path: 'areas',      element: guard('academico.areas',      <AcademicoEstructuras />) },
        { path: 'ofertas',    element: guard('academico.ofertas',    <AcademicoOfertas />) }
      ]
    },
    {
      path: 'eventos',
      children: [
        { path: 'gestion',    element: guard('eventos.gestion',    <GestionEventos />) },
        { path: 'cronograma', element: guard('eventos.cronograma', <CronogramaActividades />) },
        { path: 'membretes',  element: guard('eventos.membretes',  <MembretesFirmas />) }
      ]
    },
    {
      path: 'proyectos',
      children: [
        { index: true,           element: <Proyectos /> },
        { path: 'inscripcion',   element: guard('proyectos.inscripcion', <ProyectosInscripcion />) },
        { path: 'revision',      element: guard('proyectos.revision',    <ProyectosRevision />) },
        { path: 'mis-proyectos', element: <MisProyectos /> }
      ]
    },
    {
      path: 'evaluaciones',
      children: [
        { path: 'planillas',  element: guard('evaluaciones.planillas',  <EvaluacionesPlanillas />) },
        { path: 'actas',      element: guard('evaluaciones.actas',      <EvaluacionesActas />) },
        { path: 'calificar',  element: guard('evaluaciones.calificar',  <EvaluacionesCalificar />) },
        { path: 'resultados', element: guard('evaluaciones.resultados', <EvaluacionesResultados />) }
      ]
    },
    {
      path: 'premiacion',
      children: [
        { path: 'cuadro-honor',  element: guard('premiacion.cuadro_honor',  <PremiacionCuadroHonor />) },
        { path: 'certificados',  element: guard('premiacion.certificados',  <PremiacionCertificados />) }
      ]
    }
  ]
};

export default MainRoutes;
