# Contexto del Sistema UAGRM - EXPOCIENCIA

Este documento recopila toda la información técnica y funcional sobre el **Sistema de Gestión de Proyectos Expociencia de la UAGRM**, estructurado en forma de preguntas y respuestas detalladas. Está diseñado como insumo y contexto completo para ser procesado por herramientas de redacción y generación de documentación formal.

---

## Datos Generales

### ¿Cuál es el nombre oficial del sistema?
El sistema se denomina oficialmente **Sistema de Gestión e Inscripción y Evaluación de Proyectos "Expociencia UAGRM"** (también denominado internamente como **UAGRM EXPOCIENCIA**). En los entornos de configuración de la base de datos y el servidor, el proyecto del backend se identifica como `config` y la base de datos como `bdexpo`.

### ¿El sistema es para Expo Ciencia, feria científica, concursos académicos u otro evento?
El sistema está diseñado específicamente para la feria científica y tecnológica **Expociencia** de la universidad. Está preparado para gestionar el evento en sus diferentes niveles de alcance: **ferias facultativas** (a nivel de cada facultad individual), **ferias interfacultativas** (concurrencia de varias facultades) y la **Expociencia General/Universitaria** (a nivel de toda la universidad). Adicionalmente, gracias a su parametrización (tipos y niveles de eventos, modalidades y áreas), puede adaptarse a otros concursos académicos o evaluaciones de proyectos.

### ¿Qué institución lo usará exactamente?
La **Universidad Autónoma Gabriel René Moreno (UAGRM)**, con sede en la ciudad de Santa Cruz de la Sierra, Bolivia, involucrando a todas las facultades anexas a la universidad. El sistema será controlado y administrado principalmente por la **Dirección de Investigación, Ciencia, Innovación y Tecnología (DICyT)**, aunque su alcance de uso y aplicación se extiende de manera transversal a toda la comunidad universitaria de la UAGRM.

### ¿Quiénes son los usuarios principales del sistema?
El sistema cuenta con un ecosistema de usuarios clasificados en los siguientes perfiles:
1. **Administrador (Comité Organizador / Coordinadores)**: Controla toda la plataforma, aprueba proyectos, diseña rúbricas, asigna tribunales, resuelve empates y genera certificados.
2. **Tribunales (Jurados / Evaluadores)**: Profesionales y docentes encargados de evaluar las defensas de los proyectos.
3. **Participantes (Estudiantes)**: Postulan sus proyectos cargando resúmenes y archivos adjuntos.
4. **Tutores (Docentes Guías)**: Vinculados como mentores metodológicos o científicos del proyecto.
5. **Personal de Autoridad (Rector, Vicerector, Decano, Vicedecano, Secretaria)**: Registrados institucionalmente para actuar como firmantes autorizados en los certificados oficiales.

### ¿El sistema ya está desarrollado, está en prototipo o solo es propuesta?
El sistema está **completamente desarrollado, integrado y funcional**. Se dispone de la base de datos PostgreSQL, el backend en Django con API GraphQL, el frontend web administrativo en React (basado en el tema Mantis Dashboard) y la aplicación móvil nativa en Flutter para los evaluadores.

### ¿El sistema será web, móvil o ambos?
Es una plataforma **híbrida (ambos)**:
* **Web (React + Django)**: Utilizada por administradores para toda la gestión logística, por estudiantes para la inscripción de proyectos, y por autoridades para la configuración y descarga de certificados.
* **Móvil (Flutter)**: Diseñada específicamente para el rol de **Tribunal**, permitiendo a los jurados loguearse desde su smartphone, listar los proyectos asignados, descargar el documento del proyecto y rellenar las rúbricas numéricas directamente durante la exposición presencial.

### ¿Cuál es el objetivo principal del software en una frase?
> "Automatizar de manera centralizada e integral los procesos de inscripción, aprobación, evaluación numérica móvil, cálculo automatizado de ganadores con resolución de empates, y generación de certificados digitales para la feria científica Expociencia de la UAGRM."

---

## Problema

### ¿Cómo se realiza actualmente el proceso sin el sistema?
El proceso tradicional se lleva a cabo mediante formularios en papel impreso, recepción física de carpetas y documentos de proyectos en las oficinas, almacenamiento en archivadores físicos, transcripción manual de los datos a hojas de cálculo de Microsoft Excel y consolidación física de calificaciones firmadas por los jurados.

