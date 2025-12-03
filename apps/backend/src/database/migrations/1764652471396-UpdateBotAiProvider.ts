import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateBotAiProvider1764652471396 implements MigrationInterface {
  name = 'UpdateBotAiProvider1764652471396';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "bot" DROP COLUMN "ai_config"`);
    await queryRunner.query(`ALTER TABLE "bot" DROP COLUMN "ai_model"`);
    await queryRunner.query(`ALTER TABLE "bot" ADD "ai_provider_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "bot" ADD "ai_model_name" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "bot" ADD "ai_parameters" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "bot" DROP COLUMN "ai_parameters"`);
    await queryRunner.query(`ALTER TABLE "bot" DROP COLUMN "ai_model_name"`);
    await queryRunner.query(`ALTER TABLE "bot" DROP COLUMN "ai_provider_id"`);
    await queryRunner.query(
      `ALTER TABLE "bot" ADD "ai_model" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "bot" ADD "ai_config" jsonb`);
  }
}
