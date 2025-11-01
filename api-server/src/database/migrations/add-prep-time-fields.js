/**
 * Migración para agregar campos de tiempo de preparación
 * - restaurants.average_prep_time
 * - orders.estimated_prep_time
 * - orders.estimated_ready_time
 * - orders.confirmed_at
 */

const { Client } = require('pg');

async function runMigration() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'delivery_db',
  });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');

    // Iniciar transacción
    await client.query('BEGIN');

    // 1. Agregar campo average_prep_time a restaurants
    console.log('📝 Agregando campo average_prep_time a restaurants...');
    await client.query(`
      ALTER TABLE restaurants 
      ADD COLUMN IF NOT EXISTS average_prep_time INTEGER DEFAULT 15;
    `);
    console.log('✅ Campo average_prep_time agregado');

    // 2. Agregar campos de tiempo a orders
    console.log('📝 Agregando campos de tiempo a orders...');
    
    await client.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS estimated_prep_time INTEGER;
    `);
    console.log('✅ Campo estimated_prep_time agregado');

    await client.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS estimated_ready_time TIMESTAMPTZ;
    `);
    console.log('✅ Campo estimated_ready_time agregado');

    await client.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;
    `);
    console.log('✅ Campo confirmed_at agregado');

    // 3. Actualizar restaurantes existentes con tiempo por defecto
    console.log('📝 Actualizando restaurantes existentes...');
    await client.query(`
      UPDATE restaurants 
      SET average_prep_time = 15 
      WHERE average_prep_time IS NULL;
    `);
    console.log('✅ Restaurantes actualizados');

    // Confirmar transacción
    await client.query('COMMIT');
    console.log('✅ Migración completada exitosamente');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error en la migración:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Conexión cerrada');
  }
}

// Ejecutar migración
runMigration()
  .then(() => {
    console.log('🎉 Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
