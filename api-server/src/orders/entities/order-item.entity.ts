import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { MenuItem } from 'src/restaurants/entities/menu-item.entity';
@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  quantity: number;

  // Guardamos el precio al momento de la compra por si cambia en el futuro
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unit_price: number;

  // Comentario específico del ítem (ej: sin cebolla)
  @Column({ type: 'text', nullable: true })
  comment?: string;

  // Opciones/selecciones adicionales (JSON)
  @Column({ type: 'jsonb', nullable: true })
  options?: any;

  // Relación: Un item de pedido pertenece a una orden
  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  // Relación con MenuItem (la crearemos a continuación)
  @ManyToOne(() => MenuItem)
  @JoinColumn({ name: 'menu_item_id' })
  menuItem: MenuItem;
}
