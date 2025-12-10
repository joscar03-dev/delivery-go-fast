# 🔄 Comandos Post-Firebase Configuration

## Después de agregar SHA-1 y SHA-256 en Firebase Console

### 1. Descargar google-services.json actualizado

# Ve a: Firebase Console → Project Settings → Android app

# Click en "Download google-services.json"

# Guarda el archivo

### 2. Reemplazar archivo en el proyecto

# Copiar el archivo descargado a:

# C:\laragon\www\delivery-go-fast\delivery-frontend\android\app\google-services.json

### 3. Ejecutar en PowerShell desde la carpeta delivery-frontend:

cd C:\laragon\www\delivery-go-fast\delivery-frontend

# Sincronizar con Capacitor

npx cap sync android

# Abrir en Android Studio

npx cap open android

### 4. En Android Studio:

# - Build → Clean Project

# - Build → Rebuild Project

# - Run app en dispositivo/emulador

### 5. Verificar que funcione:

# - Abrir app

# - Ir a Phone Login

# - Probar con un número real

# - Verificar que llegue el SMS
