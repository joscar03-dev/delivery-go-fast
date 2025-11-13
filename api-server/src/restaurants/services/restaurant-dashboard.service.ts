import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { OrderStatus } from '../../common/enums/order-status.enum';
import {
  RestaurantDashboardDto,
  DashboardSummaryDto,
  OrdersByStatusDto,
  RevenueByDayDto,
  ActiveDriverDto,
  TopProductDto,
} from '../dto/restaurant-dashboard.dto';

@Injectable()
export class RestaurantDashboardService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  /**
   * Obtiene todas las estadísticas del dashboard para un restaurante
   */
  async getDashboardData(
    restaurantId: string,
    period: 'today' | 'week' | 'month' | 'all' = 'all',
  ): Promise<RestaurantDashboardDto> {
    const [summary, ordersByStatus, revenueByDay, activeDrivers, topProducts] =
      await Promise.all([
        this.getSummary(restaurantId, period),
        this.getOrdersByStatus(restaurantId, period),
        this.getRevenueByDay(restaurantId, period),
        this.getActiveDrivers(restaurantId),
        this.getTopProducts(restaurantId, period),
      ]);

    return {
      summary,
      ordersByStatus,
      revenueByDay,
      activeDrivers,
      topProducts,
    };
  }

  /**
   * Obtiene el filtro de fecha según el período
   */
  private getDateFilter(
    period: 'today' | 'week' | 'month' | 'all',
    alias: string = 'order',
  ): string | null {
    switch (period) {
      case 'today':
        return `DATE(${alias}.created_at) = CURRENT_DATE`;
      case 'week':
        return `${alias}.created_at >= CURRENT_DATE - INTERVAL '7 days'`;
      case 'month':
        return `${alias}.created_at >= CURRENT_DATE - INTERVAL '30 days'`;
      case 'all':
      default:
        return null;
    }
  }

  /**
   * Resumen de estadísticas según el período
   */
  private async getSummary(
    restaurantId: string,
    period: 'today' | 'week' | 'month' | 'all' = 'all',
  ): Promise<DashboardSummaryDto> {
    const dateFilter = this.getDateFilter(period);

    // Query base para pedidos (solo entregados para consistencia con ingresos)
    let ordersQuery = this.orderRepository
      .createQueryBuilder('order')
      .where('order.restaurant_id = :restaurantId', { restaurantId })
      .andWhere('order.status = :status', { status: OrderStatus.DELIVERED });

    if (dateFilter) {
      ordersQuery = ordersQuery.andWhere(dateFilter);
    }

    const ordersToday = await ordersQuery.getCount();

    // Ingresos (solo pedidos entregados)
    let revenueQuery = this.orderRepository
      .createQueryBuilder('order')
      .select('COALESCE(SUM(order.total), 0)', 'revenue')
      .where('order.restaurant_id = :restaurantId', { restaurantId })
      .andWhere('order.status = :status', { status: OrderStatus.DELIVERED });

    if (dateFilter) {
      revenueQuery = revenueQuery.andWhere(dateFilter);
    }

    const revenueResult = await revenueQuery.getRawOne();
    const revenueToday = parseFloat(revenueResult?.revenue || '0');

    // Total de ingresos por delivery (solo pedidos entregados)
    const deliveryDateFilter = this.getDateFilter(period, 'o');
    let deliveryRevenueQuery = this.orderRepository
      .createQueryBuilder('o')
      .leftJoin('order_payments', 'op', 'op.order_id = o.id')
      .select('COALESCE(SUM(op.delivery_fee), 0)', 'deliveryRevenue')
      .where('o.restaurant_id = :restaurantId', { restaurantId })
      .andWhere('o.status = :status', { status: OrderStatus.DELIVERED });

    if (deliveryDateFilter) {
      deliveryRevenueQuery = deliveryRevenueQuery.andWhere(deliveryDateFilter);
    }

    const deliveryRevenueResult = await deliveryRevenueQuery.getRawOne();
    const deliveryRevenue = parseFloat(
      deliveryRevenueResult?.deliveryRevenue || '0',
    );

    // Repartidores activos (siempre en tiempo real, no filtrar por período)
    const activeDriversResult = await this.orderRepository
      .createQueryBuilder('order')
      .select('COUNT(DISTINCT order.driver_id)', 'count')
      .where('order.restaurant_id = :restaurantId', { restaurantId })
      .andWhere('order.status IN (:...statuses)', {
        statuses: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.READY_FOR_PICKUP],
      })
      .andWhere('order.driver_id IS NOT NULL')
      .getRawOne();

    const activeDrivers = parseInt(activeDriversResult?.count || '0', 10);

    // Tiempo promedio de preparación (en minutos)
    const avgPrepTimeResult = await this.orderRepository
      .createQueryBuilder('order')
      .select('AVG(order.estimated_prep_time)', 'avgTime')
      .where('order.restaurant_id = :restaurantId', { restaurantId })
      .andWhere('DATE(order.created_at) = CURRENT_DATE')
      .andWhere('order.estimated_prep_time IS NOT NULL')
      .getRawOne();

    const avgPrepTime = Math.round(
      parseFloat(avgPrepTimeResult?.avgTime || '0'),
    );

    return {
      ordersToday,
      revenueToday,
      deliveryRevenue,
      activeDrivers,
      avgPrepTime,
    };
  }

  /**
   * Pedidos agrupados por estado según el período
   */
  private async getOrdersByStatus(
    restaurantId: string,
    period: 'today' | 'week' | 'month' | 'all' = 'all',
  ): Promise<OrdersByStatusDto> {
    const dateFilter = this.getDateFilter(period);

    let query = this.orderRepository
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('order.restaurant_id = :restaurantId', { restaurantId });

    if (dateFilter) {
      query = query.andWhere(dateFilter);
    }

    const result = await query.groupBy('order.status').getRawMany();

    const ordersByStatus: OrdersByStatusDto = {
      pending: 0,
      confirmed: 0,
      preparing: 0,
      ready_for_pickup: 0,
      out_for_delivery: 0,
      delivered: 0,
      cancelled: 0,
    };

    result.forEach((row) => {
      const status = row.status as keyof OrdersByStatusDto;
      ordersByStatus[status] = parseInt(row.count, 10);
    });

    return ordersByStatus;
  }

  /**
   * Ingresos de los últimos 7 días (o según el período seleccionado)
   */
  private async getRevenueByDay(
    restaurantId: string,
    period: 'today' | 'week' | 'month' | 'all' = 'all',
  ): Promise<RevenueByDayDto[]> {
    const dateFilter = this.getDateFilter(period);

    let query = this.orderRepository
      .createQueryBuilder('order')
      .select("TO_CHAR(order.created_at, 'YYYY-MM-DD')", 'date')
      .addSelect('SUM(order.total)', 'revenue')
      .where('order.restaurant_id = :restaurantId', { restaurantId })
      .andWhere('order.status = :status', { status: OrderStatus.DELIVERED });

    if (dateFilter) {
      query = query.andWhere(dateFilter);
    }

    const result = await query
      .groupBy("TO_CHAR(order.created_at, 'YYYY-MM-DD')")
      .orderBy('date', 'ASC')
      .getRawMany();

    return result.map((row) => ({
      date: row.date,
      revenue: parseFloat(row.revenue || '0'),
    }));
  }

  /**
   * Repartidores actualmente en entregas
   */
  private async getActiveDrivers(
    restaurantId: string,
  ): Promise<ActiveDriverDto[]> {
    const orders = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.driver', 'driver')
      .where('order.restaurant_id = :restaurantId', { restaurantId })
      .andWhere('order.status IN (:...statuses)', {
        statuses: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.READY_FOR_PICKUP],
      })
      .andWhere('order.driver_id IS NOT NULL')
      .getMany();

    return orders.map((order) => ({
      driverId: order.driver?.id || '',
      driverName: order.driver?.name || 'Sin nombre',
      orderId: order.id,
      orderStatus: order.status,
      estimatedDeliveryTime: order.estimatedReadyTime?.toISOString(),
    }));
  }

  /**
   * Top 5 productos más vendidos según el período
   */
  private async getTopProducts(
    restaurantId: string,
    period: 'today' | 'week' | 'month' | 'all' = 'all',
  ): Promise<TopProductDto[]> {
    const dateFilter = this.getDateFilter(period);

    let query = this.orderRepository
      .createQueryBuilder('order')
      .innerJoin('order.items', 'item')
      .innerJoin('item.menuItem', 'menuItem')
      .select('menuItem.name', 'productName')
      .addSelect('SUM(item.quantity)', 'quantity')
      .addSelect('SUM(item.unit_price * item.quantity)', 'revenue')
      .where('order.restaurant_id = :restaurantId', { restaurantId })
      .andWhere('order.status = :status', { status: OrderStatus.DELIVERED }); // Solo pedidos entregados

    if (dateFilter) {
      query = query.andWhere(dateFilter);
    }

    const result = await query
      .groupBy('menuItem.name')
      .orderBy('quantity', 'DESC')
      .limit(5)
      .getRawMany();

    return result.map((row) => ({
      productName: row.productName,
      quantity: parseInt(row.quantity, 10),
      revenue: parseFloat(row.revenue || '0'),
    }));
  }
}
