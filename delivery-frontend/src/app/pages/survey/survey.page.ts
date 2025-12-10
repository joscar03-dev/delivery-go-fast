import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
  IonList,
  IonItem,
  IonLabel,
  IonRange,
  IonRadioGroup,
  IonRadio,
  IonTextarea,
  IonButton,
  IonSpinner,
  IonNote,
  IonIcon,
  ToastController,
  AlertController,
} from '@ionic/angular/standalone';
import { OrderService } from '../../services/order.service';
import { addIcons } from 'ionicons';
import {
  star,
  starOutline,
  checkmarkCircle,
  closeCircle,
  sendOutline,
} from 'ionicons/icons';

// Registrar iconos
addIcons({
  star,
  'star-outline': starOutline,
  'checkmark-circle': checkmarkCircle,
  'close-circle': closeCircle,
  'send-outline': sendOutline,
});

/**
 * Página de encuesta POST de satisfacción del cliente
 * Mide el impacto de la app en diferentes dimensiones
 */
@Component({
  selector: 'app-survey',
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
    IonList,
    IonItem,
    IonLabel,
    IonRange,
    IonRadioGroup,
    IonRadio,
    IonTextarea,
    IonButton,
    IonSpinner,
    IonNote,
    IonIcon,
  ],
  templateUrl: './survey.page.html',
  styleUrls: ['./survey.page.scss'],
})
export class SurveyPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orderService = inject(OrderService);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);

  orderId: string = '';
  loading: boolean = false;
  submitting: boolean = false;

  // ==========================================
  // RESPUESTAS DE LA ENCUESTA - 11 PREGUNTAS
  // ==========================================

  // DIMENSIÓN 1: INTERFAZ/USABILIDAD (3 preguntas)
  q1AppLoadingSpeed: number = 3; // Pregunta 1: Velocidad de carga
  q2ProductSelectionEase: number = 3; // Pregunta 2: Facilidad de selección
  q3MenuNavigationEase: number = 3; // Pregunta 3: Facilidad de navegación

  // DIMENSIÓN 2: PRECISIÓN (2 preguntas)
  q4OrderAccuracy: number = 3; // Pregunta 4: Coincidencia del pedido
  q5PaymentAddressAccuracy: number = 3; // Pregunta 5: Monto y dirección correctos

  // DIMENSIÓN 3: MONITOREO (2 preguntas)
  q6OrderTrackingVisibility: number = 3; // Pregunta 6: Visibilidad del proceso
  q7CommunicationNeed: number = 3; // Pregunta 7: Necesidad de llamar

  // DIMENSIÓN 4: PUNTUALIDAD/EFICIENCIA (2 preguntas)
  q8DeliveryTimeliness: number = 3; // Pregunta 8: Puntualidad de entrega
  q9AppVsPhoneSpeed: number = 3; // Pregunta 9: App vs teléfono

  // DIMENSIÓN 5: SATISFACCIÓN GENERAL (2 preguntas)
  q10OverallSatisfaction: number = 3; // Pregunta 10: Satisfacción general
  q11RecommendationLikelihood: number = 3; // Pregunta 11: Probabilidad de recomendación

  // COMENTARIOS OPCIONALES
  comment: string = '';

  ngOnInit() {
    this.orderId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.orderId) {
      this.showError('ID de pedido inválido');
      this.router.navigate(['/tabs/tab1']);
    }
  }

  /**
   * Obtiene el texto descriptivo para valores de escala 1-5
   */
  getRatingLabel(value: number): string {
    const labels: Record<number, string> = {
      1: 'Muy bajo',
      2: 'Bajo',
      3: 'Regular',
      4: 'Alto',
      5: 'Muy alto',
    };
    return labels[value] || 'Regular';
  }

  /**
   * Envía la encuesta al backend
   */
  async submitSurvey() {
    // Validación básica - todas las preguntas son requeridas
    if (
      !this.q1AppLoadingSpeed ||
      !this.q2ProductSelectionEase ||
      !this.q3MenuNavigationEase ||
      !this.q4OrderAccuracy ||
      !this.q5PaymentAddressAccuracy ||
      !this.q6OrderTrackingVisibility ||
      !this.q7CommunicationNeed ||
      !this.q8DeliveryTimeliness ||
      !this.q9AppVsPhoneSpeed ||
      !this.q10OverallSatisfaction ||
      !this.q11RecommendationLikelihood
    ) {
      await this.showError('Por favor completa todas las preguntas requeridas');
      return;
    }

    // Confirmación
    const alert = await this.alertCtrl.create({
      header: 'Confirmar encuesta',
      message:
        '¿Estás seguro de enviar tus respuestas? No podrás modificarlas después.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Enviar',
          role: 'confirm',
          handler: () => this.confirmSubmit(),
        },
      ],
    });

    await alert.present();
  }

  /**
   * Confirma y envía la encuesta
   */
  private async confirmSubmit() {
    this.submitting = true;

    const surveyData = {
      q1AppLoadingSpeed: this.q1AppLoadingSpeed,
      q2ProductSelectionEase: this.q2ProductSelectionEase,
      q3MenuNavigationEase: this.q3MenuNavigationEase,
      q4OrderAccuracy: this.q4OrderAccuracy,
      q5PaymentAddressAccuracy: this.q5PaymentAddressAccuracy,
      q6OrderTrackingVisibility: this.q6OrderTrackingVisibility,
      q7CommunicationNeed: this.q7CommunicationNeed,
      q8DeliveryTimeliness: this.q8DeliveryTimeliness,
      q9AppVsPhoneSpeed: this.q9AppVsPhoneSpeed,
      q10OverallSatisfaction: this.q10OverallSatisfaction,
      q11RecommendationLikelihood: this.q11RecommendationLikelihood,
      comment: this.comment || undefined,
    };

    console.log('📋 Enviando encuesta POST con 11 preguntas:', surveyData);

    this.orderService.submitSurvey(this.orderId, surveyData).subscribe({
      next: async () => {
        this.submitting = false;
        await this.showSuccess('¡Gracias por tu feedback! 🎉');
        // Redirigir al historial de pedidos
        this.router.navigate(['/tabs/order-history']);
      },
      error: async (err) => {
        this.submitting = false;
        console.error('Error enviando encuesta:', err);
        const message = err?.error?.message || 'No se pudo enviar la encuesta';
        await this.showError(message);
      },
    });
  }

  /**
   * Muestra un mensaje de éxito
   */
  private async showSuccess(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color: 'success',
      position: 'top',
    });
    await toast.present();
  }

  /**
   * Muestra un mensaje de error
   */
  private async showError(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color: 'danger',
      position: 'top',
    });
    await toast.present();
  }
}
