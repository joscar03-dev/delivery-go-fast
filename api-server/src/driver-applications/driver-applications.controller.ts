import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { DriverApplicationsService } from './driver-applications.service';
import { CreateDriverApplicationDto } from './dto/create-driver-application.dto';
import { UpdateDriverApplicationDto } from './dto/update-driver-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { ApplicationStatus } from './entities/driver-application.entity';

@Controller('driver-applications')
@UseGuards(JwtAuthGuard)
export class DriverApplicationsController {
  constructor(
    private readonly driverApplicationsService: DriverApplicationsService,
  ) {}

  // Crear solicitud inicial (solo datos básicos)
  @Post()
  create(@Request() req, @Body() createDto: CreateDriverApplicationDto) {
    return this.driverApplicationsService.create(req.user.id, createDto);
  }

  // Actualizar solicitud (agregar datos opcionales)
  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateDto: UpdateDriverApplicationDto,
  ) {
    return this.driverApplicationsService.update(req.user.id, id, updateDto);
  }

  // Enviar Paso 1 para que admin llame
  @Post(':id/submit-step1')
  submitStep1(@Request() req, @Param('id') id: string) {
    return this.driverApplicationsService.submitStep1(req.user.id, id);
  }

  // Enviar Paso 2 (solicitud completa) para revisión final
  @Post(':id/submit-step2')
  submitStep2(@Request() req, @Param('id') id: string) {
    return this.driverApplicationsService.submitStep2(req.user.id, id);
  }

  // Obtener mi solicitud
  @Get('my-application')
  getMyApplication(@Request() req) {
    return this.driverApplicationsService.getMyApplication(req.user.id);
  }

  // ========== ADMIN ENDPOINTS ==========

  // Listar todas las solicitudes (admin)
  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  findAll(@Query('status') status?: ApplicationStatus) {
    return this.driverApplicationsService.findAll(status);
  }

  // Ver detalle de solicitud (admin)
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  findOne(@Param('id') id: string) {
    return this.driverApplicationsService.findOne(id);
  }

  // Aprobar llamada y permitir paso 2 (admin)
  @Post(':id/approve-call')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  approveCall(@Param('id') id: string, @Request() req) {
    return this.driverApplicationsService.approveCall(id, req.user.id);
  }

  // Aprobar/Rechazar solicitud final (admin)
  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateApplicationStatusDto,
    @Request() req,
  ) {
    return this.driverApplicationsService.updateStatus(
      id,
      updateStatusDto,
      req.user.id,
    );
  }
}
