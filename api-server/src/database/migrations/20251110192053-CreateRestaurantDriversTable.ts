import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateRestaurantDriversTable20251110192053
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear tabla pivot para relación many-to-many entre restaurantes y drivers
    await queryRunner.createTable(
      new Table({
        name: 'restaurant_drivers',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'restaurant_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'driver_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            comment:
              'Indica si el driver está actualmente activo para este restaurante',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Crear foreign key hacia restaurants
    await queryRunner.createForeignKey(
      'restaurant_drivers',
      new TableForeignKey({
        columnNames: ['restaurant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'restaurants',
        onDelete: 'CASCADE',
        name: 'FK_restaurant_drivers_restaurant',
      }),
    );

    // Crear foreign key hacia users (drivers)
    await queryRunner.createForeignKey(
      'restaurant_drivers',
      new TableForeignKey({
        columnNames: ['driver_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
        name: 'FK_restaurant_drivers_driver',
      }),
    );

    // Crear índice único para evitar duplicados
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_restaurant_driver_unique" 
      ON "restaurant_drivers" ("restaurant_id", "driver_id")
    `);

    // Crear índice para búsquedas por restaurante
    await queryRunner.query(`
      CREATE INDEX "IDX_restaurant_drivers_restaurant" 
      ON "restaurant_drivers" ("restaurant_id")
    `);

    // Crear índice para búsquedas por driver
    await queryRunner.query(`
      CREATE INDEX "IDX_restaurant_drivers_driver" 
      ON "restaurant_drivers" ("driver_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índices
    await queryRunner.query(`DROP INDEX "IDX_restaurant_drivers_driver"`);
    await queryRunner.query(`DROP INDEX "IDX_restaurant_drivers_restaurant"`);
    await queryRunner.query(`DROP INDEX "IDX_restaurant_driver_unique"`);

    // Eliminar foreign keys
    await queryRunner.dropForeignKey(
      'restaurant_drivers',
      'FK_restaurant_drivers_driver',
    );
    await queryRunner.dropForeignKey(
      'restaurant_drivers',
      'FK_restaurant_drivers_restaurant',
    );

    // Eliminar tabla
    await queryRunner.dropTable('restaurant_drivers');
  }
}
