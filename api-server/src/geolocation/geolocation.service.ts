import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DriverLocation } from './entities/driver-location.entity';
import { User } from '../users/entities/user.entity';
import { Order } from '../orders/entities/order.entity';
import { DriverLocationUpdateDto } from './dto/driver-location-update.dto';
import { OrderLocationUpdateDto } from './dto/order-location-update.dto';

@Injectable()
export class GeolocationService {
  constructor(
    @InjectRepository(DriverLocation)
    private readonly driverLocationRepository: Repository<DriverLocation>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async updateDriverLocation(
    driverId: string,
    locationData: DriverLocationUpdateDto,
  ): Promise<DriverLocation> {
    // Buscar la ubicación actual del repartidor
    let driverLocation = await this.driverLocationRepository.findOne({
      where: { driverId, isActive: true },
    });

    if (driverLocation) {
      // Actualizar ubicación existente
      Object.assign(driverLocation, {
        ...locationData,
        updatedAt: new Date(),
      });
    } else {
      // Crear nueva ubicación
      driverLocation = this.driverLocationRepository.create({
        driverId,
        ...locationData,
        isActive: true,
      });
    }

    return await this.driverLocationRepository.save(driverLocation);
  }

  async getDriverLocation(driverId: string): Promise<DriverLocation | null> {
    return await this.driverLocationRepository.findOne({
      where: { driverId, isActive: true },
      relations: ['driver'],
    });
  }

  async getActiveDriversInArea(
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
  ): Promise<DriverLocation[]> {
    // Consulta usando distancia geográfica
    return await this.driverLocationRepository
      .createQueryBuilder('dl')
      .leftJoinAndSelect('dl.driver', 'driver')
      .where('dl.isActive = :isActive', { isActive: true })
      .andWhere(
        `(
          6371 * acos(
            cos(radians(:lat)) * cos(radians(dl.latitude)) * 
            cos(radians(dl.longitude) - radians(:lng)) + 
            sin(radians(:lat)) * sin(radians(dl.latitude))
          )
        ) <= :radius`,
        {
          lat: latitude,
          lng: longitude,
          radius: radiusKm,
        },
      )
      .andWhere('dl.updatedAt > :recentTime', {
        recentTime: new Date(Date.now() - 5 * 60 * 1000), // Últimos 5 minutos
      })
      .getMany();
  }

  async deactivateDriverLocation(driverId: string): Promise<void> {
    await this.driverLocationRepository.update(
      { driverId, isActive: true },
      { isActive: false },
    );
  }

  async getOrderLocationUpdate(
    orderId: string,
  ): Promise<OrderLocationUpdateDto | null> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['driver', 'client'],
    });

    if (!order || !order.driver) {
      return null;
    }

    const driverLocation = await this.getDriverLocation(order.driver.id);

    if (!driverLocation) {
      return null;
    }

    return {
      orderId: order.id,
      driverId: order.driver.id,
      driverName: order.driver.name,
      latitude: driverLocation.latitude,
      longitude: driverLocation.longitude,
      heading: driverLocation.heading,
      speed: driverLocation.speed,
      estimatedArrival: this.calculateEstimatedArrival(driverLocation),
      status: order.status,
    };
  }

  private calculateEstimatedArrival(driverLocation: DriverLocation): Date {
    // Lógica simple para calcular tiempo estimado de llegada
    // En producción, usarías APIs de mapas como Google Maps o OpenStreetMap
    const estimatedMinutes = 10; // Simplificado, en producción calcular distancia real

    // Considerar la velocidad del repartidor para ajustar el tiempo
    const speed = driverLocation.speed || 30; // km/h por defecto
    const adjustedMinutes =
      speed > 20 ? estimatedMinutes : estimatedMinutes + 5;

    return new Date(Date.now() + adjustedMinutes * 60 * 1000);
  }
}
