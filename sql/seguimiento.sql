-- Seguimiento de postulaciones
-- Ejecutar este script en la base de datos PostgreSQL antes de usar la nueva seccion Seguimiento.

CREATE TABLE IF NOT EXISTS fase_seguimiento (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    color_hex VARCHAR(7) NOT NULL DEFAULT '#38bdf8',
    icono VARCHAR(50),
    orden_default INT NOT NULL DEFAULT 0,
    es_final BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS postulacion_seguimiento (
    id SERIAL PRIMARY KEY,
    id_postulacion INT NOT NULL REFERENCES postulacion(id) ON DELETE CASCADE,
    id_fase_seguimiento INT NOT NULL REFERENCES fase_seguimiento(id),
    id_metodo_evaluacion INT REFERENCES metodo_evaluacion(id),
    titulo VARCHAR(150),
    nota TEXT,
    fecha_evento DATE NOT NULL,
    fecha_limite DATE,
    resultado VARCHAR(30) NOT NULL DEFAULT 'pendiente',
    orden INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_postulacion_seguimiento_resultado
      CHECK (resultado IN ('pendiente', 'completado', 'aprobado', 'rechazado', 'cancelado'))
);

CREATE INDEX IF NOT EXISTS idx_postulacion_seguimiento_postulacion
ON postulacion_seguimiento(id_postulacion);

CREATE INDEX IF NOT EXISTS idx_postulacion_seguimiento_fecha
ON postulacion_seguimiento(fecha_evento);

CREATE INDEX IF NOT EXISTS idx_postulacion_seguimiento_fase
ON postulacion_seguimiento(id_fase_seguimiento);

INSERT INTO fase_seguimiento (nombre, color_hex, icono, orden_default, es_final) VALUES
('Postulación enviada', '#22c55e', 'send', 10, FALSE),
('Contacto inicial', '#38bdf8', 'phone', 20, FALSE),
('Prueba técnica', '#8b5cf6', 'file-code', 30, FALSE),
('Entrevista RRHH', '#06b6d4', 'users', 40, FALSE),
('Entrevista técnica', '#6366f1', 'monitor-code', 50, FALSE),
('Entrevista final', '#f59e0b', 'handshake', 60, FALSE),
('Feedback recibido', '#14b8a6', 'message-square', 70, FALSE),
('Oferta recibida', '#eab308', 'badge-dollar-sign', 80, FALSE),
('Rechazo', '#ef4444', 'x-circle', 90, TRUE),
('Contratado', '#22c55e', 'badge-check', 100, TRUE),
('Desistido', '#94a3b8', 'circle-slash', 110, TRUE)
ON CONFLICT (nombre) DO UPDATE SET
  color_hex = EXCLUDED.color_hex,
  icono = EXCLUDED.icono,
  orden_default = EXCLUDED.orden_default,
  es_final = EXCLUDED.es_final;
