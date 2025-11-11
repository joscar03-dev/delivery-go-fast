export enum City {
  BAGUA = 'Bagua',
  BAGUA_GRANDE = 'Bagua Grande',
  CHACHAPOYAS = 'Chachapoyas',
  JAEN = 'Jaen',
}

export enum ApplicationStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface RestaurantCategory {
  id: string;
  name: string;
  description?: string;
}

export interface RestaurantApplication {
  id: string;
  userId: string;
  businessName: string;
  businessPhone: string;
  businessEmail?: string;
  address: string;
  categoryId: string;
  category?: RestaurantCategory;
  city: City;
  ownerName: string;
  ownerDni: string;
  additionalComments?: string;
  status: ApplicationStatus;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  restaurantId?: string;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

export interface CreateRestaurantApplicationDto {
  businessName: string;
  businessPhone: string;
  businessEmail?: string;
  address: string;
  categoryId: string;
  city: City;
  ownerName: string;
  ownerDni: string;
  additionalComments?: string;
}
