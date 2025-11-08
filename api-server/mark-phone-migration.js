// Script para marcar la migración AddPhoneToUsers como ejecutada
// Esto es necesario porque la columna phone ya existe en la BD

const { Client } = require('pg');

async function markMigrationAsExecuted() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USERNAME || 'delivery_user',
    password: process.env.DB_PASSWORD || 'verano8080',
    database: process.env.DB_DATABASE || 'delivery_app_db',
  });

  try {
    await client.connect();
    console.log('✅ Conectado a PostgreSQL');

    // Verificar si la migración ya está registrada
    const checkResult = await client.query(
      "SELECT * FROM typeorm_migrations WHERE name = 'AddPhoneToUsers1730950000000'"
    );

    if (checkResult.rows.length > 0) {
      console.log('⚠️  La migración AddPhoneToUsers1730950000000 ya está registrada');
      console.log('   No es necesario hacer nada');
    } else {
      // Insertar el registro de la migración
      await client.query(
        `INSERT INTO typeorm_migrations (timestamp, name) 
         VALUES (1730950000000, 'AddPhoneToUsers1730950000000')`
      );
      console.log('✅ Migración AddPhoneToUsers1730950000000 marcada como ejecutada');
    }

    // Verificar que la columna phone existe
    const columnCheck = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'phone'
    `);

    if (columnCheck.rows.length > 0) {
      console.log('✅ Columna phone existe en la tabla users:');
      console.log('   ', columnCheck.rows[0]);
    } else {
      console.log('⚠️  La columna phone NO existe en la tabla users');
      console.log('   Se creará cuando ejecutes la migración AddPhoneAuthFields');
    }

    console.log('');
    console.log('🎯 Próximo paso:');
    console.log('   npm run migration:run:ts');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Cargar variables de entorno
require('dotenv').config();

markMigrationAsExecuted();
