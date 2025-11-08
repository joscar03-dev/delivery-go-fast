// Script para verificar y corregir números de teléfono antes de la migración
const { Client } = require('pg');

async function fixPhoneNumbers() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USERNAME || 'delivery_user',
    password: process.env.DB_PASSWORD || 'verano8080',
    database: process.env.DB_DATABASE || 'delivery_app_db',
  });

  try {
    await client.connect();
    console.log('✅ Conectado a PostgreSQL\n');

    // 1. Verificar cuántos usuarios tienen teléfono
    const countResult = await client.query(`
      SELECT COUNT(*) as total,
             COUNT(phone) as with_phone
      FROM users
    `);
    
    console.log('📊 Estadísticas:');
    console.log(`   Total usuarios: ${countResult.rows[0].total}`);
    console.log(`   Con teléfono: ${countResult.rows[0].with_phone}\n`);

    // 2. Mostrar teléfonos que NO cumplen con formato E.164
    const invalidPhones = await client.query(`
      SELECT id, name, email, phone
      FROM users
      WHERE phone IS NOT NULL 
      AND phone !~ '^\\+[1-9]\\d{1,14}$'
    `);

    if (invalidPhones.rows.length === 0) {
      console.log('✅ Todos los teléfonos tienen formato E.164 correcto (+51...)');
      console.log('   ¡Puedes ejecutar la migración sin problemas!');
      return;
    }

    console.log(`⚠️  ${invalidPhones.rows.length} usuario(s) con teléfono en formato incorrecto:\n`);
    invalidPhones.rows.forEach((row, index) => {
      console.log(`${index + 1}. ID: ${row.id}`);
      console.log(`   Nombre: ${row.name}`);
      console.log(`   Email: ${row.email || 'N/A'}`);
      console.log(`   Teléfono actual: "${row.phone}"`);
      console.log('');
    });

    console.log('🔧 Opciones para corregir:\n');
    console.log('OPCIÓN 1 - Limpiar teléfonos inválidos (NULL):');
    console.log('   UPDATE users SET phone = NULL WHERE phone IS NOT NULL AND phone !~ \'^\\+[1-9]\\d{1,14}$\';');
    console.log('');
    console.log('OPCIÓN 2 - Agregar +51 a teléfonos que empiezan con 9:');
    console.log('   UPDATE users SET phone = \'+51\' || phone WHERE phone ~ \'^9\\d{8}$\';');
    console.log('');
    console.log('OPCIÓN 3 - Revisar manualmente cada registro');
    console.log('');

    // Ofrecer corrección automática
    console.log('¿Quieres que el script intente corregir automáticamente?');
    console.log('Reglas que aplicará:');
    console.log('  - Si el teléfono empieza con "9" y tiene 9 dígitos → Agregar +51');
    console.log('  - Si el teléfono ya tiene código pero le falta +  → Agregar +');
    console.log('  - Otros casos → Poner NULL');
    console.log('');
    console.log('Para aplicar correcciones ejecuta: node fix-phone-numbers.js --apply');
    
    // Si se pasa --apply, hacer las correcciones
    if (process.argv.includes('--apply')) {
      console.log('\n🔧 Aplicando correcciones automáticas...\n');

      // Corregir teléfonos peruanos sin código
      const fixPeru = await client.query(`
        UPDATE users 
        SET phone = '+51' || phone 
        WHERE phone ~ '^9\\d{8}$'
        RETURNING id, name, phone
      `);
      
      if (fixPeru.rows.length > 0) {
        console.log(`✅ ${fixPeru.rows.length} teléfono(s) corregido(s) con +51:`);
        fixPeru.rows.forEach(row => {
          console.log(`   - ${row.name}: ${row.phone}`);
        });
      }

      // Agregar + si falta pero tiene formato numérico con código de país
      const addPlus = await client.query(`
        UPDATE users 
        SET phone = '+' || phone 
        WHERE phone ~ '^[1-9]\\d{7,14}$' 
        AND phone NOT LIKE '+%'
        RETURNING id, name, phone
      `);

      if (addPlus.rows.length > 0) {
        console.log(`\n✅ ${addPlus.rows.length} teléfono(s) corregido(s) agregando +:`);
        addPlus.rows.forEach(row => {
          console.log(`   - ${row.name}: ${row.phone}`);
        });
      }

      // Limpiar teléfonos que no se pudieron corregir
      const cleanup = await client.query(`
        UPDATE users 
        SET phone = NULL 
        WHERE phone IS NOT NULL 
        AND phone !~ '^\\+[1-9]\\d{1,14}$'
        RETURNING id, name, email
      `);

      if (cleanup.rows.length > 0) {
        console.log(`\n⚠️  ${cleanup.rows.length} teléfono(s) inválido(s) limpiado(s) (NULL):`);
        cleanup.rows.forEach(row => {
          console.log(`   - ${row.name} (${row.email || 'sin email'})`);
        });
      }

      console.log('\n✅ Correcciones aplicadas!');
      console.log('🎯 Ahora puedes ejecutar: npm run migration:run:ts');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Cargar variables de entorno
require('dotenv').config();

fixPhoneNumbers();
