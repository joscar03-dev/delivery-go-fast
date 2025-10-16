-- Migración: Agregar columna image_url a la tabla restaurants
-- Fecha: 2025-10-15

-- Agregar columna image_url a la tabla restaurants si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'restaurants'
        AND column_name = 'image_url'
    ) THEN
        ALTER TABLE restaurants
        ADD COLUMN image_url VARCHAR NULL;
        
        RAISE NOTICE 'Columna image_url agregada a la tabla restaurants';
    ELSE
        RAISE NOTICE 'La columna image_url ya existe en la tabla restaurants';
    END IF;
END $$;

-- Verificar que la columna se haya agregado correctamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'restaurants'
AND column_name = 'image_url';
