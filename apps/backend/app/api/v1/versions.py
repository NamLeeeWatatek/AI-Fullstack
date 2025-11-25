"""
Flow Versions API
Manage workflow versions and history
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from pydantic import BaseModel

from app.models.flow import Flow
from app.db.session import get_session
from app.core.auth import get_current_user

router = APIRouter()


class FlowVersionResponse(BaseModel):
    version: int
    name: str
    description: Optional[str]
    data: dict
    created_at: datetime
    is_current: bool
    
    class Config:
        from_attributes = True


class CreateVersionRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


@router.get("/{flow_id}/versions", response_model=List[FlowVersionResponse])
async def list_flow_versions(
    flow_id: int,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    List all versions of a flow
    For now, we only track the current version
    TODO: Implement proper version history with snapshots
    """
    flow = await session.get(Flow, flow_id)
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    
    # Return current version
    # In future, query from flow_versions table
    return [
        FlowVersionResponse(
            version=flow.version,
            name=flow.name,
            description=flow.description,
            data=flow.data,
            created_at=flow.updated_at,
            is_current=True
        )
    ]


@router.post("/{flow_id}/versions", response_model=FlowVersionResponse)
async def create_flow_version(
    flow_id: int,
    request: CreateVersionRequest,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Create a new version snapshot of the flow
    TODO: Implement proper version snapshots in flow_versions table
    """
    flow = await session.get(Flow, flow_id)
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    
    # For now, just increment version number
    flow.version += 1
    flow.updated_at = datetime.utcnow()
    
    if request.name:
        flow.name = request.name
    if request.description:
        flow.description = request.description
    
    session.add(flow)
    await session.commit()
    await session.refresh(flow)
    
    return FlowVersionResponse(
        version=flow.version,
        name=flow.name,
        description=flow.description,
        data=flow.data,
        created_at=flow.updated_at,
        is_current=True
    )


@router.post("/{flow_id}/versions/{version}/restore")
async def restore_flow_version(
    flow_id: int,
    version: int,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Restore a previous version of the flow
    TODO: Implement when version history is available
    """
    raise HTTPException(
        status_code=501,
        detail="Version restore not yet implemented. Coming soon!"
    )
