import { Router } from 'express';
import { pool } from '../config/db.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// GET /api/bundles
router.get('/', authMiddleware, async (req, res) => {
  const userId = req.user?.id;
  try {
    const { rows } = await pool.query(
      `SELECT b.*,
        row_to_json(e) as empresa,
        row_to_json(c) as cargo,
        row_to_json(n) as nivel,
        row_to_json(p) as plataforma,
        row_to_json(u) as ubicacion,
        row_to_json(m) as modalidad,
        row_to_json(es) as estado
       FROM bundle_postulacion b
       LEFT JOIN empresa e ON b.id_empresa = e.id
       LEFT JOIN cargo c ON b.id_cargo = c.id
       LEFT JOIN nivel_experiencia n ON b.id_nivel = n.id
       LEFT JOIN plataforma p ON b.id_plataforma = p.id
       LEFT JOIN ubicacion u ON b.id_ubicacion = u.id
       LEFT JOIN modalidad m ON b.id_modalidad = m.id
       LEFT JOIN estado es ON b.id_estado = es.id
       WHERE b.usuario_id = $1
       ORDER BY b.nombre ASC`,
      [userId]
    );
    res.json(rows);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bundles
router.post('/', authMiddleware, async (req, res) => {
  const userId = req.user?.id;
  try {
    const { nombre, id_empresa, id_cargo, id_nivel, id_plataforma, id_ubicacion, id_modalidad, id_estado, sueldo_ofrecido, sueldo_pedido, es_default } = req.body;
    if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre del bundle es requerido' });

    if (es_default) {
      await pool.query('UPDATE bundle_postulacion SET es_default = false WHERE usuario_id = $1', [userId]);
    }

    const { rows } = await pool.query(
      `INSERT INTO bundle_postulacion (
        nombre, usuario_id, id_empresa, id_cargo, id_nivel, id_plataforma,
        id_ubicacion, id_modalidad, id_estado, sueldo_ofrecido, sueldo_pedido, es_default
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        nombre.trim(), userId,
        id_empresa || null, id_cargo || null, id_nivel || null, id_plataforma || null,
        id_ubicacion || null, id_modalidad || null, id_estado || null,
        sueldo_ofrecido ?? null, sueldo_pedido ?? null,
        Boolean(es_default)
      ]
    );
    res.json(rows[0]);
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/bundles/:id
router.put('/:id', authMiddleware, async (req, res) => {
  const userId = req.user?.id;
  const id = Number(req.params.id);
  try {
    const { nombre, id_empresa, id_cargo, id_nivel, id_plataforma, id_ubicacion, id_modalidad, id_estado, sueldo_ofrecido, sueldo_pedido, es_default } = req.body;
    if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre del bundle es requerido' });

    if (es_default) {
      await pool.query('UPDATE bundle_postulacion SET es_default = false WHERE usuario_id = $1 AND id != $2', [userId, id]);
    }

    const { rowCount } = await pool.query(
      `UPDATE bundle_postulacion SET
        nombre = $1, id_empresa = $2, id_cargo = $3, id_nivel = $4,
        id_plataforma = $5, id_ubicacion = $6, id_modalidad = $7,
        id_estado = $8, sueldo_ofrecido = $9, sueldo_pedido = $10,
        es_default = $11
       WHERE id = $12 AND usuario_id = $13`,
      [
        nombre.trim(),
        id_empresa || null, id_cargo || null, id_nivel || null, id_plataforma || null,
        id_ubicacion || null, id_modalidad || null, id_estado || null,
        sueldo_ofrecido ?? null, sueldo_pedido ?? null,
        Boolean(es_default),
        id, userId,
      ]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Bundle no encontrado' });
    res.json({ success: true });
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/bundles/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  const userId = req.user?.id;
  const id = Number(req.params.id);
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM bundle_postulacion WHERE id = $1 AND usuario_id = $2',
      [id, userId]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Bundle no encontrado' });
    res.json({ success: true });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
