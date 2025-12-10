# 🚀 COMANDOS RÁPIDOS - Actualizar google-services.json

## DESPUÉS de descargar el nuevo archivo desde Firebase Console

### 1. Backup del archivo actual (por si acaso)
cd C:\laragon\www\delivery-go-fast\delivery-frontend\android\app
Copy-Item google-services.json google-services.json.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')

### 2. Verificar que el nuevo archivo esté en Descargas
Get-ChildItem $env:USERPROFILE\Downloads\google-services.json | Select-Object Name, LastWriteTime, Length

### 3. Copiar el nuevo archivo al proyecto
Copy-Item "$env:USERPROFILE\Downloads\google-services.json" "C:\laragon\www\delivery-go-fast\delivery-frontend\android\app\google-services.json" -Force

### 4. Verificar que se copió correctamente
Select-String -Path "C:\laragon\www\delivery-go-fast\delivery-frontend\android\app\google-services.json" -Pattern "project_id"

### 5. Sincronizar con Capacitor
cd C:\laragon\www\delivery-go-fast\delivery-frontend
npx cap sync android

### 6. Abrir en Android Studio
npx cap open android

## En Android Studio:
# 1. Build → Clean Project
# 2. Build → Rebuild Project
# 3. Run app
