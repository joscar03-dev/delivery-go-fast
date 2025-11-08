-- Agregar campo phone a la tabla users
ALTER TABLE users 
ADD COLUMN phone VARCHAR(20);

-- Nota: Si quieres hacerlo obligatorio después de que todos tengan teléfono:
-- ALTER TABLE users ALTER COLUMN phone SET NOT NULL;

-- Crear índice para búsquedas por teléfono
CREATE INDEX idx_users_phone ON users(phone);
