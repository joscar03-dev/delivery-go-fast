import {
  Controller,
  Get,
  INestApplication,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import * as request from 'supertest';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { UsersService } from '../users/users.service';

const SECRET = 'integration-secret';

@Controller('driver-only')
class DriverOnlyController {
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DRIVER, Role.SUPER_ADMIN)
  find() {
    return { ok: true };
  }
}

describe('Cambio de rol en caliente (bug 3)', () => {
  let app: INestApplication;
  let usersService: { findOneById: jest.Mock };
  let currentRole: Role;
  let isActive: boolean;
  let staleToken: string;

  const makeUser = () =>
    ({
      id: 'user-1',
      email: 'user@test.com',
      name: 'User Test',
      phone: null,
      isActive,
      role: { name: currentRole },
    }) as never;

  const get = () =>
    request(app.getHttpServer())
      .get('/driver-only')
      .set('Authorization', `Bearer ${staleToken}`);

  beforeAll(async () => {
    currentRole = Role.DRIVER;
    isActive = true;
    usersService = { findOneById: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({ secret: SECRET }),
      ],
      controllers: [DriverOnlyController],
      providers: [
        { provide: ConfigService, useValue: { get: () => SECRET } },
        { provide: UsersService, useValue: usersService },
        JwtStrategy,
        RolesGuard,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    staleToken = moduleRef
      .get(JwtService)
      .sign({ sub: 'user-1', role: Role.DRIVER });
  });

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(() => {
    usersService.findOneById.mockImplementation(async () => makeUser());
  });

  it('permite el acceso mientras el rol de la BD coincida con el del token', async () => {
    currentRole = Role.DRIVER;
    isActive = true;

    await get().expect(200);
  });

  it('bloquea con 403 en el siguiente request tras degradar el rol', async () => {
    currentRole = Role.CLIENT;
    isActive = true;

    await get().expect(403);
  });

  it('revierte el acceso al devolver el rol original en la BD', async () => {
    currentRole = Role.DRIVER;
    isActive = true;

    await get().expect(200);
  });

  it('devuelve 401 en un endpoint protegido tras desactivar la cuenta', async () => {
    currentRole = Role.DRIVER;
    isActive = false;

    await get().expect(401);
  });

  it('informa desactivación en lugar de un error de permisos', async () => {
    currentRole = Role.DRIVER;
    isActive = false;

    const res = await get();

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/desactivada/i);
  });
});

describe('JwtStrategy sin usuario en base de datos', () => {
  it('lanza UnauthorizedException', async () => {
    const usersService = {
      findOneById: jest.fn().mockResolvedValue(undefined),
    };
    const strategy = new JwtStrategy(
      { get: () => SECRET } as never,
      {
        findOneById: usersService.findOneById,
      } as never,
    );

    await expect(
      strategy.validate({ sub: 'ghost', role: Role.SUPER_ADMIN }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
