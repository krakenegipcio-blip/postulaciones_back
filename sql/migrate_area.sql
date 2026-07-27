BEGIN;

-- 1. Create area table
CREATE TABLE IF NOT EXISTS area (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    color_hex VARCHAR(7) DEFAULT '#38bdf8',
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT area_usuario_nombre_key UNIQUE (usuario_id, nombre)
);

-- 2. Alter tables
ALTER TABLE postulacion ADD COLUMN IF NOT EXISTS id_area INT REFERENCES area(id) ON DELETE SET NULL;
ALTER TABLE cargo ADD COLUMN IF NOT EXISTS id_area INT REFERENCES area(id) ON DELETE SET NULL;
ALTER TABLE tecnologia ADD COLUMN IF NOT EXISTS id_area INT REFERENCES area(id) ON DELETE SET NULL;

-- 3. Insert 'Informática' for existing users
INSERT INTO area (nombre, color_hex, usuario_id)
SELECT 'Informática', '#38bdf8', id FROM usuarios
ON CONFLICT DO NOTHING;

-- 4. Update existing records
UPDATE postulacion p SET id_area = a.id FROM area a WHERE a.usuario_id = p.usuario_id AND a.nombre = 'Informática' AND p.id_area IS NULL;
UPDATE cargo c SET id_area = a.id FROM area a WHERE a.usuario_id = c.usuario_id AND a.nombre = 'Informática' AND c.id_area IS NULL;
UPDATE tecnologia t SET id_area = a.id FROM area a WHERE a.usuario_id = t.usuario_id AND a.nombre = 'Informática' AND t.id_area IS NULL;

COMMIT;
