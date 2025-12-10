import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddFormSchemaToFlows1733800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add formSchema column
    await queryRunner.addColumn(
      'flow',
      new TableColumn({
        name: 'formSchema',
        type: 'jsonb',
        isNullable: true,
      }),
    );

    // Add category column
    await queryRunner.addColumn(
      'flow',
      new TableColumn({
        name: 'category',
        type: 'varchar',
        isNullable: true,
      }),
    );

    // Add icon column
    await queryRunner.addColumn(
      'flow',
      new TableColumn({
        name: 'icon',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('flow', 'formSchema');
    await queryRunner.dropColumn('flow', 'category');
    await queryRunner.dropColumn('flow', 'icon');
  }
}

