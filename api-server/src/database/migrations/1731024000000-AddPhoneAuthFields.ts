import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableIndex,
} from 'typeorm';

export class AddPhoneAuthFields1731024000000 implements MigrationInterface {
  name = 'AddPhoneAuthFields1731024000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar que la tabla users existe
    const hasUsersTable = await queryRunner.hasTable('users');
    if (!hasUsersTable) {
      throw new Error(
        'La tabla users debe existir antes de ejecutar esta migración',
      );
    }

    // 1. Verificar si la columna phone ya existe (de la migración anterior)
    const hasPhoneColumn = await queryRunner.hasColumn('users', 'phone');
    if (!hasPhoneColumn) {
      // Si no existe, agregarla
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'phone',
          type: 'varchar',
          length: '20',
          isNullable: true,
          isUnique: true,
        }),
      );

      // Crear índice para búsquedas por teléfono
      await queryRunner.createIndex(
        'users',
        new TableIndex({
          name: 'idx_users_phone',
          columnNames: ['phone'],
          where: 'phone IS NOT NULL',
        }),
      );
    } else {
      // Si la columna existe, verificar si el índice existe
      const indexExists = await queryRunner.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'users' AND indexname = 'idx_users_phone'
      `);

      if (indexExists.length === 0) {
        await queryRunner.createIndex(
          'users',
          new TableIndex({
            name: 'idx_users_phone',
            columnNames: ['phone'],
            where: 'phone IS NOT NULL',
          }),
        );
        console.log('✅ Índice idx_users_phone creado');
      } else {
        console.log('⚠️  Columna phone e índice idx_users_phone ya existen');
      }
    }

    // 2. Agregar columna phone_verified
    const hasPhoneVerified = await queryRunner.hasColumn(
      'users',
      'phone_verified',
    );
    if (!hasPhoneVerified) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'phone_verified',
          type: 'boolean',
          default: false,
          isNullable: false,
        }),
      );
    }

    // 3. Agregar columna auth_method
    const hasAuthMethod = await queryRunner.hasColumn('users', 'auth_method');
    if (!hasAuthMethod) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'auth_method',
          type: 'varchar',
          length: '20',
          default: "'email'",
          isNullable: false,
        }),
      );

      // Crear índice para auth_method
      await queryRunner.createIndex(
        'users',
        new TableIndex({
          name: 'idx_users_auth_method',
          columnNames: ['auth_method'],
        }),
      );
    }

    // 4. Agregar constraint para validar auth_method
    const hasAuthMethodCheck = await queryRunner.query(`
      SELECT constraint_name 
      FROM information_schema.constraint_column_usage 
      WHERE table_name = 'users' 
      AND constraint_name = 'users_auth_method_check'
    `);

    if (hasAuthMethodCheck.length === 0) {
      await queryRunner.query(`
        ALTER TABLE users 
        ADD CONSTRAINT users_auth_method_check 
        CHECK (auth_method IN ('email', 'phone', 'social'))
      `);
    }

    // 5. Agregar constraint para validar formato de phone (E.164)
    const hasPhoneFormatCheck = await queryRunner.query(`
      SELECT constraint_name 
      FROM information_schema.constraint_column_usage 
      WHERE table_name = 'users' 
      AND constraint_name = 'users_phone_format_check'
    `);

    if (hasPhoneFormatCheck.length === 0) {
      await queryRunner.query(`
        ALTER TABLE users 
        ADD CONSTRAINT users_phone_format_check 
        CHECK (phone IS NULL OR phone ~ '^\\+[1-9]\\d{1,14}$')
      `);
    }

    // 6. Hacer email y password_hash opcionales (nullable)
    // Verificar si email ya es nullable
    const emailColumn = await queryRunner.query(`
      SELECT is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'email'
    `);

    if (emailColumn[0]?.is_nullable === 'NO') {
      await queryRunner.query(`
        ALTER TABLE users 
        ALTER COLUMN email DROP NOT NULL
      `);
    }

    // Verificar si password_hash ya es nullable
    const passwordColumn = await queryRunner.query(`
      SELECT is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'password_hash'
    `);

    if (passwordColumn[0]?.is_nullable === 'NO') {
      await queryRunner.query(`
        ALTER TABLE users 
        ALTER COLUMN password_hash DROP NOT NULL
      `);
    }

    // 7. Agregar constraint: el usuario debe tener AL MENOS email O phone
    const hasEmailOrPhoneCheck = await queryRunner.query(`
      SELECT constraint_name 
      FROM information_schema.constraint_column_usage 
      WHERE table_name = 'users' 
      AND constraint_name = 'users_email_or_phone_required'
    `);

    if (hasEmailOrPhoneCheck.length === 0) {
      await queryRunner.query(`
        ALTER TABLE users 
        ADD CONSTRAINT users_email_or_phone_required 
        CHECK (email IS NOT NULL OR phone IS NOT NULL)
      `);
    }

    // 8. Agregar comentarios a las columnas
    await queryRunner.query(`
      COMMENT ON COLUMN users.phone IS 
      'Número de teléfono con código de país en formato E.164 (ej: +51987654321)'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN users.phone_verified IS 
      'TRUE si el teléfono fue verificado mediante código OTP. FALSE por defecto.'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN users.auth_method IS 
      'Método de autenticación usado: email (email/password), phone (OTP), social (Google/Facebook)'
    `);

    console.log('✅ Migración AddPhoneAuthFields completada exitosamente');
    console.log(
      '📊 Usuarios existentes mantienen auth_method=email por defecto',
    );
    console.log('📱 Sistema híbrido de autenticación habilitado');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar constraints
    await queryRunner.query(`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_or_phone_required
    `);

    await queryRunner.query(`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_phone_format_check
    `);

    await queryRunner.query(`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_auth_method_check
    `);

    // Eliminar índices
    await queryRunner.dropIndex('users', 'idx_users_auth_method');

    // Eliminar columnas (phone_verified y auth_method)
    // NO eliminamos phone porque puede venir de otra migración
    await queryRunner.dropColumn('users', 'auth_method');
    await queryRunner.dropColumn('users', 'phone_verified');

    // Restaurar email y password_hash como NOT NULL
    await queryRunner.query(`
      ALTER TABLE users 
      ALTER COLUMN email SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE users 
      ALTER COLUMN password_hash SET NOT NULL
    `);

    console.log('✅ Rollback de AddPhoneAuthFields completado');
  }
}
