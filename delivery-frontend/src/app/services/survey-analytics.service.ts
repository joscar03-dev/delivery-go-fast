import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Interfaces para el análisis de encuestas
 */
export interface QuestionStats {
  id: string;
  text: string;
  average: number;
}

export interface DimensionStats {
  name: string;
  average: number;
  questions: QuestionStats[];
}

export interface ReviewAnalytics {
  totalResponses: number;
  averages: {
    q1AppLoadingSpeed: number;
    q2ProductSelectionEase: number;
    q3MenuNavigationEase: number;
    q4OrderAccuracy: number;
    q5PaymentAddressAccuracy: number;
    q6OrderTrackingVisibility: number;
    q7CommunicationNeed: number;
    q8DeliveryTimeliness: number;
    q9AppVsPhoneSpeed: number;
    q10OverallSatisfaction: number;
    q11RecommendationLikelihood: number;
  };
  distribution: {
    [key: string]: { 1: number; 2: number; 3: number; 4: number; 5: number };
  };
  dimensions: {
    interfazUsabilidad: DimensionStats;
    precision: DimensionStats;
    monitoreo: DimensionStats;
    puntualidad: DimensionStats;
    satisfaccionGeneral: DimensionStats;
  };
  recentReviews: Array<{
    id: string;
    orderId: string;
    createdAt: Date;
    client: { name: string; phone: string } | null;
    restaurant: { name: string } | null;
    averageScore: number;
    comment: string;
  }>;
}

export interface ReviewDetail {
  id: string;
  orderId: string;
  createdAt: Date;
  clientName: string;
  clientPhone: string;
  restaurantName: string;
  driverName: string;
  q1AppLoadingSpeed: number;
  q2ProductSelectionEase: number;
  q3MenuNavigationEase: number;
  q4OrderAccuracy: number;
  q5PaymentAddressAccuracy: number;
  q6OrderTrackingVisibility: number;
  q7CommunicationNeed: number;
  q8DeliveryTimeliness: number;
  q9AppVsPhoneSpeed: number;
  q10OverallSatisfaction: number;
  q11RecommendationLikelihood: number;
  averageScore: number;
  comment: string;
}

@Injectable({
  providedIn: 'root',
})
export class SurveyAnalyticsService {
  private apiUrl = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene estadísticas completas de las encuestas
   */
  getAnalytics(): Observable<ReviewAnalytics> {
    return this.http.get<ReviewAnalytics>(
      `${this.apiUrl}/admin/reviews/analytics`
    );
  }

  /**
   * Obtiene todas las respuestas de encuestas con filtro de fechas
   */
  getAllReviews(
    startDate?: string,
    endDate?: string
  ): Observable<ReviewDetail[]> {
    let url = `${this.apiUrl}/admin/reviews/all`;
    const params: string[] = [];

    if (startDate) {
      params.push(`startDate=${startDate}`);
    }
    if (endDate) {
      params.push(`endDate=${endDate}`);
    }

    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    return this.http.get<ReviewDetail[]>(url);
  }

  /**
   * Exporta las encuestas a formato CSV
   */
  exportToCSV(reviews: ReviewDetail[]): void {
    if (reviews.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    // Encabezados
    const headers = [
      'ID Encuesta',
      'ID Pedido',
      'Fecha',
      'Cliente',
      'Teléfono',
      'Restaurante',
      'Repartidor',
      'Q1: Velocidad de carga',
      'Q2: Facilidad de selección',
      'Q3: Navegación del menú',
      'Q4: Precisión del pedido',
      'Q5: Monto y dirección',
      'Q6: Visibilidad de etapas',
      'Q7: Necesidad de llamar',
      'Q8: Puntualidad',
      'Q9: App vs Teléfono',
      'Q10: Satisfacción general',
      'Q11: Recomendación',
      'Promedio',
      'Comentario',
    ].join(',');

    // Filas de datos
    const rows = reviews.map((review) => {
      const date = new Date(review.createdAt).toLocaleString('es-PE');
      const comment = (review.comment || '')
        .replace(/,/g, ';')
        .replace(/\n/g, ' ');

      return [
        review.id,
        review.orderId,
        date,
        review.clientName,
        review.clientPhone,
        review.restaurantName,
        review.driverName,
        review.q1AppLoadingSpeed,
        review.q2ProductSelectionEase,
        review.q3MenuNavigationEase,
        review.q4OrderAccuracy,
        review.q5PaymentAddressAccuracy,
        review.q6OrderTrackingVisibility,
        review.q7CommunicationNeed,
        review.q8DeliveryTimeliness,
        review.q9AppVsPhoneSpeed,
        review.q10OverallSatisfaction,
        review.q11RecommendationLikelihood,
        review.averageScore.toFixed(2),
        `"${comment}"`,
      ].join(',');
    });

    // Combinar todo
    const csv = [headers, ...rows].join('\n');

    // Crear blob y descargar
    const blob = new Blob(['\uFEFF' + csv], {
      type: 'text/csv;charset=utf-8;',
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const filename = `encuestas_${new Date().toISOString().split('T')[0]}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log(`✅ Exportadas ${reviews.length} encuestas a ${filename}`);
  }
}
