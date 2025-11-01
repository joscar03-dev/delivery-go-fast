import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAddressTypeAndDefault1234567890123
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar columna 'type' con enum
    await queryRunner.addColumn(
      'addresses',
      new TableColumn({
        name: 'type',
        type: 'enum',
        enum: ['home', 'work', 'other'],
        default: "'home'",
        isNullable: false,
      }),
    );

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

    // Agregar columnas de timestamp
    await queryRunner.addColumn(
      'addresses',
      new TableColumn({
        name: 'createdAt',
        type: 'timestamp',
        default: 'CURRENT_TIMESTAMP',
        isNullable: false,
      }),
    );

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

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('addresses', 'updatedAt');
    await queryRunner.dropColumn('addresses', 'createdAt');
    await queryRunner.dropColumn('addresses', 'isDefault');
    await queryRunner.dropColumn('addresses', 'type');
  }
}
