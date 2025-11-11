#!/bin/bash

# verify-production.sh
# Script para verificar que el sistema de notificaciones está listo en producción

echo "🔍 Verificando Sistema de Notificaciones en Producción..."
echo "=============================================="
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# 1. Verificar Node.js
echo "1️⃣ Verificando Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✅ Node.js instalado: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js NO instalado${NC}"
    ((ERRORS++))
fi
echo ""

# 2. Verificar NPM packages
echo "2️⃣ Verificando dependencias críticas..."
cd /var/www/delivery-go-fast/api-server 2>/dev/null || cd ~/delivery-go-fast/api-server 2>/dev/null

if [ ! -d "node_modules" ]; then
    echo -e "${RED}❌ node_modules no existe. Ejecuta: npm install${NC}"
    ((ERRORS++))
else
    echo -e "${GREEN}✅ node_modules existe${NC}"
    
    # Verificar paquetes específicos
    if [ -d "node_modules/@nestjs/event-emitter" ]; then
        echo -e "${GREEN}✅ @nestjs/event-emitter instalado${NC}"
    else
        echo -e "${RED}❌ @nestjs/event-emitter NO instalado${NC}"
        ((ERRORS++))
    fi
    
    if [ -d "node_modules/@nestjs/schedule" ]; then
        echo -e "${GREEN}✅ @nestjs/schedule instalado${NC}"
    else
        echo -e "${RED}❌ @nestjs/schedule NO instalado${NC}"
        ((ERRORS++))
    fi
    
    if [ -d "node_modules/firebase-admin" ]; then
        echo -e "${GREEN}✅ firebase-admin instalado${NC}"
    else
        echo -e "${RED}❌ firebase-admin NO instalado${NC}"
        ((ERRORS++))
    fi
fi
echo ""

# 3. Verificar firebase-service-account.json
echo "3️⃣ Verificando credenciales de Firebase..."
if [ -f "firebase-service-account.json" ]; then
    echo -e "${GREEN}✅ firebase-service-account.json existe${NC}"
    
    # Verificar permisos
    PERMS=$(stat -c %a firebase-service-account.json 2>/dev/null || stat -f %A firebase-service-account.json)
    if [ "$PERMS" == "600" ]; then
        echo -e "${GREEN}✅ Permisos correctos (600)${NC}"
    else
        echo -e "${YELLOW}⚠️ Permisos incorrectos ($PERMS). Recomendado: 600${NC}"
        echo "   Ejecuta: chmod 600 firebase-service-account.json"
        ((WARNINGS++))
    fi
    
    # Verificar que es JSON válido
    if jq empty firebase-service-account.json 2>/dev/null; then
        echo -e "${GREEN}✅ JSON válido${NC}"
    else
        echo -e "${YELLOW}⚠️ No se pudo validar JSON (jq no instalado)${NC}"
        ((WARNINGS++))
    fi
else
    echo -e "${RED}❌ firebase-service-account.json NO existe${NC}"
    echo "   Súbelo desde Firebase Console"
    ((ERRORS++))
fi
echo ""

# 4. Verificar .env
echo "4️⃣ Verificando archivo .env..."
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ .env existe${NC}"
    
    # Verificar variables críticas
    if grep -q "DATABASE_HOST" .env; then
        echo -e "${GREEN}✅ DATABASE_HOST configurado${NC}"
    else
        echo -e "${YELLOW}⚠️ DATABASE_HOST no encontrado en .env${NC}"
        ((WARNINGS++))
    fi
    
    if grep -q "JWT_SECRET" .env; then
        echo -e "${GREEN}✅ JWT_SECRET configurado${NC}"
    else
        echo -e "${YELLOW}⚠️ JWT_SECRET no encontrado en .env${NC}"
        ((WARNINGS++))
    fi
    
    if grep -q "NODE_ENV=production" .env; then
        echo -e "${GREEN}✅ NODE_ENV=production${NC}"
    else
        echo -e "${YELLOW}⚠️ NODE_ENV no está en 'production'${NC}"
        ((WARNINGS++))
    fi
else
    echo -e "${YELLOW}⚠️ .env NO existe${NC}"
    echo "   Crea uno basado en .env.example"
    ((WARNINGS++))
fi
echo ""

# 5. Verificar build
echo "5️⃣ Verificando build del backend..."
if [ -d "dist" ]; then
    echo -e "${GREEN}✅ Carpeta dist/ existe${NC}"
    
    if [ -f "dist/main.js" ]; then
        echo -e "${GREEN}✅ dist/main.js existe${NC}"
    else
        echo -e "${RED}❌ dist/main.js NO existe${NC}"
        echo "   Ejecuta: npm run build"
        ((ERRORS++))
    fi
else
    echo -e "${RED}❌ Carpeta dist/ NO existe${NC}"
    echo "   Ejecuta: npm run build"
    ((ERRORS++))
fi
echo ""

