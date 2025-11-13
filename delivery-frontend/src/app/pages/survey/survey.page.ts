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
  // RESPUESTAS DE LA ENCUESTA
  // ==========================================

  // DIMENSIÓN 1: USABILIDAD/INTERFAZ (1-5)
  usabilityRating: number = 3;

  // DIMENSIÓN 2: PRECISIÓN (yes/no/errors)
  precisionAnswer: 'yes' | 'no' | 'errors' = 'yes';

  // DIMENSIÓN 3: MONITOREO (very_useful/useful/not_used)
  monitoringAnswer: 'very_useful' | 'useful' | 'not_used' = 'useful';

  // DIMENSIÓN 4: PUNTUALIDAD (on_time/delayed)
  punctualityAnswer: 'on_time' | 'delayed' = 'on_time';

  // VARIABLE DEPENDIENTE: SATISFACCIÓN GENERAL (1-5)
  generalSatisfaction: number = 3;

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
   * Obtiene el texto descriptivo para el valor de usabilidad
   */
  getUsabilityLabel(value: number): string {
    const labels: Record<number, string> = {
      1: 'Muy Difícil',
      2: 'Difícil',
      3: 'Neutral',
      4: 'Fácil',
      5: 'Muy Fácil',
    };
    return labels[value] || 'Neutral';
  }

  /**
   * Obtiene el texto descriptivo para el valor de satisfacción
   */
  getSatisfactionLabel(value: number): string {
    const labels: Record<number, string> = {
      1: 'Muy Insatisfecho',
      2: 'Insatisfecho',
      3: 'Neutral',
      4: 'Satisfecho',
      5: 'Muy Satisfecho',
    };
    return labels[value] || 'Neutral';
  }

  /**
   * Envía la encuesta al backend
   */
  async submitSurvey() {
    // Validación básica
    if (!this.usabilityRating || !this.generalSatisfaction) {
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
      usabilityRating: this.usabilityRating,
      precisionAnswer: this.precisionAnswer,
      monitoringAnswer: this.monitoringAnswer,
      punctualityAnswer: this.punctualityAnswer,
      generalSatisfaction: this.generalSatisfaction,
      comment: this.comment || undefined,
    };

    console.log('📋 Enviando encuesta POST:', surveyData);

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