### ¿Qué partes son manuales?
* El llenado y recepción de formularios de inscripción física y cartas de aval del tutor.
* La verificación visual de que los integrantes pertenezcan a la carrera y cumplan los requisitos.
* La asignación de carpetas y proyectos a los jurados según su especialidad.
* El llenado de la planilla física de criterios de evaluación durante las exposiciones.
* La entrega de planillas a la mesa de control, la transcripción manual de las notas y el cálculo de promedios en Excel.
* La resolución verbal/manual de empates en las actas de ganadores.
* El llenado manual de nombres, títulos de proyectos y posiciones en plantillas impresas de certificados.
* La distribución y desglose del dinero en efectivo de los premios a cada estudiante del equipo.

### ¿Qué errores o problemas ocurren actualmente?
* **Pérdida de documentación**: Pérdida o daño físico de los proyectos impresos y sus soportes.
* **Errores de cálculo**: Errores aritméticos al promediar manualmente las calificaciones de múltiples tribunales o al calcular las ponderaciones de las rúbricas.
* **Duplicaciones**: Asignación accidental de un mismo jurado a dos proyectos que exponen a la misma hora en lugares diferentes.
* **Fallas de ortografía**: Nombres y apellidos mal transcritos en los certificados físicos de los participantes, obligando a reimpresiones costosas.
* **Falta de transparencia**: Dificultad para auditar de forma inmediata cómo y por qué un jurado colocó una determinada puntuación en un criterio.

### ¿Quiénes pierden más tiempo con el proceso actual?
El **Comité Organizador**, que invierte horas (e incluso días) transcribiendo notas, promediando datos y revisando empates al final del evento bajo una gran presión de tiempo. También los **estudiantes y tribunales**, que deben hacer filas físicas para entregar documentos y planillas de notas.

### ¿Qué información se pierde, duplica o calcula mal?
* Las notas ponderadas de las secciones de evaluación.
* Los datos de filiación de los alumnos (nombres, registros de carrera, planes de estudio).
* El registro exacto de qué tribunales evaluaron a qué proyectos específicos y en qué rangos de hora.
* El desglose y firma de recepción de los montos económicos de los premios.

### ¿Qué consecuencias tiene no contar con el sistema?
* Retraso masivo en la publicación de resultados de ganadores (a veces declarados días después del cierre de la feria).
* Pérdida de credibilidad en el evento debido a posibles errores humanos en la transcripción de notas.
* Alto costo en papelería, impresión de certificados erróneos y distribución ineficiente de tareas de evaluación.
* Dificultades para realizar un seguimiento histórico de proyectos sobresalientes de gestiones pasadas.

---

## Usuarios y Roles

### ¿Qué roles existen en el sistema?
* **Administrador / Superadministrador**
* **Tribunal (Jurado)**
* **Participante (Estudiante)**
* **Tutor (Docente)**
* **Personal (Autoridades Administrativas / Secretaria)**

### ¿Qué puede hacer cada rol?
* **Administrador**: Configura los catálogos del sistema (carreras, facultades, áreas académicas); define el calendario y cronograma de eventos; aprueba o rechaza los proyectos inscritos; asigna tribunales a los proyectos; define las planillas de evaluación con secciones y criterios ponderados; concede permisos especiales para calificaciones tardías; ejecuta el cierre de actas con cálculo automático de ganadores; divide los premios monetarios; y emite/imprime los certificados oficiales.
* **Tribunal**: Inicia sesión (Web/Móvil), visualiza las fichas de los proyectos en los que fue asignado como jurado, descarga el documento de respaldo del proyecto, ingresa las calificaciones numéricas correspondientes a cada criterio de evaluación y confirma el envío de su nota.
* **Participante**: Registra proyectos científicos seleccionando la oferta académica de su carrera; introduce los datos de los integrantes del equipo y sus tutores; sube el archivo digital del proyecto; y hace seguimiento de si su proyecto fue aceptado, evaluado o galardonado.
* **Tutor**: Vinculado a los proyectos científicos y de grado para figurar como mentor oficial en actas y certificados.
* **Personal**: Registrado como firmante autorizado en el sistema de membretes para validar visualmente los certificados oficiales del evento.

