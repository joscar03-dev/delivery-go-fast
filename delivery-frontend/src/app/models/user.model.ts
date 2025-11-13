export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: 'client' | 'driver' | 'restaurant_owner' | 'super_admin';
  avatarUrl?: string;
  isActive?: boolean; // Estado activo/inactivo
  // Tokens opcionales si se guardan en memoria temporal
  accessToken?: string;
  refreshToken?: string;
}
