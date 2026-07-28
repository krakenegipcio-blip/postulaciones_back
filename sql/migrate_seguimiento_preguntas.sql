BEGIN;

CREATE TABLE IF NOT EXISTS seguimiento_pregunta (
    id_postulacion_seguimiento INT REFERENCES postulacion_seguimiento(id) ON DELETE CASCADE,
    id_pregunta_frecuente INT REFERENCES preguntas_frecuentes(id) ON DELETE CASCADE,
    PRIMARY KEY (id_postulacion_seguimiento, id_pregunta_frecuente)
);

COMMIT;
