// Modelos basados en las entidades del backend (restaurants/entities)

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface RestaurantCategoryModel {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface MenuCategoryModel {
  id: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  restaurantId?: string; // para mapeos simples en frontend
}

export interface MenuItemModel {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  restaurantId: string;
  menuCategoryId?: string | null;
}

export interface RestaurantModel {
  id: string;
  name: string;
  address: string;
  phone: string;
  imageUrl?: string | null; // URL de la imagen del restaurante
  location?: GeoPoint | null; // PostGIS Point
  createdAt: string | Date;
  updatedAt: string | Date;
  category?: RestaurantCategoryModel | null;
  menuCategories?: MenuCategoryModel[];
  menuItems?: MenuItemModel[];
  ownerId?: string; // simplificado para frontend
}
