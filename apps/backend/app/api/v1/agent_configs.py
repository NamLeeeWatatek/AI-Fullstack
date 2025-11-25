from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.db.session import get_session
from app.core.auth import get_current_user
from app.models.agent_config import (
    AgentConfig,
    AgentConfigCreate,
    AgentConfigUpdate,
    AgentConfigResponse
)

router = APIRouter()

@router.get("/{flow_id}", response_model=AgentConfigResponse)
async def get_agent_config(
    flow_id: int,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Get agent config for a flow"""
    query = select(AgentConfig).where(AgentConfig.flow_id == flow_id)
    result = await session.execute(query)
    config = result.scalar_one_or_none()
    
    if not config:
        raise HTTPException(status_code=404, detail="Agent config not found")
    
    return config

@router.post("/", response_model=AgentConfigResponse)
async def create_agent_config(
    config: AgentConfigCreate,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Create agent config for a flow"""
    # Check if config already exists
    query = select(AgentConfig).where(AgentConfig.flow_id == config.flow_id)
    result = await session.execute(query)
    existing = result.scalar_one_or_none()
    
    if existing:
        raise HTTPException(status_code=400, detail="Agent config already exists for this flow")
    
    new_config = AgentConfig(**config.model_dump())
    session.add(new_config)
    await session.commit()
    await session.refresh(new_config)
    return new_config

@router.put("/{flow_id}", response_model=AgentConfigResponse)
async def update_agent_config(
    flow_id: int,
    config_update: AgentConfigUpdate,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Update agent config"""
    query = select(AgentConfig).where(AgentConfig.flow_id == flow_id)
    result = await session.execute(query)
    config = result.scalar_one_or_none()
    
    if not config:
        raise HTTPException(status_code=404, detail="Agent config not found")
    
    for key, value in config_update.model_dump(exclude_unset=True).items():
        setattr(config, key, value)
    
    config.updated_at = datetime.utcnow()
    session.add(config)
    await session.commit()
    await session.refresh(config)
    return config

@router.delete("/{flow_id}")
async def delete_agent_config(
    flow_id: int,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Delete agent config"""
    query = select(AgentConfig).where(AgentConfig.flow_id == flow_id)
    result = await session.execute(query)
    config = result.scalar_one_or_none()
    
    if not config:
        raise HTTPException(status_code=404, detail="Agent config not found")
    
    await session.delete(config)
    await session.commit()
    return {"status": "success"}
