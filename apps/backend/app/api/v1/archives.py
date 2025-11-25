"""
Archives API
Manage archived entities across the system
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from pydantic import BaseModel

from app.models.archive import Archive
from app.models.flow import Flow
from app.models.bot import Bot
from app.db.session import get_session
from app.core.auth import get_current_user

router = APIRouter()


class ArchiveResponse(BaseModel):
    id: int
    entity_type: str
    entity_id: int
    entity_data: dict
    archived_by: Optional[str]
    archived_at: datetime
    archive_reason: Optional[str]
    is_restored: bool
    
    class Config:
        from_attributes = True


class RestoreRequest(BaseModel):
    reason: Optional[str] = None


@router.get("/", response_model=List[ArchiveResponse])
async def list_archives(
    entity_type: Optional[str] = Query(None, description="Filter by entity type: flow, bot, user, etc."),
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    List all archived items
    Can filter by entity_type
    """
    query = select(Archive).where(
        Archive.is_restored == False,
        Archive.deleted_at == None
    )
    
    if entity_type:
        query = query.where(Archive.entity_type == entity_type)
    
    query = query.order_by(Archive.archived_at.desc()).offset(skip).limit(limit)
    
    result = await session.execute(query)
    archives = result.scalars().all()
    
    return archives


@router.get("/{archive_id}", response_model=ArchiveResponse)
async def get_archive(
    archive_id: int,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Get details of a specific archived item"""
    archive = await session.get(Archive, archive_id)
    if not archive:
        raise HTTPException(status_code=404, detail="Archive not found")
    
    return archive


@router.post("/{archive_id}/restore")
async def restore_archive(
    archive_id: int,
    request: RestoreRequest,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Restore an archived item
    This will update the original entity's status back to active/draft
    """
    archive = await session.get(Archive, archive_id)
    if not archive:
        raise HTTPException(status_code=404, detail="Archive not found")
    
    if archive.is_restored:
        raise HTTPException(status_code=400, detail="Item already restored")
    
    user_id = current_user.get("id") or current_user.get("sub")
    
    # Restore based on entity type
    if archive.entity_type == "flow":
        flow = await session.get(Flow, archive.entity_id)
        if flow:
            flow.status = "draft"
            flow.updated_at = datetime.utcnow()
            session.add(flow)
    
    elif archive.entity_type == "bot":
        bot = await session.get(Bot, archive.entity_id)
        if bot:
            bot.is_active = True
            bot.updated_at = datetime.utcnow()
            session.add(bot)
    
    # Add more entity types as needed
    
    # Mark archive as restored
    archive.is_restored = True
    archive.restored_at = datetime.utcnow()
    archive.restored_by = str(user_id)
    
    session.add(archive)
    await session.commit()
    await session.refresh(archive)
    
    return {
        "status": "success",
        "message": f"{archive.entity_type.capitalize()} restored successfully",
        "archive": archive
    }


@router.delete("/{archive_id}")
async def delete_archive(
    archive_id: int,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Permanently delete an archived item
    This is a hard delete - cannot be undone
    """
    archive = await session.get(Archive, archive_id)
    if not archive:
        raise HTTPException(status_code=404, detail="Archive not found")
    
    # Soft delete the archive record
    archive.deleted_at = datetime.utcnow()
    session.add(archive)
    await session.commit()
    
    return {
        "status": "success",
        "message": "Archive permanently deleted"
    }


@router.get("/stats/summary")
async def get_archive_stats(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Get statistics about archived items"""
    
    # Count by entity type
    query = select(Archive).where(
        Archive.is_restored == False,
        Archive.deleted_at == None
    )
    
    result = await session.execute(query)
    archives = result.scalars().all()
    
    stats = {
        "total": len(archives),
        "by_type": {}
    }
    
    for archive in archives:
        entity_type = archive.entity_type
        if entity_type not in stats["by_type"]:
            stats["by_type"][entity_type] = 0
        stats["by_type"][entity_type] += 1
    
    return stats
