import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { User } from '../../users/entities/user.entity';

@Entity('order_payments')
export class OrderPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  @OneToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'payment_method_code', length: 50 })
  paymentMethodCode: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({
    name: 'delivery_fee',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  deliveryFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  // Campos para pago en efectivo
  @Column({
    name: 'cash_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  cashAmount?: number;

  @Column({
    name: 'change_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  changeAmount?: number;

  // Campos para Yape/Plin
  @Column({ name: 'transaction_reference', length: 255, nullable: true })
  transactionReference?: string;

  @Column({ name: 'payment_proof_url', length: 255, nullable: true })
  paymentProofUrl?: string;

  // Campos para tarjeta
  @Column({ name: 'card_last_digits', length: 4, nullable: true })
  cardLastDigits?: string;

  @Column({ name: 'card_brand', length: 50, nullable: true })
  cardBrand?: string;

  @Column({ name: 'transaction_id', length: 255, nullable: true })
  transactionId?: string;

  @Column({ name: 'payment_status', length: 50, default: 'pending' })
  paymentStatus: string;

  @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
  verifiedAt?: Date;

  @Column({ name: 'verified_by', type: 'uuid', nullable: true })
  verifiedBy?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'verified_by' })
  verifier?: User;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
