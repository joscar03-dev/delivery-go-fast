import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MenuOptionGroup } from '../entities/menu-option-group.entity';

@Entity('menu_options')
export class MenuOption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  extraPrice: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ManyToOne(() => MenuOptionGroup, (g: MenuOptionGroup) => g.options, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'group_id' })
  group: MenuOptionGroup;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
