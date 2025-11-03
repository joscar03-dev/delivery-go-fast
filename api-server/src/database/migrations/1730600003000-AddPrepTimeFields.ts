import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPrepTimeFields1730600003000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // restaurants.average_prep_time
    await queryRunner.query(`
      ALTER TABLE restaurants 
      ADD COLUMN IF NOT EXISTS average_prep_time INTEGER DEFAULT 15;
    `);

    // orders.estimated_prep_time
    await queryRunner.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS estimated_prep_time INTEGER;
    `);

    // orders.estimated_ready_time
    await queryRunner.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS estimated_ready_time TIMESTAMPTZ;
    `);

    // orders.confirmed_at
    await queryRunner.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;
    `);

    // Set default value for existing restaurants
    await queryRunner.query(`
      UPDATE restaurants 
      SET average_prep_time = 15 
      WHERE average_prep_time IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE orders DROP COLUMN IF EXISTS confirmed_at;`,
    );
    await queryRunner.query(
      `ALTER TABLE orders DROP COLUMN IF EXISTS estimated_ready_time;`,
    );
    await queryRunner.query(
      `ALTER TABLE orders DROP COLUMN IF EXISTS estimated_prep_time;`,
    );
    await queryRunner.query(
      `ALTER TABLE restaurants DROP COLUMN IF EXISTS average_prep_time;`,
    );
  }
}
