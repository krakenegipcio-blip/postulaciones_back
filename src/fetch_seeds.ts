import { pool } from './config/db.js';

async function fetchSeeds() {
  const client = await pool.connect();
  try {
    const queries = {
      estado: 'SELECT nombre, color_hex FROM estado WHERE usuario_id = 1 ORDER BY id ASC',
      modalidad: 'SELECT nombre, color_hex FROM modalidad WHERE usuario_id = 1 ORDER BY id ASC',
      nivel_experiencia: 'SELECT nombre, orden FROM nivel_experiencia WHERE usuario_id = 1 ORDER BY orden ASC',
      cargo: 'SELECT nombre, orden FROM cargo WHERE usuario_id = 1 ORDER BY orden ASC',
      metodo_evaluacion: 'SELECT nombre, color_hex FROM metodo_evaluacion WHERE usuario_id = 1 ORDER BY id ASC',
      tecnologia: 'SELECT nombre, color_hex, orden FROM tecnologia WHERE usuario_id = 1 ORDER BY orden ASC LIMIT 20'
    };

    for (const [table, sql] of Object.entries(queries)) {
      const { rows } = await client.query(sql);
      console.log(`\n--- ${table.toUpperCase()} ---`);
      console.log(JSON.stringify(rows, null, 2));
    }
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    process.exit(0);
  }
}

fetchSeeds();
