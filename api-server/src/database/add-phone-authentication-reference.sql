-- ================================================
-- MIGRACIÓN: Agregar Phone Authentication
-- Fecha: 7 de noviembre de 2025
-- Descripción: Agrega soporte para autenticación con teléfono + OTP
--              manteniendo compatibilidad con email/password existente
-- ================================================

-- Verificar que la tabla users existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        RAISE EXCEPTION 'La tabla users no existe. Ejecuta las migraciones base primero.';
    END IF;
END $$;

-- ================================================
-- 1. AGREGAR COLUMNAS PARA PHONE AUTHENTICATION
-- ================================================

-- Agregar columna phone (número con código de país, ej: +51987654321)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20) UNIQUE;

-- Agregar columna phone_verified (indica si el teléfono fue verificado con OTP)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;

-- Agregar columna auth_method (método de autenticación usado)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS auth_method VARCHAR(20) DEFAULT 'email';

-- ================================================
-- 2. AGREGAR CHECK CONSTRAINTS
-- ================================================

-- Validar que auth_method sea uno de los valores permitidos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_auth_method_check'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT users_auth_method_check 
        CHECK (auth_method IN ('email', 'phone', 'social'));
    END IF;
END $$;

-- Validar que phone tenga formato E.164 si no es NULL
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_phone_format_check'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT users_phone_format_check 
        CHECK (phone IS NULL OR phone ~ '^\+[1-9]\d{1,14}$');
    END IF;
END $$;

-- ================================================
-- 3. CREAR ÍNDICES PARA PERFORMANCE
-- ================================================

-- Índice para búsquedas por teléfono
CREATE INDEX IF NOT EXISTS idx_users_phone 
ON users(phone) 
WHERE phone IS NOT NULL;

-- Índice para búsquedas por método de autenticación
CREATE INDEX IF NOT EXISTS idx_users_auth_method 
ON users(auth_method);

-- ================================================
-- 4. AGREGAR COMENTARIOS A LAS COLUMNAS
-- ================================================

COMMENT ON COLUMN users.phone IS 
'Número de teléfono con código de país en formato E.164 (ej: +51987654321)';

COMMENT ON COLUMN users.phone_verified IS 
'TRUE si el teléfono fue verificado mediante código OTP. FALSE por defecto.';

COMMENT ON COLUMN users.auth_method IS 
'Método de autenticación usado: email (email/password), phone (OTP), social (Google/Facebook)';

-- ================================================
-- 5. ACTUALIZAR USUARIOS EXISTENTES
-- ================================================

-- Todos los usuarios existentes usan email/password, por lo tanto:
-- - auth_method ya está en 'email' por defecto
-- - phone es NULL (pueden agregarlo después en su perfil)
-- - phone_verified es FALSE
-- No se requiere UPDATE porque los defaults ya se aplican

-- ================================================
-- 6. MODIFICAR CONSTRAINTS EXISTENTES (OPCIONAL)
-- ================================================

-- IMPORTANTE: Si antes tenías email como NOT NULL, ahora debe ser nullable
-- porque usuarios con phone auth pueden no tener email

-- Verificar si email tiene constraint NOT NULL y eliminarlo
DO $$
BEGIN
    -- Hacer email nullable si era NOT NULL
    ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
    
    -- Hacer password nullable (usuarios con phone no tienen password)
    ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
    
    RAISE NOTICE 'Columnas email y password ahora son opcionales (nullable)';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Las columnas ya eran nullable o no se pudo modificar: %', SQLERRM;
END $$;

-- ================================================
-- 7. AGREGAR CONSTRAINT LÓGICO
-- ================================================

-- Validar que el usuario tenga AL MENOS email O phone
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_email_or_phone_required'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT users_email_or_phone_required 
        CHECK (email IS NOT NULL OR phone IS NOT NULL);
    END IF;
END $$;

-- ================================================
-- 8. VERIFICACIÓN FINAL
-- ================================================

-- Contar usuarios existentes
DO $$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    RAISE NOTICE '✅ Migración completada exitosamente';
    RAISE NOTICE '📊 Total de usuarios en la BD: %', user_count;
    RAISE NOTICE '🔐 Todos los usuarios existentes mantienen auth_method=email';
    RAISE NOTICE '📱 Los usuarios pueden agregar su teléfono en el perfil';
END $$;

-- ================================================
-- ROLLBACK (en caso de necesitar revertir)
-- ================================================

-- Para revertir esta migración, ejecutar:
/*
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_auth_method_check;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_phone_format_check;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_or_phone_required;
DROP INDEX IF EXISTS idx_users_phone;
DROP INDEX IF EXISTS idx_users_auth_method;
ALTER TABLE users DROP COLUMN IF EXISTS phone;
ALTER TABLE users DROP COLUMN IF EXISTS phone_verified;
ALTER TABLE users DROP COLUMN IF EXISTS auth_method;
-- Revertir email y password a NOT NULL si lo necesitas
-- ALTER TABLE users ALTER COLUMN email SET NOT NULL;
-- ALTER TABLE users ALTER COLUMN password SET NOT NULL;
*/

-- ================================================
-- NOTAS IMPORTANTES
-- ================================================

-- 1. Esta migración es BACKWARD COMPATIBLE:
--    - Usuarios existentes NO se afectan
--    - Login con email/password sigue funcionando
--    - auth_method='email' es el default
--
-- 2. Después de ejecutar esta migración:
--    - Backend puede aceptar login con phone
--    - Frontend puede mostrar opción de phone login
--    - Usuarios pueden agregar phone en su perfil
--
-- 3. Validaciones implementadas:
--    - phone debe ser único (si existe)
--    - phone debe tener formato E.164 (+51...)
--    - auth_method solo acepta: email, phone, social
--    - Al menos email O phone debe existir
--
-- 4. Para ejecutar esta migración:
--    psql -U tu_usuario -d delivery_go_fast -f migrations/add-phone-authentication.sql
--    O usar el script: node run-migration.js add-phone-authentication
