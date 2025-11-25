from typing import Optional, Dict, Any
from datetime import datetime
from sqlmodel import SQLModel, Field, Column, JSON

class IntegrationConfigBase(SQLModel):
    provider: str = Field(index=True) # facebook, google, etc.
    client_id: str
    client_secret: str
    scopes: Optional[str] = None
    is_active: bool = True
    settings: Dict[str, Any] = Field(default={}, sa_column=Column(JSON))

class IntegrationConfig(IntegrationConfigBase, table=True):
    __tablename__ = "integration_configs"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str # Config is per user (or workspace in future)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class IntegrationConfigCreate(IntegrationConfigBase):
    pass

class IntegrationConfigUpdate(SQLModel):
    client_id: Optional[str] = None
    client_secret: Optional[str] = None
    scopes: Optional[str] = None
    is_active: Optional[bool] = None
    settings: Optional[Dict[str, Any]] = None
