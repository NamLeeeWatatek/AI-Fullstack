-- Make workspaceId nullable for global bots
ALTER TABLE "bot" 
ALTER COLUMN "workspaceId" DROP NOT NULL;

-- Verify
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'bot' AND column_name = 'workspaceId';
