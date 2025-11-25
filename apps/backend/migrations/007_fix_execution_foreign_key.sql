-- Fix workflow_executions foreign key to use flow_id instead of flow_version_id
-- Migration: 007_fix_execution_foreign_key

BEGIN;

-- Drop old foreign key constraint
ALTER TABLE workflow_executions 
DROP CONSTRAINT IF EXISTS workflow_executions_flow_version_id_fkey;

-- Rename column
ALTER TABLE workflow_executions 
RENAME COLUMN flow_version_id TO flow_id;

-- Add new foreign key constraint
ALTER TABLE workflow_executions 
ADD CONSTRAINT workflow_executions_flow_id_fkey 
FOREIGN KEY (flow_id) REFERENCES flows(id) ON DELETE CASCADE;

COMMIT;
