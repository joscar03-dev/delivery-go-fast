import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { FindOrdersDto } from './dto/find-orders.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(Role.CLIENT, Role.SUPER_ADMIN)
  create(@Body() createOrderDto: CreateOrderDto, @Request() req) {
    const currentUser = req.user;
    return this.ordersService.create(createOrderDto, currentUser.id);
  }

  @Get()
  @Roles(Role.CLIENT, Role.DRIVER, Role.RESTAURANT_OWNER, Role.SUPER_ADMIN)
  findAll(@Query() findOrdersDto: FindOrdersDto, @Request() req) {
    const currentUser = req.user;
    return this.ordersService.findAll(
      findOrdersDto,
      currentUser.id,
      currentUser.role,
    );
  }

  @Get(':id')
  @Roles(Role.CLIENT, Role.DRIVER, Role.RESTAURANT_OWNER, Role.SUPER_ADMIN)
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const currentUser = req.user;
    return this.ordersService.findOne(id, currentUser.id, currentUser.role);
  }

  @Patch(':id')
  @Roles(Role.CLIENT, Role.DRIVER, Role.RESTAURANT_OWNER, Role.SUPER_ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOrderDto: UpdateOrderDto,
    @Request() req,
  ) {
    const currentUser = req.user;
    return this.ordersService.update(
      id,
      updateOrderDto,
      currentUser.id,
      currentUser.role,
    );
  }

  @Patch(':id/assign-driver')
  @Roles(Role.SUPER_ADMIN)
  assignDriver(
    @Param('id', ParseUUIDPipe) orderId: string,
    @Body('driverId', ParseUUIDPipe) driverId: string,
  ) {
    return this.ordersService.assignDriver(orderId, driverId);
  }

  // Endpoint específico para que los clientes cancelen sus pedidos
  @Patch(':id/cancel')
  @Roles(Role.CLIENT)
  cancel(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const currentUser = req.user;
    return this.ordersService.update(
      id,
      { status: 'cancelled' as any },
      currentUser.id,
      currentUser.role,
    );
  }

  // Endpoint para que los restaurantes confirmen pedidos
  @Patch(':id/confirm')
  @Roles(Role.RESTAURANT_OWNER, Role.SUPER_ADMIN)
  confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('estimatedPrepTime') estimatedPrepTime: number,
    @Request() req,
  ) {
    const currentUser = req.user;
    return this.ordersService.confirmOrder(
      id,
      estimatedPrepTime,
      currentUser.id,
      currentUser.role,
    );
  }

  // Endpoint para que los restaurantes marquen pedidos como preparando
  @Patch(':id/preparing')
  @Roles(Role.RESTAURANT_OWNER, Role.SUPER_ADMIN)
  preparing(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const currentUser = req.user;
    return this.ordersService.update(
      id,
      { status: 'preparing' as any },
      currentUser.id,
      currentUser.role,
    );
  }

  // Endpoint para marcar pedido como listo para recoger
  @Patch(':id/ready-for-pickup')
  @Roles(Role.RESTAURANT_OWNER, Role.SUPER_ADMIN)
  readyForPickup(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const currentUser = req.user;
    return this.ordersService.update(
      id,
      { status: 'ready_for_pickup' as any },
      currentUser.id,
      currentUser.role,
    );
  }

  // Endpoint para ajustar tiempo de preparación
  @Patch(':id/adjust-prep-time')
  @Roles(Role.RESTAURANT_OWNER, Role.SUPER_ADMIN)
  adjustPrepTime(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('additionalMinutes') additionalMinutes: number,
    @Request() req,
  ) {
    const currentUser = req.user;
    return this.ordersService.adjustPrepTime(
      id,
      additionalMinutes,
      currentUser.id,
      currentUser.role,
    );
  }

  // Endpoint para que los repartidores marquen como en camino
  @Patch(':id/out-for-delivery')
  @Roles(Role.DRIVER, Role.SUPER_ADMIN)
  outForDelivery(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const currentUser = req.user;
    return this.ordersService.update(
      id,
      { status: 'out_for_delivery' as any },
      currentUser.id,
      currentUser.role,
    );
  }

  // Endpoint para que los repartidores marquen como entregado
  @Patch(':id/delivered')
  @Roles(Role.DRIVER, Role.SUPER_ADMIN)
  delivered(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const currentUser = req.user;
    return this.ordersService.update(
      id,
      { status: 'delivered' as any },
      currentUser.id,
      currentUser.role,
    );
  }
}
