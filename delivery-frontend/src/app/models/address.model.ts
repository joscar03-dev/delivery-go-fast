export enum AddressType {
  HOME = 'home',
  WORK = 'work',
  OTHER = 'other',
}

export interface Address {
  id: string;
  street: string;
  city: string;
  postalCode: string;
  reference?: string;
  type: AddressType; // Casa, Trabajo, Otro
  isDefault: boolean; // Dirección predeterminada
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAddressDto {
  street: string;
  city: string;
  postalCode: string;
  reference?: string;
  type: AddressType;
  isDefault?: boolean;
  latitude?: number;
  longitude?: number;
}

export interface UpdateAddressDto {
  street?: string;
  city?: string;
  postalCode?: string;
  reference?: string;
  type?: AddressType;
  isDefault?: boolean;
  latitude?: number;
  longitude?: number;
}

/**
 * Helper para obtener el label en español del tipo de dirección
 */
export function getAddressTypeLabel(type: AddressType): string {
  switch (type) {
    case AddressType.HOME:
      return 'Casa';
    case AddressType.WORK:
      return 'Trabajo';
    case AddressType.OTHER:
      return 'Otro';
    default:
      return type;
  }
}

/**
 * Helper para obtener el ícono del tipo de dirección
 */
export function getAddressTypeIcon(type: AddressType): string {
  switch (type) {
    case AddressType.HOME:
      return 'home-outline';
    case AddressType.WORK:
      return 'briefcase-outline';
    case AddressType.OTHER:
      return 'location-outline';
    default:
      return 'location-outline';
  }
}
