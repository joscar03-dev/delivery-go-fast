const jwt = require('jsonwebtoken');

// Generar token de prueba para diferentes roles
function generateTestToken(userId = 1, email = 'test@example.com', role = 'driver') {
  const payload = {
    sub: userId,
    email: email,
    role: role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hora
  };

  // Usar el JWT secret del .env
  const secret = 'bzzwY&e5sED9L2ryBPfxut';
  
  return jwt.sign(payload, secret);
}

// Generar tokens para diferentes roles
console.log('🔑 TOKENS DE PRUEBA GENERADOS:');
console.log('==============================\n');

console.log('👨‍🚗 TOKEN DRIVER:');
const driverToken = generateTestToken(1, 'driver@test.com', 'driver');
console.log(driverToken);

console.log('\n👤 TOKEN CLIENT:');
const clientToken = generateTestToken(2, 'client@test.com', 'client');
console.log(clientToken);

console.log('\n🏪 TOKEN RESTAURANT_OWNER:');
const ownerToken = generateTestToken(3, 'owner@test.com', 'restaurant_owner');
console.log(ownerToken);

console.log('\n👑 TOKEN SUPER_ADMIN:');
const adminToken = generateTestToken(4, 'admin@test.com', 'super_admin');
console.log(adminToken);

console.log('\n📋 INSTRUCCIONES DE USO:');
console.log('========================');
console.log('1. Copia uno de los tokens de arriba');
console.log('2. En el test interactivo, usa: connect http://localhost:3000 [token]');
console.log('3. Ejemplo: connect http://localhost:3000 ' + driverToken.substring(0, 50) + '...');

console.log('\n💡 NOTA: Asegúrate de que el JWT_SECRET en tu .env coincida con el usado aquí');
console.log('Actual JWT_SECRET usado: ' + (process.env.JWT_SECRET || 'your-secret-key-here'));
