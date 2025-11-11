import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ForbiddenException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { RestaurantApplicationsService } from './restaurant-applications.service';
import { CreateRestaurantApplicationDto } from './dto/create-restaurant-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('restaurant-applications')
export class RestaurantApplicationsController {
  constructor(
    private readonly restaurantApplicationsService: RestaurantApplicationsService,
  ) {}

  /**
   * Crear solicitud (requiere login)
   * POST /restaurant-applications
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() createDto: CreateRestaurantApplicationDto,
    @Request() req,
  ) {
    const userId = req.user.id;
    return await this.restaurantApplicationsService.create(userId, createDto);
  }

  /**
   * Ver mi solicitud
   * GET /restaurant-applications/my-application
   */
  @Get('my-application')
  @UseGuards(JwtAuthGuard)
  async getMyApplication(@Request() req) {
    const userId = req.user.id;
    return await this.restaurantApplicationsService.findByUserId(userId);
  }

  /**
   * Ver solicitud específica por ID
   * GET /restaurant-applications/:id
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const application = await this.restaurantApplicationsService.findOne(id);

    // Solo el usuario dueño o admin pueden ver la solicitud
    if (
      application.userId !== req.user.id &&
      req.user.role !== Role.SUPER_ADMIN
    ) {
      throw new ForbiddenException('No tienes permiso para ver esta solicitud');
    }

    return application;
  }
}

// ==================== ADMIN ENDPOINTS ====================

@Controller('admin/restaurant-applications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class AdminRestaurantApplicationsController {
  constructor(
    private readonly restaurantApplicationsService: RestaurantApplicationsService,
  ) {}

  /**
   * Listar todas las solicitudes
   * GET /admin/restaurant-applications
   */
  @Get()
  async findAll() {
    return await this.restaurantApplicationsService.findAll();
  }

  /**
   * Ver estadísticas
   * GET /admin/restaurant-applications/stats
   */
  @Get('stats')
  async getStats() {
    return await this.restaurantApplicationsService.getStats();
  }

  /**
   * Ver detalle de solicitud
   * GET /admin/restaurant-applications/:id
   */
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.restaurantApplicationsService.findOne(id);
  }

  /**
   * Actualizar estado de solicitud
   * PATCH /admin/restaurant-applications/:id/status
   */
  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateApplicationStatusDto,
    @Request() req,
  ) {
    const adminId = req.user.id;
    return await this.restaurantApplicationsService.updateStatus(
      id,
      updateDto,
      adminId,
    );
  }

  /**
   * Aprobar y crear restaurante automáticamente
   * POST /admin/restaurant-applications/:id/approve
   */
  @Post(':id/approve')
  async approveAndCreateRestaurant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('adminNotes') adminNotes: string,
    @Request() req,
  ) {
    const adminId = req.user.id;
    return await this.restaurantApplicationsService.approveAndCreateRestaurant(
      id,
      adminId,
      adminNotes,
    );
  }

  /**
   * Rechazar solicitud
   * POST /admin/restaurant-applications/:id/reject
   */
  @Post(':id/reject')
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
    @Request() req,
  ) {
    const adminId = req.user.id;
    return await this.restaurantApplicationsService.reject(id, adminId, reason);
  }

  /**
   * Eliminar solicitud
   * DELETE /admin/restaurant-applications/:id
   */
  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.restaurantApplicationsService.remove(id);
    return { message: 'Solicitud eliminada correctamente' };
  }
}
