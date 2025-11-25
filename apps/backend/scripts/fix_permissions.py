#!/usr/bin/env python3
"""
Fix database permissions
Grants all necessary permissions to wataomi user
"""

import sys
import os
from pathlib import Path
import asyncio
import asyncpg

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.config import settings

async def fix_permissions():
    """Fix database permissions"""
    
    print("=" * 60)
    print("WataOmi Database Permission Fix")
    print("=" * 60)
    print()
    
    # Parse DATABASE_URL to get connection info
    db_url = settings.DATABASE_URL
    
    # We need to connect as postgres user to grant permissions
    # Extract database name
    if "wataomi" in db_url:
        db_name = "wataomi"
    else:
        print("❌ Could not determine database name from DATABASE_URL")
        sys.exit(1)
    
    print(f"Database: {db_name}")
    print()
    
    # Ask for postgres password
    print("⚠️  This script needs to connect as 'postgres' user to grant permissions")
    postgres_password = input("Enter postgres password: ").strip()
    
    if not postgres_password:
        print("❌ Password required")
        sys.exit(1)
    
    print()
    print("🔧 Fixing permissions...")
    print()
    
    try:
        # Connect as postgres
        conn = await asyncpg.connect(
            host='localhost',
            port=5432,
            user='postgres',
            password=postgres_password,
            database=db_name
        )
        
        # Grant permissions
        await conn.execute("GRANT ALL PRIVILEGES ON DATABASE wataomi TO wataomi")
        await conn.execute("GRANT USAGE ON SCHEMA public TO wataomi")
        await conn.execute("GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO wataomi")
        await conn.execute("GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO wataomi")
        await conn.execute("GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO wataomi")
        
        # Set default privileges
        await conn.execute("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO wataomi")
        await conn.execute("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO wataomi")
        await conn.execute("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO wataomi")
        
        print("✅ Granted all privileges")
        print()
        
        # Change ownership of tables
        tables = await conn.fetch("""
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public'
        """)
        
        for table in tables:
            table_name = table['tablename']
            await conn.execute(f'ALTER TABLE "{table_name}" OWNER TO wataomi')
            print(f"   ✓ Changed owner of {table_name}")
        
        print()
        
        # Change ownership of sequences
        sequences = await conn.fetch("""
            SELECT sequence_name 
            FROM information_schema.sequences 
            WHERE sequence_schema = 'public'
        """)
        
        for seq in sequences:
            seq_name = seq['sequence_name']
            await conn.execute(f'ALTER SEQUENCE "{seq_name}" OWNER TO wataomi')
            print(f"   ✓ Changed owner of {seq_name}")
        
        print()
        
        # Verify
        privileges = await conn.fetch("""
            SELECT DISTINCT privilege_type 
            FROM information_schema.table_privileges 
            WHERE grantee = 'wataomi' 
            AND table_schema = 'public'
        """)
        
        print("✅ Permissions fixed successfully!")
        print()
        print("Granted privileges:")
        for priv in privileges:
            print(f"   - {priv['privilege_type']}")
        
        await conn.close()
        
        print()
        print("=" * 60)
        print("🎉 Database permissions are now correct!")
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Failed to fix permissions: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(fix_permissions())
