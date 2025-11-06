import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixUpdateTrigger1730772000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Eliminar la función antigua si existe
    await queryRunner.query(`
      DROP FUNCTION IF EXISTS update_modified_column() CASCADE;
    `);

    // 2. Crear la función CORRECTA con snake_case
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_modified_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // 3. Recrear triggers para todas las tablas que tienen updated_at
    const tables = [
      'addresses',
      'users',
      'restaurants',
      'menu_categories',
      'menu_option_groups',
      'menu_options',
      'restaurant_categories',
      'orders',
      'driver_locations',
      'device_tokens',
    ];

    for (const table of tables) {
      // Eliminar trigger antiguo si existe
      await queryRunner.query(`
        DROP TRIGGER IF EXISTS update_${table}_modtime ON ${table};
      `);

      // Crear trigger nuevo
      await queryRunner.query(`
        CREATE TRIGGER update_${table}_modtime
            BEFORE UPDATE ON ${table}
            FOR EACH ROW
            EXECUTE FUNCTION update_modified_column();
      `);
    }

    console.log('✅ Trigger update_modified_column corregido exitosamente');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Para hacer rollback: recrear la función antigua (con el bug)
    await queryRunner.query(`
      DROP FUNCTION IF EXISTS update_modified_column() CASCADE;
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_modified_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updatedAt = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    const tables = [
      'addresses',
      'users',
      'restaurants',
      'menu_categories',
      'menu_option_groups',
      'menu_options',
      'restaurant_categories',
      'orders',
      'driver_locations',
      'device_tokens',
    ];

    for (const table of tables) {
      await queryRunner.query(`
        DROP TRIGGER IF EXISTS update_${table}_modtime ON ${table};
      `);

      await queryRunner.query(`
        CREATE TRIGGER update_${table}_modtime
            BEFORE UPDATE ON ${table}
            FOR EACH ROW
            EXECUTE FUNCTION update_modified_column();
      `);
    }

    console.log('⚠️  Rollback: Trigger revertido a la versión antigua');
  }
}
