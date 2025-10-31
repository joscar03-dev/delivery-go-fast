import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Restaurant } from './restaurant.entity';
import { MenuOption } from './menu-option.entity';
import { MenuItem } from './menu-item.entity';

@Entity('menu_option_groups')
export class MenuOptionGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  // Reglas del grupo
  @Column({ type: 'int', default: 0 })
  minSelect: number;

  @Column({ type: 'int', default: 0 })
  maxSelect: number; // 0 = ilimitado

  @Column({ type: 'boolean', default: true })
  isRequired: boolean;

  @ManyToOne(() => Restaurant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  @OneToMany(() => MenuOption, (o) => o.group, { cascade: true })
  options: MenuOption[];

  // Vinculación con ítems del menú que usan este grupo
  @ManyToMany(() => MenuItem)
  @JoinTable({
    name: 'menu_item_option_groups',
    joinColumn: { name: 'group_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'menu_item_id', referencedColumnName: 'id' },
  })
  menuItems: MenuItem[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
