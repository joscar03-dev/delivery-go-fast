import { Role as RoleEnum } from '../../common/enums/role.enum';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: RoleEnum,
    default: RoleEnum.CLIENT,
  })
  name: RoleEnum;
}
