import { MigrationInterface, QueryRunner } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

export class RunAddAddressTypeAndDefaultSql1730600002000
  implements MigrationInterface
{
  private readSql(): string | undefined {
    const candidates = [
      path.resolve(
        process.cwd(),
        'migrations/add-address-type-and-default.sql',
      ),
      path.resolve(
        __dirname,
        '../../../migrations/add-address-type-and-default.sql',
      ),
    ];
    for (const p of candidates)
      if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8');
    return undefined;
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Si la columna ya existe, no ejecutamos el SQL para evitar conflictos de tipos ENUM
    const hasType = await queryRunner.hasColumn('addresses', 'type');
    if (hasType) return;
    const sql = this.readSql();
    if (!sql)
      throw new Error(
        'No se encontró migrations/add-address-type-and-default.sql',
      );
    await queryRunner.query(sql);
  }

  public async down(): Promise<void> {
    // Sin revert automático. Añadir si es necesario.
  }
}
