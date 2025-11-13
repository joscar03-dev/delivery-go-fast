import { Component, OnInit, OnDestroy, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonBackButton,
  IonButtons,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonBadge,
  IonList,
  IonItem,
  IonLabel,
  IonChip,
  IonSegment,
  IonSegmentButton,
} from '@ionic/angular/standalone';
import { BaseChartDirective } from 'ng2-charts';
import {
  ChartConfiguration,
  ChartData,
  Chart,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  PieController,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { RestaurantDashboardService } from '../../services/restaurant-dashboard.service';
import { SocketService } from '../../services/socket.service';
import { RestaurantDashboard } from '../../models/restaurant-dashboard.model';

// Registrar componentes de Chart.js
Chart.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  PieController,
  Tooltip,
  Legend,
  Filler
);
import { addIcons } from 'ionicons';
import {
  statsChartOutline,
  cartOutline,
  cashOutline,
  bicycleOutline,
  timeOutline,
  refreshOutline,
  trophyOutline,
  listOutline,
  peopleOutline,
} from 'ionicons/icons';
import { Subscription } from 'rxjs';

addIcons({
  'stats-chart-outline': statsChartOutline,
  'cart-outline': cartOutline,
  'cash-outline': cashOutline,
  'bicycle-outline': bicycleOutline,
  'time-outline': timeOutline,
  'refresh-outline': refreshOutline,
  'trophy-outline': trophyOutline,
  'list-outline': listOutline,
  'people-outline': peopleOutline,
});

