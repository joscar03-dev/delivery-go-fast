import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './entities/address.entity';
import { User } from './entities/user.entity';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Obtiene todas las direcciones de un usuario
   */
  async findAllByUser(userId: string): Promise<Address[]> {
    return await this.addressRepository.find({
      where: { user: { id: userId } },
      order: { id: 'DESC' },
    });
  }

  /**
   * Obtiene una dirección específica
   */
  async findOne(id: string, userId: string): Promise<Address> {
    const address = await this.addressRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!address) {
      throw new NotFoundException(`Address with ID ${id} not found`);
    }

    // Verificar que la dirección pertenezca al usuario
    if (address.user.id !== userId) {
      throw new ForbiddenException('You do not have access to this address');
    }

    return address;
  }

  /**
   * Crea una nueva dirección
   */
  async create(
    userId: string,
    createAddressDto: CreateAddressDto,
  ): Promise<Address> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Si esta es la primera dirección o se marca como default, desactivar otras default
    if (createAddressDto.isDefault) {
      await this.addressRepository.update(
        { user: { id: userId }, isDefault: true },
        { isDefault: false },
      );
    }

    const address = this.addressRepository.create({
      ...createAddressDto,
      user,
    });

    // Si se proporcionan coordenadas, crear el objeto Point
    if (createAddressDto.latitude && createAddressDto.longitude) {
      address.location = {
        type: 'Point',
        coordinates: [createAddressDto.longitude, createAddressDto.latitude],
      } as any;
    }

    return await this.addressRepository.save(address);
  }

  /**
   * Actualiza una dirección
   */
  async update(
    id: string,
    userId: string,
    updateAddressDto: UpdateAddressDto,
  ): Promise<Address> {
    const address = await this.findOne(id, userId);

    // Si se marca como default, desactivar otras default del usuario
    if (updateAddressDto.isDefault === true) {
      await this.addressRepository.update(
        { user: { id: userId }, isDefault: true },
        { isDefault: false },
      );
    }

    // Actualizar campos básicos
    if (updateAddressDto.street) address.street = updateAddressDto.street;
    if (updateAddressDto.city) address.city = updateAddressDto.city;
    if (updateAddressDto.postalCode)
      address.postalCode = updateAddressDto.postalCode;
    if (updateAddressDto.reference !== undefined)
      address.reference = updateAddressDto.reference;
    if (updateAddressDto.type) address.type = updateAddressDto.type;
    if (updateAddressDto.isDefault !== undefined)
      address.isDefault = updateAddressDto.isDefault;

    // Actualizar coordenadas si se proporcionan
    if (updateAddressDto.latitude && updateAddressDto.longitude) {
      address.location = {
        type: 'Point',
        coordinates: [updateAddressDto.longitude, updateAddressDto.latitude],
      } as any;
    }

    return await this.addressRepository.save(address);
  }

  /**
   * Elimina una dirección
   */
  async remove(id: string, userId: string): Promise<void> {
    const address = await this.findOne(id, userId);
    await this.addressRepository.remove(address);
  }
}
