import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePaymentTables1730860000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si las tablas ya existen
    const hasOrders = await queryRunner.hasTable('orders');
    if (!hasOrders) {
      throw new Error(
        'La tabla orders debe existir antes de ejecutar esta migración',
      );
    }

    // 1. Crear tabla restaurant_delivery_config
    const hasDeliveryConfig = await queryRunner.hasTable(
      'restaurant_delivery_config',
    );
    if (!hasDeliveryConfig) {
      await queryRunner.query(`
        CREATE TABLE restaurant_delivery_config (
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
      `);

      // Índice para optimización
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_restaurant_delivery_restaurant_id 
        ON restaurant_delivery_config(restaurant_id);
      `);
    }

    // 2. Crear tabla payment_methods
    const hasPaymentMethods = await queryRunner.hasTable('payment_methods');
    if (!hasPaymentMethods) {
      await queryRunner.query(`
        CREATE TABLE payment_methods (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          code VARCHAR(50) NOT NULL UNIQUE,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          is_active BOOLEAN DEFAULT true,
          icon_url VARCHAR(255),
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);

      // Insertar métodos de pago por defecto
      await queryRunner.query(`
        INSERT INTO payment_methods (code, name, description, is_active) VALUES
        ('cash', 'Efectivo', 'Pago en efectivo al recibir el pedido', true),
        ('yape', 'Yape', 'Transferencia mediante Yape', true),
        ('plin', 'Plin', 'Transferencia mediante Plin', true),
        ('card', 'Tarjeta', 'Pago con tarjeta de crédito/débito', false)
        ON CONFLICT (code) DO NOTHING;
      `);
    }

    // 3. Crear tabla order_payments
    const hasOrderPayments = await queryRunner.hasTable('order_payments');
    if (!hasOrderPayments) {
      await queryRunner.query(`
        CREATE TABLE order_payments (
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
      `);

      // Índices para optimización
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_order_payments_order_id 
        ON order_payments(order_id);
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_order_payments_status 
        ON order_payments(payment_status);
      `);
    }

    // 4. Modificar tabla orders para agregar campos de delivery
    const hasSubtotal = await queryRunner.hasColumn('orders', 'subtotal');
    if (!hasSubtotal) {
      await queryRunner.query(`
        ALTER TABLE orders 
        ADD COLUMN subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00;
      `);
    }

    const hasDeliveryFee = await queryRunner.hasColumn(
      'orders',
      'delivery_fee',
    );
    if (!hasDeliveryFee) {
      await queryRunner.query(`
        ALTER TABLE orders 
        ADD COLUMN delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00;
      `);
    }

    const hasDeliveryAddressId = await queryRunner.hasColumn(
      'orders',
      'delivery_address_id',
    );
    if (!hasDeliveryAddressId) {
      await queryRunner.query(`
        ALTER TABLE orders 
        ADD COLUMN delivery_address_id UUID REFERENCES addresses(id);
      `);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_orders_delivery_address 
        ON orders(delivery_address_id);
      `);
    }

    const hasDeliveryLatitude = await queryRunner.hasColumn(
      'orders',
      'delivery_latitude',
    );
    if (!hasDeliveryLatitude) {
      await queryRunner.query(`
        ALTER TABLE orders 
        ADD COLUMN delivery_latitude DECIMAL(10,8);
      `);
    }

    const hasDeliveryLongitude = await queryRunner.hasColumn(
      'orders',
      'delivery_longitude',
    );
    if (!hasDeliveryLongitude) {
      await queryRunner.query(`
        ALTER TABLE orders 
        ADD COLUMN delivery_longitude DECIMAL(11,8);
      `);
    }

    // 5. Crear triggers para actualizar updated_at
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Trigger para restaurant_delivery_config
    const hasTriggerDeliveryConfig = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_restaurant_delivery_config_updated_at'
      );
    `);

    if (!hasTriggerDeliveryConfig[0].exists) {
      await queryRunner.query(`
        CREATE TRIGGER update_restaurant_delivery_config_updated_at 
        BEFORE UPDATE ON restaurant_delivery_config
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `);
    }

    // Trigger para order_payments
    const hasTriggerOrderPayments = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_order_payments_updated_at'
      );
    `);

    if (!hasTriggerOrderPayments[0].exists) {
      await queryRunner.query(`
        CREATE TRIGGER update_order_payments_updated_at 
        BEFORE UPDATE ON order_payments
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `);
    }

    // 6. Insertar configuración de delivery por defecto para restaurantes existentes
    await queryRunner.query(`
      INSERT INTO restaurant_delivery_config (restaurant_id, delivery_fee, estimated_delivery_time)
      SELECT id, 5.00, 30 FROM restaurants
      ON CONFLICT (restaurant_id) DO NOTHING;
    `);

    // 7. Actualizar pedidos existentes con subtotal y delivery_fee
    await queryRunner.query(`
      UPDATE orders 
      SET subtotal = total, 
          delivery_fee = 0.00
      WHERE subtotal = 0.00;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar triggers
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS update_order_payments_updated_at ON order_payments;
    `);

    await queryRunner.query(`
      DROP TRIGGER IF EXISTS update_restaurant_delivery_config_updated_at ON restaurant_delivery_config;
    `);

    // Eliminar columnas de orders
    await queryRunner.query(`
      ALTER TABLE orders DROP COLUMN IF EXISTS delivery_longitude;
    `);

    await queryRunner.query(`
      ALTER TABLE orders DROP COLUMN IF EXISTS delivery_latitude;
    `);

    await queryRunner.query(`
      ALTER TABLE orders DROP COLUMN IF EXISTS delivery_address_id;
    `);

    await queryRunner.query(`
      ALTER TABLE orders DROP COLUMN IF EXISTS delivery_fee;
    `);

    await queryRunner.query(`
      ALTER TABLE orders DROP COLUMN IF EXISTS subtotal;
    `);

    // Eliminar tablas
    await queryRunner.query(`DROP TABLE IF EXISTS order_payments CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS payment_methods CASCADE;`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS restaurant_delivery_config CASCADE;`,
    );

    // Eliminar función si no se usa en otros triggers
    await queryRunner.query(`
      DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
    `);
  }
}
