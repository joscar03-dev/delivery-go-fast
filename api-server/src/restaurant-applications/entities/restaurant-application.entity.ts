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
import { RestaurantCategory } from '../../restaurants/entities/restaurant-category.entity';
import { City } from '../../common/enums/city.enum';

export enum ApplicationStatus {
  PENDING = 'pending', // Enviado, esperando revisión
  UNDER_REVIEW = 'under_review', // En proceso de revisión
  APPROVED = 'approved', // Aprobado - restaurante creado
  REJECTED = 'rejected', // Rechazado
}

@Entity('restaurant_applications')
export class RestaurantApplication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Usuario que aplica (debe estar logueado)
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  // ========== DATOS DEL NEGOCIO ==========
  @Column({ length: 255, name: 'business_name' })
  businessName: string;

  @Column({ length: 20, name: 'business_phone' })
  businessPhone: string;

  @Column({ length: 100, name: 'business_email', nullable: true })
  businessEmail?: string;

  @Column({ type: 'text' })
  address: string;

  @ManyToOne(() => RestaurantCategory, { eager: true })
  @JoinColumn({ name: 'category_id' })
  category: RestaurantCategory;

  @Column({ name: 'category_id' })
  categoryId: string;

  @Column({ type: 'enum', enum: City })
  city: City;

  // ========== DATOS DEL REPRESENTANTE ==========
  @Column({ length: 255, name: 'owner_name' })
  ownerName: string;

  @Column({ length: 20, name: 'owner_dni' })
  ownerDni: string;

  // ========== COMENTARIOS ADICIONALES ==========
  @Column({ type: 'text', nullable: true, name: 'additional_comments' })
  additionalComments?: string;

  // ========== ESTADO Y REVISIÓN ==========
  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.PENDING,
  })
  status: ApplicationStatus;

  @Column({ type: 'text', nullable: true, name: 'admin_notes' })
  adminNotes?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewed_by' })
  reviewer?: User;

  @Column({ name: 'reviewed_by', nullable: true })
  reviewedBy?: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'reviewed_at' })
  reviewedAt?: Date;

  // ========== ID DEL RESTAURANTE CREADO (al aprobar) ==========
  @Column({ type: 'uuid', nullable: true, name: 'restaurant_id' })
  restaurantId?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
