import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum VehicleType {
  MOTO = 'moto',
  BICICLETA = 'bicicleta',
  AUTO = 'auto',
}

export enum ApplicationStatus {
  DRAFT = 'draft', // Guardado pero no enviado
  PENDING_CALL = 'pending_call', // Paso 1 enviado, esperando llamada del admin
  PENDING_COMPLETION = 'pending_completion', // Admin llamó y aprobó, puede completar paso 2
  PENDING_REVIEW = 'pending_review', // Paso 2 completado, esperando aprobación final
  APPROVED = 'approved', // Aprobado, usuario es ahora driver
  REJECTED = 'rejected', // Rechazado
}

@Entity('driver_applications')
export class DriverApplication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  // ========== DATOS OBLIGATORIOS (Etapa 1) ==========
  @Column({ length: 20 })
  dni: string;

  @Column({
    type: 'enum',
    enum: VehicleType,
    name: 'vehicle_type',
  })
  vehicleType: VehicleType;

  @Column({ type: 'date', name: 'birth_date' })
  birthDate: Date;

  // ========== DATOS OPCIONALES (Etapa 2) ==========
  @Column({ length: 100, nullable: true, name: 'full_name' })
  fullName?: string;

  @Column({ length: 20, nullable: true })
  phone?: string;

  @Column({ length: 100, nullable: true })
  email?: string;

  @Column({ length: 50, nullable: true, name: 'license_number' })
  licenseNumber?: string;

  @Column({ type: 'date', nullable: true, name: 'license_expiry' })
  licenseExpiry?: Date;

  @Column({ length: 20, nullable: true, name: 'vehicle_plate' })
  vehiclePlate?: string;

  @Column({ length: 50, nullable: true, name: 'vehicle_brand' })
  vehicleBrand?: string;

  @Column({ length: 50, nullable: true, name: 'vehicle_model' })
  vehicleModel?: string;

  @Column({ type: 'int', nullable: true, name: 'vehicle_year' })
  vehicleYear?: number;

  @Column({ length: 100, nullable: true, name: 'emergency_contact_name' })
  emergencyContactName?: string;

  @Column({ length: 20, nullable: true, name: 'emergency_contact_phone' })
  emergencyContactPhone?: string;

  // ========== FOTOS DE DOCUMENTOS ==========
  @Column({ type: 'text', nullable: true, name: 'dni_photo' })
  dniPhoto?: string;

  @Column({ type: 'text', nullable: true, name: 'license_front_photo' })
  licenseFrontPhoto?: string;

  @Column({ type: 'text', nullable: true, name: 'license_back_photo' })
  licenseBackPhoto?: string;

  @Column({ type: 'text', nullable: true, name: 'vehicle_photo' })
  vehiclePhoto?: string;

  // ========== ESTADO Y REVISIÓN ==========
  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.DRAFT,
  })
  status: ApplicationStatus;

  @Column({ type: 'text', nullable: true, name: 'rejection_reason' })
  rejectionReason?: string;

  @Column({ nullable: true, name: 'reviewed_by' })
  reviewedBy?: string;

  @Column({ type: 'timestamp', nullable: true, name: 'reviewed_at' })
  reviewedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
