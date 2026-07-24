-- Seguimiento de postulaciones
-- Ejecutar este script en la base de datos PostgreSQL antes de usar la nueva seccion Seguimiento.

CREATE TABLE IF NOT EXISTS fase_seguimiento (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    color_hex VARCHAR(7) NOT NULL DEFAULT '#38bdf8',
    icono VARCHAR(50),
    orden_default INT NOT NULL DEFAULT 0,
    es_final BOOLEAN NOT NULL DEFAULT FALSE,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fase_seguimiento_usuario_nombre_key UNIQUE (usuario_id, nombre)
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

-- Nota: Las fases iniciales se insertan automáticamente mediante el seeder del backend 
-- (src/utils/seeders.ts) cuando se registra un nuevo usuario.
