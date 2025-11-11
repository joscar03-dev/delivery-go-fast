import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  RestaurantApplication,
  ApplicationStatus,
} from './entities/restaurant-application.entity';
import { CreateRestaurantApplicationDto } from './dto/create-restaurant-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { UsersService } from '../users/users.service';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class RestaurantApplicationsService {
  constructor(
    @InjectRepository(RestaurantApplication)
    private readonly applicationRepository: Repository<RestaurantApplication>,
    private readonly usersService: UsersService,
    private readonly restaurantsService: RestaurantsService,
  ) {}

  /**
   * Crear una nueva solicitud de restaurante
   * Solo usuarios autenticados pueden aplicar
   */
  async create(
    userId: string,
    createDto: CreateRestaurantApplicationDto,
  ): Promise<RestaurantApplication> {
    // Verificar si el usuario ya tiene una solicitud pendiente o aprobada
    const existingApplication = await this.applicationRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    if (existingApplication) {
      if (
        existingApplication.status === ApplicationStatus.PENDING ||
        existingApplication.status === ApplicationStatus.UNDER_REVIEW
      ) {
        throw new BadRequestException(
          'Ya tienes una solicitud en proceso. Por favor espera la respuesta del administrador.',
        );
      }

      if (existingApplication.status === ApplicationStatus.APPROVED) {
        throw new BadRequestException(
          'Tu solicitud ya fue aprobada. Ya tienes acceso como propietario de restaurante.',
        );
      }
    }

    const application = this.applicationRepository.create({
      ...createDto,
      userId,
      status: ApplicationStatus.PENDING,
    });

    return await this.applicationRepository.save(application);
  }

  /**
   * Obtener todas las solicitudes (Admin)
   */
  async findAll(): Promise<RestaurantApplication[]> {
    return await this.applicationRepository.find({
      order: { createdAt: 'DESC' },
      relations: ['user', 'category', 'reviewer'],
    });
  }

  /**
   * Obtener solicitud por ID
   */
  async findOne(id: string): Promise<RestaurantApplication> {
    const application = await this.applicationRepository.findOne({
      where: { id },
      relations: ['user', 'category', 'reviewer'],
    });

    if (!application) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    return application;
  }

  /**
   * Obtener solicitud del usuario actual
   */
  async findByUserId(userId: string): Promise<RestaurantApplication | null> {
    return await this.applicationRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: ['category'],
    });
  }

  /**
   * Actualizar estado de la solicitud (Admin)
   */
  async updateStatus(
    id: string,
    updateDto: UpdateApplicationStatusDto,
    reviewerId: string,
  ): Promise<RestaurantApplication> {
    const application = await this.findOne(id);

    application.status = updateDto.status;
    application.adminNotes = updateDto.adminNotes;
    application.reviewedBy = reviewerId;
    application.reviewedAt = new Date();

    return await this.applicationRepository.save(application);
  }

  /**
   * Aprobar solicitud y crear restaurante + cambiar rol del usuario
   */
  async approveAndCreateRestaurant(
    id: string,
    adminId: string,
    adminNotes?: string,
  ): Promise<RestaurantApplication> {
    const application = await this.findOne(id);

    if (application.status === ApplicationStatus.APPROVED) {
      throw new BadRequestException('Esta solicitud ya fue aprobada');
    }

    // Verificar si ya existe un restaurante para este usuario
    const existingRestaurants = await this.restaurantsService.findByOwner(
      application.userId,
    );

    let restaurant;
    if (existingRestaurants && existingRestaurants.length > 0) {
      restaurant = existingRestaurants[0];
    } else {
      // Crear el restaurante con los datos de la solicitud
      restaurant = await this.restaurantsService.create({
        name: application.businessName,
        address: application.address,
        phone: application.businessPhone,
        city: application.city,
        // Coordenadas por defecto (el propietario las actualizará después)
        latitude: -5.227, // Coordenadas centrales de la región
        longitude: -78.507,
        restaurantCategoryId: application.categoryId,
        ownerId: application.userId,
      });
    }

    // Cambiar rol del usuario a RESTAURANT_OWNER
    await this.usersService.updateUserRole(
      application.userId,
      Role.RESTAURANT_OWNER,
    );

    // Actualizar estado de la solicitud y vincular con el restaurante creado
    application.status = ApplicationStatus.APPROVED;
    application.adminNotes = adminNotes;
    application.reviewedBy = adminId;
    application.reviewedAt = new Date();
    application.restaurantId = restaurant.id;

    return await this.applicationRepository.save(application);
  }

  /**
   * Rechazar solicitud
   */
  async reject(
    id: string,
    adminId: string,
    reason: string,
  ): Promise<RestaurantApplication> {
    return await this.updateStatus(
      id,
      {
        status: ApplicationStatus.REJECTED,
        adminNotes: reason,
      },
      adminId,
    );
  }

  /**
   * Eliminar solicitud (Admin)
   */
  async remove(id: string): Promise<void> {
    const application = await this.findOne(id);
    await this.applicationRepository.remove(application);
  }

  /**
   * Obtener estadísticas de solicitudes (Admin)
   */
  async getStats() {
    const [total, pending, underReview, approved, rejected] = await Promise.all(
      [
        this.applicationRepository.count(),
        this.applicationRepository.count({
          where: { status: ApplicationStatus.PENDING },
        }),
        this.applicationRepository.count({
          where: { status: ApplicationStatus.UNDER_REVIEW },
        }),
        this.applicationRepository.count({
          where: { status: ApplicationStatus.APPROVED },
        }),
        this.applicationRepository.count({
          where: { status: ApplicationStatus.REJECTED },
        }),
      ],
    );

    return {
      total,
      pending,
      underReview,
      approved,
      rejected,
    };
  }
}
