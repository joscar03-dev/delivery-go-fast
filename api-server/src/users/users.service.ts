// src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
// Importa tu DTO de registro que crearemos en el siguiente paso
import { RegisterAuthDto } from '../auth/dto/register-auth.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(
    registerDto: RegisterAuthDto,
    passwordHashed: string,
  ): Promise<User> {
    const newUser = this.userRepository.create({
      ...registerDto,
      password_hash: passwordHashed,
    });
    return await this.userRepository.save(newUser);
  }

  async findOneByEmail(email: string): Promise<User | undefined> {
    return await this.userRepository.findOne({ where: { email } });
  }

  async updateRefreshToken(
    userId: string,
    hashedRefreshToken: string | null,
  ): Promise<void> {
    await this.userRepository.update(userId, { hashedRefreshToken });
  }
}
