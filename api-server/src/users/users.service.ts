import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { RegisterAuthDto } from '../auth/dto/register-auth.dto';
import { Role } from '../auth/entities/role.entity';
import { Role as RoleEnum } from '../common/enums/role.enum';
import { UpdateUserDto } from './dto/update-user.dto';

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

  async findAllWithRole(): Promise<User[]> {
    return await this.userRepository.find({ relations: ['role'] });
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.role) {
      let role = await this.roleRepository.findOne({
        where: { name: dto.role },
      });
      if (!role) {
        role = this.roleRepository.create({ name: dto.role });
        role = await this.roleRepository.save(role);
      }
      user.role = role;
    }

    if (dto.name !== undefined) user.name = dto.name;
    if (dto.email !== undefined) user.email = dto.email;

    return await this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.userRepository.remove(user);
  }

  async updateUserRole(userId: string, roleName: RoleEnum): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let role = await this.roleRepository.findOne({
      where: { name: roleName },
    });

    if (!role) {
      role = this.roleRepository.create({ name: roleName });
      role = await this.roleRepository.save(role);
    }

    user.role = role;
    return await this.userRepository.save(user);
  }

  async updateRefreshToken(
    userId: string,
    hashedRefreshToken: string | null,
  ): Promise<void> {
    await this.userRepository.update(userId, { hashedRefreshToken });
  }

  // 🆕 PHONE AUTHENTICATION METHODS

  /**
   * Buscar usuario por número de teléfono
   */
  async findOneByPhone(phone: string): Promise<User | undefined> {
    return await this.userRepository.findOne({
      where: { phone },
      relations: ['role'],
    });
  }

  /**
   * Crear usuario con autenticación por teléfono
   */
  async createWithPhone(data: {
    name: string;
    phone: string;
    phoneVerified: boolean;
    authMethod: 'phone';
    role: RoleEnum;
  }): Promise<User> {
    // Buscar o crear el rol
    let role = await this.roleRepository.findOne({
      where: { name: data.role },
    });

    if (!role) {
      role = this.roleRepository.create({ name: data.role });
      role = await this.roleRepository.save(role);
    }

    const newUser = this.userRepository.create({
      name: data.name,
      phone: data.phone,
      phoneVerified: data.phoneVerified,
      authMethod: data.authMethod,
      role: role,
      // email y password_hash son NULL para usuarios con phone auth
    });

    return await this.userRepository.save(newUser);
  }

  /**
   * Actualizar estado de verificación de teléfono
   */
  async updatePhoneVerified(userId: string, verified: boolean): Promise<void> {
    await this.userRepository.update(userId, { phoneVerified: verified });
  }

  /**
   * Agregar o actualizar teléfono de un usuario existente
   */
  async updatePhone(
    userId: string,
    phone: string,
    phoneVerified: boolean,
  ): Promise<void> {
    await this.userRepository.update(userId, {
      phone,
      phoneVerified,
    });
  }

  /**
   * Buscar usuario por email o teléfono
   * Útil para login híbrido
   */
  async findOneByEmailOrPhone(identifier: string): Promise<User | undefined> {
    // Detectar si es email (contiene @) o teléfono (empieza con +)
    if (identifier.includes('@')) {
      return this.findOneByEmail(identifier);
    } else if (identifier.startsWith('+')) {
      return this.findOneByPhone(identifier);
    }
    return undefined;
  }
}
