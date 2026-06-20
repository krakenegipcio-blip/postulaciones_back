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
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
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
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Iniciar servidor
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`✅ API Server corriendo en http://localhost:${port}`);
});
