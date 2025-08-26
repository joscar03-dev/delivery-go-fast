import { IsOptional, IsEnum, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { OrderStatus } from '../../common/enums/order-status.enum';

export class FindOrdersDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsUUID()
  restaurantId?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 10;
}
