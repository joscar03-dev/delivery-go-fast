import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Socket, io as Client } from 'socket.io-client';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeliveryGateway } from '../src/geolocation/delivery.gateway';
import { GeolocationService } from '../src/geolocation/geolocation.service';
import { DriverLocation } from '../src/geolocation/entities/driver-location.entity';
import { User } from '../src/users/entities/user.entity';
import { Order } from '../src/orders/entities/order.entity';
import { Role } from '../src/common/enums/role.enum';

describe('WebSocket Geolocation Tests', () => {
  let app: INestApplication;
  let clientSocket: Socket;
  let driverSocket: Socket;
  let jwtService: JwtService;
  let port: number;

  // Mock repositories
  const mockDriverLocationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    })),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockOrderRepository = {
    findOne: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveryGateway,
        GeolocationService,
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
            sign: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(DriverLocation),
          useValue: mockDriverLocationRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Order),
          useValue: mockOrderRepository,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    jwtService = moduleFixture.get<JwtService>(JwtService);

    // Configurar puerto dinámico para evitar conflictos
    port = 3001;
    await app.listen(port);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
    if (driverSocket && driverSocket.connected) {
      driverSocket.disconnect();
    }
  });

  describe('Conexión WebSocket', () => {
    it('debería conectar sin token JWT', (done) => {
      clientSocket = Client(`http://localhost:${port}/delivery`);

      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        done();
      });

      clientSocket.on('connect_error', (error) => {
        done(error);
      });
    });

    it('debería rechazar conexión con token JWT inválido', (done) => {
      // Mock JWT verification to throw error
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Token inválido');
      });

      clientSocket = Client(`http://localhost:${port}/delivery`, {
        auth: { token: 'invalid-token' },
      });

      clientSocket.on('connect', () => {
        done(new Error('No debería conectar con token inválido'));
      });

      clientSocket.on('connect_error', (error) => {
        expect(error.message).toBeDefined();
        done();
      });
    });

    it('debería conectar con token JWT válido', (done) => {
      const mockUser = {
        id: 1,
        email: 'driver@test.com',
        role: Role.DRIVER,
      };

      // Mock JWT verification to return valid user
      jest.spyOn(jwtService, 'verify').mockReturnValue(mockUser);

      clientSocket = Client(`http://localhost:${port}/delivery`, {
        auth: { token: 'valid-token' },
      });

      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        done();
      });

      clientSocket.on('connect_error', (error) => {
        done(error);
      });
    });
  });

  describe('Eventos de Geolocalización', () => {
    beforeEach((done) => {
      const mockDriver = {
        id: 1,
        email: 'driver@test.com',
        role: Role.DRIVER,
      };

      jest.spyOn(jwtService, 'verify').mockReturnValue(mockDriver);
      mockUserRepository.findOne.mockResolvedValue(mockDriver);

      driverSocket = Client(`http://localhost:${port}/delivery`, {
        auth: { token: 'driver-token' },
      });

      driverSocket.on('connect', () => {
        done();
      });
    });

    it('debería recibir actualización de ubicación del driver', (done) => {
      const locationData = {
        latitude: -12.0464,
        longitude: -77.0428,
        heading: 45,
        speed: 30,
        accuracy: 10,
      };

      const mockDriverLocation = {
        id: 1,
        ...locationData,
        user: { id: 1 },
        isActive: true,
        updatedAt: new Date(),
      };

      mockDriverLocationRepository.save.mockResolvedValue(mockDriverLocation);

      driverSocket.emit('driverLocationUpdate', locationData);

      // Verificar que el evento fue procesado
      setTimeout(() => {
        expect(mockDriverLocationRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            heading: locationData.heading,
            speed: locationData.speed,
          }),
        );
        done();
      }, 100);
    });

    it('debería unirse y salir de una sala de orden', (done) => {
      const mockCustomer = {
        id: 2,
        email: 'customer@test.com',
        role: Role.CLIENT,
      };

      jest.spyOn(jwtService, 'verify').mockReturnValue(mockCustomer);

      clientSocket = Client(`http://localhost:${port}/delivery`, {
        auth: { token: 'customer-token' },
      });

      clientSocket.on('connect', () => {
        const orderId = 1;

        // Unirse a la sala
        clientSocket.emit('joinOrderRoom', { orderId });

        setTimeout(() => {
          // Salir de la sala
          clientSocket.emit('leaveOrderRoom', { orderId });
          done();
        }, 50);
      });
    });

    it('debería obtener drivers activos (solo admin)', (done) => {
      const mockAdmin = {
        id: 3,
        email: 'admin@test.com',
        role: Role.SUPER_ADMIN,
      };

      jest.spyOn(jwtService, 'verify').mockReturnValue(mockAdmin);

      const mockActiveDrivers = [
        {
          id: 1,
          latitude: -12.0464,
          longitude: -77.0428,
          user: { id: 1, email: 'driver1@test.com' },
        },
      ];

      mockDriverLocationRepository
        .createQueryBuilder()
        .getMany.mockResolvedValue(mockActiveDrivers);

      clientSocket = Client(`http://localhost:${port}/delivery`, {
        auth: { token: 'admin-token' },
      });

      clientSocket.on('connect', () => {
        clientSocket.emit('getActiveDrivers', {
          latitude: -12.0464,
          longitude: -77.0428,
          radius: 5,
        });

        clientSocket.on('activeDrivers', (data) => {
          expect(Array.isArray(data)).toBe(true);
          done();
        });
      });
    });
  });

  describe('Seguridad y Autorización', () => {
    it('debería rechazar eventos sin autenticación cuando se requiere', (done) => {
      clientSocket = Client(`http://localhost:${port}/delivery`);

      clientSocket.on('connect', () => {
        clientSocket.emit('driverLocationUpdate', {
          latitude: -12.0464,
          longitude: -77.0428,
        });

        clientSocket.on('exception', (error) => {
          expect(error).toBeDefined();
          done();
        });

        // Si no recibe excepción en 1 segundo, falló
        setTimeout(() => {
          done(new Error('Debería haber recibido una excepción'));
        }, 1000);
      });
    });

    it('debería rechazar getActiveDrivers para usuarios no admin', (done) => {
      const mockCustomer = {
        id: 2,
        email: 'customer@test.com',
        role: Role.CLIENT,
      };

      jest.spyOn(jwtService, 'verify').mockReturnValue(mockCustomer);

      clientSocket = Client(`http://localhost:${port}/delivery`, {
        auth: { token: 'customer-token' },
      });

      clientSocket.on('connect', () => {
        clientSocket.emit('getActiveDrivers', {
          latitude: -12.0464,
          longitude: -77.0428,
          radius: 5,
        });

        clientSocket.on('exception', (error) => {
          expect(error.message).toContain('Acceso denegado');
          done();
        });
      });
    });
  });

  describe('Manejo de Errores', () => {
    beforeEach((done) => {
      const mockDriver = {
        id: 1,
        email: 'driver@test.com',
        role: Role.DRIVER,
      };

      jest.spyOn(jwtService, 'verify').mockReturnValue(mockDriver);

      driverSocket = Client(`http://localhost:${port}/delivery`, {
        auth: { token: 'driver-token' },
      });

      driverSocket.on('connect', () => {
        done();
      });
    });

    it('debería manejar datos de ubicación inválidos', (done) => {
      const invalidLocationData = {
        latitude: 'invalid',
        longitude: null,
      };

      driverSocket.emit('driverLocationUpdate', invalidLocationData);

      driverSocket.on('exception', (error) => {
        expect(error).toBeDefined();
        done();
      });
    });

    it('debería manejar errores de base de datos', (done) => {
      mockDriverLocationRepository.save.mockRejectedValue(
        new Error('DB Error'),
      );

      const locationData = {
        latitude: -12.0464,
        longitude: -77.0428,
        heading: 45,
        speed: 30,
        accuracy: 10,
      };

      driverSocket.emit('driverLocationUpdate', locationData);

      driverSocket.on('exception', (error) => {
        expect(error).toBeDefined();
        done();
      });
    });
  });
});
