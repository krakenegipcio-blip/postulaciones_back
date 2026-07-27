import { Router } from 'express';
import { pool } from '../config/db.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// GET /api/postulaciones (con filtros, paginación, ordenamiento)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = '1', per_page = '15', sort_col = 'id', sort_dir = 'asc',
            id_empresa, id_estado, id_modalidad, id_cargo, sueldo_min, sueldo_max,
            search, tecnologias, id_area } = req.query as Record<string, string>;

    const allowedSort = ['id', 'id_empresa', 'id_cargo', 'id_estado', 'id_modalidad', 'sueldo_ofrecido', 'fecha_postulacion'];
    const col = allowedSort.includes(sort_col) ? `p.${sort_col}` : 'p.id';
    const dir = sort_dir === 'desc' ? 'DESC' : 'ASC';

    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    // Aislamiento de datos
    conditions.push(`p.usuario_id = $${idx++}`);
    params.push(req.user?.id);

    if (id_empresa) { conditions.push(`p.id_empresa = $${idx++}`); params.push(Number(id_empresa)); }
    if (id_area) { conditions.push(`p.id_area = $${idx++}`); params.push(Number(id_area)); }
    if (id_estado) { conditions.push(`p.id_estado = $${idx++}`); params.push(Number(id_estado)); }
    if (id_modalidad) { conditions.push(`p.id_modalidad = $${idx++}`); params.push(Number(id_modalidad)); }
    if (id_cargo) { conditions.push(`p.id_cargo = $${idx++}`); params.push(Number(id_cargo)); }
    if (sueldo_min) { conditions.push(`p.sueldo_ofrecido >= $${idx++}`); params.push(Number(sueldo_min)); }
    if (sueldo_max) { conditions.push(`p.sueldo_ofrecido <= $${idx++}`); params.push(Number(sueldo_max)); }
    if (search) {
      conditions.push(`(e.nombre ILIKE $${idx} OR c.nombre ILIKE $${idx} OR EXISTS (
        SELECT 1 FROM postulacion_tecnologia pt2 JOIN tecnologia t2 ON pt2.id_tecnologia = t2.id
        WHERE pt2.id_postulacion = p.id AND t2.nombre ILIKE $${idx}
      ))`);
      params.push(`%${search}%`);
      idx++;
    }
    if (tecnologias) {
      const tecIds = tecnologias.split(',').map(Number).filter(n => !isNaN(n));
      if (tecIds.length > 0) {
        conditions.push(`p.id IN (
          SELECT id_postulacion FROM postulacion_tecnologia
          WHERE id_tecnologia = ANY($${idx++})
          GROUP BY id_postulacion HAVING COUNT(DISTINCT id_tecnologia) = $${idx++}
        )`);
        params.push(tecIds, tecIds.length);
      }
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const offset = (Number(page) - 1) * Number(per_page);

    // Count
    const countQ = `SELECT COUNT(*) as total FROM postulacion p
      LEFT JOIN empresa e ON p.id_empresa = e.id
      LEFT JOIN cargo c ON p.id_cargo = c.id
      ${where}`;
    const { rows: countRows } = await pool.query(countQ, params);
    const total = Number(countRows[0].total);

    // Main query
    const mainQ = `
      SELECT p.*,
        row_to_json(a) as area, row_to_json(e) as empresa, row_to_json(c) as cargo,
        row_to_json(s) as estado, row_to_json(pl) as plataforma,
        row_to_json(m) as modalidad, row_to_json(u) as ubicacion,
        row_to_json(ne) as nivel_experiencia
      FROM postulacion p
      LEFT JOIN area a ON p.id_area = a.id
      LEFT JOIN empresa e ON p.id_empresa = e.id
      LEFT JOIN cargo c ON p.id_cargo = c.id
      LEFT JOIN estado s ON p.id_estado = s.id
      LEFT JOIN plataforma pl ON p.id_plataforma = pl.id
      LEFT JOIN modalidad m ON p.id_modalidad = m.id
      LEFT JOIN ubicacion u ON p.id_ubicacion = u.id
      LEFT JOIN nivel_experiencia ne ON p.id_nivel = ne.id
      ${where}
      ORDER BY ${col} ${dir}
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    params.push(Number(per_page), offset);
    const { rows } = await pool.query(mainQ, params);

    // Load tecnologias & metodos
    const ids = rows.map(r => r.id);
    if (ids.length > 0) {
      const { rows: tecRows } = await pool.query(
        `SELECT pt.id_postulacion, t.id, t.nombre, t.color_hex
         FROM postulacion_tecnologia pt JOIN tecnologia t ON pt.id_tecnologia = t.id
         WHERE pt.id_postulacion = ANY($1)`, [ids]
      );
      const { rows: metRows } = await pool.query(
        `SELECT pm.id_postulacion, me.id, me.nombre, me.color_hex
         FROM postulacion_metodo pm JOIN metodo_evaluacion me ON pm.id_metodo_evaluacion = me.id
         WHERE pm.id_postulacion = ANY($1)`, [ids]
      );
      const tecMap: Record<number, any[]> = {};
      const metMap: Record<number, any[]> = {};
      tecRows.forEach(r => { (tecMap[r.id_postulacion] ??= []).push({ id: r.id, nombre: r.nombre, color_hex: r.color_hex }); });
      metRows.forEach(r => { (metMap[r.id_postulacion] ??= []).push({ id: r.id, nombre: r.nombre, color_hex: r.color_hex }); });
      rows.forEach(r => { r.tecnologias = tecMap[r.id] ?? []; r.metodos = metMap[r.id] ?? []; });
    }

    res.json({ rows, total });
  } catch (err: any) { console.error(err); res.status(500).json({ error: err.message }); }
});

// POST /api/postulaciones (con transacción)
router.post('/', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const { tecnologias, metodos, ...payload } = req.body;
    payload.usuario_id = req.user?.id; // Asociar al usuario logueado
    await client.query('BEGIN');

    const keys = Object.keys(payload);
    const vals = Object.values(payload);
    const ph = keys.map((_, i) => `$${i + 1}`).join(',');
    const { rows } = await client.query(
      `INSERT INTO postulacion (${keys.join(',')}) VALUES (${ph}) RETURNING id`, vals
    );
    const id = rows[0].id;

    if (tecnologias?.length > 0) {
      const tecVals = tecnologias.map((_: number, i: number) => `($1, $${i + 2})`).join(',');
      await client.query(
        `INSERT INTO postulacion_tecnologia (id_postulacion, id_tecnologia) VALUES ${tecVals}`,
        [id, ...tecnologias]
      );
    }
    if (metodos?.length > 0) {
      const metVals = metodos.map((_: number, i: number) => `($1, $${i + 2})`).join(',');
      await client.query(
        `INSERT INTO postulacion_metodo (id_postulacion, id_metodo_evaluacion) VALUES ${metVals}`,
        [id, ...metodos]
      );
    }

    await client.query('COMMIT');
    res.json({ id });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error(err); res.status(500).json({ error: err.message });
  } finally { client.release(); }
});

// PUT /api/postulaciones/:id (con transacción)
router.put('/:id', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const postId = Number(req.params.id);
    const { tecnologias, metodos, ...payload } = req.body;
    await client.query('BEGIN');

    const keys = Object.keys(payload);
    const vals = Object.values(payload);
    const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    vals.push(postId);
    vals.push(req.user?.id);
    const updateResult = await client.query(`UPDATE postulacion SET ${sets} WHERE id = $${vals.length - 1} AND usuario_id = $${vals.length}`, vals);
    
    if (updateResult.rowCount === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Postulación no encontrada o no pertenece al usuario' });
      return;
    }

    // Reemplazar relaciones
    await client.query('DELETE FROM postulacion_tecnologia WHERE id_postulacion = $1', [postId]);
    if (tecnologias?.length > 0) {
      const tecVals = tecnologias.map((_: number, i: number) => `($1, $${i + 2})`).join(',');
      await client.query(
        `INSERT INTO postulacion_tecnologia (id_postulacion, id_tecnologia) VALUES ${tecVals}`,
        [postId, ...tecnologias]
      );
    }
    await client.query('DELETE FROM postulacion_metodo WHERE id_postulacion = $1', [postId]);
    if (metodos?.length > 0) {
      const metVals = metodos.map((_: number, i: number) => `($1, $${i + 2})`).join(',');
      await client.query(
        `INSERT INTO postulacion_metodo (id_postulacion, id_metodo_evaluacion) VALUES ${metVals}`,
        [postId, ...metodos]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error(err); res.status(500).json({ error: err.message });
  } finally { client.release(); }
});

// DELETE /api/postulaciones/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM postulacion WHERE id = $1 AND usuario_id = $2', [req.params.id, req.user?.id]);
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Postulación no encontrada o no pertenece al usuario' });
      return;
    }
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
