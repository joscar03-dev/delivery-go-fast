-- Migration: create_payment_tables
-- Ejecutar después de las migraciones existentes

-- 1. Tabla de configuración de delivery por restaurante
CREATE TABLE IF NOT EXISTS restaurant_delivery_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    free_delivery_threshold DECIMAL(10,2),
    min_order_amount DECIMAL(10,2),
    max_delivery_distance INTEGER DEFAULT 10,
    estimated_delivery_time INTEGER DEFAULT 30,
    is_delivery_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT uq_restaurant_delivery UNIQUE(restaurant_id)
);

-- 2. Tabla de métodos de pago
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    icon_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Insertar métodos de pago por defecto
INSERT INTO payment_methods (code, name, description, is_active) VALUES
('cash', 'Efectivo', 'Pago en efectivo al recibir el pedido', true),
('yape', 'Yape', 'Transferencia mediante Yape', true),
('plin', 'Plin', 'Transferencia mediante Plin', true),
('card', 'Tarjeta', 'Pago con tarjeta de crédito/débito', false)
ON CONFLICT (code) DO NOTHING;

-- 4. Tabla de información de pago por pedido
CREATE TABLE IF NOT EXISTS order_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_method_code VARCHAR(50) NOT NULL REFERENCES payment_methods(code),
    amount DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    subtotal DECIMAL(10,2) NOT NULL,
    
    -- Para pagos en efectivo
    cash_amount DECIMAL(10,2),
    change_amount DECIMAL(10,2),
    
    -- Para pagos con Yape/Plin
    transaction_reference VARCHAR(255),
    payment_proof_url VARCHAR(255),
    
    -- Para pagos con tarjeta
    card_last_digits VARCHAR(4),
    card_brand VARCHAR(50),
    transaction_id VARCHAR(255),
    
    payment_status VARCHAR(50) DEFAULT 'pending',
    verified_at TIMESTAMP,
    verified_by UUID REFERENCES users(id),
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT uq_order_payment UNIQUE(order_id)
);

-- 5. Modificar tabla orders para agregar campos de delivery
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS delivery_address_id UUID REFERENCES addresses(id),
ADD COLUMN IF NOT EXISTS delivery_latitude DECIMAL(10,8),
ADD COLUMN IF NOT EXISTS delivery_longitude DECIMAL(11,8);

-- 6. Índices para optimización
CREATE INDEX IF NOT EXISTS idx_order_payments_order_id ON order_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_payments_status ON order_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_restaurant_delivery_restaurant_id ON restaurant_delivery_config(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_address ON orders(delivery_address_id);

-- 7. Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_restaurant_delivery_config_updated_at BEFORE UPDATE ON restaurant_delivery_config
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_payments_updated_at BEFORE UPDATE ON order_payments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Insertar configuración de delivery por defecto para restaurantes existentes
INSERT INTO restaurant_delivery_config (restaurant_id, delivery_fee, estimated_delivery_time)
SELECT id, 5.00, 30 FROM restaurants
ON CONFLICT (restaurant_id) DO NOTHING;

-- 9. Actualizar pedidos existentes con subtotal y delivery_fee
UPDATE orders 
SET subtotal = total, 
    delivery_fee = 0.00
WHERE subtotal = 0.00;
