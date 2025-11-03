import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddIsActiveToMenuItems1730357400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('menu_items');
    if (!hasTable) return;
    const has = await queryRunner.hasColumn('menu_items', 'is_active');
    if (!has) {
      await queryRunner.addColumn(
        'menu_items',
        new TableColumn({
          name: 'is_active',
          type: 'boolean',
          default: true,
          isNullable: false,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const has = await queryRunner.hasColumn('menu_items', 'is_active');
    if (has) {
      await queryRunner.dropColumn('menu_items', 'is_active');
    }
  }
}