### ¿Quién registra a los usuarios?
* El **Administrador** registra de forma directa a los Tribunales, Personal Administrativo y otros administradores a través del panel de control web.
* Los **Participantes** y **Tutores** son registrados automáticamente por el sistema cuando un estudiante realiza el flujo de inscripción de su proyecto, creando cuentas de usuario asociadas en base a sus números de Cédula de Identidad (CI).

### ¿Los estudiantes se registran solos o los registra un administrador?
Se registran a través del flujo de inscripción de proyectos. La persona que inscribe el proyecto puede agregar a sus compañeros de equipo (integrantes) y al docente tutor. Si estos usuarios no existen en el sistema, el software crea automáticamente sus perfiles y sus cuentas de autenticación basadas en sus respectivos números de CI (utilizados como usuario y contraseña inicial).

### ¿Los tribunales usan una app móvil o también pueden usar la web?
**Ambas opciones están disponibles**. Los tribunales pueden ingresar a la web para ver su perfil y calificar, pero disponen de una aplicación móvil nativa (Flutter) diseñada para que califiquen cómodamente desde sus teléfonos celulares durante las defensas en vivo en los stands de la feria.

### ¿Existe un superadministrador?
Sí, el sistema está construido sobre el modelo de autenticación estándar de Django (`AbstractUser`). El primer usuario creado mediante consola (`python manage.py createsuperuser`) posee permisos globales absolutos y administra las tablas del sistema.

### ¿Hay permisos diferentes por carrera, facultad, evento o categoría?
Sí, el sistema web restringe el acceso a las vistas operativas mediante directivas basadas en códigos de permisos específicos (ej. `usuarios.gestion`, `evaluaciones.planillas`, `premiacion.certificados`) a través de un componente `PermissionGuard`. Adicionalmente, los proyectos, jurados y premios están clasificados según su carrera, facultad, área y evento para evitar cruces.

---

## Funcionalidades Principales

### ¿El sistema permite registrar eventos o ferias?
Sí, el módulo de Gestión de Eventos permite crear ferias científicas asociándoles un nombre, versión de edición (ej. v1, v2) y año de gestión.

### ¿Permite registrar proyectos?
Sí, en el portal de inscripción web se recopila título, resumen, archivo de proyecto y vinculaciones a integrantes y tutores.

### ¿Permite registrar estudiantes/participantes?
Sí, recopilando sus nombres, CI, expedición de documento, celular, código/registro universitario, correo electrónico y si es un participante externo de otra institución.

### ¿Permite registrar tutores/docentes?
Sí, registrando nombres, CI, expedición, celular, dirección, correo y su código de empleado docente.

### ¿Permite asignar tribunales a proyectos?
Sí, el administrador puede asignar múltiples tribunales a un proyecto en el panel web. Al hacerlo, el backend genera automáticamente las celdas de calificación asociadas a cada tribunal en el acta del proyecto.

### ¿Permite calificar proyectos?
Sí, los jurados ingresan sus notas numéricas criterio por criterio desde la web o la app móvil.

### ¿Cómo se calculan los ganadores?
Al pulsar "Cerrar Acta de Resultados" de una oferta académica, el backend Django realiza un cálculo automático:
1. Obtiene las actas de evaluación de los proyectos de la oferta.
2. Calcula la nota final promediando los totales entregados por cada jurado asignado.
3. Ordena los proyectos de mayor a menor nota.
4. Asigna los premios configurados (1er, 2do y 3er lugar) a los proyectos con las notas más altas de forma secuencial.
5. Si detecta un empate en el promedio del primer lugar u otras posiciones premiadas, el sistema detiene el proceso automático de asignación y genera registros de **Candidatos** empatados para que el administrador resuelva el desempate de manera manual y justa.

### ¿Genera certificados?
Sí, emite certificados basados en plantillas personalizadas.

### ¿Genera reportes?
Sí, genera rankings de ganadores, actas de evaluación completas y reportes financieros del desglose de dinero de los premios.

### ¿Tiene panel/dashboard?
Sí, cuenta con un dashboard moderno e interactivo (basado en el tema Mantis React y Material UI) que muestra estadísticas de proyectos, usuarios y estados.

### ¿Tiene notificaciones?
Sí, el sistema está integrado con **Firebase Cloud Messaging (FCM)** en el backend (`fcm.py`). Envía notificaciones push automáticas a la aplicación móvil del Tribunal cuando el administrador le asigna un nuevo proyecto de evaluación.

