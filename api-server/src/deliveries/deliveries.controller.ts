import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';
import { FindAvailableDeliveriesDto } from './dto/find-available-deliveries.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('deliveries')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Get('available')
  @Roles(Role.DRIVER)
  findAvailableDeliveries(
    @Query() findAvailableDeliveriesDto: FindAvailableDeliveriesDto,
    @Request() req,
  ) {
    const currentUser = req.user;
    return this.deliveriesService.findAvailableDeliveries(
      findAvailableDeliveriesDto,
      currentUser.id,
    );
  }

  @Post(':orderId/accept')
  @Roles(Role.DRIVER)
  acceptOrder(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Request() req,
  ) {
    const currentUser = req.user;
    return this.deliveriesService.acceptOrder(orderId, currentUser.id);
  }

  @Get('my-active')
  @Roles(Role.DRIVER)
  getMyActiveDeliveries(@Request() req) {
    const currentUser = req.user;
    return this.deliveriesService.getMyActiveDeliveries(currentUser.id);
  }

  @Get('my-history')
  @Roles(Role.DRIVER)
  getMyDeliveryHistory(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Request() req,
  ) {
    const currentUser = req.user;
    return this.deliveriesService.getMyDeliveryHistory(
      currentUser.id,
      page,
      limit,
    );
  }
}

// Controlador adicional para actualizar estado de pedidos
// Esto se podría integrar en el OrdersController, pero lo separo para claridad
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrderStatusController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Put(':id/status')
  @Roles(Role.DRIVER)
  updateOrderStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
    @Request() req,
  ) {
    const currentUser = req.user;
    return this.deliveriesService.updateOrderStatus(
      id,
      updateOrderStatusDto,
      currentUser.id,
    );
  }
}
