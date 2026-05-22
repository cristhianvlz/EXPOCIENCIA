# Guía de Instalación y Requerimientos

Este documento detalla los pasos necesarios para instalar y ejecutar el proyecto (Frontend y Backend) en otra PC desde cero.

## 1. Requisitos Previos Generales
- **Git:** Para descargar o clonar el repositorio.
- **Node.js:** (Versión recomendada 18 o superior) para ejecutar el frontend.
- **Yarn:** Gestor de paquetes configurado en el proyecto (usando Yarn 4.12.0). Se instala globalmente con `npm install -g yarn` si no lo tienes.
- **Python:** (Versión recomendada 3.10 o superior) para el backend.
- **PostgreSQL:** (Opcional/Requerido dependiendo de tu `settings.py`). El backend tiene `psycopg2` instalado, lo que indica que se conecta a PostgreSQL.

---

## 2. Configuración del Backend (Django)

1. **Abrir la terminal en la carpeta del backend:**
   ```bash
   cd backend
   ```

2. **Crear un Entorno Virtual:**
   Para aislar las dependencias del proyecto y evitar conflictos globales (aquí es donde se instalarán dependencias como `pillow`, `graphene-django`, etc.):
   ```bash
   python -m venv venv
   ```

3. **Activar el Entorno Virtual:**
   - En Windows (PowerShell/CMD):
     ```bash
     .\venv\Scripts\activate
     ```
   - En macOS / Linux:
     ```bash
     source venv/bin/activate
     ```

4. **Instalar Dependencias:**
   Se ha generado un archivo `requirements.txt` con todas las librerías necesarias. Ejecuta:
   ```bash
   pip install -r requirements.txt
   ```
   *(Esto instalará todas las dependencias requeridas como `Django`, `Pillow`, `graphene-django`, `django-graphql-jwt`, `psycopg2-binary`, etc.)*

5. **Configurar la Base de Datos:**
   Asegúrate de que tus variables de entorno o la configuración de base de datos en `backend/config/settings.py` apunten a tu instancia local (si usan PostgreSQL, asegúrate de crear la base de datos).

6. **Aplicar Migraciones:**
   Sincroniza la base de datos con los modelos del sistema:
   ```bash
   python manage.py migrate
   ```

7. **Crear un Superusuario (Opcional pero recomendado para pruebas):**
   ```bash
   python manage.py createsuperuser
   ```

8. **Ejecutar el Servidor de Desarrollo:**
   ```bash
   python manage.py runserver
   ```
   El backend se ejecutará por defecto en `http://127.0.0.1:8000/`.

---

## 3. Configuración del Frontend (React + Vite)

1. **Abrir otra terminal en la carpeta del frontend:**
   ```bash
   cd frontend
   ```

2. **Instalar Dependencias:**
   Dado que el proyecto está configurado para usar Yarn (versión 4+), el comando recomendado para descargar todos los paquetes de React y Material UI es:
   ```bash
   yarn install
   ```

3. **Configurar Variables de Entorno (.env):**
   Asegúrate de revisar el archivo `.env` en la carpeta `frontend`. Es probable que necesites verificar que las URLs del backend estén apuntando a `http://127.0.0.1:8000/graphql` para entorno local.

4. **Ejecutar el Servidor de Desarrollo (Vite):**
   ```bash
   yarn start
   ```
   El frontend se levantará y podrás verlo en tu navegador (la terminal te mostrará el enlace, usualmente `http://localhost:5173/`).