### ¿Permite subir archivos, imágenes, documentos o evidencias?
Sí, los estudiantes suben los documentos de sus proyectos (formatos PDF, DOC, DOCX) y los administradores cargan imágenes de logos institucionales, firmas digitales y sellos de autoridad en el módulo de Membretes.

### ¿Permite exportar datos a PDF, Excel o Word?
Sí, cuenta con vistas de impresión HTML/CSS altamente detalladas y limpias que abren el diálogo nativo del sistema operativo (`window.print()`), permitiendo la impresión física directa o el guardado en formato PDF de certificados y comprobantes de premios.

### ¿Tiene búsqueda y filtros?
Sí, dispone de barras de búsqueda y selectores para filtrar proyectos por título, estado de revisión, oferta académica, fecha e historial de evaluaciones.

### ¿Tiene historial o bitácora de acciones?
Sí, el backend mantiene las evaluaciones históricas y los cambios de estado de los proyectos y las asignaciones de premios.

---

## Registro de Proyectos

### ¿Qué datos se registran de cada proyecto?
Título, resumen o abstract del proyecto, fecha y hora de inscripción automática, archivo de respaldo (documentación del proyecto), oferta académica (carrera y plan de estudio), integrantes del equipo, y tutores.

### ¿El proyecto pertenece a una carrera, facultad, categoría o área?
Sí, el proyecto se inscribe en una `OfertaEaCarrera`, la cual enlaza:
* **Entidad Académica (Facultad)** (ej. Facultad de Ciencias de la Computación y Telecomunicaciones).
* **Carrera** (ej. Ingeniería de Sistemas).
* **Oferta Académica** que a su vez se enlaza a un **Área Académica** (ej. Desarrollo de Software) y una **Modalidad** (ej. Proyecto de Grado / Feria Científica).

### ¿Cuántos integrantes puede tener un proyecto?
El sistema permite agregar múltiples integrantes de manera dinámica mediante el botón "Agregar" en el paso 2 del wizard de inscripción. La relación en la base de datos es de muchos a muchos (`ManyToManyField`).

### ¿Cada proyecto tiene tutor?
Sí, en el paso final de la inscripción se asocia obligatoriamente uno o más tutores académicos.

### ¿Hay límite de inscripción?
Sí, el período de inscripción está estrictamente regulado por las fechas de inicio y fin configuradas en el `Cronograma` de actividades del Evento. Si un estudiante intenta inscribirse fuera de este rango de fechas, el sistema bloquea el avance del formulario web.

### ¿Se valida el proyecto antes de aceptarlo?
Sí, al inscribirse, el proyecto se guarda con el estado de `revision`. El comité organizador revisa el título, la descripción y el documento adjunto y decide si lo aprueba (pasa a `aprobado`) o lo rechaza (pasa a `rechazado`). Solo los proyectos en estado `aprobado` pueden ser evaluados por los tribunales.

### ¿Quién aprueba o rechaza un proyecto?
El **Administrador** o coordinador autorizado del comité a través del panel de "Revisión y Aprobación" del sistema web.

### ¿El sistema maneja estados? Ejemplo: registrado, observado, aprobado, evaluado, ganador.
Sí, los proyectos manejan los estados de ciclo de vida: `revision`, `aprobado` y `rechazado`.
A nivel de premiación, los proyectos postulados manejan los estados: `candidato`, `ganador` y `descartado`.

---

## Evaluación

### ¿Qué criterios usa el tribunal para evaluar?
El administrador define los criterios en planillas de evaluación dinámicas. Ejemplos de criterios comunes en Expociencia incluyen: originalidad del proyecto, calidad de la exposición oral, prototipo o software funcional, orden metodológico del documento escrito y viabilidad social/económica.

### ¿Los criterios tienen puntajes?
Sí, cada criterio tiene un puntaje numérico máximo de referencia (ej. 10 puntos, 15 puntos, etc.).

### ¿Todos los criterios valen igual o tienen ponderación?
Se agrupan en **Secciones** (ej. Exposición 40%, Documento 20%, Prototipo 40%). La suma de ponderaciones de las secciones debe totalizar exactamente el 100% de la nota máxima de la planilla (normalmente 100 puntos). Los sub-criterios de cada sección se configuran con puntajes que sumados alcancen el valor máximo de la sección ponderada.

### ¿La evaluación es numérica, por rúbrica o ambos?
Es una **evaluación numérica basada en criterios explícitos**. El jurado otorga a cada criterio una nota de 0 al puntaje máximo permitido para ese criterio.

