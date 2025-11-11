import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateRestaurantApplicationsTable20251110205716
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'restaurant_applications',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'business_name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'business_phone',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'business_email',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'address',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'category_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'city',
            type: 'enum',
            enum: ['Bagua', 'Bagua Grande', 'Chachapoyas', 'Jaen'],
            isNullable: false,
          },
          {
            name: 'owner_name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'owner_dni',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'additional_comments',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'under_review', 'approved', 'rejected'],
            default: "'pending'",
            isNullable: false,
          },
          {
            name: 'admin_notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'reviewed_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'reviewed_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'restaurant_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Foreign key: user_id -> users.id
    await queryRunner.createForeignKey(
      'restaurant_applications',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Foreign key: category_id -> restaurant_categories.id
    await queryRunner.createForeignKey(
      'restaurant_applications',
      new TableForeignKey({
        columnNames: ['category_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'restaurant_categories',
        onDelete: 'RESTRICT',
      }),
    );

    // Foreign key: reviewed_by -> users.id
    await queryRunner.createForeignKey(
      'restaurant_applications',
      new TableForeignKey({
        columnNames: ['reviewed_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    // Opcional: Foreign key para restaurant_id si quieres rastrear el restaurante creado
    // await queryRunner.createForeignKey(
    //   'restaurant_applications',
    //   new TableForeignKey({
    //     columnNames: ['restaurant_id'],
    //     referencedColumnNames: ['id'],
    //     referencedTableName: 'restaurants',
    //     onDelete: 'SET NULL',
    //   }),
    // );

    // Crear índices para mejorar performance
    await queryRunner.query(
      `CREATE INDEX "IDX_restaurant_applications_user_id" ON "restaurant_applications" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_restaurant_applications_status" ON "restaurant_applications" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_restaurant_applications_category_id" ON "restaurant_applications" ("category_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índices
    await queryRunner.query(
      `DROP INDEX "IDX_restaurant_applications_category_id"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_restaurant_applications_status"`);
    await queryRunner.query(`DROP INDEX "IDX_restaurant_applications_user_id"`);

    // Eliminar foreign keys
    const table = await queryRunner.getTable('restaurant_applications');
    const foreignKeys = table.foreignKeys;

    for (const foreignKey of foreignKeys) {
      await queryRunner.dropForeignKey('restaurant_applications', foreignKey);
    }

    // Eliminar tabla
    await queryRunner.dropTable('restaurant_applications');
  }
}
