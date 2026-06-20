import { pool } from '../config/db.js';

export async function createInitialSeeds(usuarioId: number) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // 1. Estado
    const estados = [
      { nombre: 'En Espera', color: '#f59e0b' },
      { nombre: 'Entrevista', color: '#3b82f6' },
      { nombre: 'Rechazado', color: '#ef4444' },
      { nombre: 'Finalizado / Contratado', color: '#22c55e' },
      { nombre: 'Pausa', color: '#6b7280' },
      { nombre: 'Sin Postular', color: '#6366f1' }
    ];
    for (const est of estados) {
      await client.query(
        'INSERT INTO estado (nombre, color_hex, usuario_id) VALUES ($1, $2, $3)',
        [est.nombre, est.color, usuarioId]
      );
    }

    // 2. Modalidad
    const modalidades = [
      { nombre: 'Presencial', color: '#10b981' },
      { nombre: 'Remoto', color: '#3b82f6' },
      { nombre: 'Híbrido', color: '#f59e0b' }
    ];
    for (const mod of modalidades) {
      await client.query(
        'INSERT INTO modalidad (nombre, color_hex, usuario_id) VALUES ($1, $2, $3)',
        [mod.nombre, mod.color, usuarioId]
      );
    }

    // 3. Nivel de Experiencia
    const niveles = ['Trainee', 'Junior', 'Semi Senior', 'Senior'];
    for (let i = 0; i < niveles.length; i++) {
      await client.query(
        'INSERT INTO nivel_experiencia (nombre, orden, usuario_id) VALUES ($1, $2, $3)',
        [niveles[i], i + 1, usuarioId]
      );
    }

    // 4. Cargo
    const cargos = [
      'Sin especificar',
      'Full Stack Developer',
      'Frontend Developer',
      'Backend Developer',
      'DevOps Engineer',
      'Data Engineer',
      'Mobile Developer',
      'QA Engineer',
      'Ciberseguridad'
    ];
    for (const cargo of cargos) {
      await client.query(
        'INSERT INTO cargo (nombre, orden, usuario_id) VALUES ($1, 0, $2)',
        [cargo, usuarioId]
      );
    }

    // 5. Método de Evaluación
    const metodos = [
      { nombre: 'Entrevista Técnica', color: '#8b5cf6' },
      { nombre: 'Prueba Online', color: '#3b82f6' },
      { nombre: 'Prueba Técnica Práctica (Take-home)', color: '#f59e0b' },
      { nombre: 'Coding Challenge', color: '#06b6d4' },
      { nombre: 'Pair Programming', color: '#ec4899' },
      { nombre: 'Plataforma Externa (Evalart, HackerRank, etc.)', color: '#22c55e' }
    ];
    for (const met of metodos) {
      await client.query(
        'INSERT INTO metodo_evaluacion (nombre, color_hex, usuario_id) VALUES ($1, $2, $3)',
        [met.nombre, met.color, usuarioId]
      );
    }

    // 6. Fases de Seguimiento
    const fases = [
      { n: 'Postulación enviada', c: '#22c55e', i: 'send', o: 10, f: false },
      { n: 'Contacto inicial', c: '#38bdf8', i: 'phone', o: 20, f: false },
      { n: 'Prueba técnica', c: '#8b5cf6', i: 'file-code', o: 30, f: false },
      { n: 'Entrevista RRHH', c: '#06b6d4', i: 'users', o: 40, f: false },
      { n: 'Entrevista técnica', c: '#6366f1', i: 'monitor-code', o: 50, f: false },
      { n: 'Entrevista final', c: '#f59e0b', i: 'handshake', o: 60, f: false },
      { n: 'Feedback recibido', c: '#14b8a6', i: 'message-square', o: 70, f: false },
      { n: 'Oferta recibida', c: '#eab308', i: 'badge-dollar-sign', o: 80, f: false },
      { n: 'Rechazo', c: '#ef4444', i: 'x-circle', o: 90, f: true },
      { n: 'Contratado', c: '#22c55e', i: 'badge-check', o: 100, f: true },
      { n: 'Desistido', c: '#94a3b8', i: 'circle-slash', o: 110, f: true }
    ];
    for (const f of fases) {
      await client.query(
        'INSERT INTO fase_seguimiento (nombre, color_hex, icono, orden_default, es_final, usuario_id) VALUES ($1, $2, $3, $4, $5, $6)',
        [f.n, f.c, f.i, f.o, f.f, usuarioId]
      );
    }

    // 7. Tecnologías
    const tecnologias = [
      { n: 'JavaScript', c: '#f7df1e' },
      { n: 'TypeScript', c: '#3178c6' },
      { n: 'React', c: '#61dafb' },
      { n: 'Angular', c: '#dd0031' },
      { n: 'Node.js', c: '#68a063' },
      { n: 'Python', c: '#3776ab' },
      { n: 'Java', c: '#f89820' },
      { n: 'PostgreSQL', c: '#336791' },
      { n: 'MySQL', c: '#4479a1' },
      { n: 'MongoDB', c: '#47a248' },
      { n: 'Docker', c: '#2496ed' },
      { n: 'AWS', c: '#ff9900' },
      { n: 'Azure', c: '#0078d4' },
      { n: 'Git', c: '#f34f29' },
      { n: 'Inglés', c: '#6b7280' }
    ];
    for (const t of tecnologias) {
      await client.query(
        'INSERT INTO tecnologia (nombre, color_hex, orden, usuario_id) VALUES ($1, $2, 0, $3)',
        [t.n, t.c, usuarioId]
      );
    }

    // 8. Empresa
    await client.query(
      'INSERT INTO empresa (nombre, usuario_id) VALUES ($1, $2)',
      ['Sin especificar', usuarioId]
    );

    // 9. Plataforma
    const plataformas = ['Sin Especificar', 'Presencial', 'Correo Electrónico'];
    for (const p of plataformas) {
      await client.query(
        'INSERT INTO plataforma (nombre, usuario_id) VALUES ($1, $2)',
        [p, usuarioId]
      );
    }

    // 10. Ubicación
    await client.query(
      'INSERT INTO ubicacion (nombre, usuario_id) VALUES ($1, $2)',
      ['Sin especificar', usuarioId]
    );

    await client.query('COMMIT');
    console.log(`Seeders iniciales creados exitosamente para el usuario ${usuarioId}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear seeders iniciales:', error);
    throw error;
  } finally {
    client.release();
  }
}