### ¿Cada proyecto es evaluado por cuántos tribunales?
El sistema admite asignación múltiple. Un proyecto comúnmente es evaluado por un panel de **3 jurados**, aunque el administrador puede asignar más o menos según el caso.

### ¿El sistema promedia las notas?
Sí, el sistema suma las calificaciones individuales en los criterios de cada jurado para obtener su nota total. Luego, la `nota_final` del proyecto se calcula como el promedio matemático simple de los totales entregados por todos los tribunales asignados en el acta de evaluación.

### ¿Qué pasa si dos proyectos empatan?
Si dos proyectos obtienen el promedio de nota más alto durante el cierre de resultados, el backend detiene el algoritmo de asignación de premios de esa categoría y los deja marcados en el estado de `candidato` para empate. El administrador debe resolverlo de forma manual en el panel de control antes de confirmar los ganadores definitivos.

### ¿El tribunal puede editar una calificación después de enviarla?
**No**. Una vez que el tribunal envía la calificación, el estado de su evaluación cambia y la interfaz web/móvil bloquea la edición de notas. Si hay un error, el tribunal debe solicitar al administrador un **permiso de calificación tardía**, el cual desactiva temporalmente el bloqueo para permitir una única corrección.

### ¿El administrador puede ver las calificaciones en tiempo real?
Sí, el panel de actas web le muestra al administrador la barra de progreso de jurados calificados (ej. 2/3 jurados listos) y las puntuaciones detalladas a medida que los tribunales envían sus notas.

### ¿Los estudiantes pueden ver sus resultados?
Sí, una vez publicadas las actas de resultados por el administrador, las notas finales se hacen públicas en el portal web de los participantes.

---

## Premiación

### ¿Cómo se define al ganador?
Los ganadores son los proyectos que obtienen las promedios más altos (nota final) de cada carrera/modalidad y son confirmados por el administrador al cerrar las actas del evento.

### ¿Hay ganadores por categoría, carrera, facultad o evento general?
Los premios se definen por **Oferta Académica**, la cual vincula un Evento particular con una Carrera y Área Académica específicas. Por lo tanto, hay ganadores individuales por carrera/área y categorías.

### ¿Hay primer, segundo y tercer lugar?
Sí, el sistema clasifica las posiciones de los premios correspondientes a los puestos 1, 2 y 3.

### ¿Hay menciones especiales?
Sí, a través de los Descriptores que se asocian a las plantillas de premios (ej. Mención Honrosa, Proyecto con Mayor Impacto Social, etc.).

### ¿El sistema genera ranking?
Sí, el módulo de cuadro de honor calcula y despliega el ranking consolidado en orden descendente de promedios para todas las carreras.

### ¿El sistema bloquea cambios después de publicar ganadores?
Sí, una vez declarado un ganador y creada su vinculación oficial a un premio, los cambios en las actas de notas se bloquean por motivos de seguridad informática e integridad de datos.

### ¿Quién publica los resultados?
El **Administrador** del sistema al dar clic en la confirmación de ganadores del cuadro de honor.

---

## Certificados

### ¿Qué tipos de certificados genera?
* **Certificado de Ganador**: Para los integrantes y tutores del proyecto galardonado.
* **Certificado de Participante**: Para todos los estudiantes inscritos con proyectos aprobados.
* **Certificado de Tribunal**: Para el docente evaluador.
* **Certificado de Tutor**: Para el mentor metodológico.

### ¿Los certificados tienen código QR?
Actualmente **no cuentan con código QR para la validación pública**. El diseño se basa en un maquetado limpio de HTML impreso. (Los códigos QR existentes en el sistema se usan solo para la autenticación de dos factores del usuario).

### ¿Los certificados pueden verificarse en línea?
No en la versión actual. La verificación se realiza de manera administrativa mediante el registro interno único de certificados en la base de datos de PostgreSQL.

### ¿Qué datos aparecen en el certificado?
* **Logos y firmas digitales**: Del rector, vicerector o decano según se haya configurado el membrete.
* **Cuerpo de texto dinámico**: Que resuelve variables especiales:
  * `{{Nombre_Proyecto}}`: Nombre del proyecto inscrito.
  * `{{Lugar}}`: Posición obtenida (1er Lugar, 2do Lugar...).
  * `{{Descriptor}}`: Descripción del premio.
  * `{{Oferta}}`: Carrera o catálogo académico.
  * `{{Area}}`: Área de especialidad.
  * `{{Evento}}`: Nombre del evento científico.
  * `{{Nota}}`: Nota de calificación.
  * `{{Monto}}`: Premio económico (si corresponde).
  * `{{Participantes}}`: Integrantes del equipo.
  * `{{Tutores}}`: Nombres de los docentes guías.
