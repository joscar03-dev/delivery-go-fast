import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Aumentar el límite de payload para imágenes en base64
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  // CORS para frontend Ionic y app móvil
  app.enableCors({
    origin: [
      'http://localhost:8100', // Desarrollo web
      'http://localhost:8101', // Desarrollo web alternativo
      'http://10.0.2.2:8100', // Android emulator
      'capacitor://localhost', // Capacitor iOS
      'ionic://localhost', // Ionic iOS
      'https://localhost', // General
      'https://gofastdelivery.site', // Producción web
      'https://api.gofastdelivery.site', // Producción API
    ],
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
