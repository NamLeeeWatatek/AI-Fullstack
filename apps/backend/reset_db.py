"""
Script to DROP and recreate all tables
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from sqlmodel import SQLModel

# Import all models
from app.models.user import User, Workspace, WorkspaceMember
from app.models.conversation import Channel, ChannelConnection, Conversation, Message
from app.models.bot import Bot, FlowVersion
from app.models.flow import Flow
from app.models.execution import WorkflowExecution, NodeExecution
from app.models.integration import IntegrationConfig
from app.core.config import settings

async def reset_database():
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    
    async with engine.begin() as conn:
        # Drop all tables
        print("🗑️  Dropping all tables...")
        await conn.execute(text("DROP TABLE IF EXISTS messages CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS conversations CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS channel_connections CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS channels CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS node_executions CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS workflow_executions CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS integration_configs CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS flow_versions CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS flows CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS bots CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS workspace_members CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS workspaces CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS users CASCADE"))
        
        print("✅ All tables dropped!")
        
        # Create all tables
        print("🔨 Creating all tables...")
        await conn.run_sync(SQLModel.metadata.create_all)
        print("✅ All tables created!")
    
    # Seed channels
    from sqlalchemy.ext.asyncio import AsyncSession
    from sqlalchemy.orm import sessionmaker
    
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        channels = [
            Channel(name='WhatsApp', type='whatsapp', color='#25D366', description='WhatsApp Business API', is_active=True),
            Channel(name='Facebook', type='facebook', color='#1877F2', description='Facebook Pages', is_active=True),
            Channel(name='Messenger', type='messenger', color='#0084FF', description='Facebook Messenger', is_active=True),
            Channel(name='Instagram', type='instagram', color='#E4405F', description='Instagram Direct Messages', is_active=True),
            Channel(name='Telegram', type='telegram', color='#0088CC', description='Telegram Bot API', is_active=True),
            Channel(name='Email', type='email', color='#EA4335', description='Email Integration', is_active=True),
            Channel(name='Web Chat', type='webchat', color='#8B5CF6', description='Website Chat Widget', is_active=True),
        ]
        for channel in channels:
            session.add(channel)
        await session.commit()
        print("✅ Channels seeded!")
    
    print("\n🎉 Database reset complete!")

if __name__ == "__main__":
    print("⚠️  WARNING: This will DELETE ALL DATA in the database!")
    confirm = input("Type 'yes' to continue: ")
    if confirm.lower() == 'yes':
        asyncio.run(reset_database())
    else:
        print("❌ Aborted")
