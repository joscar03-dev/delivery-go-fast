import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Restaurant } from './restaurant.entity';
import { MenuItem } from './menu-item.entity';

@Entity('menu_categories')
export class MenuCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number; // Para ordenar las categorías en el menú

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // Relación: Una categoría de menú pertenece a un restaurante
  @ManyToOne(() => Restaurant, (restaurant) => restaurant.menuCategories, {
    nullable: false,
  })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  // Relación: Una categoría de menú tiene muchos ítems
  @OneToMany(() => MenuItem, (menuItem) => menuItem.category)
  menuItems: MenuItem[];
}
