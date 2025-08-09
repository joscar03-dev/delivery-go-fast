import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Calificación de 1 a 5 estrellas
  @Column({ type: 'smallint' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  // Una reseña pertenece a una sola orden
  @OneToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;
}
