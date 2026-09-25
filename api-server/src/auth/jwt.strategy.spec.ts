import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { Role } from '../common/enums/role.enum';
import type { User } from '../users/entities/user.entity';

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'driver@test.com',
    name: 'Driver Test',
    phone: null,
    isActive: true,
    password_hash: 'hash',
    ...overrides,
  } as User;
}

describe('JwtStrategy', () => {
  let usersService: { findOneById: jest.Mock };
  let strategy: JwtStrategy;

  beforeEach(() => {
    usersService = { findOneById: jest.fn() };
    const configService = { get: jest.fn().mockReturnValue('test-secret') };
    strategy = new JwtStrategy(configService as never, usersService as never);
  });

  describe('rol', () => {
    it('debe tomar el rol de la base de datos e ignorar el claim del token', async () => {
      usersService.findOneById.mockResolvedValue(
        buildUser({ role: { name: Role.CLIENT } as never }),
      );

      const result = await strategy.validate({
        sub: 'user-1',
        role: Role.SUPER_ADMIN,
      });

      expect(result.role).toBe(Role.CLIENT);
    });

    it('debe propagar un cambio de rol sin esperar a que expire el token', async () => {
      usersService.findOneById.mockResolvedValue(
        buildUser({ role: { name: Role.DRIVER } as never }),
      );

      const result = await strategy.validate({
        sub: 'user-1',
        role: Role.CLIENT,
      });

      expect(result.role).toBe(Role.DRIVER);
    });

    it('debe devolver el rol como string, nunca como objeto', async () => {
      usersService.findOneById.mockResolvedValue(
        buildUser({ role: { name: Role.RESTAURANT_OWNER } as never }),
      );

      const result = await strategy.validate({
        sub: 'user-1',
        role: Role.SUPER_ADMIN,
      });

      expect(typeof result.role).toBe('string');
    });

    it('debe caer en Role.CLIENT cuando el usuario no tiene rol cargado', async () => {
      usersService.findOneById.mockResolvedValue(
        buildUser({ role: undefined as never }),
      );

      const result = await strategy.validate({
        sub: 'user-1',
        role: Role.SUPER_ADMIN,
      });

      expect(result.role).toBe(Role.CLIENT);
      expect(result.role).not.toBe('CLIENT');
    });
  });

  describe('isActive', () => {
    it('debe rechazar a un usuario desactivado', async () => {
      usersService.findOneById.mockResolvedValue(
        buildUser({ isActive: false }),
      );

      await expect(
        strategy.validate({ sub: 'user-1', role: Role.CLIENT }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('debe rechazar a un usuario que ya no existe', async () => {
      usersService.findOneById.mockResolvedValue(undefined);

      await expect(
        strategy.validate({ sub: 'user-1', role: Role.CLIENT }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('debe exponer sub, id, userId y name igual que antes', async () => {
      usersService.findOneById.mockResolvedValue(
        buildUser({ role: { name: Role.DRIVER } as never }),
      );

      const result = await strategy.validate({
        sub: 'user-1',
        role: Role.DRIVER,
      });

      expect(result).toMatchObject({
        sub: 'user-1',
        id: 'user-1',
        userId: 'user-1',
        name: 'Driver Test',
        role: Role.DRIVER,
      });
    });
  });
});
