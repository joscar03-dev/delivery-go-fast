import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { GeolocationService } from './geolocation.service';
import { DriverLocationUpdateDto } from './dto/driver-location-update.dto';
import { GetActiveDriversDto } from './dto/get-active-drivers.dto';
import { Role } from '../common/enums/role.enum';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
  userEmail?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: '/delivery',
})
export class DeliveryGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(DeliveryGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly geolocationService: GeolocationService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extraer token de los headers o query params
      const token = this.extractTokenFromClient(client);

      if (!token) {
        this.logger.warn(
          `❌ Client ${client.id} attempted to connect without token`,
        );
        client.emit('auth_error', {
          code: 'NO_TOKEN',
          message: 'No authentication token provided',
        });
        client.disconnect();
        return;
      }

      // Verificar y decodificar el token JWT
      const payload = this.jwtService.verify(token);

      // Asignar información del usuario al socket
      client.userId = payload.sub;
      client.userRole = payload.role;
      client.userEmail = payload.email;

      // Unir al cliente a salas según su rol
      await this.joinRoleBasedRooms(client);

      this.logger.log(
        `✅ Client connected: ${client.id} (User: ${client.userEmail}, Role: ${client.userRole})`,
      );
    } catch (error) {
      // Manejar diferentes tipos de errores JWT
      let errorCode = 'AUTH_FAILED';
      let errorMessage = 'Authentication failed';

      if (error.name === 'TokenExpiredError') {
        errorCode = 'TOKEN_EXPIRED';
        errorMessage = 'Your session has expired. Please login again.';
        this.logger.warn(
          `⚠️ Token expired for client ${client.id} - Exp: ${error.expiredAt}`,
        );
      } else if (error.name === 'JsonWebTokenError') {
        errorCode = 'INVALID_TOKEN';
        errorMessage = 'Invalid authentication token';
        this.logger.error(
          `❌ Invalid token for client ${client.id}: ${error.message}`,
        );
      } else {
        this.logger.error(
          `❌ Authentication failed for client ${client.id}:`,
          error.message,
        );
      }

      // Emitir error específico al cliente
      client.emit('auth_error', {
        code: errorCode,
        message: errorMessage,
        timestamp: new Date().toISOString(),
      });

      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId && client.userRole === Role.DRIVER) {
      // Desactivar la ubicación del repartidor al desconectarse
      await this.geolocationService.deactivateDriverLocation(client.userId);
      this.logger.log(
        `Driver ${client.userId} location deactivated on disconnect`,
      );
    }

    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('driverLocationUpdate')
  async handleDriverLocationUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: DriverLocationUpdateDto,
  ) {
    try {
      // Verificar que el cliente sea un repartidor
      if (client.userRole !== Role.DRIVER) {
        client.emit('error', { message: 'Only drivers can update location' });
        return;
      }

      // Actualizar ubicación en la base de datos
      const updatedLocation =
        await this.geolocationService.updateDriverLocation(client.userId, data);

      this.logger.debug(`Location updated for driver ${client.userId}`);

      // Si el repartidor está entregando un pedido, notificar al cliente
      if (data.orderId) {
        await this.notifyClientAboutOrderLocation(data.orderId);
      }

      // Confirmar la actualización al repartidor
      client.emit('locationUpdated', {
        success: true,
        timestamp: updatedLocation.updatedAt,
      });
    } catch (error) {
      this.logger.error(`Error updating driver location:`, error);
      client.emit('error', { message: 'Failed to update location' });
    }
  }

  @SubscribeMessage('joinOrderRoom')
  async handleJoinOrderRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { orderId: string },
  ) {
    try {
      // Verificar que el usuario tenga permisos para unirse a esta sala
      if (
        await this.canJoinOrderRoom(
          client.userId,
          data.orderId,
          client.userRole,
        )
      ) {
        await client.join(`order_${data.orderId}`);

        client.emit('joinedOrderRoom', {
          orderId: data.orderId,
          message: 'Successfully joined order tracking',
        });

        this.logger.log(
          `User ${client.userId} joined room for order ${data.orderId}`,
        );

        // Enviar ubicación actual si está disponible
        const locationUpdate =
          await this.geolocationService.getOrderLocationUpdate(data.orderId);

        if (locationUpdate) {
          client.emit('orderLocationUpdate', locationUpdate);
        }
      } else {
        client.emit('error', {
          message: 'You do not have permission to track this order',
        });
      }
    } catch (error) {
      this.logger.error(`Error joining order room:`, error);
      client.emit('error', { message: 'Failed to join order tracking' });
    }
  }

  @SubscribeMessage('leaveOrderRoom')
  async handleLeaveOrderRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { orderId: string },
  ) {
    await client.leave(`order_${data.orderId}`);
    client.emit('leftOrderRoom', { orderId: data.orderId });

    this.logger.log(
      `User ${client.userId} left room for order ${data.orderId}`,
    );
  }

  // Método público para notificar actualizaciones de ubicación desde otros servicios
  async notifyOrderLocationUpdate(orderId: string) {
    await this.notifyClientAboutOrderLocation(orderId);
  }

  private async notifyClientAboutOrderLocation(orderId: string) {
    try {
      const locationUpdate =
        await this.geolocationService.getOrderLocationUpdate(orderId);

      if (locationUpdate) {
        // Enviar actualización a todos los clientes suscritos a este pedido
        this.server
          .to(`order_${orderId}`)
          .emit('orderLocationUpdate', locationUpdate);

        this.logger.debug(`Location update sent for order ${orderId}`);
      }
    } catch (error) {
      this.logger.error(`Error notifying order location:`, error);
    }
  }

  private extractTokenFromClient(client: Socket): string | null {
    // Intentar extraer token desde el objeto auth (Socket.IO cliente)
    const authToken = client.handshake.auth?.token as string;
    if (authToken) {
      // Si viene con 'Bearer ', extraerlo
      if (authToken.startsWith('Bearer ')) {
        return authToken.substring(7);
      }
      return authToken;
    }

    // Intentar extraer token de diferentes lugares (compatibilidad)
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Intentar desde query params
    const tokenFromQuery = client.handshake.query.token as string;
    if (tokenFromQuery) {
      return tokenFromQuery;
    }

    // Intentar desde headers personalizados
    const tokenFromHeader = client.handshake.headers['x-auth-token'] as string;
    if (tokenFromHeader) {
      return tokenFromHeader;
    }

    return null;
  }

  private async joinRoleBasedRooms(client: AuthenticatedSocket) {
    // Unir a sala general según el rol
    await client.join(`role_${client.userRole}`);

    // Si es repartidor, unir a sala de repartidores disponibles
    if (client.userRole === Role.DRIVER) {
      await client.join('available_drivers');
    }

    // Si es cliente, unir a sala de clientes
    if (client.userRole === Role.CLIENT) {
      await client.join('clients');
    }
  }

  private async canJoinOrderRoom(
    userId: string,
    orderId: string,
    userRole: string,
  ): Promise<boolean> {
    try {
      // Los super admins pueden acceder a cualquier pedido
      if (userRole === Role.SUPER_ADMIN) {
        return true;
      }

      // Verificar directamente con el Order en vez de depender de DriverLocation
      const order =
        await this.geolocationService.getOrderForPermissionCheck(orderId);

      if (!order) {
        this.logger.warn(`Order ${orderId} not found for permission check`);
        return false;
      }

      // El cliente puede ver su propio pedido
      if (userRole === Role.CLIENT) {
        return order.client && order.client.id === userId;
      }

      // El repartidor puede ver pedidos asignados a él
      if (userRole === Role.DRIVER) {
        const canJoin = order.driver && order.driver.id === userId;
        if (!canJoin) {
          this.logger.warn(
            `Driver ${userId} tried to join order ${orderId} but is not assigned (assigned driver: ${order.driver?.id})`,
          );
        }
        return canJoin;
      }

      return false;
    } catch (error) {
      this.logger.error(`Error checking order room permissions:`, error);
      return false;
    }
  }

  @SubscribeMessage('getActiveDrivers')
  async handleGetActiveDrivers(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: GetActiveDriversDto,
  ) {
    try {
      // Solo los administradores pueden ver todos los drivers activos
      if (client.userRole !== Role.SUPER_ADMIN) {
        client.emit('exception', {
          message:
            'Acceso denegado. Solo administradores pueden ver drivers activos.',
          code: 'ACCESS_DENIED',
        });
        return;
      }

      this.logger.log(
        `Admin ${client.userId} requesting active drivers in area: ${data.latitude}, ${data.longitude} (${data.radius}km)`,
      );

      const activeDrivers =
        await this.geolocationService.getActiveDriversInArea(
          data.latitude,
          data.longitude,
          data.radius,
        );

      // Emitir solo al cliente que lo solicitó
      client.emit('activeDrivers', activeDrivers);

      this.logger.log(
        `Sent ${activeDrivers.length} active drivers to admin ${client.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error getting active drivers for admin ${client.userId}:`,
        error,
      );
      client.emit('exception', {
        message: 'Error al obtener drivers activos',
        error: error.message,
      });
    }
  }
}