@Component({
  selector: 'app-restaurant-dashboard',
  templateUrl: './restaurant-dashboard.page.html',
  styleUrls: ['./restaurant-dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonBackButton,
    IonButtons,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonIcon,
    IonSpinner,
    IonRefresher,
    IonRefresherContent,
    IonBadge,
    IonList,
    IonItem,
    IonLabel,
    IonChip,
    IonSegment,
    IonSegmentButton,
    BaseChartDirective,
  ],
})
export class RestaurantDashboardPage implements OnInit, OnDestroy {
  private dashboardService = inject(RestaurantDashboardService);
  private socketService = inject(SocketService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  restaurantId: string = '';
  dashboardData: RestaurantDashboard | null = null;
  loading = true;
  isSocketConnected = false;
  selectedPeriod: 'today' | 'week' | 'month' | 'all' = 'all';

  private subscriptions: Subscription[] = [];

  // Configuración del gráfico de pedidos por estado (Pie Chart)
  @ViewChild('pieChart') pieChart?: BaseChartDirective;

  public pieChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [
          '#ffc409', // pending - warning
          '#0cd1e8', // confirmed - info
          '#eb445a', // preparing - danger
          '#2dd36f', // ready_for_pickup - success
          '#3880ff', // out_for_delivery - primary
          '#92949c', // delivered - medium
          '#000000', // cancelled - dark
        ],
      },
    ],
  };

  public pieChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            return `${label}: ${value} pedidos`;
          },
        },
      },
    },
  };

  // Configuración del gráfico de ingresos (Line Chart)
  @ViewChild('lineChart') lineChart?: BaseChartDirective;

  public lineChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        label: 'Ingresos',
        data: [],
        borderColor: '#2dd36f',
        backgroundColor: 'rgba(45, 211, 111, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  public lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y || 0;
            return `Ingresos: S/ ${value.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `S/ ${value}`,
        },
      },
    },
  };

  ngOnInit() {
    this.restaurantId = this.route.snapshot.paramMap.get('id') || '';

    if (!this.restaurantId) {
      this.router.navigate(['/restaurant-admin']);
      return;
    }

    this.loadDashboardData();
    this.setupSocketConnection();
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  /**
   * Obtiene el label dinámico según el período seleccionado
   */
  getPeriodLabel(): string {
    const labels: Record<typeof this.selectedPeriod, string> = {
      today: 'Hoy',
      week: '7 Días',
      month: '30 Días',
      all: 'Total',
    };
    return labels[this.selectedPeriod];
  }

  /**
   * Carga los datos del dashboard
   */
  loadDashboardData() {
    this.loading = true;
    const sub = this.dashboardService
      .getDashboardData(this.restaurantId, this.selectedPeriod)
      .subscribe({
        next: (data) => {
          this.dashboardData = data;
          this.updateCharts();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al cargar dashboard:', error);
          this.loading = false;
        },
      });
    this.subscriptions.push(sub);
  }

  /**
   * Actualiza los gráficos con los datos actuales
   */
  updateCharts() {
    if (!this.dashboardData) return;

    // Actualizar gráfico de pedidos por estado - Solo mostrar estados con pedidos
    const allStatuses = [
      { key: 'pending', label: 'Pendiente', color: '#ffc409' },
      { key: 'confirmed', label: 'Confirmado', color: '#0cd1e8' },
      { key: 'preparing', label: 'En preparación', color: '#eb445a' },
      {
        key: 'ready_for_pickup',
        label: 'Listo para recoger',
        color: '#2dd36f',
      },
      { key: 'out_for_delivery', label: 'En camino', color: '#3880ff' },
      { key: 'delivered', label: 'Entregado', color: '#92949c' },
      { key: 'cancelled', label: 'Cancelado', color: '#000000' },
    ];

    // Filtrar solo los estados que tienen pedidos
    const statusLabels: string[] = [];
    const statusData: number[] = [];
    const statusColors: string[] = [];

    allStatuses.forEach((status) => {
      const count =
        this.dashboardData!.ordersByStatus[
          status.key as keyof typeof this.dashboardData.ordersByStatus
        ];
      if (count > 0) {
        statusLabels.push(status.label);
        statusData.push(count);
        statusColors.push(status.color);
      }
    });

    // Si no hay pedidos, mostrar un mensaje
    if (statusData.length === 0) {
      statusLabels.push('Sin pedidos');
      statusData.push(1);
      statusColors.push('#d7d8da');
    }

    this.pieChartData.labels = statusLabels;
    this.pieChartData.datasets[0].data = statusData;
    this.pieChartData.datasets[0].backgroundColor = statusColors;
    this.pieChart?.update();

    // Actualizar gráfico de ingresos
    const revenueLabels = this.dashboardData.revenueByDay.map((item) =>
      this.formatDate(item.date)
    );
    const revenueData = this.dashboardData.revenueByDay.map(
      (item) => item.revenue
    );

    this.lineChartData.labels = revenueLabels;
    this.lineChartData.datasets[0].data = revenueData;
    this.lineChart?.update();
  }

  /**
   * Formatea una fecha en formato legible
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
      });
    }
  }

  /**
   * Obtiene el color del badge según el estado del pedido
   */
  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      pending: 'warning',
      confirmed: 'tertiary',
      preparing: 'danger',
      ready_for_pickup: 'success',
      out_for_delivery: 'primary',
      delivered: 'medium',
      cancelled: 'dark',
    };
    return colors[status] || 'medium';
  }

  /**
   * Obtiene la etiqueta en español del estado
   */
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      confirmed: 'Confirmado',
      preparing: 'En preparación',
      ready_for_pickup: 'Listo',
      out_for_delivery: 'En camino',
      delivered: 'Entregado',
      cancelled: 'Cancelado',
    };
    return labels[status] || status;
  }

  /**
   * Configura la conexión WebSocket para actualizaciones en tiempo real
   */
  setupSocketConnection() {
    // Verificar si ya está conectado
    if (!this.socketService.isConnected()) {
      const token = localStorage.getItem('access_token');
      if (token) {
        this.socketService.connect(token);
      }
    }

    // Suscribirse al estado de conexión
    const connectionSub = this.socketService.isConnected$.subscribe(
      (connected) => {
        this.isSocketConnected = connected;
        if (connected) {
          console.log('✅ Socket conectado al dashboard');
          // No es necesario unirse a salas específicas para el dashboard
          // El socket ya escucha todos los eventos de pedidos
        }
      }
    );
    this.subscriptions.push(connectionSub);

    // Escuchar actualizaciones de pedidos
    const orderUpdateSub = this.socketService.orderStatusUpdated$.subscribe(
      (update) => {
        if (update) {
          console.log('📊 Dashboard: Actualizando por cambio de pedido');
          // Recargar datos cuando haya un cambio
          this.loadDashboardData();
        }
      }
    );
    this.subscriptions.push(orderUpdateSub);
  }

  /**
   * Maneja el refresh manual
   */
  handleRefresh(event: any) {
    this.loadDashboardData();
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }

  /**
   * Cambia el período de filtro y actualiza los gráficos
   */
  onPeriodChange(event: any) {
    this.selectedPeriod = event.detail.value;
    this.loadDashboardData(); // Recargar datos del backend con nuevo período
  }
}
