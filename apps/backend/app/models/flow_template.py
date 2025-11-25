from typing import Optional, Dict, Any
from datetime import datetime
from sqlmodel import SQLModel, Field, Column, JSON

class FlowTemplateBase(SQLModel):
    name: str
    description: str
    category: str  # customer-service, sales, automation, etc.
    icon: str  # emoji or icon name
    template_data: Dict[str, Any] = Field(default={}, sa_column=Column(JSON))
    is_public: bool = False

class FlowTemplate(FlowTemplateBase, table=True):
    __tablename__ = "flow_templates"
    id: Optional[int] = Field(default=None, primary_key=True)
    workspace_id: Optional[int] = None  # None for global templates
    created_by: str  # user_id
    usage_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class FlowTemplateCreate(FlowTemplateBase):
    pass

class FlowTemplateUpdate(SQLModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    icon: Optional[str] = None
    template_data: Optional[Dict[str, Any]] = None
    is_public: Optional[bool] = None

class FlowTemplateResponse(FlowTemplateBase):
    id: int
    workspace_id: Optional[int]
    created_by: str
    usage_count: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
