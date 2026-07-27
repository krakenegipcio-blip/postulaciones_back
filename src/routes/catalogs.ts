import { Router } from 'express';
import { pool } from '../config/db.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

const ALLOWED_TABLES = [
  'empresa', 'cargo', 'estado', 'plataforma',
  'modalidad', 'ubicacion', 'tecnologia',
  'metodo_evaluacion', 'nivel_experiencia',
  'fase_seguimiento', 'area', 'duracion',
];

// GET /api/:table
router.get('/:table', authMiddleware, async (req, res) => {
  const table = req.params.table as string;
  const userId = req.user?.id;
  
  if (!ALLOWED_TABLES.includes(table)) return res.status(400).json({ error: 'Tabla no permitida' });
  
  try {
    if (table === 'tecnologia') {
      const { rows } = await pool.query(`
        SELECT t.*, row_to_json(p.*) as padre
        FROM tecnologia t LEFT JOIN tecnologia p ON t.id_padre = p.id
        WHERE t.usuario_id = $1
        ORDER BY t.orden ASC, t.nombre ASC
      `, [userId]);
      return res.json(rows);
    }
    
    const orderBy = table === 'cargo' ? 'orden ASC, nombre ASC'
      : (table === 'nivel_experiencia' ? 'orden ASC, nombre ASC'
        : (table === 'fase_seguimiento' ? 'orden_default ASC, nombre ASC' : 'id ASC'));
        
    const { rows } = await pool.query(`SELECT * FROM ${table} WHERE usuario_id = $1 ORDER BY ${orderBy}`, [userId]);
    res.json(rows);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// POST /api/:table
router.post('/:table', authMiddleware, async (req, res) => {
  const table = req.params.table as string;
  const userId = req.user?.id;
  
  if (!ALLOWED_TABLES.includes(table)) return res.status(400).json({ error: 'Tabla no permitida' });
  
  try {
    const payload = { ...req.body, usuario_id: userId };
    const keys = Object.keys(payload);
    const vals = Object.values(payload);
    const ph = keys.map((_, i) => `$${i + 1}`).join(',');
    
    const { rows } = await pool.query(
      `INSERT INTO ${table} (${keys.join(',')}) VALUES (${ph}) RETURNING *`, vals
    );
    res.json(rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// PUT /api/:table/:id
router.put('/:table/:id', authMiddleware, async (req, res) => {
  const table = req.params.table as string;
  const id = req.params.id as string;
  const userId = req.user?.id;
  
  if (!ALLOWED_TABLES.includes(table)) return res.status(400).json({ error: 'Tabla no permitida' });
  
  try {
    // Remove usuario_id from body if malicious user sent it
    const { usuario_id, ...payload } = req.body;
    
    const keys = Object.keys(payload);
    const vals = Object.values(payload);
    const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    
    vals.push(id);
    vals.push(userId);
    
    const { rowCount } = await pool.query(
      `UPDATE ${table} SET ${sets} WHERE id = $${vals.length - 1} AND usuario_id = $${vals.length}`, 
      vals
    );
    
    if (rowCount === 0) return res.status(404).json({ error: 'Registro no encontrado o no autorizado' });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/:table/:id
router.delete('/:table/:id', authMiddleware, async (req, res) => {
  const table = req.params.table as string;
  const id = req.params.id as string;
  const userId = req.user?.id;
  
  if (!ALLOWED_TABLES.includes(table)) return res.status(400).json({ error: 'Tabla no permitida' });
  
  try {
    const { rowCount } = await pool.query(`DELETE FROM ${table} WHERE id = $1 AND usuario_id = $2`, [id, userId]);
    if (rowCount === 0) return res.status(404).json({ error: 'Registro no encontrado o no autorizado' });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
