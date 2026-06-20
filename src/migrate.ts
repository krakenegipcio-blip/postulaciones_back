import { pool } from './config/db.js';

async function runMigrations() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log('Creating usuarios table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Altering postulacion table...');
    await client.query(`
      ALTER TABLE postulacion ADD COLUMN IF NOT EXISTS usuario_id INTEGER;
      ALTER TABLE postulacion DROP CONSTRAINT IF EXISTS fk_usuario;
      ALTER TABLE postulacion ADD CONSTRAINT fk_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;
    `);

    console.log('Altering postulacion_seguimiento table...');
    await client.query(`
      ALTER TABLE postulacion_seguimiento ADD COLUMN IF NOT EXISTS usuario_id INTEGER;
      ALTER TABLE postulacion_seguimiento DROP CONSTRAINT IF EXISTS fk_seguimiento_usuario;
      ALTER TABLE postulacion_seguimiento ADD CONSTRAINT fk_seguimiento_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;
    `);

    await client.query('COMMIT');
    console.log('Migrations complete!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

runMigrations();
