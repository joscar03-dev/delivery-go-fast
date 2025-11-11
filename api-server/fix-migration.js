require('dotenv').config();
const { Client } = require('pg');

async function markMigrationAsRun() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_DATABASE || 'delivery_db',
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'root',
  });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');

    // Marcar AddDeliveryTypeColumn como ejecutada
    const result = await client.query(`
      INSERT INTO typeorm_migrations (timestamp, name) 
      VALUES (1731268712000, 'AddDeliveryTypeColumn1731268712000')
      ON CONFLICT DO NOTHING
      RETURNING *;
    `);

    if (result.rowCount > 0) {
      console.log('✅ Migración AddDeliveryTypeColumn1731268712000 marcada como ejecutada');
    } else {
      console.log('ℹ️  Migración AddDeliveryTypeColumn1731268712000 ya estaba marcada');
    }

    // Verificar migraciones
    const migrations = await client.query(`
      SELECT * FROM typeorm_migrations 
      ORDER BY id DESC 
      LIMIT 5;
    `);

    console.log('\n📋 Últimas migraciones:');
    migrations.rows.forEach((m, i) => {
      console.log(`  ${i + 1}. ${m.name} (${new Date(parseInt(m.timestamp)).toLocaleString()})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

markMigrationAsRun();
