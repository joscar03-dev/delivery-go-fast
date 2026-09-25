import 'dotenv/config';
import 'reflect-metadata';
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import dataSource from '../data-source';
import { Role as RoleEntity } from '../../auth/entities/role.entity';
import { Role as RoleEnum } from '../../common/enums/role.enum';
import { User } from '../../users/entities/user.entity';
import { PaymentMethod } from '../../payments/entities/payment-method.entity';
import { RestaurantCategory } from '../../restaurants/entities/restaurant-category.entity';
import { defaultPaymentMethods } from '../../common/seeds/payment-methods.seed';
import { defaultCategories } from '../../common/seeds/categories.seed';

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 10);

async function ensureRoles(ds: DataSource): Promise<number> {
  const roles = ds.getRepository(RoleEntity);
  let created = 0;

  for (const name of Object.values(RoleEnum)) {
    const existing = await roles.findOne({ where: { name } });
    if (!existing) {
      await roles.save(roles.create({ name }));
      created++;
      console.log(`   + rol creado: ${name}`);
    }
  }

  return created;
}

async function ensureSuperAdmin(ds: DataSource): Promise<boolean> {
  const users = ds.getRepository(User);

  const existingAdmin = await users
    .createQueryBuilder('user')
    .leftJoinAndSelect('user.role', 'role')
    .where('role.name = :roleName', { roleName: RoleEnum.SUPER_ADMIN })
    .getOne();

  if (existingAdmin) {
    console.log(
      `   = super admin ya existe (${existingAdmin.email ?? existingAdmin.phone}) - se omite la creacion`,
    );
    return false;
  }

  const name = process.env.BOOTSTRAP_ADMIN_NAME?.trim();
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

  const missing = [
    !name && 'BOOTSTRAP_ADMIN_NAME',
    !email && 'BOOTSTRAP_ADMIN_EMAIL',
    !password && 'BOOTSTRAP_ADMIN_PASSWORD',
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Error(
      `No hay ningun super admin en la base de datos y faltan estas variables de entorno: ${missing.join(', ')}.\n` +
        'Definelas en api-server/.env y vuelve a ejecutar el bootstrap.',
    );
  }

  if (password.length < 8) {
    throw new Error(
      'BOOTSTRAP_ADMIN_PASSWORD debe tener al menos 8 caracteres.',
    );
  }

  const role = await ds.getRepository(RoleEntity).findOneOrFail({
    where: { name: RoleEnum.SUPER_ADMIN },
  });

  const admin = users.create({
    name: name!,
    email: email!,
    password_hash: await bcrypt.hash(password!, SALT_ROUNDS),
    role,
  });
  await users.save(admin);

  console.log(`   + super admin creado: ${email}`);
  return true;
}

async function upsertPaymentMethods(ds: DataSource): Promise<number> {
  const methods = ds.getRepository(PaymentMethod);
  let upserted = 0;

  for (const data of defaultPaymentMethods) {
    const existing = await methods.findOne({ where: { code: data.code } });
    if (existing) {
      existing.name = data.name;
      existing.description = data.description;
      existing.isActive = data.is_active;
      await methods.save(existing);
    } else {
      await methods.save(
        methods.create({
          code: data.code,
          name: data.name,
          description: data.description,
          isActive: data.is_active,
        }),
      );
    }
    upserted++;
  }

  return upserted;
}

async function ensureRestaurantCategories(ds: DataSource): Promise<number> {
  const categories = ds.getRepository(RestaurantCategory);

  const count = await categories.count();
  if (count > 0) {
    console.log(`   = ya existen ${count} categorias - se omite el seed`);
    return 0;
  }

  for (const data of defaultCategories) {
    await categories.save(categories.create(data));
  }

  return defaultCategories.length;
}

async function bootstrap(): Promise<void> {
  console.log('Conectando a la base de datos...');
  await dataSource.initialize();
  console.log('Conexion establecida\n');

  console.log('Asegurando roles...');
  const rolesCreated = await ensureRoles(dataSource);
  console.log(
    rolesCreated === 0
      ? '   = los 4 roles ya existian'
      : `   = ${rolesCreated} rol(es) creado(s)`,
  );
  console.log();

  console.log('Asegurando super admin...');
  await ensureSuperAdmin(dataSource);
  console.log();

  console.log('Asegurando metodos de pago...');
  const methods = await upsertPaymentMethods(dataSource);
  console.log(`   = ${methods} metodo(s) sincronizado(s)`);
  console.log();

  console.log('Asegurando categorias de restaurante...');
  const categories = await ensureRestaurantCategories(dataSource);
  if (categories > 0) {
    console.log(`   = ${categories} categoria(s) creada(s)`);
  }
  console.log();

  console.log('Bootstrap completado exitosamente.');
  console.log('Proximo paso: inicia sesion en la app con el super admin.');
}

bootstrap()
  .then(async () => {
    await dataSource.destroy();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('\nBootstrap fallido:', error.message ?? error);
    try {
      await dataSource.destroy();
    } catch {
      process.exit(1);
    }
    process.exit(1);
  });
