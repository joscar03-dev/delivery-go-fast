import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeliveryTypeColumn1731268712000 implements MigrationInterface {
  name = 'AddDeliveryTypeColumn1731268712000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Crear tipo enum para delivery_type
    await queryRunner.query(`
      CREATE TYPE "delivery_type_enum" AS ENUM ('none', 'restaurant', 'platform')
    `);

    // 2. Agregar columna delivery_type con valor por defecto
    await queryRunner.query(`
      ALTER TABLE "restaurant_delivery_config" 
      ADD COLUMN "delivery_type" "delivery_type_enum" DEFAULT 'platform'
    `);

    // 3. Migrar datos existentes basados en is_delivery_enabled
    await queryRunner.query(`
      UPDATE "restaurant_delivery_config" 
      SET "delivery_type" = CASE 
        WHEN "is_delivery_enabled" = true THEN 'platform'::delivery_type_enum
        ELSE 'none'::delivery_type_enum
      END
    `);

    // 4. Hacer la columna NOT NULL después de migrar datos
    await queryRunner.query(`
      ALTER TABLE "restaurant_delivery_config" 
      ALTER COLUMN "delivery_type" SET NOT NULL
    `);

    // 5. Crear índice para mejorar performance en queries
    await queryRunner.query(`
      CREATE INDEX "idx_restaurant_delivery_config_delivery_type" 
      ON "restaurant_delivery_config" ("delivery_type")
    `);

    console.log('✅ Migración completada: delivery_type agregado');
    console.log('📊 Datos migrados: is_delivery_enabled → delivery_type');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir en orden inverso
    await queryRunner.query(`
      DROP INDEX "idx_restaurant_delivery_config_delivery_type"
    `);

    await queryRunner.query(`
      ALTER TABLE "restaurant_delivery_config" 
      DROP COLUMN "delivery_type"
    `);

    await queryRunner.query(`
      DROP TYPE "delivery_type_enum"
    `);

    console.log('⏪ Migración revertida: delivery_type eliminado');
  }
}
