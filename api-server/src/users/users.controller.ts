import {
  Controller,
  Get,
  UseGuards,
  Req,
  Patch,
  Body,
  Param,
  Delete,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role as RoleEnum } from '../common/enums/role.enum';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Perfil del usuario autenticado
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: any) {
    const u = req.user; // adjuntado por JwtStrategy
    return this.sanitizeUser(u);
  }

  // Listado de usuarios (solo super admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.SUPER_ADMIN)
  @Get()
  async findAll() {
    const list = await this.usersService.findAllWithRole();
    return list.map((u) => this.sanitizeUser(u));
  }

  // Actualización parcial de usuario (solo super admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.SUPER_ADMIN)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const updated = await this.usersService.update(id, dto);
    return this.sanitizeUser(updated);
  }

  // Eliminación de usuario (solo super admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.SUPER_ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
    return { message: 'User deleted' };
  }

  private sanitizeUser(u: any) {
    if (!u) return u;
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role?.name ?? u.role,
      created_at: u.created_at,
      updated_at: u.updated_at,
    };
  }
}
