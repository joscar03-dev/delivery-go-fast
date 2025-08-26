import { IsOptional, IsEnum, IsString } from 'class-validator';
import { OrderStatus } from '../../common/enums/order-status.enum';

export class UpdateOrderDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  deliveryAddress?: string;
}
