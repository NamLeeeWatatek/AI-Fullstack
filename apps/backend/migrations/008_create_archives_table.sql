-- Create archives table for generic soft-delete system
-- Migration: 008_create_archives_table

BEGIN;

CREATE TABLE IF NOT EXISTS archives (
    id SERIAL PRIMARY KEY,
    
    -- Polymorphic fields
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER NOT NULL,
    
    -- Entity data snapshot
    entity_data JSON NOT NULL DEFAULT '{}',
    
    -- Archive metadata
    archived_by VARCHAR(255),
    archived_at TIMESTAMP NOT NULL DEFAULT NOW(),
    archive_reason TEXT,
    
    -- Restore tracking
    restored_at TIMESTAMP,
    restored_by VARCHAR(255),
    is_restored BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Soft delete
    deleted_at TIMESTAMP,
    
    -- Indexes
    CONSTRAINT archives_entity_unique UNIQUE (entity_type, entity_id, archived_at)
);

-- Create indexes for better query performance
CREATE INDEX idx_archives_entity_type ON archives(entity_type);
CREATE INDEX idx_archives_entity_id ON archives(entity_id);
CREATE INDEX idx_archives_is_restored ON archives(is_restored);
CREATE INDEX idx_archives_archived_at ON archives(archived_at DESC);

COMMIT;
