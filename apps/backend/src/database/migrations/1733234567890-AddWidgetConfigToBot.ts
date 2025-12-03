import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWidgetConfigToBot1733234567890 implements MigrationInterface {
    name = 'AddWidgetConfigToBot1733234567890';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add widget_enabled column
        await queryRunner.query(`
            ALTER TABLE "bot" 
            ADD COLUMN "widget_enabled" BOOLEAN NOT NULL DEFAULT false
        `);

        // Add widget_config column (JSONB)
        await queryRunner.query(`
            ALTER TABLE "bot" 
            ADD COLUMN "widget_config" JSONB DEFAULT '{}'::jsonb
        `);

        // Add allowed_origins column
        await queryRunner.query(`
            ALTER TABLE "bot" 
            ADD COLUMN "allowed_origins" TEXT[] DEFAULT ARRAY['*']
        `);

        // Create index for fast widget lookup
        await queryRunner.query(`
            CREATE INDEX "idx_bot_widget_enabled" 
            ON "bot"("id") 
            WHERE "widget_enabled" = true
        `);

        // Set default widget config for existing bots
        await queryRunner.query(`
            UPDATE "bot" 
            SET "widget_config" = '{
                "theme": {
                    "primaryColor": "#667eea",
                    "position": "bottom-right",
                    "buttonSize": "medium",
                    "showAvatar": true,
                    "showTimestamp": true
                },
                "behavior": {
                    "autoOpen": false,
                    "autoOpenDelay": 0,
                    "greetingDelay": 2
                },
                "messages": {
                    "welcome": "Xin chào! Tôi có thể giúp gì cho bạn?",
                    "placeholder": "Nhập tin nhắn...",
                    "offline": "Chúng tôi hiện đang offline",
                    "errorMessage": "Đã có lỗi xảy ra. Vui lòng thử lại."
                },
                "features": {
                    "fileUpload": false,
                    "voiceInput": false,
                    "markdown": true,
                    "quickReplies": true
                },
                "branding": {
                    "showPoweredBy": true
                }
            }'::jsonb
            WHERE "widget_config" = '{}'::jsonb
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop index
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_bot_widget_enabled"
        `);

        // Drop columns
        await queryRunner.query(`
            ALTER TABLE "bot" DROP COLUMN "allowed_origins"
        `);

        await queryRunner.query(`
            ALTER TABLE "bot" DROP COLUMN "widget_config"
        `);

        await queryRunner.query(`
            ALTER TABLE "bot" DROP COLUMN "widget_enabled"
        `);
    }
}
