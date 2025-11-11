import { IsOptional, IsEnum, IsNumber, IsUUID } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { OrderStatus } from '../../common/enums/order-status.enum';

export class FindOrdersDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsUUID()
  restaurantId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Transform(({ value }) => {
    const num = parseInt(value, 10);
    return isNaN(num) ? 1 : num;
  })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Transform(({ value }) => {
    const num = parseInt(value, 10);
    return isNaN(num) ? 10 : num;
  })
  limit?: number = 10;
}
