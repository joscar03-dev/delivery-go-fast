-- Migración para habilitar PostGIS y configurar las extensiones necesarias
-- Ejecutar como superusuario de PostgreSQL

-- Habilitar la extensión PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Habilitar la extensión para funciones de distancia
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Verificar que PostGIS esté instalado correctamente
SELECT PostGIS_Version();

-- Crear índices espaciales para mejorar el rendimiento
-- (Se ejecutarán automáticamente cuando TypeORM cree las tablas)

-- Ejemplo de cómo crear manualmente un índice espacial en la tabla restaurants:
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_restaurants_location_gist 
-- ON restaurants USING GIST (location);

-- Verificar índices espaciales existentes:
-- SELECT 
--     schemaname, 
--     tablename, 
--     indexname, 
--     indexdef 
-- FROM pg_indexes 
-- WHERE indexdef LIKE '%GIST%' 
-- AND tablename = 'restaurants';
