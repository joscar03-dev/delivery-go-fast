import { IsNumber, IsOptional, IsBoolean, IsEnum, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { DeliveryType } from '../../payments/entities/restaurant-delivery-config.entity';

export class UpdateDeliveryConfigDto {
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @Transform(({ value }) =>
    value === null || value === undefined ? 0 : Number(value),
  )
  @IsOptional()
  deliveryFee?: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @Transform(({ value }) =>
    value === null || value === undefined ? 0 : Number(value),
  )
  @IsOptional()
  freeDeliveryThreshold?: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @Transform(({ value }) =>
    value === null || value === undefined ? 0 : Number(value),
  )
  @IsOptional()
  minOrderAmount?: number;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @Transform(({ value }) =>
    value === null || value === undefined ? 10 : Number(value),
  )
  @IsOptional()
  maxDeliveryDistance?: number;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @Transform(({ value }) =>
    value === null || value === undefined ? 30 : Number(value),
  )
  @IsOptional()
  estimatedDeliveryTime?: number;

  @IsBoolean()
  @IsOptional()
  isDeliveryEnabled?: boolean;

  @IsEnum(DeliveryType)
  @IsOptional()
  deliveryType?: DeliveryType;
}
