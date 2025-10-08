import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    try {
      const client: Socket = context.switchToWs().getClient();
      const token = this.extractTokenFromClient(client);

      if (!token) {
        throw new WsException('No token provided');
      }

      const payload = this.jwtService.verify(token);

      // Añadir información del usuario al contexto
      context.switchToWs().getData().user = {
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
      };

      return true;
    } catch {
      throw new WsException('Invalid token');
    }
  }

  private extractTokenFromClient(client: Socket): string | null {
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    const tokenFromQuery = client.handshake.query.token as string;
    if (tokenFromQuery) {
      return tokenFromQuery;
    }

    const tokenFromHeader = client.handshake.headers['x-auth-token'] as string;
    if (tokenFromHeader) {
      return tokenFromHeader;
    }

    return null;
  }
}
