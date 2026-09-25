import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import { bootstrap as bootstrapGlobalAgent } from 'global-agent';
import { ALLOWED_ORIGINS } from './common/config/cors';

async function bootstrap() {
  // Configurar zona horaria para Lima, Perú (UTC-5)
  process.env.TZ = 'America/Lima';

  // 🌐 Usar el proxy corporativo si está definido en el entorno
  if (process.env.HTTP_PROXY || process.env.HTTPS_PROXY) {
    process.env.GLOBAL_AGENT_HTTP_PROXY =
      process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
    process.env.GLOBAL_AGENT_HTTPS_PROXY =
      process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
    bootstrapGlobalAgent();
    console.log(
      `🌐 Salidas de red vía proxy: ${process.env.GLOBAL_AGENT_HTTP_PROXY}`,
    );
  } else {
    console.log('🌐 Salidas de red SIN proxy (conexión directa)');
  }

  const app = await NestFactory.create(AppModule);

  // Habilitar validación global con transformación
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      whitelist: true,
    }),
  );

  // Aumentar el límite de payload para imágenes en base64
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  // CORS para frontend Ionic y app móvil
  app.enableCors({
    origin: ALLOWED_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Authorization'],
  });
  const port = process.env.PORT ?? 3000;

  // ⚠️ IMPORTANTE: Escuchar en 0.0.0.0 para permitir conexiones externas
  // Esto permite que el emulador Android (10.0.2.2) pueda conectarse
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📱 Android Emulator can access via: http://10.0.2.2:${port}`);
}
bootstrap();
