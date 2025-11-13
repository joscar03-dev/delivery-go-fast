import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración para actualizar la tabla reviews para encuesta POST académica
 * Reemplaza las columnas antiguas (rating, driver_rating, restaurant_rating)
 * por las nuevas dimensiones de la encuesta de satisfacción
 */
export class UpdateReviewsTableForSurvey1731536000000
  implements MigrationInterface
{
  name = 'UpdateReviewsTableForSurvey1731536000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ==========================================
    // PASO 1: ELIMINAR COLUMNAS ANTIGUAS
    // ==========================================
    console.log('📋 Eliminando columnas antiguas de reviews...');

    // Eliminar columna rating (si existe)
    await queryRunner.query(`
      ALTER TABLE "reviews" 
      DROP COLUMN IF EXISTS "rating"
    `);

    // Eliminar columna driver_rating (si existe)
    await queryRunner.query(`
      ALTER TABLE "reviews" 
      DROP COLUMN IF EXISTS "driver_rating"
    `);

    // Eliminar columna restaurant_rating (si existe)
    await queryRunner.query(`
      ALTER TABLE "reviews" 
      DROP COLUMN IF EXISTS "restaurant_rating"
    `);

    // ==========================================
    // PASO 2: AGREGAR NUEVAS COLUMNAS DE ENCUESTA
    // ==========================================
    console.log('📊 Agregando columnas de encuesta POST académica...');

    // DIMENSIÓN 1: USABILIDAD/INTERFAZ (1-5)
    await queryRunner.query(`
      ALTER TABLE "reviews" 
      ADD COLUMN "usability_rating" SMALLINT NOT NULL DEFAULT 3
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "reviews"."usability_rating" IS 
      '¿Qué tan fácil fue hacer tu pedido en nuestra app? Escala: 1=Muy Difícil, 5=Muy Fácil'
    `);

    // DIMENSIÓN 2: PRECISIÓN (yes/no/errors)
    await queryRunner.query(`
      CREATE TYPE "precision_answer_enum" AS ENUM ('yes', 'no', 'errors')
    `);

    await queryRunner.query(`
      ALTER TABLE "reviews" 
      ADD COLUMN "precision_answer" "precision_answer_enum" NOT NULL DEFAULT 'yes'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "reviews"."precision_answer" IS 
      '¿Tu pedido llegó completo y correcto? Opciones: yes, no, errors'
    `);

    // DIMENSIÓN 3: MONITOREO (very_useful/useful/not_used)
    await queryRunner.query(`
      CREATE TYPE "monitoring_answer_enum" AS ENUM ('very_useful', 'useful', 'not_used')
    `);

    await queryRunner.query(`
      ALTER TABLE "reviews" 
      ADD COLUMN "monitoring_answer" "monitoring_answer_enum" NOT NULL DEFAULT 'useful'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "reviews"."monitoring_answer" IS 
      '¿Te fue útil el seguimiento en tiempo real? Opciones: very_useful, useful, not_used'
    `);

    // DIMENSIÓN 4: PUNTUALIDAD (on_time/delayed)
    await queryRunner.query(`
      CREATE TYPE "punctuality_answer_enum" AS ENUM ('on_time', 'delayed')
    `);

    await queryRunner.query(`
      ALTER TABLE "reviews" 
      ADD COLUMN "punctuality_answer" "punctuality_answer_enum" NOT NULL DEFAULT 'on_time'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "reviews"."punctuality_answer" IS 
      '¿Tu pedido llegó en el tiempo estimado? Opciones: on_time, delayed'
    `);

    // VARIABLE DEPENDIENTE: SATISFACCIÓN GENERAL (1-5)
    await queryRunner.query(`
      ALTER TABLE "reviews" 
      ADD COLUMN "general_satisfaction" SMALLINT NOT NULL DEFAULT 3
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "reviews"."general_satisfaction" IS 
      'Satisfacción general con la experiencia en la app. Escala: 1=Muy Insatisfecho, 5=Muy Satisfecho'
    `);

    // TIMESTAMP DE CREACIÓN
    await queryRunner.query(`
      ALTER TABLE "reviews" 
      ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    `);

    // ==========================================
    // PASO 3: CREAR ÍNDICES PARA ANÁLISIS
    // ==========================================
    console.log('🔍 Creando índices para análisis académico...');

    await queryRunner.query(`
      CREATE INDEX "idx_reviews_usability_rating" 
      ON "reviews" ("usability_rating")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_reviews_general_satisfaction" 
      ON "reviews" ("general_satisfaction")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_reviews_created_at" 
      ON "reviews" ("created_at")
    `);

    console.log('✅ Tabla reviews actualizada para encuesta POST académica');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ==========================================
    // REVERTIR CAMBIOS
    // ==========================================
    console.log('⏪ Revirtiendo cambios en tabla reviews...');

    // Eliminar índices
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_reviews_created_at"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_reviews_general_satisfaction"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_reviews_usability_rating"
    `);

    // Eliminar columnas nuevas
    await queryRunner.query(`
      ALTER TABLE "reviews" 
      DROP COLUMN IF EXISTS "created_at"
    `);

    await queryRunner.query(`
      ALTER TABLE "reviews" 
      DROP COLUMN IF EXISTS "general_satisfaction"
    `);

    await queryRunner.query(`
      ALTER TABLE "reviews" 
      DROP COLUMN IF EXISTS "punctuality_answer"
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS "punctuality_answer_enum"
    `);

    await queryRunner.query(`
      ALTER TABLE "reviews" 
      DROP COLUMN IF EXISTS "monitoring_answer"
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS "monitoring_answer_enum"
    `);

    await queryRunner.query(`
      ALTER TABLE "reviews" 
      DROP COLUMN IF EXISTS "precision_answer"
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS "precision_answer_enum"
    `);

    await queryRunner.query(`
      ALTER TABLE "reviews" 
      DROP COLUMN IF EXISTS "usability_rating"
    `);

    // Restaurar columnas antiguas (sin datos)
    await queryRunner.query(`
      ALTER TABLE "reviews" 
      ADD COLUMN "rating" SMALLINT
    `);

    await queryRunner.query(`
      ALTER TABLE "reviews" 
      ADD COLUMN "driver_rating" SMALLINT
    `);

    await queryRunner.query(`
      ALTER TABLE "reviews" 
      ADD COLUMN "restaurant_rating" SMALLINT
    `);

    console.log('✅ Cambios revertidos');
  }
}
