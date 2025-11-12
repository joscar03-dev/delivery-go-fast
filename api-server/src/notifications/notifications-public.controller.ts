import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

/**
 * Controlador público para endpoints de diagnóstico
 * NO requiere autenticación
 */
@Controller('notifications')
export class NotificationsPublicController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * 🧪 ENDPOINT DE PRUEBA: Verifica el estado de Firebase
   * Este endpoint NO requiere autenticación para facilitar diagnóstico
   */
  @Get('health')
  @HttpCode(HttpStatus.OK)
  async checkHealth() {
    try {
      // Verificar si el servicio está disponible
      const isInitialized = this.notificationsService ? true : false;

      return {
        status: 'ok',
        firebase: isInitialized ? 'initialized' : 'not initialized',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        firebase: 'error',
        database: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
