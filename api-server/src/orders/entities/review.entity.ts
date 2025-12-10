import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';

/**
 * Entidad para almacenar encuestas POST de satisfacción del cliente
 * Encuesta detallada con 11 preguntas para análisis académico
 *
 * Fecha actualización: 9 de diciembre de 2025
 *
 * DIMENSIONES:
 * - Interfaz/Usabilidad: q1, q2, q3
 * - Precisión: q4, q5
 * - Monitoreo: q6, q7
 * - Puntualidad/Eficiencia: q8, q9
 * - Satisfacción General: q10, q11
 */
@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ==========================================
  // DIMENSIÓN 1: INTERFAZ/USABILIDAD (3 preguntas)
  // ==========================================

  // Pregunta 1: Velocidad de carga de la app
  // ¿Qué tan rápido fue abrir la app y empezar tu pedido?
  // 1=Muy lento, 2=Lento, 3=Aceptable, 4=Rápido, 5=Muy rápido
  @Column({ type: 'smallint', name: 'q1_app_loading_speed', default: 3 })
  q1AppLoadingSpeed: number;

  // Pregunta 2: Facilidad de selección de productos
  // ¿Qué tan fácil fue seleccionar productos e ingresar datos?
  // 1=Muy difícil, 2=Difícil, 3=Regular, 4=Fácil, 5=Muy fácil
  @Column({ type: 'smallint', name: 'q2_product_selection_ease', default: 3 })
  q2ProductSelectionEase: number;

  // Pregunta 3: Facilidad de navegación del menú
  // ¿Qué tan fácil fue encontrar el menú y ver precios?
  // 1=Muy difícil, 2=Difícil, 3=Regular, 4=Fácil, 5=Muy fácil
  @Column({ type: 'smallint', name: 'q3_menu_navigation_ease', default: 3 })
  q3MenuNavigationEase: number;

  // ==========================================
  // DIMENSIÓN 2: PRECISIÓN (2 preguntas)
  // ==========================================

  // Pregunta 4: Coincidencia del pedido
  // ¿El pedido coincide con lo seleccionado en la pantalla?
  // 1=Muchos errores, 2=Varios errores, 3=Pocos errores, 4=Casi idéntico, 5=Idéntico
  @Column({ type: 'smallint', name: 'q4_order_accuracy', default: 3 })
  q4OrderAccuracy: number;

  // Pregunta 5: Corrección de monto y dirección
  // ¿El monto y dirección fueron correctos?
  // 1=Incorrectos, 2=Mayormente incorrectos, 3=Parcialmente correctos, 4=Casi correctos, 5=Totalmente correctos
  @Column({ type: 'smallint', name: 'q5_payment_address_accuracy', default: 3 })
  q5PaymentAddressAccuracy: number;

  // ==========================================
  // DIMENSIÓN 3: MONITOREO (2 preguntas)
  // ==========================================

  // Pregunta 6: Visibilidad del proceso de pedido
  // ¿La app mostró visualmente las etapas del pedido?
  // 1=No mostró nada, 2=Muy poco, 3=Algunas etapas, 4=Casi todo, 5=Todo el proceso
  @Column({
    type: 'smallint',
    name: 'q6_order_tracking_visibility',
    default: 3,
  })
  q6OrderTrackingVisibility: number;

  // Pregunta 7: Necesidad de comunicación externa
  // ¿Sintió necesidad de llamar al restaurante/repartidor?
  // 1=Llamé varias veces, 2=Llamé una vez, 3=Dudé pero no llamé, 4=Casi no necesité, 5=No necesité llamar
  @Column({ type: 'smallint', name: 'q7_communication_need', default: 3 })
  q7CommunicationNeed: number;

  // ==========================================
  // DIMENSIÓN 4: PUNTUALIDAD/EFICIENCIA (2 preguntas)
  // ==========================================

  // Pregunta 8: Puntualidad de entrega
  // ¿El pedido llegó en el rango de tiempo estimado?
  // 1=Mucho después, 2=Después, 3=Casi en rango, 4=En rango, 5=A tiempo o antes
  @Column({ type: 'smallint', name: 'q8_delivery_timeliness', default: 3 })
  q8DeliveryTimeliness: number;

  // Pregunta 9: Comparación con pedido por teléfono
  // ¿La app fue más rápida que pedir por teléfono?
  // 1=Mucho más lenta, 2=Más lenta, 3=Igual, 4=Más rápida, 5=Mucho más rápida
  @Column({ type: 'smallint', name: 'q9_app_vs_phone_speed', default: 3 })
  q9AppVsPhoneSpeed: number;

  // ==========================================
  // DIMENSIÓN 5: SATISFACCIÓN GENERAL (2 preguntas)
  // ==========================================

  // Pregunta 10: Satisfacción general con la experiencia
  // ¿Cuál es tu satisfacción general con la app?
  // 1=Muy insatisfecho, 2=Insatisfecho, 3=Neutral, 4=Satisfecho, 5=Muy satisfecho
  @Column({ type: 'smallint', name: 'q10_overall_satisfaction', default: 3 })
  q10OverallSatisfaction: number;

  // Pregunta 11: Probabilidad de recomendación
  // ¿Recomendarías la app a tus amigos?
  // 1=No la recomendaría, 2=Muy poco, 3=Moderadamente, 4=Bastante, 5=Totalmente
  @Column({
    type: 'smallint',
    name: 'q11_recommendation_likelihood',
    default: 3,
  })
  q11RecommendationLikelihood: number;

  // ==========================================
  // COMENTARIOS ADICIONALES (OPCIONAL)
  // ==========================================
  @Column({ type: 'text', nullable: true })
  comment: string;

  // ==========================================
  // RELACIÓN CON PEDIDO
  // ==========================================
  @OneToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // ==========================================
  // MÉTODOS DE AYUDA PARA ANÁLISIS
  // ==========================================

  /**
   * Calcula el promedio de las preguntas de Interfaz/Usabilidad (q1, q2, q3)
   */
  getUsabilityAverage(): number {
    return (
      (this.q1AppLoadingSpeed +
        this.q2ProductSelectionEase +
        this.q3MenuNavigationEase) /
      3
    );
  }

  /**
   * Calcula el promedio de las preguntas de Precisión (q4, q5)
   */
  getPrecisionAverage(): number {
    return (this.q4OrderAccuracy + this.q5PaymentAddressAccuracy) / 2;
  }

  /**
   * Calcula el promedio de las preguntas de Monitoreo (q6, q7)
   */
  getMonitoringAverage(): number {
    return (this.q6OrderTrackingVisibility + this.q7CommunicationNeed) / 2;
  }

  /**
   * Calcula el promedio de las preguntas de Eficiencia (q8, q9)
   */
  getEfficiencyAverage(): number {
    return (this.q8DeliveryTimeliness + this.q9AppVsPhoneSpeed) / 2;
  }

  /**
   * Calcula el promedio de las preguntas de Satisfacción (q10, q11)
   */
  getSatisfactionAverage(): number {
    return (this.q10OverallSatisfaction + this.q11RecommendationLikelihood) / 2;
  }

  /**
   * Calcula el promedio general de todas las preguntas
   */
  getOverallAverage(): number {
    return (
      (this.q1AppLoadingSpeed +
        this.q2ProductSelectionEase +
        this.q3MenuNavigationEase +
        this.q4OrderAccuracy +
        this.q5PaymentAddressAccuracy +
        this.q6OrderTrackingVisibility +
        this.q7CommunicationNeed +
        this.q8DeliveryTimeliness +
        this.q9AppVsPhoneSpeed +
        this.q10OverallSatisfaction +
        this.q11RecommendationLikelihood) /
      11
    );
  }
}
