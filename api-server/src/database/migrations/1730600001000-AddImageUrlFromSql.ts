import { MigrationInterface, QueryRunner } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

export class AddImageUrlFromSql1730600001000 implements MigrationInterface {
  private readSql(): string | undefined {
    const candidates = [
      path.resolve(process.cwd(), 'src/database/add-image-url-column.sql'),
      path.resolve(__dirname, '../add-image-url-column.sql'),
    ];
    for (const p of candidates)
      if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8');
    return undefined;
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    const sql = this.readSql();
    if (!sql) throw new Error('No se encontró add-image-url-column.sql');
    await queryRunner.query(sql);
  }

  public async down(): Promise<void> {
    // Revert manual si aplica: ALTER TABLE restaurants DROP COLUMN image_url;
  }
}