* **Fecha de emisión** y **sello digital** de la autoridad.

### ¿Se generan automáticamente o manualmente?
Se generan de manera **semiautomatizada**. El administrador selecciona la plantilla que desea utilizar y el sistema resuelve automáticamente todas las variables del ganador en el lienzo HTML.

### ¿Se descargan en PDF?
Sí, al presionar el botón de imprimir, se genera una salida CSS estructurada en tamaño A4 (horizontal o vertical) que permite al usuario guardarla directamente como PDF en su computadora o imprimirla físicamente.

---

## Tecnologías

### ¿Cuáles son las herramientas tecnológicas detalladas del proyecto?
Para el desarrollo del presente proyecto se utilizaron las siguientes herramientas tecnológicas:
* **Python**: Lenguaje de programación dinámico utilizado para el desarrollo del backend.
* **Django**: Framework web de alto nivel utilizado para la construcción y estructuración del backend del sistema.
* **Graphene-Django**: Herramienta utilizada para la implementación y exposición del esquema de la API GraphQL en el backend.
* **React**: Biblioteca de interfaz de usuario utilizada para el desarrollo del frontend web del sistema.
* **Vite**: Herramienta utilizada para la configuración y ejecución rápida del entorno de desarrollo frontend.
* **Material UI (MUI)**: Librería utilizada para el diseño de componentes visuales modernos en la plataforma web.
* **Dart**: Lenguaje de programación compilado utilizado para el desarrollo de la aplicación móvil.
* **Flutter**: Framework de UI multiplataforma utilizado para el desarrollo de la app móvil destinada a los Tribunales.
* **PostgreSQL**: Sistema gestor de base de datos relacional utilizado para el almacenamiento de la información de manera segura.
* **Apollo Client**: Cliente GraphQL utilizado para gestionar la comunicación y caché de datos entre el frontend web y la API GraphQL.
* **graphql_flutter**: Cliente GraphQL utilizado para la comunicación en la aplicación móvil Flutter con el backend.
* **Git y GitHub**: Herramientas y plataforma utilizadas para el control de versiones y almacenamiento remoto del código fuente.
* **Visual Studio Code / Android Studio**: Entornos de desarrollo integrado (IDE) utilizados para la programación y depuración de los componentes del sistema.


### ¿Qué lenguaje/framework usa el frontend web?
**React 19** con **Vite** como servidor de desarrollo y empaquetador, estructurado mediante componentes de **Material UI (MUI)**.

### ¿Qué lenguaje/framework usa el backend?
**Python** con **Django 6.0.5**, implementando arquitectura basada en aplicaciones modularizadas.

### ¿Qué tecnología usa la app móvil?
**Flutter** en su última versión estable, compilando de forma nativa para plataformas móviles Android e iOS.

### ¿Qué base de datos usa?
**PostgreSQL** (configurada en el puerto 5432 con codificación UTF-8, base de datos local `bdexpo`).

### ¿Usa API REST, GraphQL u otra?
Consumo completo mediante **GraphQL**. El backend expone un endpoint único `/graphql/` desarrollado con **Graphene Django** y el frontend lo consume mediante el cliente de **Apollo Client**.

### ¿Usa autenticación con JWT, sesiones, OAuth u otro método?
Autenticación basada en **JWT (JSON Web Tokens)** en las cabeceras HTTP mediante el backend de `django-graphql-jwt`. Las contraseñas se almacenan con hashing seguro.

### ¿Dónde se desplegará?
Despliegue inicial en red de desarrollo local (servidor de desarrollo del backend en puerto 8000 e IP del host en red local Wi-Fi para conexión del celular). Posteriormente, desplegado en servidores IIS/Apache/Nginx o VPS corporativo en la nube de la universidad.

### ¿Qué servidor web usa?
Servidores embebidos para desarrollo (Django runserver / Vite dev server) y servidores web tradicionales (Nginx o Gunicorn) para entornos productivos.

