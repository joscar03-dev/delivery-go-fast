import { RestaurantModel } from './restaurant.model';
import { User } from './user.model';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY_FOR_PICKUP = 'ready_for_pickup',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  quantity: number;
  price: number;
  total: number;
  comment?: string;
  options?: Record<string, any> | string[];
  menuItem?: {
    id: string;
    name: string;
    price: number;
    description?: string;
    image?: string;
  };
}

export interface Order {
  id: string;
  client?: User;
  driver?: User;
  restaurant?: RestaurantModel;
  status: OrderStatus;
  total: number;
  notes?: string;
  deliveryAddress?: string;
  items?: OrderItem[];
  createdAt: string;
  updatedAt: string;
  estimatedPrepTime?: number;
  estimatedReadyTime?: string;
  confirmedAt?: string;
}

export interface OrderHistoryResponse {
  orders: Order[];
  total: number;
}

export interface CreateOrderDto {
  restaurantId: string;
  items: CreateOrderItemDto[];
  notes?: string;
  deliveryAddress?: string;
}

export interface CreateOrderItemDto {
  menuItemId: string;
  quantity: number;
  comment?: string;
  options?: Record<string, any> | string[];
}

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  description?: string;
  restaurantId: string;
  restaurantName: string;
  comment?: string;
  options?: Record<string, any> | string[];
}
