export interface DashboardSummary {
  ordersToday: number;
  revenueToday: number;
  deliveryRevenue: number;
  activeDrivers: number;
  avgPrepTime: number;
}

export interface OrdersByStatus {
  pending: number;
  confirmed: number;
  preparing: number;
  ready_for_pickup: number;
  out_for_delivery: number;
  delivered: number;
  cancelled: number;
}

export interface RevenueByDay {
  date: string;
  revenue: number;
}

export interface ActiveDriver {
  driverId: string;
  driverName: string;
  orderId: string;
  orderStatus: string;
  estimatedDeliveryTime?: string;
}

export interface TopProduct {
  productName: string;
  quantity: number;
  revenue: number;
}

export interface RestaurantDashboard {
  summary: DashboardSummary;
  ordersByStatus: OrdersByStatus;
  revenueByDay: RevenueByDay[];
  activeDrivers: ActiveDriver[];
  topProducts: TopProduct[];
}
