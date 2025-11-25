from typing import Optional, Dict, Any, List
from datetime import datetime
from sqlmodel import SQLModel, Field, Column, JSON

class ChannelBase(SQLModel):
    name: str
    type: str  # 'messaging', 'social', 'email'
    icon: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = True

class Channel(ChannelBase, table=True):
    __tablename__ = "channels"
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ChannelConnectionBase(SQLModel):
    channel_id: int
    user_id: str
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    token_expires_at: Optional[datetime] = None
    config: Dict[str, Any] = Field(default={}, sa_column=Column(JSON))
    status: str = "active"  # 'active', 'disconnected', 'error'

class ChannelConnection(ChannelConnectionBase, table=True):
    __tablename__ = "channel_connections"
    id: Optional[int] = Field(default=None, primary_key=True)
    last_sync_at: Optional[datetime] = None
    error_message: Optional[str] = None
    total_conversations: int = 0
    total_messages: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ConversationBase(SQLModel):
    channel_connection_id: int
    customer_id: str
    customer_name: Optional[str] = None
    customer_avatar: Optional[str] = None
    customer_meta: Dict[str, Any] = Field(default={}, sa_column=Column(JSON))
    status: str = "active"  # 'active', 'closed', 'archived'
    assigned_to: Optional[str] = None
    bot_id: Optional[int] = None
    is_bot_active: bool = True

class Conversation(ConversationBase, table=True):
    __tablename__ = "conversations"
    id: Optional[int] = Field(default=None, primary_key=True)
    last_message_content: Optional[str] = None
    last_message_at: Optional[datetime] = None
    unread_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class MessageBase(SQLModel):
    conversation_id: int
    sender_type: str  # 'customer', 'bot', 'agent'
    sender_id: str
    content: str
    content_type: str = "text"  # 'text', 'image', 'file', 'audio'
    attachments: List[Dict[str, Any]] = Field(default=[], sa_column=Column(JSON))
    message_meta: Dict[str, Any] = Field(default={}, sa_column=Column(JSON))
    status: str = "sent"  # 'sent', 'delivered', 'read', 'failed'

class Message(MessageBase, table=True):
    __tablename__ = "messages"
    id: Optional[int] = Field(default=None, primary_key=True)
    external_id: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Response models
class ConversationResponse(ConversationBase):
    id: int
    last_message_content: Optional[str]
    last_message_at: Optional[datetime]
    unread_count: int
    channel_name: Optional[str] = None
    channel_icon: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class MessageResponse(MessageBase):
    id: int
    external_id: Optional[str]
    created_at: datetime

# Create/Update models
class ConversationCreate(ConversationBase):
    pass

class MessageCreate(MessageBase):
    pass

# Export public models
__all__ = [
    "Channel",
    "ChannelConnection",
    "Conversation",
    "Message",
    "ConversationResponse",
    "MessageResponse",
    "ConversationCreate",
    "MessageCreate",
]
