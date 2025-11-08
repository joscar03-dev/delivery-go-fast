export enum VehicleType {
  MOTO = 'moto',
  BICICLETA = 'bicicleta',
  AUTO = 'auto',
}

export enum ApplicationStatus {
  DRAFT = 'draft',
  PENDING_CALL = 'pending_call',
  PENDING_COMPLETION = 'pending_completion',
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface DriverApplication {
  id: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };

  // Datos obligatorios (Etapa 1)
  dni: string;
  vehicleType: VehicleType;
  birthDate: Date | string;

  // Datos opcionales (Etapa 2)
  fullName?: string;
  phone?: string;
  email?: string;
  licenseNumber?: string;
  licenseExpiry?: Date | string;
  vehiclePlate?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  emergencyContactName?: string;
  emergencyContactPhone?: string;

  // Fotos
  dniPhoto?: string;
  licenseFrontPhoto?: string;
  licenseBackPhoto?: string;
  vehiclePhoto?: string;

  // Estado
  status: ApplicationStatus;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: Date | string;

  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateDriverApplicationDto {
  dni: string;
  vehicleType: VehicleType;
  birthDate: string;
}

export interface UpdateDriverApplicationDto {
  fullName?: string;
  phone?: string;
  email?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  vehiclePlate?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  dniPhoto?: string;
  licenseFrontPhoto?: string;
  licenseBackPhoto?: string;
  vehiclePhoto?: string;
}
