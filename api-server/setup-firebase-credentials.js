# Script para configurar Firebase credentials desde el JSON descargado
# Uso: node setup-firebase-credentials.js <ruta-al-archivo-json>

const fs = require('fs');
const path = require('path');

// Verificar argumentos
if (process.argv.length < 3) {
  console.log('❌ Uso: node setup-firebase-credentials.js <ruta-al-archivo-firebase-adminsdk.json>');
  console.log('');
  console.log('Ejemplo:');
  console.log('  node setup-firebase-credentials.js C:\\Users\\TuUsuario\\Downloads\\delivery-go-fast-firebase-adminsdk-xxxxx.json');
  console.log('');
  process.exit(1);
}

const jsonFilePath = process.argv[2];
const envFilePath = path.join(__dirname, '.env');

console.log('🔥 Configurando Firebase Credentials...\n');

// Verificar que el archivo JSON existe
if (!fs.existsSync(jsonFilePath)) {
  console.error(`❌ No se encontró el archivo: ${jsonFilePath}`);
  console.error('');
  console.error('Pasos:');
  console.error('1. Ve a Firebase Console: https://console.firebase.google.com');
  console.error('2. Configuración del proyecto → Cuentas de servicio');
  console.error('3. Genera nueva clave privada');
  console.error('4. Descarga el archivo JSON');
  console.error('5. Ejecuta este script con la ruta del archivo');
  process.exit(1);
}

// Leer el archivo JSON
console.log(`📄 Leyendo archivo: ${jsonFilePath}`);
const serviceAccount = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));

// Extraer las credenciales necesarias
const projectId = serviceAccount.project_id;
const privateKey = serviceAccount.private_key;
const clientEmail = serviceAccount.client_email;

if (!projectId || !privateKey || !clientEmail) {
  console.error('❌ El archivo JSON no tiene el formato correcto');
  console.error('Debe contener: project_id, private_key, client_email');
  process.exit(1);
}

console.log('✅ Credenciales extraídas correctamente:');
console.log(`   - Project ID: ${projectId}`);
console.log(`   - Client Email: ${clientEmail}`);
console.log(`   - Private Key: ${privateKey.substring(0, 50)}...`);
console.log('');

// Leer el archivo .env existente (si existe)
let envContent = '';
if (fs.existsSync(envFilePath)) {
  console.log('📝 Archivo .env encontrado, actualizando...');
  envContent = fs.readFileSync(envFilePath, 'utf8');
} else {
  console.log('📝 Creando nuevo archivo .env...');
}

// Función para actualizar o agregar variable
function updateOrAddEnvVar(content, key, value) {
  const regex = new RegExp(`^${key}=.*$`, 'gm');
  const newLine = `${key}="${value}"`;
  
  if (regex.test(content)) {
    // Actualizar variable existente
    return content.replace(regex, newLine);
  } else {
    // Agregar nueva variable
    return content + (content.endsWith('\n') ? '' : '\n') + newLine + '\n';
  }
}

// Actualizar o agregar las variables de Firebase
envContent = updateOrAddEnvVar(envContent, 'FIREBASE_PROJECT_ID', projectId);
envContent = updateOrAddEnvVar(envContent, 'FIREBASE_PRIVATE_KEY', privateKey);
envContent = updateOrAddEnvVar(envContent, 'FIREBASE_CLIENT_EMAIL', clientEmail);

// Agregar sección de Firebase si no existe
if (!envContent.includes('# Firebase Admin SDK Configuration')) {
  const firebaseSection = `
# Firebase Admin SDK Configuration
# Generado automáticamente el ${new Date().toLocaleString()}
`;
  
  // Insertar la sección antes de las variables de Firebase
  const firstFirebaseVar = envContent.indexOf('FIREBASE_PROJECT_ID=');
  if (firstFirebaseVar !== -1) {
    envContent = envContent.slice(0, firstFirebaseVar) + 
                 firebaseSection + 
                 envContent.slice(firstFirebaseVar);
  }
}

// Guardar el archivo .env
fs.writeFileSync(envFilePath, envContent, 'utf8');

console.log('');
console.log('✅ Archivo .env actualizado correctamente!');
console.log('');
console.log('📍 Ubicación: ' + envFilePath);
console.log('');
console.log('🔒 IMPORTANTE: Seguridad');
console.log('   - El archivo .env NO debe subirse a Git');
console.log('   - Verifica que .env esté en .gitignore');
console.log('');

// Verificar .gitignore
const gitignorePath = path.join(__dirname, '.gitignore');
if (fs.existsSync(gitignorePath)) {
  let gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  
  const entriesToAdd = ['.env', 'firebase-service-account.json'];
  let updated = false;
  
  entriesToAdd.forEach(entry => {
    if (!gitignoreContent.includes(entry)) {
      gitignoreContent += `\n${entry}`;
      updated = true;
    }
  });
  
  if (updated) {
    fs.writeFileSync(gitignorePath, gitignoreContent, 'utf8');
    console.log('✅ .gitignore actualizado para proteger credenciales');
  } else {
    console.log('✅ .gitignore ya está configurado correctamente');
  }
} else {
  console.log('⚠️  No se encontró .gitignore');
  console.log('   Crea uno y agrega: .env y firebase-service-account.json');
}

console.log('');
console.log('🎯 Próximos pasos:');
console.log('   1. Reinicia el servidor: npm run start:dev');
console.log('   2. Verifica que veas: "✅ Firebase Admin SDK inicializado correctamente"');
console.log('   3. Habilita Phone Authentication en Firebase Console');
console.log('   4. Ejecuta la migración: npm run typeorm migration:run');
console.log('');
console.log('📚 Documentación completa: FIREBASE_CREDENTIALS_SETUP.md');
console.log('');
