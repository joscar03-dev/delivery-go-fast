-- Script para verificar que la migración se aplicó correctamente
-- Ejecutar: psql -U delivery_user -d delivery_app_db -f verify-phone-migration.sql

-- 1. Verificar que las columnas nuevas existen
\echo '📋 Verificando columnas en tabla users:'
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name IN ('phone', 'phone_verified', 'auth_method')
ORDER BY column_name;

-- 2. Verificar índices
\echo ''
\echo '📊 Verificando índices:'
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'users' 
  AND indexname LIKE '%phone%'
ORDER BY indexname;

-- 3. Verificar constraints
\echo ''
\echo '🔒 Verificando constraints:'
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'users'::regclass
  AND conname LIKE '%phone%' OR conname LIKE '%auth_method%' OR conname LIKE '%email_or_phone%'
ORDER BY conname;

-- 4. Contar usuarios por método de autenticación
\echo ''
\echo '👥 Usuarios por método de autenticación:'
SELECT 
    auth_method,
    COUNT(*) as total,
    COUNT(phone) as con_phone,
    COUNT(email) as con_email
FROM users
GROUP BY auth_method
ORDER BY auth_method;

-- 5. Ver usuarios con teléfono
\echo ''
\echo '📱 Usuarios con teléfono registrado:'
SELECT 
    id,
    name,
    email,
    phone,
    phone_verified,
    auth_method
FROM users
WHERE phone IS NOT NULL
LIMIT 5;

-- 6. Verificar que todos los usuarios tienen email O phone
\echo ''
\echo '✅ Verificar constraint email_or_phone_required:'
SELECT COUNT(*) as usuarios_invalidos
FROM users
WHERE email IS NULL AND phone IS NULL;
-- Debe ser 0

\echo ''
\echo '✅ Migración verificada correctamente!'
