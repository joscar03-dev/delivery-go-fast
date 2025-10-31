import { PartialType } from '@nestjs/mapped-types';
import { CreateMenuOptionGroupDto } from './create-menu-option-group.dto';

export class UpdateMenuOptionGroupDto extends PartialType(
  CreateMenuOptionGroupDto,
) {}
