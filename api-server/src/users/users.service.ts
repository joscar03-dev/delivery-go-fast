import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { RegisterAuthDto } from '../auth/dto/register-auth.dto';
import { Role } from '../auth/entities/role.entity';
import { Role as RoleEnum } from '../common/enums/role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async create(
    registerDto: RegisterAuthDto,
    passwordHashed: string,
    roleName: RoleEnum = RoleEnum.CLIENT,
  ): Promise<User> {
    // Buscar o crear el rol
    let role = await this.roleRepository.findOne({
      where: { name: roleName },
    });

    if (!role) {
      // Crear el rol si no existe
      role = this.roleRepository.create({ name: roleName });
      role = await this.roleRepository.save(role);
    }

    const newUser = this.userRepository.create({
      ...registerDto,
      password_hash: passwordHashed,
      role: role,
    });
    return await this.userRepository.save(newUser);
  }

  async findSuperAdmin(): Promise<User | undefined> {
    try {
      return await this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.role', 'role')
        .where('role.name = :roleName', { roleName: RoleEnum.SUPER_ADMIN })
        .getOne();
    } catch {
      // Si hay error, significa que no hay super admin aún
      return undefined;
    }
  }

  async findOneByEmail(email: string): Promise<User | undefined> {
    return await this.userRepository.findOne({
      where: { email },
      relations: ['role'],
    });
  }

  async updateRefreshToken(
    userId: string,
    hashedRefreshToken: string | null,
  ): Promise<void> {
    await this.userRepository.update(userId, { hashedRefreshToken });
  }
}
