from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.db.session import get_session
from app.core.auth import get_current_user
from app.models.conversation import Channel, ChannelConnection

router = APIRouter()

class ChannelResponse(BaseModel):
    id: int
    name: str
    type: str
    icon: Optional[str] = None
    status: str
    connected_at: datetime
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[ChannelResponse])
async def list_channels(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """List all connected channels for the current user"""
    user_id = current_user.get("id") or current_user.get("sub")
    
    # Query ChannelConnections for this user
    query = select(ChannelConnection, Channel).join(Channel, ChannelConnection.channel_id == Channel.id).where(
        ChannelConnection.user_id == user_id
    ).where(ChannelConnection.status == "active")
    
    result = await session.execute(query)
    connections = result.all()
    
    response = []
    for conn, channel in connections:
        response.append(ChannelResponse(
            id=conn.id,
            name=channel.name,
            type=channel.type,
            icon=channel.icon,
            status=conn.status,
            connected_at=conn.created_at
        ))
        
    return response

@router.delete("/{connection_id}")
async def disconnect_channel(
    connection_id: int,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Disconnect a channel"""
    user_id = current_user.get("id") or current_user.get("sub")
    
    connection = await session.get(ChannelConnection, connection_id)
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
        
    if connection.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    await session.delete(connection)
    await session.commit()
    
    return {"status": "success", "message": "Channel disconnected"}
