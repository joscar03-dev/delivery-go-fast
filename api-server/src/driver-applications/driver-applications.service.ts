import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DriverApplication,
  ApplicationStatus,
} from './entities/driver-application.entity';
import { CreateDriverApplicationDto } from './dto/create-driver-application.dto';
import { UpdateDriverApplicationDto } from './dto/update-driver-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { UsersService } from '../users/users.service';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class DriverApplicationsService {
  constructor(
    @InjectRepository(DriverApplication)
    private readonly driverApplicationRepository: Repository<DriverApplication>,
    private readonly usersService: UsersService,
  ) {}

  // Crear solicitud inicial (solo DNI, tipo vehículo, fecha nacimiento)
  async create(userId: string, createDto: CreateDriverApplicationDto) {
    // Verificar si ya existe una solicitud activa
    const existing = await this.driverApplicationRepository.findOne({
      where: {
        userId,
        status: ApplicationStatus.DRAFT,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Ya tienes una solicitud en borrador. Complétala antes de crear una nueva.',
      );
    }

    const application = this.driverApplicationRepository.create({
      userId,
      ...createDto,
      birthDate: new Date(createDto.birthDate),
      status: ApplicationStatus.DRAFT,
    });

    return await this.driverApplicationRepository.save(application);
  }

  // Actualizar solicitud (agregar datos opcionales)
  async update(
    userId: string,
    id: string,
    updateDto: UpdateDriverApplicationDto,
  ) {
    const application = await this.driverApplicationRepository.findOne({
      where: { id, userId },
    });

    if (!application) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    // Permitir editar en DRAFT y PENDING_COMPLETION (después de aprobar llamada)
    if (
      application.status !== ApplicationStatus.DRAFT &&
      application.status !== ApplicationStatus.PENDING_COMPLETION
    ) {
      throw new BadRequestException(
        'Solo puedes editar solicitudes en borrador o pendientes de completar',
      );
    }

    Object.assign(application, updateDto);

    if (updateDto.licenseExpiry) {
      application.licenseExpiry = new Date(updateDto.licenseExpiry);
    }

    return await this.driverApplicationRepository.save(application);
  }

  // Enviar Paso 1 para revisión (llamada del admin)
  async submitStep1(userId: string, id: string) {
    const application = await this.driverApplicationRepository.findOne({
      where: { id, userId },
    });

    if (!application) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    if (application.status !== ApplicationStatus.DRAFT) {
      throw new BadRequestException('Esta solicitud ya fue enviada');
    }

    // Validar que tenga los campos del paso 1
    if (
      !application.dni ||
      !application.vehicleType ||
      !application.birthDate
    ) {
      throw new BadRequestException(
        'Debes completar todos los campos del paso 1',
      );
    }

    application.status = ApplicationStatus.PENDING_CALL;
    return await this.driverApplicationRepository.save(application);
  }

  // Admin: Aprobar llamada y permitir completar paso 2
  async approveCall(id: string, adminUserId: string) {
    const application = await this.driverApplicationRepository.findOne({
      where: { id },
    });

    if (!application) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    if (application.status !== ApplicationStatus.PENDING_CALL) {
      throw new BadRequestException(
        'Solo se puede aprobar la llamada de solicitudes en estado PENDING_CALL',
      );
    }

    application.status = ApplicationStatus.PENDING_COMPLETION;
    application.reviewedBy = adminUserId;
    application.reviewedAt = new Date();
    return await this.driverApplicationRepository.save(application);
  }

  // Enviar solicitud completa (Paso 2) para revisión final
  async submitStep2(userId: string, id: string) {
    const application = await this.driverApplicationRepository.findOne({
      where: { id, userId },
    });

    if (!application) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    if (application.status !== ApplicationStatus.PENDING_COMPLETION) {
      throw new BadRequestException(
        'Debes esperar a que el administrador apruebe tu llamada',
      );
    }

    // Validar que tenga todos los campos requeridos para enviar
    const requiredFields = [
      'fullName',
      'phone',
      'email',
      'licenseNumber',
      'dniPhoto',
      'licenseFrontPhoto',
      'vehiclePhoto',
    ];

    const missingFields = requiredFields.filter((field) => !application[field]);

    if (missingFields.length > 0) {
      throw new BadRequestException(
        `Faltan campos requeridos: ${missingFields.join(', ')}`,
      );
    }

    application.status = ApplicationStatus.PENDING_REVIEW;
    return await this.driverApplicationRepository.save(application);
  }

  // Obtener solicitud del usuario actual
  async getMyApplication(userId: string) {
    return await this.driverApplicationRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  // Admin: Listar todas las solicitudes
  async findAll(status?: ApplicationStatus) {
    const where = status ? { status } : {};
    return await this.driverApplicationRepository.find({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  // Admin: Ver detalle de una solicitud
  async findOne(id: string) {
    const application = await this.driverApplicationRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!application) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    return application;
  }

  // Admin: Aprobar/Rechazar solicitud final
  async updateStatus(
    id: string,
    updateStatusDto: UpdateApplicationStatusDto,
    reviewedBy: string,
  ) {
    const application = await this.driverApplicationRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!application) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    if (application.status !== ApplicationStatus.PENDING_REVIEW) {
      throw new BadRequestException(
        'Solo puedes revisar solicitudes que estén en revisión final',
      );
    }

    application.status = updateStatusDto.status;
    application.reviewedBy = reviewedBy;
    application.reviewedAt = new Date();

    if (updateStatusDto.rejectionReason) {
      application.rejectionReason = updateStatusDto.rejectionReason;
    }

    // Si se aprueba, actualizar el rol del usuario a 'driver'
    if (updateStatusDto.status === ApplicationStatus.APPROVED) {
      await this.usersService.updateUserRole(application.userId, Role.DRIVER);
    }

    return await this.driverApplicationRepository.save(application);
  }
}
