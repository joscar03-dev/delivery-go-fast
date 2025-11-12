import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationType } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Registra un token de dispositivo para recibir notificaciones push
   */
  @Post('register-token')
  @HttpCode(HttpStatus.OK)
  async registerToken(
    @Req() req: any,
    @Body() registerDto: RegisterDeviceTokenDto,
  ) {
    const userId = req.user.userId;
    const deviceToken = await this.notificationsService.registerDeviceToken(
      userId,
      registerDto,
    );

    return {
      message: 'Token de dispositivo registrado correctamente',
      data: {
        id: deviceToken.id,
        platform: deviceToken.platform,
      },
    };
  }

  /**
   * Desregistra un token de dispositivo
   */
  @Delete('unregister-token')
  @HttpCode(HttpStatus.OK)
  async unregisterToken(@Req() req: any, @Body() body: { token: string }) {
    const userId = req.user.userId;
    const result = await this.notificationsService.unregisterDeviceToken(
      userId,
      body.token,
    );

    return {
      message: result ? 'Token eliminado correctamente' : 'Token no encontrado',
      success: result,
    };
  }

  /**
   * 🧪 ENDPOINT DE PRUEBA: Obtiene los tokens del usuario actual
   */
  @Get('my-tokens')
  @HttpCode(HttpStatus.OK)
  async getMyTokens(@Req() req: any) {
    const userId = req.user.userId;
    const tokens = await this.notificationsService.getUserTokens(userId);
    return tokens;
  }

  /**
   * 🧪 ENDPOINT DE PRUEBA: Envía una notificación de prueba al usuario actual
   */
  @Post('test')
  @HttpCode(HttpStatus.OK)
  async sendTestNotification(
    @Req() req: any,
    @Body() body?: { title?: string; body?: string },
  ) {
    const userId = req.user.userId;

    const result = await this.notificationsService.sendToUser(userId, {
      title: body?.title || '🧪 Notificación de Prueba',
      body:
        body?.body ||
        'Si ves esto, las notificaciones push están funcionando correctamente! 🎉',
      data: {
        type: 'test',
        timestamp: new Date().toISOString(),
      },
      type: NotificationType.NEW_ORDER,
    });

    return {
      message: 'Notificación de prueba enviada',
      success: result.success,
      failure: result.failure,
    };
  }
}
