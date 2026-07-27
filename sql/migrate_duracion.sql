BEGIN;

-- 1. Create duracion table
CREATE TABLE IF NOT EXISTS duracion (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    color_hex VARCHAR(7) DEFAULT '#8b5cf6',
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT duracion_usuario_nombre_key UNIQUE (usuario_id, nombre)
);

-- 2. Alter postulacion table
ALTER TABLE postulacion ADD COLUMN IF NOT EXISTS id_duracion INT REFERENCES duracion(id) ON DELETE SET NULL;

-- 3. Insert default durations for existing users
INSERT INTO duracion (nombre, color_hex, usuario_id)
SELECT 'Permanente', '#10b981', id FROM usuarios
ON CONFLICT DO NOTHING;

INSERT INTO duracion (nombre, color_hex, usuario_id)
SELECT 'Proyecto', '#3b82f6', id FROM usuarios
ON CONFLICT DO NOTHING;

INSERT INTO duracion (nombre, color_hex, usuario_id)
SELECT 'Esporádico / Por día', '#ef4444', id FROM usuarios
ON CONFLICT DO NOTHING;

-- 4. Update existing records in postulacion to 'Permanente'
UPDATE postulacion p SET id_duracion = d.id 
FROM duracion d 
WHERE d.usuario_id = p.usuario_id AND d.nombre = 'Permanente' AND p.id_duracion IS NULL;

COMMIT;
