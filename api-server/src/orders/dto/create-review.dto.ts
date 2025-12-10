import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * DTO para crear una encuesta POST de satisfacción
 * Encuesta detallada con 11 preguntas para análisis académico
 *
 * Fecha actualización: 9 de diciembre de 2025
 *
 * DIMENSIONES:
 * - Interfaz/Usabilidad: q1, q2, q3
 * - Precisión: q4, q5
 * - Monitoreo: q6, q7
 * - Puntualidad/Eficiencia: q8, q9
 * - Satisfacción General: q10, q11
 */
export class CreateReviewDto {
  // ==========================================
  // DIMENSIÓN 1: INTERFAZ/USABILIDAD (3 preguntas)
  // ==========================================

  // Pregunta 1: Velocidad de carga de la app
  @IsInt({ message: 'q1AppLoadingSpeed debe ser un número entero' })
  @Min(1, { message: 'q1AppLoadingSpeed debe ser mínimo 1' })
  @Max(5, { message: 'q1AppLoadingSpeed debe ser máximo 5' })
  q1AppLoadingSpeed: number;

  // Pregunta 2: Facilidad de selección de productos
  @IsInt({ message: 'q2ProductSelectionEase debe ser un número entero' })
  @Min(1, { message: 'q2ProductSelectionEase debe ser mínimo 1' })
  @Max(5, { message: 'q2ProductSelectionEase debe ser máximo 5' })
  q2ProductSelectionEase: number;

  // Pregunta 3: Facilidad de navegación del menú
  @IsInt({ message: 'q3MenuNavigationEase debe ser un número entero' })
  @Min(1, { message: 'q3MenuNavigationEase debe ser mínimo 1' })
  @Max(5, { message: 'q3MenuNavigationEase debe ser máximo 5' })
  q3MenuNavigationEase: number;

  // ==========================================
  // DIMENSIÓN 2: PRECISIÓN (2 preguntas)
  // ==========================================

  // Pregunta 4: Coincidencia del pedido
  @IsInt({ message: 'q4OrderAccuracy debe ser un número entero' })
  @Min(1, { message: 'q4OrderAccuracy debe ser mínimo 1' })
  @Max(5, { message: 'q4OrderAccuracy debe ser máximo 5' })
  q4OrderAccuracy: number;

  // Pregunta 5: Corrección de monto y dirección
  @IsInt({ message: 'q5PaymentAddressAccuracy debe ser un número entero' })
  @Min(1, { message: 'q5PaymentAddressAccuracy debe ser mínimo 1' })
  @Max(5, { message: 'q5PaymentAddressAccuracy debe ser máximo 5' })
  q5PaymentAddressAccuracy: number;

  // ==========================================
  // DIMENSIÓN 3: MONITOREO (2 preguntas)
  // ==========================================

  // Pregunta 6: Visibilidad del proceso de pedido
  @IsInt({ message: 'q6OrderTrackingVisibility debe ser un número entero' })
  @Min(1, { message: 'q6OrderTrackingVisibility debe ser mínimo 1' })
  @Max(5, { message: 'q6OrderTrackingVisibility debe ser máximo 5' })
  q6OrderTrackingVisibility: number;

  // Pregunta 7: Necesidad de comunicación externa
  @IsInt({ message: 'q7CommunicationNeed debe ser un número entero' })
  @Min(1, { message: 'q7CommunicationNeed debe ser mínimo 1' })
  @Max(5, { message: 'q7CommunicationNeed debe ser máximo 5' })
  q7CommunicationNeed: number;

  // ==========================================
  // DIMENSIÓN 4: PUNTUALIDAD/EFICIENCIA (2 preguntas)
  // ==========================================

  // Pregunta 8: Puntualidad de entrega
  @IsInt({ message: 'q8DeliveryTimeliness debe ser un número entero' })
  @Min(1, { message: 'q8DeliveryTimeliness debe ser mínimo 1' })
  @Max(5, { message: 'q8DeliveryTimeliness debe ser máximo 5' })
  q8DeliveryTimeliness: number;

  // Pregunta 9: Comparación con pedido por teléfono
  @IsInt({ message: 'q9AppVsPhoneSpeed debe ser un número entero' })
  @Min(1, { message: 'q9AppVsPhoneSpeed debe ser mínimo 1' })
  @Max(5, { message: 'q9AppVsPhoneSpeed debe ser máximo 5' })
  q9AppVsPhoneSpeed: number;

  // ==========================================
  // DIMENSIÓN 5: SATISFACCIÓN GENERAL (2 preguntas)
  // ==========================================

  // Pregunta 10: Satisfacción general con la experiencia
  @IsInt({ message: 'q10OverallSatisfaction debe ser un número entero' })
  @Min(1, { message: 'q10OverallSatisfaction debe ser mínimo 1' })
  @Max(5, { message: 'q10OverallSatisfaction debe ser máximo 5' })
  q10OverallSatisfaction: number;

  // Pregunta 11: Probabilidad de recomendación
  @IsInt({ message: 'q11RecommendationLikelihood debe ser un número entero' })
  @Min(1, { message: 'q11RecommendationLikelihood debe ser mínimo 1' })
  @Max(5, { message: 'q11RecommendationLikelihood debe ser máximo 5' })
  q11RecommendationLikelihood: number;

  // ==========================================
  // COMENTARIOS ADICIONALES (OPCIONAL)
  // ==========================================
  @IsOptional()
  @IsString()
  comment?: string;
}
