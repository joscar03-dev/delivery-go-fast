import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PaymentsService, PaymentActor } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { VerifyPaymentDto } from './dto/checkout.dto';
import { OrderPaymentResponseDto } from './dto/order-payment-response.dto';

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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.RESTAURANT_OWNER)
  @Get('orders/:id')
  async getOrderPayment(
    @Param('id') orderId: string,
    @Request() req,
  ): Promise<OrderPaymentResponseDto> {
    const payment = await this.paymentsService.getOrderPayment(
      orderId,
      this.actorOf(req),
    );
    return OrderPaymentResponseDto.from(payment);
  }

  /**
   * POST /api/payments/verify
   * Verificar un pago (solo para super admin o dueño del restaurante)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.RESTAURANT_OWNER)
  @Post('verify')
  async verifyPayment(
    @Body() dto: VerifyPaymentDto,
    @Request() req,
  ): Promise<OrderPaymentResponseDto> {
    const payment = await this.paymentsService.verifyPayment(
      dto.orderId,
      dto.status,
      this.actorOf(req),
      dto.notes,
    );
    return OrderPaymentResponseDto.from(payment);
  }

  private actorOf(req: { user: { sub: string; role: string } }): PaymentActor {
    return { id: req.user.sub, role: req.user.role };
  }
}
