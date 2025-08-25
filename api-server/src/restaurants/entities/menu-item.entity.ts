import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Restaurant } from './restaurant.entity';
import { MenuCategory } from './menu-category.entity';

@Entity('menu_items')
export class MenuItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ name: 'image_url', type: 'varchar', nullable: true })
  imageUrl: string;

  // Relación: Un item del menú pertenece a un restaurante
  @ManyToOne(() => Restaurant)
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  // Relación: Un item del menú pertenece a una categoría de menú
  @ManyToOne(() => MenuCategory, (menuCategory) => menuCategory.menuItems)
  @JoinColumn({ name: 'menu_category_id' })
  category: MenuCategory;
}
