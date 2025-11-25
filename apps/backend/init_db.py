"""
Script to create database tables using SQLAlchemy
Run this instead of SQL migrations if you have encoding issues
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import SQLModel

# Import all models
from app.models.user import User, Workspace, WorkspaceMember
from app.models.conversation import Channel, ChannelConnection, Conversation, Message
from app.models.bot import Bot, FlowVersion
from app.models.flow import Flow
from app.models.execution import WorkflowExecution, NodeExecution
from app.models.integration import IntegrationConfig
from app.core.config import settings

async def create_tables():
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    
    async with engine.begin() as conn:
        # Create all tables
        await conn.run_sync(SQLModel.metadata.create_all)
    
    print("✅ All tables created successfully!")
    
    # Seed channels
    from sqlalchemy.ext.asyncio import AsyncSession
    from sqlalchemy.orm import sessionmaker
    
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Check if channels already exist
        from sqlmodel import select
        result = await session.execute(select(Channel))
        existing = result.scalars().all()
        
        if not existing:
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
            print("✅ Channels seeded successfully!")
        else:
            print("ℹ️  Channels already exist, skipping seed")

if __name__ == "__main__":
    asyncio.run(create_tables())
