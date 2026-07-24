const { Client } = require('pg');
require('dotenv').config();
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    await client.connect();
    await client.query('BEGIN');

    console.log('Fixing corrupted text in fase_seguimiento...');
    await client.query(`UPDATE fase_seguimiento SET nombre = 'Postulación enviada' WHERE nombre = 'PostulaciÃ³n enviada'`);
    await client.query(`UPDATE fase_seguimiento SET nombre = 'Prueba técnica' WHERE nombre = 'Prueba tÃ©cnica'`);
    await client.query(`UPDATE fase_seguimiento SET nombre = 'Entrevista técnica' WHERE nombre = 'Entrevista tÃ©cnica'`);

    console.log('Creating bundle_postulacion table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS bundle_postulacion (
          id SERIAL PRIMARY KEY,
          nombre VARCHAR(100) NOT NULL,
          usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
          id_empresa INT REFERENCES empresa(id) ON DELETE SET NULL,
          id_cargo INT REFERENCES cargo(id) ON DELETE SET NULL,
          id_nivel INT REFERENCES nivel_experiencia(id) ON DELETE SET NULL,
          id_plataforma INT REFERENCES plataforma(id) ON DELETE SET NULL,
          id_ubicacion INT REFERENCES ubicacion(id) ON DELETE SET NULL,
          id_modalidad INT REFERENCES modalidad(id) ON DELETE SET NULL,
          id_estado INT REFERENCES estado(id) ON DELETE SET NULL,
          sueldo_ofrecido INT,
          sueldo_pedido INT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          CONSTRAINT bundle_postulacion_usuario_nombre_key UNIQUE (usuario_id, nombre)
      )
    `);

    await client.query('COMMIT');
    console.log('Migration successful');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', e);
  } finally {
    await client.end();
  }
}

run();
