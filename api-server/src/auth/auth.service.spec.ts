import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { Role } from '../common/enums/role.enum';
import type { User } from '../users/entities/user.entity';

const REFRESH_TOKEN = 'refresh-token-fake';

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'user@test.com',
    name: 'User Test',
    phone: null,
    isActive: true,
    password_hash: 'hash',
    hashedRefreshToken: bcrypt.hashSync(REFRESH_TOKEN, 4),
    role: { name: Role.CLIENT } as never,
    ...overrides,
  } as User;
}

describe('AuthService', () => {
  let usersService: {
    findOneById: jest.Mock;
    updateRefreshToken: jest.Mock;
    findOneByEmailOrPhone: jest.Mock;
    togglePhoneVerified?: jest.Mock;
  };
  let jwtService: { sign: jest.Mock; verify: jest.Mock };
  let configService: { get: jest.Mock };
  let authService: AuthService;

  beforeEach(() => {
    usersService = {
      findOneById: jest.fn(),
      updateRefreshToken: jest.fn().mockResolvedValue(undefined),
      findOneByEmailOrPhone: jest.fn(),
    };
    jwtService = {
      sign: jest.fn().mockReturnValue('new-token'),
      verify: jest.fn().mockReturnValue({ sub: 'user-1' }),
    };
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'BCRYPT_SALT_ROUNDS') return 4;
        if (key === 'JWT_ACCESS_TOKEN_EXPIRATION_TIME') return '1h';
        if (key === 'JWT_REFRESH_TOKEN_EXPIRATION_TIME') return '7d';
        return 'test-secret';
      }),
    };
    const otpService = {};

    authService = new AuthService(
      usersService as never,
      jwtService as never,
      configService as never,
      otpService as never,
    );
  });

  describe('refreshToken', () => {
    it('debe rechazar a un usuario desactivado', async () => {
      usersService.findOneById.mockResolvedValue(
        buildUser({ isActive: false }),
      );

      await expect(authService.refreshToken(REFRESH_TOKEN)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('debe rechazar cuando no hay refresh token almacenado', async () => {
      usersService.findOneById.mockResolvedValue(
        buildUser({ hashedRefreshToken: null as never }),
      );

      await expect(authService.refreshToken(REFRESH_TOKEN)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('debe rechazar cuando el refresh token no coincide', async () => {
      usersService.findOneById.mockResolvedValue(buildUser());

      await expect(authService.refreshToken('otro-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('debe emitir el rol actual de la base de datos en el token nuevo', async () => {
      usersService.findOneById.mockResolvedValue(
        buildUser({ role: { name: Role.SUPER_ADMIN } as never }),
      );

      await authService.refreshToken(REFRESH_TOKEN);

      const [accessPayload] = jwtService.sign.mock.calls[0];
      expect(accessPayload.role).toBe(Role.SUPER_ADMIN);
    });

    it('debe emitir el enum Role.CLIENT y nunca la cadena "CLIENT"', async () => {
      usersService.findOneById.mockResolvedValue(
        buildUser({ role: undefined as never }),
      );

      await authService.refreshToken(REFRESH_TOKEN);

      const [accessPayload] = jwtService.sign.mock.calls[0];
      expect(accessPayload.role).toBe(Role.CLIENT);
      expect(accessPayload.role).not.toBe('CLIENT');
    });

    it('debe rotar el refresh token almacenado', async () => {
      usersService.findOneById.mockResolvedValue(buildUser());

      await authService.refreshToken(REFRESH_TOKEN);

      expect(usersService.updateRefreshToken).toHaveBeenCalledWith(
        'user-1',
        expect.any(String),
      );
    });
  });

  describe('logout', () => {
    it('debe anular el refresh token almacenado', async () => {
      await authService.logout('user-1');

      expect(usersService.updateRefreshToken).toHaveBeenCalledWith(
        'user-1',
        null,
      );
    });
  });
});
