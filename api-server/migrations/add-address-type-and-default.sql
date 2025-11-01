-- Migración para agregar tipo de dirección y marcado como predeterminada
-- Fecha: 2024

-- 1. Agregar columna 'type' con enum (home, work, other)
-- Primero crear el tipo enum si no existe
DO $$ BEGIN
    CREATE TYPE address_type AS ENUM ('home', 'work', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Agregar la columna type
ALTER TABLE addresses 
ADD COLUMN IF NOT EXISTS type address_type NOT NULL DEFAULT 'home';

-- 2. Agregar columna 'isDefault' 
ALTER TABLE addresses 
ADD COLUMN IF NOT EXISTS "isDefault" boolean NOT NULL DEFAULT false;

-- 3. Agregar columnas de timestamp
ALTER TABLE addresses 
ADD COLUMN IF NOT EXISTS "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE addresses 
ADD COLUMN IF NOT EXISTS "updatedAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 4. Crear un trigger para actualizar automáticamente updatedAt
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_addresses_modtime ON addresses;
CREATE TRIGGER update_addresses_modtime 
BEFORE UPDATE ON addresses 
FOR EACH ROW 
EXECUTE FUNCTION update_modified_column();

-- 5. Actualizar la primera dirección de cada usuario como predeterminada (opcional)
WITH first_addresses AS (
    SELECT DISTINCT ON (user_id) id
    FROM addresses
    ORDER BY user_id, created_at ASC NULLS LAST
)
UPDATE addresses
SET "isDefault" = true
WHERE id IN (SELECT id FROM first_addresses);

-- Verificación
SELECT 
    table_name, 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'addresses'
  AND column_name IN ('type', 'isDefault', 'createdAt', 'updatedAt')
ORDER BY ordinal_position;
