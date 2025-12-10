import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración para actualizar la tabla reviews con las 11 preguntas detalladas
 * de la encuesta POST académica
 *
 * Fecha: 9 de diciembre de 2025
 *
 * ESTRUCTURA:
 * - 3 preguntas de Interfaz/Usabilidad (q1, q2, q3)
 * - 2 preguntas de Precisión (q4, q5)
 * - 2 preguntas de Monitoreo (q6, q7)
 * - 2 preguntas de Puntualidad/Eficiencia (q8, q9)
 * - 2 preguntas de Satisfacción General (q10, q11)
 */
export class UpdateReviewsWithDetailedSurvey1733725200000
  implements MigrationInterface
{
  name = 'UpdateReviewsWithDetailedSurvey1733725200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ==========================================
    // PASO 1: ELIMINAR COLUMNAS DE ENCUESTA ANTERIOR
    // ==========================================
    console.log('📋 Eliminando columnas de encuesta anterior...');

    await queryRunner.query(`
      ALTER TABLE "reviews" 
      DROP COLUMN IF EXISTS "usability_rating"
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
      DROP COLUMN IF EXISTS "monitoring_answer"
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS "monitoring_answer_enum"
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
      DROP COLUMN IF EXISTS "general_satisfaction"
    `);

    // ==========================================
    // PASO 2: AGREGAR NUEVAS 11 PREGUNTAS
    // ==========================================
    console.log('📊 Agregando 11 preguntas detalladas de encuesta POST...');

    // ==========================================
    // DIMENSIÓN: INTERFAZ/USABILIDAD
    // ==========================================

    // Pregunta 1: Velocidad de carga
    await queryRunner.query(`
      ALTER TABLE "reviews" 
      ADD COLUMN "q1_app_loading_speed" SMALLINT NOT NULL DEFAULT 3
        CHECK ("q1_app_loading_speed" >= 1 AND "q1_app_loading_speed" <= 5)
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "reviews"."q1_app_loading_speed" IS 
      'P1: ¿Qué tan rápido fue abrir la app y empezar tu pedido? 1=Muy lento, 5=Muy rápido'
    `);

    // Pregunta 2: Facilidad de selección
    await queryRunner.query(`
      ALTER TABLE "reviews" 
      ADD COLUMN "q2_product_selection_ease" SMALLINT NOT NULL DEFAULT 3
        CHECK ("q2_product_selection_ease" >= 1 AND "q2_product_selection_ease" <= 5)
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "reviews"."q2_product_selection_ease" IS 
      'P2: ¿Qué tan fácil fue seleccionar productos e ingresar datos? 1=Muy difícil, 5=Muy fácil'
    `);

    // Pregunta 3: Facilidad de navegación
    await queryRunner.query(`
      ALTER TABLE "reviews" 
      ADD COLUMN "q3_menu_navigation_ease" SMALLINT NOT NULL DEFAULT 3
        CHECK ("q3_menu_navigation_ease" >= 1 AND "q3_menu_navigation_ease" <= 5)
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "reviews"."q3_menu_navigation_ease" IS 
      'P3: ¿Qué tan fácil fue encontrar el menú y ver precios? 1=Muy difícil, 5=Muy fácil'
    `);

    // ==========================================
    // DIMENSIÓN: PRECISIÓN
    // ==========================================

    // Pregunta 4: Coincidencia del pedido
    await queryRunner.query(`
      ALTER TABLE "reviews" 
      ADD COLUMN "q4_order_accuracy" SMALLINT NOT NULL DEFAULT 3
        CHECK ("q4_order_accuracy" >= 1 AND "q4_order_accuracy" <= 5)
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "reviews"."q4_order_accuracy" IS 
      'P4: ¿El pedido coincide con lo seleccionado? 1=Muchos errores, 5=Idéntico'
    `);

    // Pregunta 5: Corrección de monto y dirección
    await queryRunner.query(`
      ALTER TABLE "reviews" 
      ADD COLUMN "q5_payment_address_accuracy" SMALLINT NOT NULL DEFAULT 3
        CHECK ("q5_payment_address_accuracy" >= 1 AND "q5_payment_address_accuracy" <= 5)
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "reviews"."q5_payment_address_accuracy" IS 
      'P5: ¿Monto y dirección fueron correctos? 1=Incorrectos, 5=Totalmente correctos'
    `);

    // ==========================================
    // DIMENSIÓN: MONITOREO
    // ==========================================

    // Pregunta 6: Visibilidad del proceso
    await queryRunner.query(`
      ALTER TABLE "reviews" 
      ADD COLUMN "q6_order_tracking_visibility" SMALLINT NOT NULL DEFAULT 3
        CHECK ("q6_order_tracking_visibility" >= 1 AND "q6_order_tracking_visibility" <= 5)
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "reviews"."q6_order_tracking_visibility" IS 
      'P6: ¿Vio las etapas del pedido visualmente? 1=No mostró nada, 5=Mostró todo'
    `);

    // Pregunta 7: Necesidad de llamar
    await queryRunner.query(`
      ALTER TABLE "reviews" 
      ADD COLUMN "q7_communication_need" SMALLINT NOT NULL DEFAULT 3
        CHECK ("q7_communication_need" >= 1 AND "q7_communication_need" <= 5)
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "reviews"."q7_communication_need" IS 
      'P7: ¿Sintió necesidad de llamar al restaurante? 1=Llamé varias veces, 5=No necesité llamar'
    `);

    // ==========================================
    // DIMENSIÓN: PUNTUALIDAD/EFICIENCIA
    // ==========================================

    // Pregunta 8: Puntualidad de entrega
    await queryRunner.query(`
      ALTER TABLE "reviews" 
      ADD COLUMN "q8_delivery_timeliness" SMALLINT NOT NULL DEFAULT 3
        CHECK ("q8_delivery_timeliness" >= 1 AND "q8_delivery_timeliness" <= 5)
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "reviews"."q8_delivery_timeliness" IS 
      'P8: ¿Llegó en el rango estimado? 1=Mucho después, 5=A tiempo o antes'
    `);

    // Pregunta 9: Comparación con teléfono
    await queryRunner.query(`
      ALTER TABLE "reviews" 
      ADD COLUMN "q9_app_vs_phone_speed" SMALLINT NOT NULL DEFAULT 3
        CHECK ("q9_app_vs_phone_speed" >= 1 AND "q9_app_vs_phone_speed" <= 5)
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "reviews"."q9_app_vs_phone_speed" IS 
      'P9: ¿App más rápida que teléfono? 1=Mucho más lenta, 5=Mucho más rápida'
    `);

    // ==========================================
    // DIMENSIÓN: SATISFACCIÓN GENERAL
    // ==========================================

    // Pregunta 10: Satisfacción general
    await queryRunner.query(`
      ALTER TABLE "reviews" 
      ADD COLUMN "q10_overall_satisfaction" SMALLINT NOT NULL DEFAULT 3
        CHECK ("q10_overall_satisfaction" >= 1 AND "q10_overall_satisfaction" <= 5)
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "reviews"."q10_overall_satisfaction" IS 
      'P10: Satisfacción general con la app. 1=Muy insatisfecho, 5=Muy satisfecho'
    `);

    // Pregunta 11: Recomendación
    await queryRunner.query(`
      ALTER TABLE "reviews" 
      ADD COLUMN "q11_recommendation_likelihood" SMALLINT NOT NULL DEFAULT 3
        CHECK ("q11_recommendation_likelihood" >= 1 AND "q11_recommendation_likelihood" <= 5)
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "reviews"."q11_recommendation_likelihood" IS 
      'P11: ¿Recomendaría la app? 1=No la recomendaría, 5=La recomendaría totalmente'
    `);

    // ==========================================
    // PASO 3: CREAR ÍNDICES PARA ANÁLISIS
    // ==========================================
    console.log('🔍 Creando índices para análisis estadístico...');

    // Índices para cada dimensión
    await queryRunner.query(`
      CREATE INDEX "idx_reviews_usability_q1" 
      ON "reviews" ("q1_app_loading_speed")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_reviews_usability_q2" 
      ON "reviews" ("q2_product_selection_ease")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_reviews_usability_q3" 
      ON "reviews" ("q3_menu_navigation_ease")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_reviews_precision_q4" 
      ON "reviews" ("q4_order_accuracy")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_reviews_precision_q5" 
      ON "reviews" ("q5_payment_address_accuracy")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_reviews_monitoring_q6" 
      ON "reviews" ("q6_order_tracking_visibility")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_reviews_monitoring_q7" 
      ON "reviews" ("q7_communication_need")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_reviews_efficiency_q8" 
      ON "reviews" ("q8_delivery_timeliness")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_reviews_efficiency_q9" 
      ON "reviews" ("q9_app_vs_phone_speed")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_reviews_satisfaction_q10" 
      ON "reviews" ("q10_overall_satisfaction")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_reviews_recommendation_q11" 
      ON "reviews" ("q11_recommendation_likelihood")
    `);

    // Índice compuesto para análisis de satisfacción general
    await queryRunner.query(`
      CREATE INDEX "idx_reviews_satisfaction_composite" 
      ON "reviews" ("q10_overall_satisfaction", "q11_recommendation_likelihood", "created_at")
    `);

    console.log('✅ Tabla reviews actualizada con 11 preguntas detalladas');
    console.log('');
    console.log('📊 ESTRUCTURA DE LA ENCUESTA:');
    console.log('   - Interfaz/Usabilidad: q1, q2, q3');
    console.log('   - Precisión: q4, q5');
    console.log('   - Monitoreo: q6, q7');
    console.log('   - Puntualidad/Eficiencia: q8, q9');
    console.log('   - Satisfacción General: q10, q11');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ==========================================
    // REVERTIR CAMBIOS
    // ==========================================
    console.log('⏪ Revirtiendo cambios en tabla reviews...');

    // Eliminar índices
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_reviews_satisfaction_composite"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_reviews_recommendation_q11"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_reviews_satisfaction_q10"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_reviews_efficiency_q9"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_reviews_efficiency_q8"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_reviews_monitoring_q7"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_reviews_monitoring_q6"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_reviews_precision_q5"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_reviews_precision_q4"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_reviews_usability_q3"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_reviews_usability_q2"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_reviews_usability_q1"
    `);

    // Eliminar las 11 columnas de preguntas
    await queryRunner.query(`
      ALTER TABLE "reviews" 
      DROP COLUMN IF EXISTS "q11_recommendation_likelihood"
    `);

    await queryRunner.query(`
      ALTER TABLE "reviews" 
      DROP COLUMN IF EXISTS "q10_overall_satisfaction"
    `);

    await queryRunner.query(`
      ALTER TABLE "reviews" 
      DROP COLUMN IF EXISTS "q9_app_vs_phone_speed"
    `);

    await queryRunner.query(`
      ALTER TABLE "reviews" 
      DROP COLUMN IF EXISTS "q8_delivery_timeliness"
    `);

    await queryRunner.query(`
      ALTER TABLE "reviews" 
      DROP COLUMN IF EXISTS "q7_communication_need"
    `);

    await queryRunner.query(`
      ALTER TABLE "reviews" 
      DROP COLUMN IF EXISTS "q6_order_tracking_visibility"
    `);

    await queryRunner.query(`
      ALTER TABLE "reviews" 
      DROP COLUMN IF EXISTS "q5_payment_address_accuracy"
    `);

    await queryRunner.query(`
      ALTER TABLE "reviews" 
      DROP COLUMN IF EXISTS "q4_order_accuracy"
    `);

    await queryRunner.query(`
      ALTER TABLE "reviews" 
      DROP COLUMN IF EXISTS "q3_menu_navigation_ease"
    `);

    await queryRunner.query(`
      ALTER TABLE "reviews" 
      DROP COLUMN IF EXISTS "q2_product_selection_ease"
    `);

    await queryRunner.query(`
      ALTER TABLE "reviews" 
      DROP COLUMN IF EXISTS "q1_app_loading_speed"
    `);

    // Restaurar columnas de encuesta anterior
    console.log('📋 Restaurando columnas de encuesta anterior...');

    await queryRunner.query(`
      ALTER TABLE "reviews" 
      ADD COLUMN "usability_rating" SMALLINT
    `);

    await queryRunner.query(`
      CREATE TYPE "precision_answer_enum" AS ENUM ('yes', 'no', 'errors')
    `);

    await queryRunner.query(`
      ALTER TABLE "reviews" 
      ADD COLUMN "precision_answer" "precision_answer_enum"
    `);

    await queryRunner.query(`
      CREATE TYPE "monitoring_answer_enum" AS ENUM ('very_useful', 'useful', 'not_used')
    `);

    await queryRunner.query(`
      ALTER TABLE "reviews" 
      ADD COLUMN "monitoring_answer" "monitoring_answer_enum"
    `);

    await queryRunner.query(`
      CREATE TYPE "punctuality_answer_enum" AS ENUM ('on_time', 'delayed')
    `);

    await queryRunner.query(`
      ALTER TABLE "reviews" 
      ADD COLUMN "punctuality_answer" "punctuality_answer_enum"
    `);

    await queryRunner.query(`
      ALTER TABLE "reviews" 
      ADD COLUMN "general_satisfaction" SMALLINT
    `);

    console.log('✅ Cambios revertidos a estructura anterior');
  }
}
