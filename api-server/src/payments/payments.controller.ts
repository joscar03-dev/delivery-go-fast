import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VerifyPaymentDto } from './dto/checkout.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * GET /api/payments/methods
   * Obtener métodos de pago disponibles
   */
  @Get('methods')
  async getPaymentMethods() {
    return this.paymentsService.getAvailablePaymentMethods();
  }

  /**
   * GET /api/payments/restaurants/:id/delivery-config
   * Obtener configuración de delivery de un restaurante
   */
  @Get('restaurants/:id/delivery-config')
  async getDeliveryConfig(@Param('id') restaurantId: string) {
    return this.paymentsService.getRestaurantDeliveryConfig(restaurantId);
  }

  /**
   * GET /api/payments/orders/:id
   * Obtener información de pago de una orden
   */
  @UseGuards(JwtAuthGuard)
  @Get('orders/:id')
  async getOrderPayment(@Param('id') orderId: string) {
    return this.paymentsService.getOrderPayment(orderId);
  }

  /**
   * POST /api/payments/verify
   * Verificar un pago (solo para admin/restaurante)
   */
  @UseGuards(JwtAuthGuard)
  @Post('verify')
  async verifyPayment(@Body() dto: VerifyPaymentDto, @Request() req) {
    return this.paymentsService.verifyPayment(
      dto.orderId,
      dto.status,
      req.user.userId,
      dto.notes,
    );
  }
}
