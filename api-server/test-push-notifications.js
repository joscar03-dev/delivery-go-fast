/**
 * 🧪 Script de prueba para notificaciones push
 * 
 * Este script verifica:
 * 1. Si Firebase está configurado correctamente
 * 2. Si hay tokens FCM registrados para usuarios
 * 3. Envía una notificación de prueba
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000';

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Verifica el estado de Firebase
 */
async function checkFirebaseStatus() {
  log('\n📱 === VERIFICANDO FIREBASE ==', 'blue');
  try {
    const response = await axios.get(`${API_URL}/notifications/health`);
    log(`✅ Firebase está ${response.data.firebase}`, 'green');
    log(`✅ Base de datos está ${response.data.database}`, 'green');
    return true;
  } catch (error) {
    log(`❌ Error verificando Firebase: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Verifica tokens registrados para un usuario
 */
async function checkUserTokens(userId, token) {
  log(`\n🔍 === VERIFICANDO TOKENS PARA USUARIO ${userId} ===`, 'blue');
  try {
    const response = await axios.get(`${API_URL}/notifications/my-tokens`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    const tokens = response.data;
    log(`📱 Tokens registrados: ${tokens.length}`, tokens.length > 0 ? 'green' : 'yellow');
    
    tokens.forEach((token, index) => {
      log(`\n  Token #${index + 1}:`, 'magenta');
      log(`    Platform: ${token.platform}`, 'reset');
      log(`    Active: ${token.isActive ? '✅' : '❌'}`, token.isActive ? 'green' : 'red');
      log(`    Last used: ${new Date(token.lastUsedAt).toLocaleString()}`, 'reset');
      log(`    Device: ${token.deviceInfo?.model || 'N/A'}`, 'reset');
    });
    
    return tokens.length > 0;
  } catch (error) {
    log(`❌ Error verificando tokens: ${error.message}`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Data: ${JSON.stringify(error.response.data)}`, 'red');
    }
    return false;
  }
}

/**
 * Envía una notificación de prueba
 */
async function sendTestNotification(token) {
  log('\n🔔 === ENVIANDO NOTIFICACIÓN DE PRUEBA ===', 'blue');
  try {
    const response = await axios.post(
      `${API_URL}/notifications/test`,
      {
        title: '🧪 Prueba de Notificación',
        body: 'Si ves esto, las notificaciones están funcionando! 🎉',
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    log(`✅ Notificación enviada exitosamente`, 'green');
    log(`   Exitosas: ${response.data.success}`, 'green');
    log(`   Fallidas: ${response.data.failure}`, response.data.failure > 0 ? 'red' : 'green');
    
    return response.data.success > 0;
  } catch (error) {
    log(`❌ Error enviando notificación: ${error.message}`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Data: ${JSON.stringify(error.response.data)}`, 'red');
    }
    return false;
  }
}

/**
 * Función principal
 */
async function main() {
  log('\n🚀 === DIAGNÓSTICO DE NOTIFICACIONES PUSH ===', 'magenta');
  log('Este script verificará el estado de las notificaciones push\n', 'reset');

  // Paso 1: Verificar Firebase
  const firebaseOk = await checkFirebaseStatus();
  if (!firebaseOk) {
    log('\n❌ Firebase no está configurado correctamente. Revisa firebase-service-account.json', 'red');
    process.exit(1);
  }

  // Paso 2: Obtener token de acceso
  log('\n🔑 === NECESITAS UN TOKEN DE ACCESO ===', 'yellow');
  log('Opciones para obtener un token:', 'reset');
  log('  1. Login en la app móvil y copia el access_token de localStorage', 'reset');
  log('  2. Login en la web y copia el access_token de localStorage', 'reset');
  log('  3. Usa Postman/Insomnia: POST /auth/login', 'reset');
  log('\nEjemplo de uso:', 'yellow');
  log('  node test-push-notifications.js YOUR_TOKEN_HERE YOUR_USER_ID', 'green');
  
  const token = process.argv[2];
  const userId = process.argv[3];

  if (!token) {
    log('\n❌ Falta el token de acceso', 'red');
    log('Uso: node test-push-notifications.js <TOKEN> [USER_ID]\n', 'yellow');
    process.exit(1);
  }

  // Paso 3: Verificar tokens registrados
  if (userId) {
    await checkUserTokens(userId, token);
  }

  // Paso 4: Enviar notificación de prueba
  const sent = await sendTestNotification(token);
  
  if (sent) {
    log('\n✅ === DIAGNÓSTICO COMPLETADO ===', 'green');
    log('Las notificaciones push están funcionando correctamente!', 'green');
  } else {
    log('\n⚠️ === DIAGNÓSTICO COMPLETADO CON ERRORES ===', 'yellow');
    log('Posibles causas:', 'yellow');
    log('  1. El usuario no tiene tokens FCM registrados', 'reset');
    log('  2. La app móvil no ha solicitado permisos de notificaciones', 'reset');
    log('  3. El token FCM expiró o es inválido', 'reset');
    log('\nSolución:', 'yellow');
    log('  1. Abre la app móvil', 'reset');
    log('  2. Haz login con tu usuario', 'reset');
    log('  3. Acepta los permisos de notificaciones', 'reset');
    log('  4. Revisa los logs de la app (Android Studio o Xcode)', 'reset');
  }

  log('');
}

// Ejecutar
main().catch((error) => {
  log(`\n❌ Error fatal: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
