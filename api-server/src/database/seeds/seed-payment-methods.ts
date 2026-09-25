import { DataSource } from 'typeorm';
import dataSource from '../data-source';
import { defaultPaymentMethods } from '../../common/seeds/payment-methods.seed';

async function seedPaymentMethods() {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await dataSource.initialize();
    console.log('✅ Conexión establecida\n');

    const queryRunner = dataSource.createQueryRunner();

    // Verificar métodos existentes
    console.log('🔍 Verificando métodos de pago existentes...');
    const existing = await queryRunner.query(
      'SELECT code, name, is_active FROM payment_methods ORDER BY code',
    );

    console.log('📊 Métodos actuales:');
    console.table(existing);
    console.log(`Total: ${existing.length} métodos\n`);

    // Insertar métodos de pago
    console.log('➕ Insertando métodos de pago...\n');

    for (const method of defaultPaymentMethods) {
      await queryRunner.query(
        `
        INSERT INTO payment_methods (code, name, description, is_active)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (code) 
        DO UPDATE SET 
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          is_active = EXCLUDED.is_active
      `,
        [method.code, method.name, method.description, method.is_active],
      );

      const status = method.is_active ? '✅ Activo' : '⏸️  Inactivo';
      console.log(`${status} - ${method.code}: ${method.name}`);
    }

    // Verificar resultado final
    console.log('\n📊 Métodos de pago actualizados:');
    const final = await queryRunner.query(
      'SELECT code, name, description, is_active FROM payment_methods ORDER BY code',
    );
    console.table(final);

    await queryRunner.release();
    await dataSource.destroy();

    console.log('\n✨ ¡Seed completado exitosamente!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Ejecutar seed
seedPaymentMethods();
