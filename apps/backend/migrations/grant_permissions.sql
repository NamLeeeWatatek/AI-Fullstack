-- Grant Permissions to wataomi user
-- Run this if you get "permission denied" errors
-- Usage: psql -U postgres -d wataomi -f migrations/grant_permissions.sql

-- Grant all privileges on database
GRANT ALL PRIVILEGES ON DATABASE wataomi TO wataomi;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO wataomi;

-- Grant all privileges on all existing tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO wataomi;

-- Grant all privileges on all existing sequences
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO wataomi;

-- Grant all privileges on all existing functions
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO wataomi;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO wataomi;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO wataomi;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO wataomi;

-- Make wataomi owner of all tables
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(r.tablename) || ' OWNER TO wataomi';
    END LOOP;
END$$;

-- Make wataomi owner of all sequences
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public'
    LOOP
        EXECUTE 'ALTER SEQUENCE ' || quote_ident(r.sequence_name) || ' OWNER TO wataomi';
    END LOOP;
END$$;

-- Verify permissions
SELECT 
    grantee, 
    table_schema, 
    table_name, 
    privilege_type 
FROM information_schema.table_privileges 
WHERE grantee = 'wataomi' 
AND table_schema = 'public'
ORDER BY table_name, privilege_type;
