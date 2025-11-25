#!/usr/bin/env python3
"""
Run database migration
Executes init_schema.sql to create/reset database
"""

import sys
import os
from pathlib import Path
import asyncio
import asyncpg

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.config import settings

async def run_migration():
    """Run the database migration"""
    
    print("=" * 60)
    print("WataOmi Database Migration")
    print("=" * 60)
    print()
    
    # Parse DATABASE_URL
    db_url = settings.DATABASE_URL
    
    # Convert asyncpg URL format
    if db_url.startswith("postgresql+asyncpg://"):
        db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
    
    print(f"Database URL: {db_url.split('@')[1] if '@' in db_url else 'localhost'}")
    print()
    
    # Read migration file
    migration_file = Path(__file__).parent.parent / "migrations" / "init_schema.sql"
    
    if not migration_file.exists():
        print(f"❌ Migration file not found: {migration_file}")
        sys.exit(1)
    
    print(f"📄 Reading migration file: {migration_file.name}")
    
    with open(migration_file, 'r', encoding='utf-8') as f:
        sql = f.read()
    
    print(f"✅ Loaded {len(sql)} characters of SQL")
    print()
    
    # Confirm action
    print("⚠️  WARNING: This will DROP and RECREATE all tables!")
    print("⚠️  All existing data will be LOST!")
    print()
    
    response = input("Continue? (yes/no): ").strip().lower()
    
    if response != 'yes':
        print("❌ Migration cancelled")
        sys.exit(0)
    
    print()
    print("🚀 Running migration...")
    print()
    
    try:
        # Connect to database
        conn = await asyncpg.connect(db_url)
        
        # Execute migration
        await conn.execute(sql)
        
        # Verify tables
        tables = await conn.fetch("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        """)
        
        print("✅ Migration completed successfully!")
        print()
        print(f"📊 Created {len(tables)} tables:")
        for table in tables:
            print(f"   - {table['table_name']}")
        
        print()
        
        # Check seed data
        channel_count = await conn.fetchval("SELECT COUNT(*) FROM channels")
        template_count = await conn.fetchval("SELECT COUNT(*) FROM flow_templates")
        
        print("📦 Seed data:")
        print(f"   - Channels: {channel_count}")
        print(f"   - Flow Templates: {template_count}")
        
        await conn.close()
        
        print()
        print("=" * 60)
        print("🎉 Database is ready!")
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(run_migration())
