# Fix Permission Denied Error

If you see this error:
```
permission denied for table users
```

## Quick Fix

Run this command in PowerShell (as Administrator if needed):

```powershell
# Navigate to backend folder
cd apps/backend

# Run the SQL script to grant permissions
$env:PGPASSWORD='your_postgres_password'; psql -U postgres -d wataomi -f migrations/grant_permissions.sql
```

Replace `your_postgres_password` with your actual postgres password.

## Alternative: Python Script

```bash
cd apps/backend
python scripts/fix_permissions.py
```

This will prompt for postgres password and fix all permissions automatically.

## Manual Fix

If the above doesn't work, run these commands in psql:

```sql
-- Connect as postgres
psql -U postgres -d wataomi

-- Run these commands:
GRANT ALL PRIVILEGES ON DATABASE wataomi TO wataomi;
GRANT USAGE ON SCHEMA public TO wataomi;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO wataomi;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO wataomi;

-- Change table ownership
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(r.tablename) || ' OWNER TO wataomi';
    END LOOP;
END$$;

-- Change sequence ownership
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public'
    LOOP
        EXECUTE 'ALTER SEQUENCE ' || quote_ident(r.sequence_name) || ' OWNER TO wataomi';
    END LOOP;
END$$;
```

## Verify Fix

After running the fix, verify with:

```sql
-- Check table ownership
SELECT tablename, tableowner 
FROM pg_tables 
WHERE schemaname = 'public';

-- Should show 'wataomi' as owner for all tables
```

## Why This Happens

The migration was run as `postgres` user, so all tables are owned by `postgres`. The application connects as `wataomi` user, which doesn't have permissions by default.

## Prevention

Always run migrations with proper permissions:

```bash
# Option 1: Run as postgres and grant permissions (recommended)
psql -U postgres -d wataomi -f migrations/init_schema.sql

# Option 2: Run as wataomi user directly
psql -U wataomi -d wataomi -f migrations/init_schema.sql
```

The `init_schema.sql` now includes automatic permission grants at the end.
