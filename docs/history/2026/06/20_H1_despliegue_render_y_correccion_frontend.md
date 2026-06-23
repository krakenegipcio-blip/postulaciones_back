# Historial de Cambios: 20 de Junio de 2026 (H1)
**Título:** Resolución de errores de despliegue en Render y adaptación de Frontend

## Resumen de la Tarea
El objetivo principal era resolver un fallo de despliegue (`MODULE_NOT_FOUND`) en Render para el backend (`postulaciones_back`) y redirigir el frontend (`postulaciones_analisis_final`) para que consuma la API desplegada en lugar del entorno local.

## Problemas Identificados y Solucionados

### 1. Fallo de Compilación en Render (`MODULE_NOT_FOUND`)
- **Causa original:** Render no ejecutaba la compilación de TypeScript antes de intentar arrancar la aplicación, por lo que la carpeta `dist` no existía.
- **Solución inicial:** Se añadió el script `"render-build": "npm install && npm run build"` en el `package.json` para definir un *Build Command* adecuado.
- **Causa subyacente (TypeScript & Node 24):** Al intentar compilar, el servidor fallaba debido a que la opción `moduleResolution: "node"` fue deprecada en TypeScript 6.
- **Solución final:** Se actualizó `tsconfig.json` para usar `"moduleResolution": "NodeNext"` y `"module": "NodeNext"`.
- **Corrección de Tipos (Express 5):** Se resolvieron errores de tipado en `src/routes/catalogs.ts` causados por Express 5 (donde `req.params` puede ser `string | string[]`), asegurando que las variables se interpretaran como `string`.

### 2. Configuración de CORS y Cookies para Producción
- **CORS Estático:** El backend solo permitía peticiones de `http://localhost:5173`.
- **Solución:** Se implementó CORS dinámico en `src/index.ts` que permite el origen definido en la variable de entorno `FRONTEND_URL`.
- **Cookies Bloqueadas (Cross-Origin):** Las cookies JWT estaban configuradas como `sameSite: 'strict'`, lo cual bloquea la sesión cuando el front y el back están en distintos dominios.
- **Solución:** Se ajustó `src/routes/auth.ts` para que, en producción (`NODE_ENV === 'production'`), las cookies usen `sameSite: 'none'` y `secure: true`.

### 3. Redirección del Frontend a Producción
- **URLs Hardcodeadas:** Varios archivos del frontend tenían peticiones apuntando directamente a `http://localhost:3001`.
- **Solución:** Se refactorizaron `src/store/authStore.ts`, `src/pages/LoginPage.tsx` y `src/pages/RegisterPage.tsx` para que utilicen la variable de entorno `VITE_API_URL` (o el cliente centralizado).
- **Configuración Local:** Se actualizó el archivo `.env` del frontend para apuntar a la URL de producción de Render (`https://postulaciones-back.onrender.com/api`).

## Acciones de Configuración Requeridas en Render
Como parte de la intervención, se especificaron los siguientes ajustes necesarios en el dashboard de Render:
- **Build Command:** `npm run render-build`
- **Start Command:** `npm start`
- **Variables de Entorno:**
  - `DATABASE_URL`: URI de la base de datos Neon.
  - `JWT_SECRET`: Secreto para firma de tokens.
  - `NODE_ENV`: `production`
  - `FRONTEND_URL`: URL del frontend desplegado.
