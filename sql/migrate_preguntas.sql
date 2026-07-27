BEGIN;

CREATE TABLE IF NOT EXISTS preguntas_frecuentes (
    id SERIAL PRIMARY KEY,
    pregunta TEXT NOT NULL,
    respuesta TEXT NOT NULL,
    frecuencia INT DEFAULT 0,
    id_area INT REFERENCES area(id) ON DELETE SET NULL,
    id_tecnologia INT REFERENCES tecnologia(id) ON DELETE SET NULL,
    activa BOOLEAN DEFAULT TRUE,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMIT;
