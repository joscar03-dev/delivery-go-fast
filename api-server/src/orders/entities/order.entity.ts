import { OrderStatus } from 'src/common/enums/order-status.enum';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { User } from 'src/users/entities/user.entity';
import { OrderItem } from './order-item.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relación: Un pedido pertenece a un cliente
  @ManyToOne(() => User)
  @JoinColumn({ name: 'client_id' })
  client: User;

  // Relación: Un pedido puede ser tomado por un repartidor
  @ManyToOne(() => User, { nullable: true }) // Un repartidor puede no estar asignado aún
  @JoinColumn({ name: 'driver_id' })
  driver: User;

  // Relación: Un pedido pertenece a un restaurante
  @ManyToOne(() => Restaurant)
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  deliveryAddress: string;

  // Relación: Un pedido tiene muchos items
  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, {
    cascade: true,
  })
  items: OrderItem[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
