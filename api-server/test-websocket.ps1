# Script de PowerShell para probar WebSockets
# Uso: .\test-websocket.ps1 [token]

param(
    [string]$Token = "",
    [switch]$Simulate = $false,
    [switch]$StartServer = $false
)

Write-Host "🔧 WebSocket Tester - Delivery System" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Ejecuta este script desde el directorio api-server" -ForegroundColor Red
    exit 1
}

# Verificar que Node.js está instalado
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Node.js no está instalado o no está en el PATH" -ForegroundColor Red
    exit 1
}

# Verificar que las dependencias están instaladas
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
    npm install
}

# Iniciar servidor si se solicita
if ($StartServer) {
    Write-Host "🚀 Iniciando servidor en segundo plano..." -ForegroundColor Yellow
    $serverJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        npm run start:dev
    }
    
    Write-Host "⏳ Esperando que el servidor inicie..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
}

Write-Host "`n🧪 OPCIONES DE PRUEBA DISPONIBLES:" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

Write-Host "`n1️⃣ Prueba con cliente HTML interactivo"
Write-Host "   - Abre test-websocket.html en tu navegador"
Write-Host "   - URL: file:///$PWD/test-websocket.html" -ForegroundColor Yellow

Write-Host "`n2️⃣ Prueba con script Node.js simple"
if ($Token) {
    Write-Host "   - Usando token: $Token" -ForegroundColor Green
    $command = "node test-websocket-simple.js `"$Token`""
} else {
    Write-Host "   - Sin autenticación" -ForegroundColor Yellow
    $command = "node test-websocket-simple.js"
}

if ($Simulate) {
    $command += " --simulate"
    Write-Host "   - Con simulación de movimiento" -ForegroundColor Magenta
}

Write-Host "   - Comando: $command" -ForegroundColor Gray

Write-Host "`n3️⃣ Prueba con script interactivo"
Write-Host "   - Comando: node test-websocket.js" -ForegroundColor Gray

Write-Host "`n4️⃣ Pruebas unitarias con Jest"
Write-Host "   - Comando: npm run test test/websocket-geolocation.e2e-spec.ts" -ForegroundColor Gray

Write-Host "`n5️⃣ Herramientas externas recomendadas:"
Write-Host "   - Postman (soporta WebSocket)"
Write-Host "   - WebSocket King (Chrome Extension)"
Write-Host "   - Socket.IO Admin UI"

Write-Host "`n🔗 ENDPOINTS DE WEBSOCKET:" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host "   - URL: ws://localhost:3000/delivery" -ForegroundColor Yellow
Write-Host "   - Namespace: /delivery" -ForegroundColor Yellow

Write-Host "`n📋 EVENTOS DISPONIBLES:" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host "   📤 EMISIÓN (Cliente -> Servidor):"
Write-Host "      - driverLocationUpdate"
Write-Host "      - joinOrderRoom"
Write-Host "      - leaveOrderRoom"
Write-Host "      - getActiveDrivers (solo admin)"

Write-Host "`n   📥 RECEPCIÓN (Servidor -> Cliente):"
Write-Host "      - orderLocationUpdate"
Write-Host "      - driverLocationUpdate"
Write-Host "      - activeDrivers"
Write-Host "      - exception"

Write-Host "`n🔑 AUTENTICACIÓN:" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan
Write-Host "   - Header: Authorization: Bearer <token>"
Write-Host "   - Query: ?token=<token>"
Write-Host "   - Auth object: { token: '<token>' }"

Write-Host "`n¿Qué opción quieres ejecutar?" -ForegroundColor Green

$choice = Read-Host "`nElige una opción (1-4) o presiona Enter para script simple"

switch ($choice) {
    "1" {
        Write-Host "`n🌐 Abriendo cliente HTML..." -ForegroundColor Green
        $htmlPath = Join-Path $PWD "test-websocket.html"
        Start-Process $htmlPath
    }
    "2" {
        Write-Host "`n🚀 Ejecutando script Node.js simple..." -ForegroundColor Green
        Invoke-Expression $command
    }
    "3" {
        Write-Host "`n🎮 Iniciando modo interactivo..." -ForegroundColor Green
        if ($Token) {
            node test-websocket.js localhost:3000 $Token
        } else {
            node test-websocket.js
        }
    }
    "4" {
        Write-Host "`n🧪 Ejecutando pruebas con Jest..." -ForegroundColor Green
        npm run test test/websocket-geolocation.e2e-spec.ts
    }
    default {
        Write-Host "`n🚀 Ejecutando script simple por defecto..." -ForegroundColor Green
        Invoke-Expression $command
    }
}

# Limpiar trabajos de servidor si se iniciaron
if ($StartServer -and $serverJob) {
    Write-Host "`n🛑 Deteniendo servidor..." -ForegroundColor Yellow
    Stop-Job $serverJob
    Remove-Job $serverJob
}

Write-Host "`n✅ Prueba completada!" -ForegroundColor Green