# 6. Verificar PostgreSQL
echo "6️⃣ Verificando PostgreSQL..."
if command -v psql &> /dev/null; then
    echo -e "${GREEN}✅ PostgreSQL instalado${NC}"
    
    # Verificar tabla device_tokens
    if sudo -u postgres psql -d delivery_db -c "\dt device_tokens" 2>/dev/null | grep -q "device_tokens"; then
        echo -e "${GREEN}✅ Tabla device_tokens existe${NC}"
    else
        echo -e "${YELLOW}⚠️ Tabla device_tokens NO encontrada${NC}"
        echo "   Ejecuta las migraciones: npm run migration:run"
        ((WARNINGS++))
    fi
else
    echo -e "${YELLOW}⚠️ PostgreSQL no accesible o no instalado${NC}"
    ((WARNINGS++))
fi
echo ""

# 7. Verificar PM2
echo "7️⃣ Verificando PM2..."
if command -v pm2 &> /dev/null; then
    echo -e "${GREEN}✅ PM2 instalado${NC}"
    
    # Verificar si la app está corriendo
    if pm2 list | grep -q "delivery-api"; then
        echo -e "${GREEN}✅ delivery-api está en PM2${NC}"
        
        # Verificar estado
        if pm2 list | grep "delivery-api" | grep -q "online"; then
            echo -e "${GREEN}✅ delivery-api está ONLINE${NC}"
        else
            echo -e "${RED}❌ delivery-api NO está online${NC}"
            echo "   Ejecuta: pm2 restart delivery-api"
            ((ERRORS++))
        fi
    else
        echo -e "${YELLOW}⚠️ delivery-api NO está en PM2${NC}"
        echo "   Ejecuta: pm2 start dist/main.js --name delivery-api"
        ((WARNINGS++))
    fi
else
    echo -e "${YELLOW}⚠️ PM2 NO instalado${NC}"
    echo "   Instala: npm install -g pm2"
    ((WARNINGS++))
fi
echo ""

# 8. Verificar Nginx
echo "8️⃣ Verificando Nginx..."
if command -v nginx &> /dev/null; then
    echo -e "${GREEN}✅ Nginx instalado${NC}"
    
    if systemctl is-active --quiet nginx; then
        echo -e "${GREEN}✅ Nginx está corriendo${NC}"
    else
        echo -e "${YELLOW}⚠️ Nginx NO está corriendo${NC}"
        echo "   Ejecuta: sudo systemctl start nginx"
        ((WARNINGS++))
    fi
    
    # Verificar configuración de reverse proxy
    if [ -f "/etc/nginx/sites-enabled/delivery-api" ] || [ -f "/etc/nginx/conf.d/delivery-api.conf" ]; then
        echo -e "${GREEN}✅ Configuración de Nginx encontrada${NC}"
    else
        echo -e "${YELLOW}⚠️ Configuración de Nginx NO encontrada${NC}"
        ((WARNINGS++))
    fi
else
    echo -e "${YELLOW}⚠️ Nginx NO instalado${NC}"
    ((WARNINGS++))
fi
echo ""

# 9. Verificar Firewall
echo "9️⃣ Verificando Firewall (UFW)..."
if command -v ufw &> /dev/null; then
    echo -e "${GREEN}✅ UFW instalado${NC}"
    
    if sudo ufw status | grep -q "80/tcp"; then
        echo -e "${GREEN}✅ Puerto 80 permitido${NC}"
    else
        echo -e "${YELLOW}⚠️ Puerto 80 NO permitido${NC}"
        ((WARNINGS++))
    fi
    
    if sudo ufw status | grep -q "443/tcp"; then
        echo -e "${GREEN}✅ Puerto 443 permitido${NC}"
    else
        echo -e "${YELLOW}⚠️ Puerto 443 NO permitido${NC}"
        ((WARNINGS++))
    fi
else
    echo -e "${YELLOW}⚠️ UFW NO instalado${NC}"
    ((WARNINGS++))
fi
echo ""

# 10. Test de conexión al backend
echo "🔟 Verificando conexión al backend..."
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✅ Backend responde en localhost:3000${NC}"
else
    echo -e "${RED}❌ Backend NO responde en localhost:3000${NC}"
    echo "   Verifica que PM2 esté corriendo: pm2 status"
    ((ERRORS++))
fi
echo ""

# Resumen
echo "=============================================="
echo "📊 RESUMEN"
echo "=============================================="
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 TODO PERFECTO - Sistema listo para producción${NC}"
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}✅ Sistema funcional con $WARNINGS advertencias${NC}"
    echo "Puedes ignorar las advertencias o corregirlas para mejor configuración"
else
    echo -e "${RED}❌ Se encontraron $ERRORS errores críticos y $WARNINGS advertencias${NC}"
    echo "Corrige los errores antes de usar en producción"
fi
echo ""

# Comandos útiles
echo "📝 COMANDOS ÚTILES:"
echo "  Ver logs:        pm2 logs delivery-api"
echo "  Reiniciar:       pm2 restart delivery-api"
echo "  Ver estado:      pm2 status"
echo "  Ver eventos:     pm2 logs delivery-api | grep 'Event'"
echo "  Ver notifs:      pm2 logs delivery-api | grep 'Notification'"
echo ""

exit $ERRORS
