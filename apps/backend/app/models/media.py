from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field

class MediaAssetBase(SQLModel):
    public_id: str
    url: str
    secure_url: str
    resource_type: str  # image, video, raw
    format: str
    width: Optional[int] = None
    height: Optional[int] = None
    bytes: int

class MediaAsset(MediaAssetBase, table=True):
    __tablename__ = "media_assets"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class MediaAssetResponse(MediaAssetBase):
    id: int
    user_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True
