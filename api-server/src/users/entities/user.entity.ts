import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Role } from '../../auth/entities/role.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { Address } from './address.entity';
import { Order } from 'src/orders/entities/order.entity';
@Entity('users') // Nombre de la tabla en la base de datos
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  email: string;

  @Column({ type: 'varchar' })
  password_hash: string;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'role_id' }) // Esto creará la columna 'role_id' en la tabla 'users'
  role: Role;

  // Un usuario puede ser dueño de muchos restaurantes.
  @OneToMany(() => Restaurant, (restaurant) => restaurant.owner)
  ownedRestaurants: Restaurant[];

  // Relaciones para tener la entidad completa
  @OneToMany(() => Address, (address) => address.user)
  addresses: Address[];

  @OneToMany(() => Order, (order) => order.client)
  ordersAsClient: Order[];

  @OneToMany(() => Order, (order) => order.driver)
  ordersAsDriver: Order[];

  @Column({ name: 'hashed_refresh_token', type: 'varchar', nullable: true })
  hashedRefreshToken: string;
}
