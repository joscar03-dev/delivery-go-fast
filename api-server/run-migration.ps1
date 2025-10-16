# Script para ejecutar la migración de agregar image_url a restaurants
# Asegúrate de tener PostgreSQL instalado y accesible desde la línea de comandos

$env:PGPASSWORD = "verano8080"
$dbName = "delivery_app_db"
$dbUser = "delivery_user"
$dbHost = "localhost"
$dbPort = "5432"
$sqlFile = "src/database/add-image-url-column.sql"

Write-Host "Ejecutando migración: Agregar columna image_url a restaurants..." -ForegroundColor Cyan

# Ejecutar el script SQL
psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -f $sqlFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "Migración ejecutada exitosamente!" -ForegroundColor Green
}
else {
    Write-Host "Error al ejecutar la migración" -ForegroundColor Red
    exit 1
}

# Limpiar la variable de entorno de la contraseña
Remove-Item Env:\PGPASSWORD
