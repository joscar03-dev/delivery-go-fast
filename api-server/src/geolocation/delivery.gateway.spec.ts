import { JwtService } from '@nestjs/jwt';
import { DeliveryGateway } from './delivery.gateway';
import { GeolocationService } from './geolocation.service';
import { UsersService } from '../users/users.service';
import { Role } from '../common/enums/role.enum';

type FakeSocket = {
  id: string;
  handshake: {
    auth: { token?: string };
    query: Record<string, string>;
    headers: Record<string, string>;
  };
  emit: jest.Mock;
  disconnect: jest.Mock;
  join: jest.Mock;
  userId?: string;
  userRole?: string;
  userEmail?: string;
};

function buildSocket(token?: string): FakeSocket {
  return {
    id: 'socket-1',
    handshake: {
      auth: token ? { token } : {},
      query: {},
      headers: {},
    },
    emit: jest.fn(),
    disconnect: jest.fn(),
    join: jest.fn().mockResolvedValue(undefined),
  };
}

function buildGateway(overrides?: {
  verify?: jest.Mock;
  findOneById?: jest.Mock;
}) {
  const jwtService = {
    verify: overrides?.verify ?? jest.fn().mockReturnValue({ sub: 'user-1' }),
  };
  const geolocationService = {
    deactivateDriverLocation: jest.fn().mockResolvedValue(undefined),
  };
  const usersService = {
    findOneById:
      overrides?.findOneById ??
      jest.fn().mockResolvedValue({
        id: 'user-1',
        email: 'user@test.com',
        isActive: true,
        role: { name: Role.DRIVER },
      }),
  };

  const gateway = new DeliveryGateway(
    jwtService as unknown as JwtService,
    geolocationService as unknown as GeolocationService,
    usersService as unknown as UsersService,
  );

  return { gateway, jwtService, usersService };
}

function authErrorCode(socket: FakeSocket): string | undefined {
  return socket.emit.mock.calls
    .map((call) => call[0])
    .find((event) => event === 'auth_error');
}

function authErrorPayload(socket: FakeSocket): { code?: string } | undefined {
  const call = socket.emit.mock.calls.find((c) => c[0] === 'auth_error');
  return call?.[1];
}

describe('DeliveryGateway autenticación de conexiones', () => {
  it('rechaza la conexión sin token', async () => {
    const { gateway, usersService } = buildGateway();
    const socket = buildSocket();

    await gateway.handleConnection(socket as never);

    expect(socket.disconnect).toHaveBeenCalled();
    expect(usersService.findOneById).not.toHaveBeenCalled();
  });

  it('rechaza la conexión si la cuenta está desactivada', async () => {
    const findOneById = jest.fn().mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      isActive: false,
      role: { name: Role.DRIVER },
    });
    const { gateway } = buildGateway({ findOneById });
    const socket = buildSocket('token');

    await gateway.handleConnection(socket as never);

    expect(socket.disconnect).toHaveBeenCalled();
    expect(authErrorPayload(socket)?.code).toBe('ACCOUNT_DISABLED');
    expect(socket.join).not.toHaveBeenCalled();
  });

  it('rechaza la conexión si el usuario ya no existe', async () => {
    const findOneById = jest.fn().mockResolvedValue(undefined);
    const { gateway } = buildGateway({ findOneById });
    const socket = buildSocket('token');

    await gateway.handleConnection(socket as never);

    expect(socket.disconnect).toHaveBeenCalled();
    expect(authErrorPayload(socket)?.code).toBe('USER_NOT_FOUND');
    expect(socket.join).not.toHaveBeenCalled();
  });

  it('toma el rol de la base de datos, no el del token', async () => {
    // El token sigue diciendo admin porque se emitió antes del cambio de rol.
    const verify = jest.fn().mockReturnValue({
      sub: 'user-1',
      role: Role.SUPER_ADMIN,
    });
    const findOneById = jest.fn().mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      isActive: true,
      role: { name: Role.DRIVER },
    });
    const { gateway } = buildGateway({ verify, findOneById });
    const socket = buildSocket('token');

    await gateway.handleConnection(socket as never);

    expect(socket.userRole).toBe(Role.DRIVER);
    expect(socket.userRole).not.toBe(Role.SUPER_ADMIN);
    expect(socket.disconnect).not.toHaveBeenCalled();
  });

  it('conecta y une las salas del rol que dice la base de datos', async () => {
    const { gateway } = buildGateway();
    const socket = buildSocket('token');

    await gateway.handleConnection(socket as never);

    expect(socket.disconnect).not.toHaveBeenCalled();
    expect(socket.userId).toBe('user-1');
    expect(socket.userEmail).toBe('user@test.com');
    expect(socket.join).toHaveBeenCalledWith(`role_${Role.DRIVER}`);
    expect(socket.join).toHaveBeenCalledWith('available_drivers');
  });

  it('cae a CLIENT si el usuario no tiene rol asignado', async () => {
    const findOneById = jest.fn().mockResolvedValue({
      id: 'user-1',
      email: null,
      isActive: true,
      role: null,
    });
    const { gateway } = buildGateway({ findOneById });
    const socket = buildSocket('token');

    await gateway.handleConnection(socket as never);

    expect(socket.userRole).toBe(Role.CLIENT);
    expect(socket.userEmail).toBeUndefined();
  });

  it('desconecta si el token no es válido', async () => {
    const verify = jest.fn().mockImplementation(() => {
      throw new Error('invalid');
    });
    const { gateway } = buildGateway({ verify });
    const socket = buildSocket('token');

    await gateway.handleConnection(socket as never);

    expect(socket.disconnect).toHaveBeenCalled();
    expect(authErrorCode(socket)).toBe('auth_error');
  });
});
