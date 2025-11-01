/**
 * Script para ejecutar la migración de direcciones
 * Agrega columnas: type, isDefault, createdAt, updatedAt
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_DATABASE || 'delivery_app_db',
  user: process.env.DB_USERNAME || 'delivery_user',
  password: process.env.DB_PASSWORD || 'verano8080',
};

async function runMigration() {
  const client = new Client(dbConfig);

  try {
    console.log('🔌 Conectando a la base de datos...');
    await client.connect();
    console.log('✅ Conectado exitosamente');

    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'migrations', 'add-address-type-and-default.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📝 Ejecutando migración...');
    await client.query(sql);
    console.log('✅ Migración ejecutada exitosamente');

    // Verificar las columnas agregadas
    console.log('\n📊 Verificando columnas agregadas:');
    const result = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        column_default,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'addresses'
        AND column_name IN ('type', 'isDefault', 'createdAt', 'updatedAt')
      ORDER BY ordinal_position;
    `);

    console.table(result.rows);

    // Verificar cuántas direcciones hay
    const countResult = await client.query('SELECT COUNT(*) as total FROM addresses');
    console.log(`\n📍 Total de direcciones en la base de datos: ${countResult.rows[0].total}`);

    // Verificar cuántas direcciones predeterminadas hay por usuario
    const defaultResult = await client.query(`
      SELECT user_id, COUNT(*) as default_count
      FROM addresses
      WHERE "isDefault" = true
      GROUP BY user_id
      HAVING COUNT(*) > 1;
    `);

    if (defaultResult.rows.length === 0) {
      console.log('✅ No hay usuarios con múltiples direcciones predeterminadas');
    } else {
      console.log('⚠️ Usuarios con múltiples direcciones predeterminadas:');
      console.table(defaultResult.rows);
    }

  } catch (error) {
    console.error('❌ Error ejecutando migración:', error);
    throw error;
  } finally {
    await client.end();
    console.log('\n🔌 Conexión cerrada');
  }
}

// Ejecutar la migración
runMigration()
  .then(() => {
    console.log('\n✨ Migración completada exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error en la migración:', error.message);
    process.exit(1);
  });
