import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as admin from 'firebase-admin';
import { DeviceToken } from './entities/device-token.entity';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';

/**
 * Tipos de notificaciones que se pueden enviar
 */
export enum NotificationType {
  NEW_ORDER = 'new_order',
  ORDER_CONFIRMED = 'order_confirmed',
  ORDER_PREPARING = 'order_preparing',
  ORDER_READY = 'order_ready',
  ORDER_PICKED_UP = 'order_picked_up',
  ORDER_ON_THE_WAY = 'order_on_the_way',
  ORDER_DELIVERED = 'order_delivered',
  ORDER_CANCELLED = 'order_cancelled',
  DRIVER_ASSIGNED = 'driver_assigned',
  DELIVERY_NEAR = 'delivery_near',
}

/**
 * Servicio para manejar notificaciones push usando Firebase Cloud Messaging
 */
@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private firebaseApp: admin.app.App;

  constructor(
    @InjectRepository(DeviceToken)
    private deviceTokenRepository: Repository<DeviceToken>,
  ) {}

  /**
   * Inicializa Firebase Admin SDK al cargar el módulo
   */
  async onModuleInit() {
    try {
      // Verificar si ya existe una instancia de Firebase
      if (admin.apps.length === 0) {
        // Buscar el archivo de credenciales de Firebase
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

        if (!serviceAccountPath) {
          this.logger.warn(
            '⚠️ FIREBASE_SERVICE_ACCOUNT_PATH no configurado. Las notificaciones push no estarán disponibles.',
          );
          this.logger.warn('💡 Para habilitar push notifications:');
          this.logger.warn(
            '   1. Crea un proyecto en Firebase Console (https://console.firebase.google.com)',
          );
          this.logger.warn('   2. Ve a Project Settings > Service Accounts');
          this.logger.warn('   3. Genera una nueva clave privada (JSON)');
          this.logger.warn(
            '   4. Guarda el archivo como firebase-service-account.json en la raíz del proyecto',
          );
          this.logger.warn(
            '   5. Agrega FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json al archivo .env',
          );
          return;
        }

        // Inicializar Firebase Admin
        const serviceAccount = require(`../../${serviceAccountPath}`);

        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });

        this.logger.log('✅ Firebase Admin SDK inicializado correctamente');
      } else {
        this.firebaseApp = admin.app();
        this.logger.log('✅ Usando instancia existente de Firebase Admin SDK');
      }
    } catch (error) {
      this.logger.error(
        '❌ Error al inicializar Firebase Admin SDK:',
        error.message,
      );
      this.logger.warn(
        '⚠️ Las notificaciones push no estarán disponibles hasta que se configure correctamente Firebase',
      );
    }
  }

  /**
   * Registra un token de dispositivo para un usuario
   */
  async registerDeviceToken(
    userId: string,
    registerDto: RegisterDeviceTokenDto,
  ): Promise<DeviceToken> {
    try {
      // Buscar si ya existe este token para este usuario
      let deviceToken = await this.deviceTokenRepository.findOne({
        where: {
          userId,
          token: registerDto.token,
        },
      });

      if (deviceToken) {
        // Actualizar token existente
        deviceToken.platform = registerDto.platform;
        deviceToken.deviceInfo = registerDto.deviceInfo;
        deviceToken.isActive = true;
        deviceToken.lastUsedAt = new Date();
      } else {
        // Crear nuevo token
        deviceToken = this.deviceTokenRepository.create({
          userId,
          token: registerDto.token,
          platform: registerDto.platform,
          deviceInfo: registerDto.deviceInfo,
          isActive: true,
          lastUsedAt: new Date(),
        });
      }

      await this.deviceTokenRepository.save(deviceToken);
      this.logger.log(
        `✅ Token de dispositivo registrado para usuario ${userId} (${registerDto.platform})`,
      );

      return deviceToken;
    } catch (error) {
      this.logger.error(
        `❌ Error al registrar token de dispositivo:`,
        error.message,
      );
      throw error;
    }
  }

  /**
   * Desregistra un token de dispositivo
   */
  async unregisterDeviceToken(userId: string, token: string): Promise<boolean> {
    try {
      const result = await this.deviceTokenRepository.delete({
        userId,
        token,
      });

      if (result.affected > 0) {
        this.logger.log(
          `✅ Token de dispositivo eliminado para usuario ${userId}`,
        );
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(
        `❌ Error al eliminar token de dispositivo:`,
        error.message,
      );
      throw error;
    }
  }

  /**
   * Obtiene todos los tokens activos de un usuario
   */
  async getUserTokens(userId: string): Promise<DeviceToken[]> {
    return this.deviceTokenRepository.find({
      where: {
        userId,
        isActive: true,
      },
    });
  }

  /**
   * Envía una notificación push a un usuario específico
   */
  async sendToUser(
    userId: string,
    notification: {
      title: string;
      body: string;
      data?: Record<string, string>;
      type?: NotificationType;
    },
  ): Promise<{ success: number; failure: number }> {
    if (!this.firebaseApp) {
      this.logger.warn(
        '⚠️ Firebase no está inicializado. No se puede enviar notificación.',
      );
      return { success: 0, failure: 0 };
    }

    try {
      // Obtener todos los tokens activos del usuario
      const deviceTokens = await this.getUserTokens(userId);

      if (deviceTokens.length === 0) {
        this.logger.warn(
          `⚠️ No hay tokens de dispositivo registrados para usuario ${userId}`,
        );
        return { success: 0, failure: 0 };
      }

      const tokens = deviceTokens.map((dt) => dt.token);

      // Preparar el mensaje
      const message: admin.messaging.MulticastMessage = {
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: {
          ...notification.data,
          type: notification.type || NotificationType.NEW_ORDER,
          timestamp: new Date().toISOString(),
        },
        tokens,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'delivery_notifications',
            priority: 'high',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      // Enviar notificación
      const response = await admin.messaging().sendEachForMulticast(message);

      this.logger.log(
        `📨 Notificación enviada a usuario ${userId}: ${response.successCount} exitosas, ${response.failureCount} fallidas`,
      );

      // Actualizar lastUsedAt para tokens exitosos
      const successfulTokens = tokens.filter(
        (_, index) => response.responses[index].success,
      );
      await this.updateLastUsedAt(successfulTokens);

      // Marcar como inactivos los tokens que fallaron
      const failedTokens = tokens.filter(
        (_, index) => !response.responses[index].success,
      );
      await this.markTokensAsInactive(failedTokens);

      return {
        success: response.successCount,
        failure: response.failureCount,
      };
    } catch (error) {
      this.logger.error(`❌ Error al enviar notificación push:`, error.message);
      return { success: 0, failure: 1 };
    }
  }

  /**
   * Envía notificación a múltiples usuarios
   */
  async sendToUsers(
    userIds: string[],
    notification: {
      title: string;
      body: string;
      data?: Record<string, string>;
      type?: NotificationType;
    },
  ): Promise<{ success: number; failure: number }> {
    let totalSuccess = 0;
    let totalFailure = 0;

    for (const userId of userIds) {
      const result = await this.sendToUser(userId, notification);
      totalSuccess += result.success;
      totalFailure += result.failure;
    }

    return { success: totalSuccess, failure: totalFailure };
  }

  /**
   * Envía notificación de nuevo pedido al restaurante
   */
  async sendNewOrderNotification(
    restaurantOwnerId: string,
    orderData: {
      orderId: string;
      orderNumber: string;
      totalAmount: number;
      customerName: string;
    },
  ): Promise<void> {
    await this.sendToUser(restaurantOwnerId, {
      title: '🔔 Nuevo Pedido',
      body: `Pedido #${orderData.orderNumber} - $${orderData.totalAmount} de ${orderData.customerName}`,
      data: {
        orderId: orderData.orderId,
        orderNumber: orderData.orderNumber,
        screen: 'restaurant-orders',
      },
      type: NotificationType.NEW_ORDER,
    });
  }

  /**
   * Envía notificación de cambio de estado al cliente
   */
  async sendOrderStatusNotification(
    customerId: string,
    orderData: {
      orderId: string;
      orderNumber: string;
      status: string;
      restaurantName: string;
    },
  ): Promise<void> {
    const statusMessages = {
      confirmed: {
        title: '✅ Pedido Confirmado',
        body: `Tu pedido de ${orderData.restaurantName} ha sido confirmado`,
        type: NotificationType.ORDER_CONFIRMED,
      },
      preparing: {
        title: '👨‍🍳 Preparando tu Pedido',
        body: `${orderData.restaurantName} está preparando tu pedido`,
        type: NotificationType.ORDER_PREPARING,
      },
      ready_for_pickup: {
        title: '📦 Pedido Listo',
        body: `Tu pedido está listo para ser recogido`,
        type: NotificationType.ORDER_READY,
      },
      out_for_delivery: {
        title: '🚗 En Camino',
        body: `Tu pedido está en camino. ¡Llegará pronto!`,
        type: NotificationType.ORDER_ON_THE_WAY,
      },
      delivered: {
        title: '🎉 Pedido Entregado',
        body: `Tu pedido ha sido entregado. ¡Buen provecho!`,
        type: NotificationType.ORDER_DELIVERED,
      },
      cancelled: {
        title: '❌ Pedido Cancelado',
        body: `Tu pedido ha sido cancelado`,
        type: NotificationType.ORDER_CANCELLED,
      },
    };

    const messageConfig = statusMessages[orderData.status];
    if (!messageConfig) return;

    await this.sendToUser(customerId, {
      title: messageConfig.title,
      body: messageConfig.body,
      data: {
        orderId: orderData.orderId,
        orderNumber: orderData.orderNumber,
        screen: 'order-detail',
      },
      type: messageConfig.type,
    });
  }

  /**
   * Envía notificación de pedido disponible a repartidores
   */
  async sendNewDeliveryNotification(
    driverIds: string[],
    orderData: {
      orderId: string;
      orderNumber: string;
      restaurantName: string;
      deliveryAddress: string;
      estimatedDistance?: string;
    },
  ): Promise<void> {
    await this.sendToUsers(driverIds, {
      title: '🚗 Nuevo Pedido Disponible',
      body: `Pedido #${orderData.orderNumber} - ${orderData.restaurantName}`,
      data: {
        orderId: orderData.orderId,
        orderNumber: orderData.orderNumber,
        screen: 'available-deliveries',
      },
      type: NotificationType.NEW_ORDER,
    });
  }

  /**
   * Actualiza lastUsedAt para tokens que fueron usados exitosamente
   */
  private async updateLastUsedAt(tokens: string[]): Promise<void> {
    if (tokens.length === 0) return;

    await this.deviceTokenRepository
      .createQueryBuilder()
      .update(DeviceToken)
      .set({ lastUsedAt: new Date() })
      .where('token IN (:...tokens)', { tokens })
      .execute();
  }

  /**
   * Marca tokens como inactivos si fallaron al enviar
   */
  private async markTokensAsInactive(tokens: string[]): Promise<void> {
    if (tokens.length === 0) return;

    await this.deviceTokenRepository
      .createQueryBuilder()
      .update(DeviceToken)
      .set({ isActive: false })
      .where('token IN (:...tokens)', { tokens })
      .execute();

    this.logger.warn(
      `⚠️ ${tokens.length} tokens marcados como inactivos por fallo en envío`,
    );
  }
}
