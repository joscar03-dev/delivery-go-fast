import dataSource from '../src/database/data-source';

async function checkDeliveryType() {
  try {
    await dataSource.initialize();
    console.log('✅ Conexión establecida\n');

    // Verificar columnas de la tabla
    const queryRunner = dataSource.createQueryRunner();
    const columns = await queryRunner.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'restaurant_delivery_config'
      ORDER BY ordinal_position;
    `);

    console.log('📊 Columnas de restaurant_delivery_config:');
    console.table(columns);

    // Verificar datos existentes
    const configs = await queryRunner.query(`
      SELECT id, restaurant_id, delivery_fee, is_delivery_enabled, delivery_type
      FROM restaurant_delivery_config
      LIMIT 5;
    `);

    console.log('\n📋 Configuraciones existentes:');
    console.table(configs);

    await queryRunner.release();
    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkDeliveryType();
