from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from datetime import datetime

from app.db.session import get_session
from app.core.auth import get_current_user
from app.models.integration import IntegrationConfig, IntegrationConfigCreate, IntegrationConfigUpdate

router = APIRouter()

@router.get("/", response_model=List[IntegrationConfig])
async def list_integrations(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """List all integration configurations"""
    user_id = current_user.get("id") or current_user.get("sub")
    query = select(IntegrationConfig).where(IntegrationConfig.user_id == user_id)
    result = await session.execute(query)
    return result.scalars().all()

@router.post("/", response_model=IntegrationConfig)
async def create_integration(
    config: IntegrationConfigCreate,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Create or update integration configuration"""
    user_id = current_user.get("id") or current_user.get("sub")
    
    # Check if exists
    query = select(IntegrationConfig).where(
        IntegrationConfig.user_id == user_id,
        IntegrationConfig.provider == config.provider
    )
    result = await session.execute(query)
    existing = result.scalar_one_or_none()
    
    if existing:
        # Update existing
        for key, value in config.model_dump(exclude_unset=True).items():
            setattr(existing, key, value)
        existing.updated_at = datetime.utcnow()
        session.add(existing)
        await session.commit()
        await session.refresh(existing)
        return existing
    
    # Create new
    new_config = IntegrationConfig(
        **config.model_dump(),
        user_id=user_id
    )
    session.add(new_config)
    await session.commit()
    await session.refresh(new_config)
    return new_config

@router.get("/{provider}", response_model=IntegrationConfig)
async def get_integration(
    provider: str,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Get integration configuration by provider"""
    user_id = current_user.get("id") or current_user.get("sub")
    query = select(IntegrationConfig).where(
        IntegrationConfig.user_id == user_id,
        IntegrationConfig.provider == provider
    )
    result = await session.execute(query)
    config = result.scalar_one_or_none()
    
    if not config:
        raise HTTPException(status_code=404, detail="Integration not found")
    return config
