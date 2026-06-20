import { pool } from './config/db.js';

async function runMigrations() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Remover usuario_id de postulacion_seguimiento
    console.log('Removiendo usuario_id de postulacion_seguimiento...');
    await client.query(`
      ALTER TABLE postulacion_seguimiento DROP CONSTRAINT IF EXISTS fk_seguimiento_usuario;
      ALTER TABLE postulacion_seguimiento DROP COLUMN IF EXISTS usuario_id;
    `);

    // 2. Agregar usuario_id a los catálogos
    const tables = [
      'tecnologia', 'metodo_evaluacion', 'empresa', 'cargo', 
      'plataforma', 'modalidad', 'ubicacion', 'estado', 'nivel_experiencia'
    ];

    console.log('Agregando usuario_id a tablas de catálogos...');
    for (const table of tables) {
      await client.query(`
        ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS usuario_id INTEGER;
        ALTER TABLE ${table} DROP CONSTRAINT IF EXISTS fk_${table}_usuario;
        ALTER TABLE ${table} ADD CONSTRAINT fk_${table}_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;
      `);
    }

    // 3. (Opcional) Si existe el usuario 1, asignarle los datos existentes para que no queden huérfanos
    console.log('Asignando datos existentes al usuario ID 1 (si existe)...');
    const { rowCount: userExists } = await client.query('SELECT id FROM usuarios WHERE id = 1');
    if (userExists && userExists > 0) {
      for (const table of tables) {
        await client.query(`UPDATE ${table} SET usuario_id = 1 WHERE usuario_id IS NULL`);
      }
      console.log('Datos asignados exitosamente.');
    } else {
      console.log('Usuario ID 1 no encontrado, los datos actuales quedaron con usuario_id NULL.');
    }

    await client.query('COMMIT');
    console.log('Migraciones de catálogos completadas!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error en migracion:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

runMigrations();
