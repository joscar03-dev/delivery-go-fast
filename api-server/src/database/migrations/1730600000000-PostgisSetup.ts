import { MigrationInterface, QueryRunner } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

export class PostgisSetup1730600000000 implements MigrationInterface {
  private readSql(): string | undefined {
    const candidates = [
      path.resolve(process.cwd(), 'src/database/postgis-setup.sql'),
      path.resolve(__dirname, '../postgis-setup.sql'),
    ];
    for (const p of candidates)
      if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8');
    return undefined;
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    const sql = this.readSql();
    if (sql && sql.trim().length > 0) {
      await queryRunner.query(sql);
    } else {
      await queryRunner.query('CREATE EXTENSION IF NOT EXISTS postgis;');
      await queryRunner.query(
        'CREATE EXTENSION IF NOT EXISTS postgis_topology;',
      );
    }
  }

  public async down(): Promise<void> {
    // No se recomienda desinstalar PostGIS en down; podría romper dependencias.
  }
}
