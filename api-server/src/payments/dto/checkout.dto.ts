import {
  IsUUID,
  IsArray,
  ValidateNested,
  IsEnum,
  IsOptional,
  IsNumber,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum PaymentMethodCode {
  CASH = 'cash',
  YAPE = 'yape',
  PLIN = 'plin',
  CARD = 'card',
}

export class CreateOrderItemDto {
  @IsUUID()
  menuItemId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  options?: Record<string, any> | string[];
}

export class CheckoutDto {
  @IsUUID()
  restaurantId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @IsUUID()
  deliveryAddressId: string;

  @IsEnum(PaymentMethodCode)
  paymentMethodCode: PaymentMethodCode;

  // Para pago en efectivo
  @IsOptional()
  @IsNumber()
  @Min(0)
  cashAmount?: number;

  // Para Yape/Plin
  @IsOptional()
  @IsString()
  transactionReference?: string;

  @IsOptional()
  @IsString()
  paymentProofUrl?: string;

  // Notas del pedido
  @IsOptional()
  @IsString()
  notes?: string;
}

export class VerifyPaymentDto {
  @IsUUID()
  orderId: string;

  @IsEnum(['pending', 'verified', 'failed'])
  status: 'pending' | 'verified' | 'failed';

  @IsOptional()
  @IsString()
  notes?: string;
}
