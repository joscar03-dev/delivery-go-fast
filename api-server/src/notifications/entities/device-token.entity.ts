import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * Entidad para almacenar tokens de dispositivos para push notifications
 */
@Entity('device_tokens')
@Index(['userId', 'token'], { unique: true })
export class DeviceToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  /**
   * Token FCM del dispositivo
   */
  @Column({ type: 'varchar', length: 500 })
  token: string;

  /**
   * Plataforma del dispositivo
   */
  @Column({
    type: 'enum',
    enum: ['ios', 'android', 'web'],
    default: 'android',
  })
  platform: 'ios' | 'android' | 'web';

  /**
   * Información adicional del dispositivo (modelo, versión, etc)
   */
  @Column({ type: 'jsonb', nullable: true })
  deviceInfo?: {
    model?: string;
    manufacturer?: string;
    osVersion?: string;
    appVersion?: string;
  };

  /**
   * Si el dispositivo está activo/habilitado para recibir notificaciones
   */
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  /**
   * Última vez que se verificó que el token es válido
   */
  @Column({ type: 'timestamp', nullable: true, name: 'last_used_at' })
  lastUsedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
