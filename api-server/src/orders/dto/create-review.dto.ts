import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * DTO para crear una encuesta POST de satisfacción
 * Validaciones basadas en las preguntas de la encuesta académica
 */
export class CreateReviewDto {
  // DIMENSIÓN 1: USABILIDAD/INTERFAZ
  // ¿Qué tan fácil fue hacer tu pedido en nuestra app?
  @IsInt()
  @Min(1, { message: 'La calificación de usabilidad debe ser mínimo 1' })
  @Max(5, { message: 'La calificación de usabilidad debe ser máximo 5' })
  usabilityRating: number;

  // DIMENSIÓN 2: PRECISIÓN
  // ¿Tu pedido llegó completo y correcto?
  @IsEnum(['yes', 'no', 'errors'], {
    message: 'La respuesta de precisión debe ser: yes, no o errors',
  })
  precisionAnswer: 'yes' | 'no' | 'errors';

  // DIMENSIÓN 3: MONITOREO
  // ¿Te fue útil el seguimiento en tiempo real?
  @IsEnum(['very_useful', 'useful', 'not_used'], {
    message:
      'La respuesta de monitoreo debe ser: very_useful, useful o not_used',
  })
  monitoringAnswer: 'very_useful' | 'useful' | 'not_used';

  // DIMENSIÓN 4: EFICIENCIA/PUNTUALIDAD
  // ¿Tu pedido llegó en el tiempo estimado?
  @IsEnum(['on_time', 'delayed'], {
    message: 'La respuesta de puntualidad debe ser: on_time o delayed',
  })
  punctualityAnswer: 'on_time' | 'delayed';

  // VARIABLE DEPENDIENTE: SATISFACCIÓN GENERAL
  // ¿Cuál es tu satisfacción general con la experiencia?
  @IsInt()
  @Min(1, { message: 'La satisfacción general debe ser mínimo 1' })
  @Max(5, { message: 'La satisfacción general debe ser máximo 5' })
  generalSatisfaction: number;

  // COMENTARIOS ADICIONALES (OPCIONAL)
  @IsOptional()
  @IsString()
  comment?: string;
}
