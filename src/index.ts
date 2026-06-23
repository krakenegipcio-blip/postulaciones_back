import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import postulacionesRouter from './routes/postulaciones.js';
import seguimientoRouter from './routes/seguimiento.js';
import dashboardRouter from './routes/dashboard.js';
import catalogsRouter from './routes/catalogs.js';
import authRouter from './routes/auth.js';

dotenv.config();

const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Rutas específicas PRIMERO (deben ir antes de las genéricas)
app.use('/api/auth', authRouter);
app.use('/api/postulaciones', seguimientoRouter);
app.use('/api/postulaciones', postulacionesRouter);
app.use('/api/dashboard', dashboardRouter);

// Rutas genéricas de catálogos AL FINAL
app.use('/api', catalogsRouter);

// Health check
app.get('/api/health', (_req: any, res: any) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Prueba API
app.get('/api/prueba_api', (_req: any, res: any) => {
  const ahora = new Date();
  const opciones: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Asuncion',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };
  const fechaHora = ahora.toLocaleString('es-PY', opciones);
  res.json({
    mensaje: `API saludable a las ${fechaHora}`,
    fecha: fechaHora,
    timestamp: ahora.toISOString(),
  });
});

// Iniciar servidor
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`✅ API Server corriendo en http://localhost:${port}`);
});
