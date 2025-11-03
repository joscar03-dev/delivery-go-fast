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
  synchronize: false,
  logging: false,
  // Entities are not needed to run migrations; omit to avoid path alias issues in CLI
  entities: [],
  migrations: [
    __dirname + '/migrations/*{.ts,.js}', // src/database/migrations
    __dirname + '/../../migrations/*{.ts,.js}', // src/migrations (if exists)
  ],
  migrationsTableName: 'typeorm_migrations',
});