### ¿Usa Docker?
No de forma predeterminada, pero la separación de capas facilita su dockerización en contenedores independientes de backend, frontend y base de datos.

### ¿Usa Git/GitHub/GitLab?
Sí, control de versiones mediante Git.

### ¿Usa alguna librería para PDF, reportes, QR o certificados?
* **Backend**: `Pillow` para procesamiento y compresión de logos de membretes y firmas digitales de firmantes autorizados; `pyotp` y `qrcode` en el backend para la generación de secretos TOTP y renders de autenticación 2FA.
* **Frontend**: `@apollo/client` para peticiones de red GraphQL, `@mui/material` para la interfaz visual, e impresión nativa web (`window.print`).
* **Mobile**: `graphql_flutter` para el cliente móvil GraphQL y `flutter_secure_storage` para persistencia del token de sesión JWT.

---

## Arquitectura

### ¿El sistema está separado en frontend, backend y base de datos?
Sí, sigue una arquitectura desacoplada de 3 capas. El frontend web y la aplicación móvil consumen servicios del backend de forma independiente de la base de datos PostgreSQL.

### ¿La app móvil consume la misma API que la web?
Sí, ambas aplicaciones comparten las mismas consultas (`Queries`) y mutaciones (`Mutations`) expuestas en el servidor GraphQL.

### ¿Hay panel administrativo separado?
No hay una aplicación separada; el panel administrativo está integrado en la misma aplicación web web React, protegido contra usuarios no autorizados por tokens JWT y roles verificados.

### ¿Qué módulos principales tiene el sistema?
1. **Seguridad e Identidad**: Autenticación 2FA TOTP obligatoria, roles y gestión fina de permisos.
2. **Académico**: Catálogo de facultades, carreras, planes de estudio, áreas y modalidades de proyectos.
3. **Eventos y Logística**: Creación de ferias, cronogramas por actividad y membretes oficiales con firmas.
4. **Proyectos y Registro**: Formulario de inscripción secuencial, carga de archivos y validación del comité.
5. **Evaluaciones**: Diseño de rúbricas, asignación de jurados y envío de notas (Web y App móvil).
6. **Premiación y Certificados**: Cuadros de honor, rankings automáticos, división de premios y plantillas HTML de impresión.

### ¿Cómo se comunican los módulos?
Se comunican en el backend por medio del ORM de Django (relaciones de base de datos) y en el frontend a través de Apollo Client realizando peticiones GraphQL en red.

### ¿El sistema funciona solo con internet o también offline?
Requiere conexión en red de datos (red local interna o internet) para interactuar con la base de datos centralizada de PostgreSQL.

---

## Base de Datos

### ¿Cuáles son las tablas o entidades principales?
* `usuario` (Tabla centralizada de autenticación).
* `roles`, `permiso`, `roles_permiso`, `roles_permiso_usuario` (Seguridad).
* `participante`, `tutor`, `tribunal`, `personal` (Perfiles vinculados).
* `entidad_academica`, `area`, `modalidad`, `oferta`, `oferta_ea_carrera` (Área Académica).
* `evento`, `membrete`, `firmante`, `cronograma` (Configuración de Eventos).
* `proyecto` (Datos principales de proyectos).
* `planilla_evaluativa`, `seccion`, `criterio`, `acta_evaluacion`, `detalle_evaluacion`, `puntuacion_criterio` (Evaluación).
* `premio`, `candidato_premio`, `ganador_premio`, `plantilla`, `certificado`, `asignacion_premio` (Módulo de Premiación).

### ¿Qué relaciones principales existen?
* **Usuario (1:1) Perfiles**: Cada usuario tiene un único perfil de Estudiante, Jurado, Autoridad o Tutor.
* **Proyecto (M:N) Participantes / Tutores / Tribunales**: Permite múltiples integrantes y múltiples evaluadores asignados.
* **Proyecto (N:1) OfertaEaCarrera**: Un proyecto pertenece a una carrera y plan de estudio habilitados.
* **ActaEvaluacion (N:1) Proyecto / PlanillaEvaluativa**: Registra las notas del proyecto en base a una rúbrica.
* **DetalleEvaluacion (N:1) ActaEvaluacion / Tribunal**: Notas individuales de cada jurado por proyecto.

### ¿Se guarda historial de evaluaciones?
Sí, las notas criterio por criterio de cada jurado quedan grabadas de forma permanente en las tablas relacionales de la base de datos.

