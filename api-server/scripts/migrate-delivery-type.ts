import dataSource from '../src/database/data-source';

async function migrateDeliveryType() {
  try {
    await dataSource.initialize();
    console.log('✅ Conexión establecida\n');

    const queryRunner = dataSource.createQueryRunner();

    // Ver estado actual
    const before = await queryRunner.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_delivery_enabled = true THEN 1 ELSE 0 END) as enabled,
        SUM(CASE WHEN is_delivery_enabled = false THEN 1 ELSE 0 END) as disabled,
        SUM(CASE WHEN delivery_type = 'platform' THEN 1 ELSE 0 END) as platform,
        SUM(CASE WHEN delivery_type = 'none' THEN 1 ELSE 0 END) as none
      FROM restaurant_delivery_config;
    `);

    console.log('📊 Estado ANTES de migración:');
    console.table(before);

    // Migrar: delivery desactivado → type 'none'
    const result = await queryRunner.query(`
      UPDATE restaurant_delivery_config
      SET delivery_type = 'none'
      WHERE is_delivery_enabled = false;
    `);

    console.log(
      `\n✅ Actualización completada: ${result[1]} registros actualizados\n`,
    );

    // Ver estado después
    const after = await queryRunner.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_delivery_enabled = true THEN 1 ELSE 0 END) as enabled,
        SUM(CASE WHEN is_delivery_enabled = false THEN 1 ELSE 0 END) as disabled,
        SUM(CASE WHEN delivery_type = 'platform' THEN 1 ELSE 0 END) as platform,
        SUM(CASE WHEN delivery_type = 'none' THEN 1 ELSE 0 END) as none
      FROM restaurant_delivery_config;
    `);

    console.log('📊 Estado DESPUÉS de migración:');
    console.table(after);

    // Mostrar algunos registros
    const samples = await queryRunner.query(`
      SELECT id, restaurant_id, is_delivery_enabled, delivery_type
      FROM restaurant_delivery_config
      LIMIT 5;
    `);

    console.log('\n📋 Ejemplos de configuraciones:');
    console.table(samples);

    await queryRunner.release();
    await dataSource.destroy();

    console.log('\n✨ Migración completada exitosamente!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

migrateDeliveryType();
