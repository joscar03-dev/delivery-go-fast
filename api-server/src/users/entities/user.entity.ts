import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Role } from '../../auth/entities/role.entity';
import { Restaurant } from '../../restaurants/entities/restaurant.entity';
import { Address } from './address.entity';
import { Order } from '../../orders/entities/order.entity';

/**
 * Tipo de método de autenticación
 */
export type AuthMethod = 'email' | 'phone' | 'social';

@Entity('users') // Nombre de la tabla en la base de datos
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Email es opcional ahora - usuarios con phone pueden no tener email
  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  email?: string;

  // Password es opcional - usuarios con phone auth no tienen password
  @Column({ type: 'varchar', nullable: true })
  password_hash?: string;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  // 🆕 PHONE AUTHENTICATION FIELDS

  /**
   * Número de teléfono con código de país (formato E.164)
   * Ejemplo: +51987654321
   */
  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  @Index('idx_users_phone') // Índice para búsquedas rápidas
  phone?: string;

  /**
   * Indica si el teléfono fue verificado con OTP
   */
  @Column({ name: 'phone_verified', type: 'boolean', default: false })
  phoneVerified: boolean;

  /**
   * Método de autenticación usado por el usuario
   * - 'email': Email + Password tradicional
   * - 'phone': Teléfono + OTP
   * - 'social': Google, Facebook, Apple
   */
  @Column({
    name: 'auth_method',
    type: 'varchar',
    length: 20,
    default: 'email',
  })
  @Index('idx_users_auth_method')
  authMethod: AuthMethod;

  /**
   * Indica si el usuario está activo en el sistema
   * - true: Usuario puede acceder y usar el sistema
   * - false: Usuario bloqueado/desactivado
   */
  @Column({ name: 'is_active', type: 'boolean', default: true })
  @Index('idx_users_is_active')
  isActive: boolean;

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
