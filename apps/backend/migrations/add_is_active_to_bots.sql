-- Add is_active column to bots table if it doesn't exist
-- Run: psql -U postgres -d wataomi -f migrations/add_is_active_to_bots.sql

DO $$ 
BEGIN
    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bots' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE bots ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
        RAISE NOTICE 'Added is_active column to bots table';
    ELSE
        RAISE NOTICE 'is_active column already exists in bots table';
    END IF;

    -- Remove old columns if they exist
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bots' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE bots DROP COLUMN user_id;
        RAISE NOTICE 'Removed user_id column from bots table';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bots' AND column_name = 'status'
    ) THEN
        ALTER TABLE bots DROP COLUMN status;
        RAISE NOTICE 'Removed status column from bots table';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bots' AND column_name = 'config'
    ) THEN
        ALTER TABLE bots DROP COLUMN config;
        RAISE NOTICE 'Removed config column from bots table';
    END IF;

    -- Create index if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'bots' AND indexname = 'idx_bots_is_active'
    ) THEN
        CREATE INDEX idx_bots_is_active ON bots(is_active);
        RAISE NOTICE 'Created index idx_bots_is_active';
    END IF;

    -- Remove old indexes if they exist
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'bots' AND indexname = 'idx_bots_user_id'
    ) THEN
        DROP INDEX idx_bots_user_id;
        RAISE NOTICE 'Dropped index idx_bots_user_id';
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'bots' AND indexname = 'idx_bots_status'
    ) THEN
        DROP INDEX idx_bots_status;
        RAISE NOTICE 'Dropped index idx_bots_status';
    END IF;
END $$;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'bots'
ORDER BY ordinal_position;
