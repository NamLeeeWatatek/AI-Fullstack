-- Add flow_id column to bots table
-- Run: psql -U postgres -d wataomi -f migrations/add_flow_id_to_bots.sql

DO $$ 
BEGIN
    -- Add flow_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bots' AND column_name = 'flow_id'
    ) THEN
        ALTER TABLE bots ADD COLUMN flow_id INTEGER REFERENCES flows(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added flow_id column to bots table';
    ELSE
        RAISE NOTICE 'flow_id column already exists in bots table';
    END IF;

    -- Create index if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'bots' AND indexname = 'idx_bots_flow_id'
    ) THEN
        CREATE INDEX idx_bots_flow_id ON bots(flow_id);
        RAISE NOTICE 'Created index idx_bots_flow_id';
    END IF;
END $$;

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'bots' AND column_name = 'flow_id';
