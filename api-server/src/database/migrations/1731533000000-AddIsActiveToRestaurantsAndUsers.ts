import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsActiveToRestaurantsAndUsers1731533000000
  implements MigrationInterface
{
  name = 'AddIsActiveToRestaurantsAndUsers1731533000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar columna is_active a la tabla restaurants
    await queryRunner.query(`
      ALTER TABLE "restaurants" 
      ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true
    `);

    // Crear índice para consultas eficientes
    await queryRunner.query(`
      CREATE INDEX "idx_restaurants_is_active" 
      ON "restaurants" ("is_active")
    `);

    // Agregar columna is_active a la tabla users
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true
    `);

    // Crear índice para consultas eficientes
    await queryRunner.query(`
      CREATE INDEX "idx_users_is_active" 
      ON "users" ("is_active")
    `);

    // Agregar comentarios para documentación
    await queryRunner.query(`
      COMMENT ON COLUMN "restaurants"."is_active" IS 
      'Indica si el restaurante está activo y puede recibir pedidos'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "users"."is_active" IS 
      'Indica si el usuario está activo y puede acceder al sistema'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índices
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_users_is_active"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_restaurants_is_active"
    `);

    // Eliminar columnas
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN "is_active"
    `);

    await queryRunner.query(`
      ALTER TABLE "restaurants" DROP COLUMN "is_active"
    `);
  }
}
