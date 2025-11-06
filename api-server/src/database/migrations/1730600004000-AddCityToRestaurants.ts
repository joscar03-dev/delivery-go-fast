import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCityToRestaurants1730600004000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasRestaurants = await queryRunner.hasTable('restaurants');
    if (!hasRestaurants) return;

    const hasCity = await queryRunner.hasColumn('restaurants', 'city');
    if (hasCity) return;

    // Add city column (nullable initially, can be populated later)
    await queryRunner.query(`
      ALTER TABLE restaurants 
      ADD COLUMN IF NOT EXISTS city VARCHAR(100);
    `);

    // Optionally set a default city for existing restaurants
    await queryRunner.query(`
      UPDATE restaurants 
      SET city = 'Lima' 
      WHERE city IS NULL;
    `);

    // Add index for city filtering
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_restaurants_city 
      ON restaurants(city);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasRestaurants = await queryRunner.hasTable('restaurants');
    if (!hasRestaurants) return;

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_restaurants_city;
    `);

    await queryRunner.query(`
      ALTER TABLE restaurants 
      DROP COLUMN IF EXISTS city;
    `);
  }
}
