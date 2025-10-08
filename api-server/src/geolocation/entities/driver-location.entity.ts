import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('driver_locations')
export class DriverLocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'driver_id' })
  driver: User;

  @Column({ name: 'driver_id' })
  driverId: string;

  @Column('decimal', { precision: 10, scale: 8 })
  latitude: number;

  @Column('decimal', { precision: 11, scale: 8 })
  longitude: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  heading: number; // Dirección en grados (0-360)

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  speed: number; // Velocidad en km/h

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  accuracy: number; // Precisión en metros

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
