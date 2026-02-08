# WealthFlow - Gestión de Cartera Profesional

**WealthFlow** es una plataforma integral de gestión de patrimonio diseñada para inversores que buscan un control detallado y profesional de sus activos financieros.

## 🚀 Análisis de la Aplicación

La aplicación es un dashboard financiero moderno construido con tecnologías de vanguardia para ofrecer una experiencia de usuario fluida y segura.

### Características Principales
- **Dashboard Holístico**: Visualización clara del patrimonio total, rendimiento y distribución de activos.
- **Gestión de Cartera**: Control detallado de posiciones en diferentes mercados.
- **Calculadora de Rebalanceo**: Herramienta inteligente para ajustar la cartera según objetivos estratégicos.
- **Seguimiento de Favoritos**: Monitorización en tiempo real de activos de interés.
- **Notificaciones Personalizadas**: Alertas sobre movimientos del mercado y actualizaciones de la cartera.
- **Conversor de Divisas**: Herramienta integrada para análisis multi-divisa.

### Stack Tecnológico
- **Frontend**: React 18 con Vite para un desarrollo ultra-rápido.
- **Estilos**: Tailwind CSS para un diseño moderno y responsive.
- **Componentes UI**: Radix UI para accesibilidad y componentes de alta calidad.
- **Animaciones**: Framer Motion para una interfaz viva y elegante.
- **Gráficos**: Recharts para visualización de datos financieros complejos.
- **Backend / Auth**: Supabase para autenticación segura y persistencia de datos.

## 🛠️ Estructura del Proyecto

- `src/components/`: Componentes reutilizables de la interfaz.
- `src/pages/`: Vistas principales (Dashboard, Cartera, Rebalanceo, etc.).
- `src/contexts/`: Gestión de estado global (Autenticación).
- `src/services/`: Integración con servicios externos y APIs.
- `src/lib/`: Utilidades y configuraciones de terceros (Supabase, Tailwind merge).

## 🏃 Cómo Iniciar la Aplicación

Sigue estos pasos para ejecutar la aplicación en tu entorno local (Windows/Mac/Linux):

### 1. Prerrequisitos
Asegúrate de tener instalado **Node.js** (versión 20 o superior recomendada).
- Puedes descargarlo en: [nodejs.org](https://nodejs.org/)
- Verifica la instalación abriendo una terminal y ejecutando:
  ```powershell
  node -v
  npm -v
  ```

### 2. Instalación de Dependencias
Abre tu terminal (PowerShell o CMD en Windows) en la carpeta del proyecto y ejecuta:
```powershell
npm install
```

> **Nota para Windows**: Si `npm install` falla o se queda colgado, intenta ejecutar la terminal como **Administrador** o usa el comando:
> ```powershell
> npm install --legacy-peer-deps
> ```

### 3. Ejecutar el Servidor de Desarrollo
Una vez instaladas las dependencias, inicia el proyecto con:
```powershell
npm run dev
```

### 4. Acceder a la Aplicación
La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

## 🛠️ Solución de Problemas en Windows

Si encuentras errores específicos al iniciar en Windows:

1. **Error: "npm no se reconoce..."**: 
   - Debes instalar Node.js y asegurarte de marcar la opción "Add to PATH" durante la instalación. Reinicia tu terminal después de instalar.

2. **Error: "la ejecución de scripts está deshabilitada..."**:
   - Este es un error de seguridad de PowerShell. Ejecuta este comando para permitir scripts de confianza:
     ```powershell
     Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
     ```

3. **Errores de Permisos (EPERM)**: 
   - Cierra tu editor (VS Code, etc.) y abre la terminal como Administrador para ejecutar `npm install`.

4. **Limpieza de Caché**:
   - Si los errores persisten, borra la carpeta `node_modules` y el archivo `package-lock.json`, luego intenta de nuevo:
     ```powershell
     rm -Recurse -Force node_modules, package-lock.json
     npm install
     ```

---
Desarrollado con ❤️ para inversores inteligentes.
