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
 * Mide el impacto de la app en diferentes dimensiones
 */
@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ==========================================
  // DIMENSIÓN 1: USABILIDAD/INTERFAZ
  // ==========================================
  // ¿Qué tan fácil fue hacer tu pedido en nuestra app?
  // Escala: 1=Muy Difícil, 2=Difícil, 3=Neutral, 4=Fácil, 5=Muy Fácil
  @Column({ type: 'smallint', name: 'usability_rating' })
  usabilityRating: number;

  // ==========================================
  // DIMENSIÓN 2: PRECISIÓN
  // ==========================================
  // ¿Tu pedido llegó completo y correcto?
  // Opciones: 'yes' | 'no' | 'errors'
  @Column({
    type: 'enum',
    enum: ['yes', 'no', 'errors'],
    name: 'precision_answer',
  })
  precisionAnswer: 'yes' | 'no' | 'errors';

  // ==========================================
  // DIMENSIÓN 3: MONITOREO
  // ==========================================
  // ¿Te fue útil el seguimiento en tiempo real?
  // Opciones: 'very_useful' | 'useful' | 'not_used'
  @Column({
    type: 'enum',
    enum: ['very_useful', 'useful', 'not_used'],
    name: 'monitoring_answer',
  })
  monitoringAnswer: 'very_useful' | 'useful' | 'not_used';

  // ==========================================
  // DIMENSIÓN 4: EFICIENCIA/PUNTUALIDAD
  // ==========================================
  // ¿Tu pedido llegó en el tiempo estimado?
  // Opciones: 'on_time' | 'delayed'
  @Column({
    type: 'enum',
    enum: ['on_time', 'delayed'],
    name: 'punctuality_answer',
  })
  punctualityAnswer: 'on_time' | 'delayed';

  // ==========================================
  // VARIABLE DEPENDIENTE: SATISFACCIÓN GENERAL
  // ==========================================
  // ¿Cuál es tu satisfacción general con la experiencia?
  // Escala: 1=Muy Insatisfecho, 2=Insatisfecho, 3=Neutral, 4=Satisfecho, 5=Muy Satisfecho
  @Column({ type: 'smallint', name: 'general_satisfaction' })
  generalSatisfaction: number;

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

  // NOTA: Se eliminaron campos antiguos (rating, driverRating, restaurantRating)
  // Esta es una encuesta académica POST para medir dimensiones específicas
}
