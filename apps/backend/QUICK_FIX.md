# Quick Fix for Schema Mismatch

## Problem
Database schema doesn't match the models, causing errors like:
- `column bots.is_active does not exist`
- `operator does not exist: integer = character varying`

## Solution

### Option 1: Run Migration Patch (Recommended)

This will update your existing database without losing data:

```powershell
# In PowerShell
cd apps/backend
$env:PGPASSWORD='123456'; psql -U postgres -d wataomi -f migrations/add_is_active_to_bots.sql
```

### Option 2: Fresh Database (Will lose all data!)

If you want to start fresh with the correct schema:

```powershell
# Drop and recreate database
$env:PGPASSWORD='123456'; psql -U postgres -c "DROP DATABASE IF EXISTS wataomi;"
$env:PGPASSWORD='123456'; psql -U postgres -c "CREATE DATABASE wataomi OWNER wataomi;"

# Run complete migration
$env:PGPASSWORD='123456'; psql -U postgres -d wataomi -f migrations/init_schema.sql

# Grant permissions
$env:PGPASSWORD='123456'; psql -U postgres -d wataomi -f migrations/grant_permissions.sql
```

### Option 3: Python Script

```bash
cd apps/backend
python scripts/run_migration.py
```

## Verify Fix

After running the migration, verify with:

```sql
-- Check bots table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bots';

-- Should show:
-- id, integer
-- workspace_id, integer
-- name, character varying
-- description, text
-- is_active, boolean
-- created_at, timestamp
-- updated_at, timestamp
```

## Common Issues

### "Permission Denied"
Run: `psql -U postgres -d wataomi -f migrations/grant_permissions.sql`

### "Database does not exist"
Create it first: `psql -U postgres -c "CREATE DATABASE wataomi OWNER wataomi;"`

### "Password authentication failed"
Update `$env:PGPASSWORD='your_actual_password'`

## After Fix

Restart your backend server:
```bash
# Stop current server (Ctrl+C)
# Then restart
uvicorn app.main:app --reload --port 8000
```

The errors should be gone! ✅
