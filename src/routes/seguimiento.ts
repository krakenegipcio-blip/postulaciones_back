import { Router } from 'express';
import { pool } from '../config/db.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

const RESULTADOS_PERMITIDOS = new Set(['pendiente', 'completado', 'aprobado', 'rechazado', 'cancelado']);

function normalizeStep(body: Record<string, any>) {
  const resultado = body.resultado ?? 'pendiente';
  if (!RESULTADOS_PERMITIDOS.has(resultado)) {
    throw new Error('Resultado de seguimiento no permitido');
  }
  if (!body.id_fase_seguimiento) {
    throw new Error('Debe seleccionar una fase de seguimiento');
  }
  if (!body.fecha_evento) {
    throw new Error('Debe indicar la fecha del evento');
  }

  return {
    id_fase_seguimiento: Number(body.id_fase_seguimiento),
    id_metodo_evaluacion: body.id_metodo_evaluacion ? Number(body.id_metodo_evaluacion) : null,
    titulo: body.titulo?.trim() || null,
    nota: body.nota?.trim() || null,
    fecha_evento: body.fecha_evento,
    fecha_limite: body.fecha_limite || null,
    resultado,
    orden: body.orden !== undefined && body.orden !== null && body.orden !== '' ? Number(body.orden) : 0,
  };
}

async function verifyOwnership(postId: number, userId: number | undefined): Promise<boolean> {
  if (!userId) return false;
  const { rowCount } = await pool.query('SELECT id FROM postulacion WHERE id = $1 AND usuario_id = $2', [postId, userId]);
  return (rowCount ?? 0) > 0;
}

// GET /api/postulaciones/:id/seguimiento
router.get('/:id/seguimiento', authMiddleware, async (req, res) => {
  try {
    const postId = Number(req.params.id);
    if (!(await verifyOwnership(postId, req.user?.id))) {
      return res.status(404).json({ error: 'Postulación no encontrada o no autorizada' });
    }

    const { rows } = await pool.query(
      `SELECT ps.*,
        row_to_json(fs) as fase,
        row_to_json(me) as metodo
       FROM postulacion_seguimiento ps
       JOIN fase_seguimiento fs ON ps.id_fase_seguimiento = fs.id
       LEFT JOIN metodo_evaluacion me ON ps.id_metodo_evaluacion = me.id
       WHERE ps.id_postulacion = $1
       ORDER BY ps.orden ASC, ps.fecha_evento ASC, ps.id ASC`,
      [postId]
    );
    res.json(rows);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/postulaciones/:id/seguimiento
router.post('/:id/seguimiento', authMiddleware, async (req, res) => {
  try {
    const postId = Number(req.params.id);
    if (!(await verifyOwnership(postId, req.user?.id))) {
      return res.status(404).json({ error: 'Postulación no encontrada o no autorizada' });
    }

    const step = normalizeStep(req.body);

    const { rows } = await pool.query(
      `INSERT INTO postulacion_seguimiento (
        id_postulacion, id_fase_seguimiento, id_metodo_evaluacion,
        titulo, nota, fecha_evento, fecha_limite, resultado, orden
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        postId,
        step.id_fase_seguimiento,
        step.id_metodo_evaluacion,
        step.titulo,
        step.nota,
        step.fecha_evento,
        step.fecha_limite,
        step.resultado,
        step.orden
      ]
    );

    res.json(rows[0]);
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/postulaciones/:id/seguimiento/:stepId
router.put('/:id/seguimiento/:stepId', authMiddleware, async (req, res) => {
  try {
    const postId = Number(req.params.id);
    if (!(await verifyOwnership(postId, req.user?.id))) {
      return res.status(404).json({ error: 'Postulación no encontrada o no autorizada' });
    }

    const stepId = Number(req.params.stepId);
    const step = normalizeStep(req.body);

    const { rowCount } = await pool.query(
      `UPDATE postulacion_seguimiento SET
        id_fase_seguimiento = $1,
        id_metodo_evaluacion = $2,
        titulo = $3,
        nota = $4,
        fecha_evento = $5,
        fecha_limite = $6,
        resultado = $7,
        orden = $8,
        updated_at = NOW()
       WHERE id = $9 AND id_postulacion = $10`,
      [
        step.id_fase_seguimiento,
        step.id_metodo_evaluacion,
        step.titulo,
        step.nota,
        step.fecha_evento,
        step.fecha_limite,
        step.resultado,
        step.orden,
        stepId,
        postId
      ]
    );

    if (rowCount === 0) return res.status(404).json({ error: 'Paso de seguimiento no encontrado' });
    res.json({ success: true });
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/postulaciones/:id/seguimiento/:stepId
router.delete('/:id/seguimiento/:stepId', authMiddleware, async (req, res) => {
  try {
    const postId = Number(req.params.id);
    if (!(await verifyOwnership(postId, req.user?.id))) {
      return res.status(404).json({ error: 'Postulación no encontrada o no autorizada' });
    }

    const { rowCount } = await pool.query(
      'DELETE FROM postulacion_seguimiento WHERE id = $1 AND id_postulacion = $2',
      [Number(req.params.stepId), postId]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Paso de seguimiento no encontrado' });
    res.json({ success: true });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