---

## Seguridad

### ¿Cómo inicia sesión el usuario?
El usuario introduce su nombre y contraseña. Si no ha configurado el **doble factor de autenticación (2FA)**, el sistema web le despliega en un stepper un **código QR único** que debe escanear con su aplicación móvil (ej. Google Authenticator o Authy) para registrar el secreto TOTP de 6 dígitos. Una vez validado por primera vez o si ya estaba registrado, debe ingresar el código dinámico de 6 dígitos para obtener su token JWT y acceder al panel.

### ¿Las contraseñas están encriptadas?
Sí, hasheadas de forma unidireccional en el backend mediante algoritmos de seguridad de Django.

### ¿El sistema valida acceso por token o sesión?
Valida el acceso por medio de **Tokens JWT** (vigencia predeterminada de 1 día) enviados en las cabeceras HTTP de cada petición GraphQL.

### ¿Hay recuperación de contraseña?
Sí, el administrador puede reestablecer las contraseñas de acceso de los alumnos o jurados de manera manual en el panel de usuarios.

---

## Requisitos Funcionales y No Funcionales

### Requisitos Funcionales Clave
* Inscripción web guiada de proyectos.
* Aprobación de proyectos y control de fechas límite de inscripción basadas en cronogramas activos.
* Creación parametrizada de rúbricas de evaluación con secciones ponderadas sobre el 100%.
* Aplicación móvil nativa para que los tribunales califiquen mediante scrolls de puntuaciones.
* Cierre automático de actas de ganadores con detención inteligente ante empates para resolución manual del administrador.
* División monetaria de premios con bloqueo de edición una vez impreso el comprobante.
* Diseñador de certificados con placeholders variables y soporte para orientaciones horizontal y vertical.

### Requisitos No Funcionales Clave
* **Usabilidad**: Diseño responsivo, estético y minimalista.
* **Disponibilidad**: Funcionamiento estable durante los días de exposición presencial de la feria Expociencia.
* **Concurrencia**: Capacidad de procesamiento simultáneo de promedios para cientos de jurados y alumnos.
* **Seguridad**: Autenticación 2FA TOTP obligatoria para accesos seguros y control estricto de roles.

---

## Metodología y Pruebas

### ¿Qué metodología usaron o quieren declarar?
Se declara el uso de una metodología híbrida basada en **Agile (Scrum + XP)**, estructurando el avance en sprints de desarrollo de 2 semanas y priorizando la simplicidad del código y pruebas tempranas.

### ¿Cuántos sprints hubo?
El desarrollo se planificó en **4 Sprints** de entrega:
1. **Sprint 1**: Diseño de base de datos, backend Django y módulo de autenticación 2FA.
2. **Sprint 2**: Módulo académico, inscripción web de proyectos y gestión de cronogramas.
3. **Sprint 3**: Rúbricas de evaluación y desarrollo de la app móvil Flutter para tribunales.
4. **Sprint 4**: Cierre de actas de ganadores, división de premios y generación de certificados.

### ¿Qué pruebas realizaron?
* Pruebas de APIs GraphQL del backend Django para garantizar el correcto envío de mutaciones.
* Pruebas unitarias de perfiles (`test_perfiles.py`) para validar que las entidades relacionales se creen sin pérdida de datos.
* Pruebas piloto del cálculo matemático de notas y resolución de empates en las actas.
* Pruebas de usabilidad en dispositivos físicos con la APK de Flutter para comprobar el rendimiento en red local.

---

## Datos Para Personalizar El Documento

* **Nombre completo del proyecto**: Sistema de Gestión e Inscripción y Evaluación de Proyectos "Expociencia UAGRM".
* **Nombre de los estudiantes/autores**: Cristian Velez y colaboradores.
* **Carrera**: Ingeniería de Sistemas / Ingeniería Informática.
* **Facultad**: Facultad de Ciencias de la Computación y Telecomunicaciones (FICCT).
* **Materia**: Proyecto de Grado / Taller de Licenciatura.
* **Gestión/Año**: 2026.
* **Ciudad y País**: Santa Cruz de la Sierra, Bolivia.
* **Nombre correcto de la universidad**: Universidad Autónoma Gabriel René Moreno (UAGRM).
* **Unidad beneficiaria**: Dirección de Investigación, Ciencia, Innovación y Tecnología (DICyT), y la UAGRM en general con todas sus facultades anexas.
