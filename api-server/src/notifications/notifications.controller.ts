import {
  Controller,
  Post,
  Delete,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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
}
