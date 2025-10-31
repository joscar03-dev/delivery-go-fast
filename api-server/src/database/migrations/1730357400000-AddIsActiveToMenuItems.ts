import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddIsActiveToMenuItems1730357400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
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

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('menu_items', 'is_active');
  }
}
