import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as turf from '@turf/turf';
import * as fs from 'fs';
import * as path from 'path';
import { DriverLocation } from './entities/driver-location.entity';
import { User } from '../users/entities/user.entity';
import { Order } from '../orders/entities/order.entity';
import { DriverLocationUpdateDto } from './dto/driver-location-update.dto';
import { OrderLocationUpdateDto } from './dto/order-location-update.dto';
import { CoverageResponse } from './dto/check-coverage.dto';

@Injectable()
export class GeolocationService {
  private readonly logger = new Logger(GeolocationService.name);
  private coveragePolygon: any;

  constructor(
    @InjectRepository(DriverLocation)
    private readonly driverLocationRepository: Repository<DriverLocation>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {
    this.loadCoveragePolygon();
  }

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

  /**
   * Obtiene la orden con sus relaciones para verificar permisos de WebSocket
   * @param orderId ID de la orden
   * @returns Order con driver y client cargados, o null si no existe
   */
  async getOrderForPermissionCheck(orderId: string): Promise<Order | null> {
    return await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['driver', 'client'],
    });
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

  /**
   * Carga el polígono de cobertura desde el archivo GeoJSON
   * Este método se ejecuta al iniciar el servicio
   */
  private loadCoveragePolygon(): void {
    try {
      // Intentar múltiples rutas para desarrollo y producción
      const possiblePaths = [
        path.join(__dirname, 'coverage.geojson'), // En dist/ después de build
        path.join(__dirname, '../../src/geolocation/coverage.geojson'), // En desarrollo con ts-node
        path.join(process.cwd(), 'src/geolocation/coverage.geojson'), // Desde raíz del proyecto
      ];

      let coverageData: string | null = null;
      let usedPath: string | null = null;

      for (const coveragePath of possiblePaths) {
        try {
          if (fs.existsSync(coveragePath)) {
            coverageData = fs.readFileSync(coveragePath, 'utf-8');
            usedPath = coveragePath;
            break;
          }
        } catch (e) {
          // Intentar siguiente ruta
          continue;
        }
      }

      if (!coverageData) {
        this.logger.warn('⚠️ No se encontró coverage.geojson en ninguna ruta');
        this.logger.warn('⚠️ Sistema de geofencing deshabilitado');
        return;
      }

      const geoJSON = JSON.parse(coverageData);

      // Extraer el polígono de la primera feature
      if (geoJSON.features && geoJSON.features.length > 0) {
        this.coveragePolygon = geoJSON.features[0].geometry;
        this.logger.log(
          `✅ Polígono de cobertura cargado exitosamente desde: ${usedPath}`,
        );
        this.logger.log(
          `📍 Polígono con ${geoJSON.features[0].geometry.coordinates[0].length} puntos`,
        );
      } else {
        this.logger.error(
          '❌ No se encontró ninguna feature en coverage.geojson',
        );
      }
    } catch (error) {
      this.logger.error('❌ Error al cargar coverage.geojson:', error.message);
      this.logger.warn('⚠️ Sistema de geofencing deshabilitado');
    }
  }

  /**
   * Verifica si una ubicación está dentro de la zona de cobertura
   * @param latitude Latitud del punto a verificar
   * @param longitude Longitud del punto a verificar
   * @returns Objeto con el resultado de la validación
   */
  checkCoverage(latitude: number, longitude: number): CoverageResponse {
    // Si no hay polígono cargado, permitir por defecto (modo desarrollo)
    if (!this.coveragePolygon) {
      this.logger.warn(
        '⚠️ No hay polígono de cobertura, permitiendo por defecto',
      );
      return {
        isInCoverage: true,
        message: 'Sistema de cobertura no configurado - permitiendo acceso',
        coordinates: { latitude, longitude },
      };
    }

    try {
      // ADVERTENCIA CRÍTICA: Turf.js y GeoJSON usan [Longitud, Latitud]
      const userPoint = turf.point([longitude, latitude]);
      const isInside = turf.booleanPointInPolygon(
        userPoint,
        this.coveragePolygon,
      );

      if (isInside) {
        return {
          isInCoverage: true,
          message: 'La ubicación está dentro de la zona de cobertura',
          coordinates: { latitude, longitude },
        };
      } else {
        return {
          isInCoverage: false,
          message: 'Lo sentimos, aún no tenemos cobertura en tu zona',
          coordinates: { latitude, longitude },
        };
      }
    } catch (error) {
      this.logger.error('❌ Error al verificar cobertura:', error.message);
      // En caso de error, permitir por defecto para no bloquear el servicio
      return {
        isInCoverage: true,
        message: 'Error al verificar cobertura - permitiendo acceso',
        coordinates: { latitude, longitude },
      };
    }
  }
}
