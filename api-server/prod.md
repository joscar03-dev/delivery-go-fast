# 1. Ir al directorio del backend

pm2 flush

cd /ruta/a/tu/delivery-go-fast/api-server

agregar al env DB_BOOTSTRAP: 'true'

# 2. Instalar dependencias (por si hay nuevas)

npm install

# 3. Compilar el código

npm run build

# 4. Activar bootstrap temporalmente y reiniciar

pm2 restart delivery-api --update-env

# 5. Esperar 10 segundos (para que cree las tablas)

# Verifica los logs

pm2 logs delivery-api --lines 50

# 6. Reiniciar normalmente (sin DB_BOOTSTRAP)

pm2 restart delivery-api
