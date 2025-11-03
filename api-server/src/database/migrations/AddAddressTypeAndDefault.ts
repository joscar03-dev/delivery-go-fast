import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAddressTypeAndDefault1234567890123
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasType = await queryRunner.hasColumn('addresses', 'type');
    if (!hasType) {
      // Agregar columna 'type' con enum
      await queryRunner.addColumn(
        'addresses',
        new TableColumn({
          name: 'type',
          type: 'enum',
          enum: ['home', 'work', 'other'],
          enumName: 'address_type',
          default: "'home'",
          isNullable: false,
        }),
      );
    }

    const hasIsDefault = await queryRunner.hasColumn('addresses', 'isDefault');
    if (!hasIsDefault) {
      // Agregar columna 'isDefault'
      await queryRunner.addColumn(
        'addresses',
        new TableColumn({
          name: 'isDefault',
          type: 'boolean',
          default: false,
          isNullable: false,
        }),
      );
    }

    // Agregar columnas de timestamp
    const hasCreatedAt = await queryRunner.hasColumn('addresses', 'createdAt');
    if (!hasCreatedAt) {
      await queryRunner.addColumn(
        'addresses',
        new TableColumn({
          name: 'createdAt',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
          isNullable: false,
        }),
      );
    }

    const hasUpdatedAt = await queryRunner.hasColumn('addresses', 'updatedAt');
    if (!hasUpdatedAt) {
      await queryRunner.addColumn(
        'addresses',
        new TableColumn({
          name: 'updatedAt',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
          onUpdate: 'CURRENT_TIMESTAMP',
          isNullable: false,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const cols = ['updatedAt', 'createdAt', 'isDefault', 'type'];
    for (const c of cols) {
      const has = await queryRunner.hasColumn('addresses', c);
      if (has) await queryRunner.dropColumn('addresses', c);
    }
  }
}
