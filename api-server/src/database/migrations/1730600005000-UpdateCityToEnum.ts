import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateCityToEnum1730600005000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasRestaurants = await queryRunner.hasTable('restaurants');
    if (!hasRestaurants) return;

    const hasCity = await queryRunner.hasColumn('restaurants', 'city');
    if (!hasCity) return;

    // Verificar si ya existe el enum con el nombre correcto de TypeORM
    const enumExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'restaurants_city_enum'
      );
    `);

    if (!enumExists[0].exists) {
      // Crear el tipo enum con el nombre que TypeORM espera
      await queryRunner.query(`
        CREATE TYPE restaurants_city_enum AS ENUM ('Bagua', 'Bagua Grande', 'Chachapoyas', 'Jaen');
      `);

      // Convertir la columna a tipo enum
      await queryRunner.query(`
        ALTER TABLE restaurants 
        ALTER COLUMN city TYPE restaurants_city_enum 
        USING city::restaurants_city_enum;
      `);
    } else {
      // Si el enum ya existe, solo actualizar la columna si no es del tipo correcto
      const columnType = await queryRunner.query(`
        SELECT data_type, udt_name 
        FROM information_schema.columns 
        WHERE table_name = 'restaurants' AND column_name = 'city';
      `);

      if (
        columnType[0]?.data_type !== 'USER-DEFINED' ||
        columnType[0]?.udt_name !== 'restaurants_city_enum'
      ) {
        // La columna existe pero no es del tipo enum, convertirla
        await queryRunner.query(`
          ALTER TABLE restaurants 
          ALTER COLUMN city TYPE restaurants_city_enum 
          USING city::restaurants_city_enum;
        `);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasRestaurants = await queryRunner.hasTable('restaurants');
    if (!hasRestaurants) return;

    // Convertir de vuelta a VARCHAR
    await queryRunner.query(`
      ALTER TABLE restaurants 
      ALTER COLUMN city TYPE VARCHAR(100);
    `);

    // Eliminar el tipo enum
    await queryRunner.query(`
      DROP TYPE IF EXISTS restaurants_city_enum;
    `);
  }
}
