import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSortOrderToNodeType1733733930000 implements MigrationInterface {
    name = 'AddSortOrderToNodeType1733733930000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "node_type" ADD "sortOrder" integer NOT NULL DEFAULT 0
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "node_type" DROP COLUMN "sortOrder"
        `);
    }
}

