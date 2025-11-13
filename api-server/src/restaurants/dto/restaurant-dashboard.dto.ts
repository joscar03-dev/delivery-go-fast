export class DashboardSummaryDto {
  ordersToday: number;
  revenueToday: number;
  deliveryRevenue: number; // Total de ingresos por delivery
  activeDrivers: number;
  avgPrepTime: number;
}

export class OrdersByStatusDto {
  pending: number;
  confirmed: number;
  preparing: number;
  ready_for_pickup: number;
  out_for_delivery: number;
  delivered: number;
  cancelled: number;
}

export class RevenueByDayDto {
  date: string; // formato: YYYY-MM-DD
  revenue: number;
}

export class ActiveDriverDto {
  driverId: string;
  driverName: string;
  orderId: string;
  orderStatus: string;
  estimatedDeliveryTime?: string;
}

export class TopProductDto {
  productName: string;
  quantity: number;
  revenue: number;
}

export class RestaurantDashboardDto {
  summary: DashboardSummaryDto;
  ordersByStatus: OrdersByStatusDto;
  revenueByDay: RevenueByDayDto[];
  activeDrivers: ActiveDriverDto[];
  topProducts: TopProductDto[];
}
