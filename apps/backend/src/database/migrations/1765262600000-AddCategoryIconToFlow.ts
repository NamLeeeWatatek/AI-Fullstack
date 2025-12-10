import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategoryIconToFlow1765262600000 implements MigrationInterface {
  name = 'AddCategoryIconToFlow1765262600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if columns exist before adding
    const table = await queryRunner.getTable('flow');
    
    if (table && !table.findColumnByName('category')) {
      await queryRunner.query(
        `ALTER TABLE "flow" ADD "category" character varying`,
      );
    }
    
    if (table && !table.findColumnByName('icon')) {
      await queryRunner.query(`ALTER TABLE "flow" ADD "icon" character varying`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "flow" DROP COLUMN IF EXISTS "icon"`);
    await queryRunner.query(
      `ALTER TABLE "flow" DROP COLUMN IF EXISTS "category"`,
    );
  }
}

