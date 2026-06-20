import { Router } from 'express';
import { pool } from '../config/db.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// GET /api/dashboard
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { rows: [{ total }] } = await pool.query('SELECT COUNT(*)::int as total FROM postulacion WHERE usuario_id = $1', [userId]);

    const { rows: tecnologias } = await pool.query(`
      SELECT t.id, t.nombre, t.color_hex, COUNT(*)::int as count
      FROM postulacion_tecnologia pt 
      JOIN tecnologia t ON pt.id_tecnologia = t.id
      JOIN postulacion p ON pt.id_postulacion = p.id
      WHERE p.usuario_id = $1
      GROUP BY t.id, t.nombre, t.color_hex ORDER BY count DESC LIMIT 12
    `, [userId]);

    const { rows: [inglesRow] } = await pool.query(`
      SELECT COUNT(*)::int as count FROM postulacion_tecnologia pt
      JOIN tecnologia t ON pt.id_tecnologia = t.id 
      JOIN postulacion p ON pt.id_postulacion = p.id
      WHERE t.nombre = 'Inglés' AND p.usuario_id = $1
    `, [userId]);
    const conIngles = inglesRow?.count ?? 0;

    const { rows: cargos } = await pool.query(`
      SELECT c.nombre, COUNT(*)::int as count FROM postulacion p
      JOIN cargo c ON p.id_cargo = c.id 
      WHERE p.usuario_id = $1
      GROUP BY c.nombre ORDER BY count DESC LIMIT 8
    `, [userId]);

    // Stack combos
    const { rows: tecRel } = await pool.query(`
      SELECT pt.id_postulacion, t.nombre FROM postulacion_tecnologia pt
      JOIN tecnologia t ON pt.id_tecnologia = t.id
      JOIN postulacion p ON pt.id_postulacion = p.id
      WHERE p.usuario_id = $1
    `, [userId]);
    const postTecMap: Record<number, string[]> = {};
    tecRel.forEach(r => { (postTecMap[r.id_postulacion] ??= []).push(r.nombre); });
    const comboMap: Record<string, number> = {};
    Object.values(postTecMap).forEach(names => {
      const sorted = [...names].sort();
      for (let i = 0; i < sorted.length; i++)
        for (let j = i + 1; j < sorted.length; j++) {
          const key = `${sorted[i]} + ${sorted[j]}`;
          comboMap[key] = (comboMap[key] ?? 0) + 1;
        }
    });
    const stacks = Object.entries(comboMap).map(([stack, count]) => ({ stack, count }))
      .sort((a, b) => b.count - a.count).slice(0, 8);

    const { rows: metodos } = await pool.query(`
      SELECT me.nombre, me.color_hex, COUNT(*)::int as count
      FROM postulacion_metodo pm 
      JOIN metodo_evaluacion me ON pm.id_metodo_evaluacion = me.id
      JOIN postulacion p ON pm.id_postulacion = p.id
      WHERE p.usuario_id = $1
      GROUP BY me.nombre, me.color_hex ORDER BY count DESC
    `, [userId]);

    const { rows: porEstado } = await pool.query(`
      SELECT s.nombre, s.color_hex, COUNT(*)::int as count FROM postulacion p
      JOIN estado s ON p.id_estado = s.id 
      WHERE p.usuario_id = $1
      GROUP BY s.nombre, s.color_hex ORDER BY count DESC
    `, [userId]);

    const { rows: porModalidad } = await pool.query(`
      SELECT m.nombre, m.color_hex, COUNT(*)::int as count FROM postulacion p
      JOIN modalidad m ON p.id_modalidad = m.id 
      WHERE p.usuario_id = $1
      GROUP BY m.nombre, m.color_hex ORDER BY count DESC
    `, [userId]);

    res.json({
      totalPostulaciones: total, conIngles, sinIngles: total - conIngles,
      tecnologias, cargos, stacks, metodos, porEstado, porModalidad,
    });
  } catch (err: any) { console.error(err); res.status(500).json({ error: err.message }); }
});

export default router;
