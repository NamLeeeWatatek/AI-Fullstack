"""
Archive Model
Generic archive system for soft-deleting any entity
"""
from sqlmodel import SQLModel, Field, Column, JSON
from typing import Optional, Dict, Any
from datetime import datetime


class Archive(SQLModel, table=True):
    """
    Generic archive table for soft-deleted entities
    Supports polymorphic archiving of any entity type
    """
    __tablename__ = "archives"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Polymorphic fields
    entity_type: str  # 'flow', 'bot', 'user', 'channel', etc.
    entity_id: int  # ID of the archived entity
    
    # Entity data snapshot
    entity_data: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    
    # Archive metadata
    archived_by: Optional[str] = None  # User ID who archived it
    archived_at: datetime = Field(default_factory=datetime.utcnow)
    archive_reason: Optional[str] = None
    
    # Restore tracking
    restored_at: Optional[datetime] = None
    restored_by: Optional[str] = None
    is_restored: bool = False
    
    # Soft delete (for permanently deleting archives)
    deleted_at: Optional[datetime] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "entity_type": "flow",
                "entity_id": 123,
                "entity_data": {
                    "name": "Customer Support Flow",
                    "description": "Automated customer support",
                    "status": "archived"
                },
                "archived_by": "user_123",
                "archive_reason": "No longer needed"
            }
        }
