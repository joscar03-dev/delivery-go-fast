import 'dotenv/config';
import 'reflect-metadata';
import { DataSource } from 'typeorm';

// TypeORM CLI DataSource for running migrations in dev/prod
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: true, // ⚠️ true para crear tablas automáticamente en desarrollo
  logging: false,
  // Cargar todas las entidades para que TypeORM pueda crear las tablas
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [
    __dirname + '/migrations/*{.ts,.js}', // src/database/migrations
    __dirname + '/../../migrations/*{.ts,.js}', // src/migrations (if exists)
  ],
  migrationsTableName: 'typeorm_migrations',
});
