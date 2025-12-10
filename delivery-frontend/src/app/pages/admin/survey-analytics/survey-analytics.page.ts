import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonSpinner,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonBadge,
  IonList,
  IonItem,
  IonLabel,
  IonNote,
  IonProgressBar,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  downloadOutline,
  refreshOutline,
  statsChartOutline,
  peopleOutline,
  starOutline,
  checkmarkCircleOutline,
} from 'ionicons/icons';
import {
  SurveyAnalyticsService,
  ReviewAnalytics,
  ReviewDetail,
} from '../../../services/survey-analytics.service';

// Registrar iconos
addIcons({
  'download-outline': downloadOutline,
  'refresh-outline': refreshOutline,
  'stats-chart-outline': statsChartOutline,
  'people-outline': peopleOutline,
  'star-outline': starOutline,
  'checkmark-circle-outline': checkmarkCircleOutline,
});

@Component({
  selector: 'app-survey-analytics',
  templateUrl: './survey-analytics.page.html',
  styleUrls: ['./survey-analytics.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonSpinner,
    IonButton,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonBadge,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    IonProgressBar,
    IonRefresher,
    IonRefresherContent,
  ],
})
export class SurveyAnalyticsPage implements OnInit {
  analytics: ReviewAnalytics | null = null;
  allReviews: ReviewDetail[] = [];
  loading = true;
  exporting = false;

  constructor(private surveyAnalyticsService: SurveyAnalyticsService) {}

  ngOnInit() {
    this.loadAnalytics();
  }

  /**
   * Cargar estadísticas de encuestas
   */
  loadAnalytics() {
    this.loading = true;
    this.surveyAnalyticsService.getAnalytics().subscribe({
      next: (data) => {
        this.analytics = data;
        this.loading = false;
        console.log('📊 Analytics cargados:', data);
      },
      error: (error) => {
        console.error('❌ Error cargando analytics:', error);
        this.loading = false;
      },
    });
  }

  /**
   * Recargar datos
   */
  refresh(event?: any) {
    this.loadAnalytics();
    if (event) {
      setTimeout(() => {
        event.target.complete();
      }, 1000);
    }
  }

  /**
   * Exportar todas las encuestas a CSV
   */
  async exportData() {
    this.exporting = true;

    this.surveyAnalyticsService.getAllReviews().subscribe({
      next: (reviews) => {
        this.allReviews = reviews;
        this.surveyAnalyticsService.exportToCSV(reviews);
        this.exporting = false;
        console.log(`✅ Exportadas ${reviews.length} encuestas`);
      },
      error: (error) => {
        console.error('❌ Error exportando encuestas:', error);
        this.exporting = false;
        alert('Error al exportar los datos');
      },
    });
  }

  /**
   * Obtener color según el promedio
   */
  getScoreColor(score: number): string {
    if (score >= 4.5) return 'success';
    if (score >= 3.5) return 'primary';
    if (score >= 2.5) return 'warning';
    return 'danger';
  }

  /**
   * Obtener etiqueta de satisfacción
   */
  getScoreLabel(score: number): string {
    if (score >= 4.5) return 'Excelente';
    if (score >= 3.5) return 'Bueno';
    if (score >= 2.5) return 'Regular';
    if (score >= 1.5) return 'Deficiente';
    return 'Muy malo';
  }

  /**
   * Obtener array para iterar en estrellas
   */
  getStarsArray(score: number): number[] {
    return Array(Math.round(score)).fill(0);
  }

  /**
   * Formatear fecha
   */
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
