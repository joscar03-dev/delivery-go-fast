const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USERNAME || 'delivery_user',
  password: process.env.DB_PASSWORD || 'verano8080',
  database: process.env.DB_DATABASE || 'delivery_app_db',
});

async function runMigration() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');

    const sqlFile = path.join(__dirname, 'src', 'database', 'add-image-url-column.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('🔄 Ejecutando migración...');
    const result = await client.query(sql);
    
    console.log('✅ Migración ejecutada exitosamente!');
    if (result.rows && result.rows.length > 0) {
      console.log('📊 Resultado:', result.rows);
    }
  } catch (error) {
    console.error('❌ Error al ejecutar la migración:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
