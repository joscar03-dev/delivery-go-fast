import { User } from '../../users/entities/user.entity'; // Para el dueño/admin del restaurante
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
  Point,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { RestaurantCategory } from './restaurant-category.entity';
import { MenuCategory } from './menu-category.entity';
import { Order } from 'src/orders/entities/order.entity';
import { MenuItem } from './menu-item.entity';
import { City } from '../../common/enums/city.enum';

@Entity('restaurants')
export class Restaurant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  address: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ type: 'enum', enum: City, nullable: true })
  city: City;

  @Column({ name: 'image_url', type: 'varchar', nullable: true })
  imageUrl: string;

  // Tiempo promedio de preparación en minutos (por defecto 15 min)
  @Column({ name: 'average_prep_time', type: 'int', default: 15 })
  averagePrepTime: number;

  // 💡 ¡AQUÍ USAMOS POSTGIS!
  // Guardamos la ubicación geográfica como un punto (longitud, latitud).
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326, // Sistema de coordenadas estándar (WGS 84)
    nullable: true,
  })
  location: Point;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // Aquí añadiremos relaciones (e.g., a MenuItem) más adelante
  @OneToMany(() => MenuItem, (menuItem) => menuItem.restaurant)
  menuItems: MenuItem[];

  // Relación: Un Restaurante tiene muchas Órdenes.
  @OneToMany(() => Order, (order) => order.restaurant)
  orders: Order[];

  // Relación: Un restaurante pertenece a una categoría de restaurante
  @ManyToOne(() => RestaurantCategory, (category) => category.restaurants)
  @JoinColumn({ name: 'restaurant_category_id' })
  category: RestaurantCategory;

  // Relación: Un restaurante tiene muchas categorías de menú
  @OneToMany(() => MenuCategory, (menuCategory) => menuCategory.restaurant)
  menuCategories: MenuCategory[];

  // Relación: Un restaurante es propiedad de un usuario.
  @ManyToOne(() => User, { nullable: false }) // Un restaurante DEBE tener un dueño.
  @JoinColumn({ name: 'owner_id' }) // Esto creará la columna 'owner_id' en la tabla.
  owner: User;
}
