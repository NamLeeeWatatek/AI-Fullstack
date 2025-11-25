-- Add channel_id column to flows table
-- Run: psql -U postgres -d wataomi -f migrations/add_channel_id_to_flows.sql

DO $$ 
BEGIN
    -- Add channel_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'flows' AND column_name = 'channel_id'
    ) THEN
        ALTER TABLE flows ADD COLUMN channel_id INTEGER REFERENCES channels(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added channel_id column to flows table';
    ELSE
        RAISE NOTICE 'channel_id column already exists in flows table';
    END IF;

    -- Create index if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'flows' AND indexname = 'idx_flows_channel_id'
    ) THEN
        CREATE INDEX idx_flows_channel_id ON flows(channel_id);
        RAISE NOTICE 'Created index idx_flows_channel_id';
    END IF;
END $$;

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'flows' AND column_name = 'channel_id';
