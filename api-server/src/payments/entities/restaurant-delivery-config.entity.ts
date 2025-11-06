import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Restaurant } from '../../restaurants/entities/restaurant.entity';

@Entity('restaurant_delivery_config')
export class RestaurantDeliveryConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'restaurant_id', type: 'uuid', unique: true })
  restaurantId: string;

  @OneToOne(() => Restaurant)
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  @Column({
    name: 'delivery_fee',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  deliveryFee: number;

  @Column({
    name: 'free_delivery_threshold',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  freeDeliveryThreshold?: number;

  @Column({
    name: 'min_order_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  minOrderAmount?: number;

  @Column({ name: 'max_delivery_distance', type: 'int', default: 10 })
  maxDeliveryDistance: number;

  @Column({ name: 'estimated_delivery_time', type: 'int', default: 30 })
  estimatedDeliveryTime: number;

  @Column({ name: 'is_delivery_enabled', default: true })
  isDeliveryEnabled: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
