from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.models.conversation import (
    Conversation,
    ConversationResponse,
    Message,
    MessageCreate,
    MessageResponse,
    Channel,
    ChannelConnection
)
from app.db.session import get_session
from app.core.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=dict)
async def list_conversations(
    channel_id: Optional[int] = Query(None),
    status: str = Query("active"),
    search: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0),
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """List conversations with filters"""
    user_id = current_user.get("id") or current_user.get("sub")
    
    # Build query
    query = (
        select(
            Conversation,
            Channel.name.label("channel_name"),
            Channel.icon.label("channel_icon")
        )
        .join(ChannelConnection, Conversation.channel_connection_id == ChannelConnection.id)
        .join(Channel, ChannelConnection.channel_id == Channel.id)
        .where(ChannelConnection.user_id == str(user_id))
    )
    
    # Filters
    if status:
        query = query.where(Conversation.status == status)
    
    if channel_id:
        query = query.where(ChannelConnection.channel_id == channel_id)
    
    if search:
        query = query.where(
            or_(
                Conversation.customer_name.ilike(f"%{search}%"),
                Conversation.last_message_content.ilike(f"%{search}%")
            )
        )
    
    # Count total
    count_query = (
        select(func.count())
        .select_from(Conversation)
        .join(ChannelConnection, Conversation.channel_connection_id == ChannelConnection.id)
        .where(ChannelConnection.user_id == str(user_id))
    )
    
    if status:
        count_query = count_query.where(Conversation.status == status)
    
    if channel_id:
        count_query = count_query.where(ChannelConnection.channel_id == channel_id)
    
    total = (await session.execute(count_query)).scalar() or 0
    
    # Get conversations
    query = query.order_by(Conversation.last_message_at.desc()).limit(limit).offset(offset)
    result = await session.execute(query)
    rows = result.all()
    
    conversations = []
    for row in rows:
        conv = row[0]
        conv_dict = conv.model_dump()
        conv_dict["channel_name"] = row[1]
        conv_dict["channel_icon"] = row[2]
        conversations.append(conv_dict)
    
    return {
        "conversations": conversations,
        "total": total,
        "has_more": (offset + limit) < total
    }

@router.get("/{conversation_id}/messages", response_model=dict)
async def get_conversation_messages(
    conversation_id: int,
    limit: int = Query(100, le=200),
    offset: int = Query(0),
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Get messages for a conversation"""
    conversation = await session.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Get messages
    query = (
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
        .limit(limit)
        .offset(offset)
    )
    
    result = await session.execute(query)
    messages = result.scalars().all()
    
    return {"messages": [msg.model_dump() for msg in messages]}

@router.post("/{conversation_id}/messages", response_model=MessageResponse)
async def send_message(
    conversation_id: int,
    message: MessageCreate,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Send a message in a conversation"""
    conversation = await session.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Create message
    user_id = current_user.get("id") or current_user.get("sub")
    db_message = Message(
        **message.model_dump(),
        conversation_id=conversation_id,
        sender_id=str(user_id)
    )
    
    session.add(db_message)
    
    # Update conversation
    conversation.last_message_content = message.content
    conversation.last_message_at = datetime.utcnow()
    conversation.updated_at = datetime.utcnow()
    
    session.add(conversation)
    await session.commit()
    await session.refresh(db_message)
    
    return db_message

@router.post("/{conversation_id}/read")
async def mark_as_read(
    conversation_id: int,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Mark conversation as read"""
    conversation = await session.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    conversation.unread_count = 0
    conversation.updated_at = datetime.utcnow()
    
    session.add(conversation)
    await session.commit()
    
    return {"status": "success"}
