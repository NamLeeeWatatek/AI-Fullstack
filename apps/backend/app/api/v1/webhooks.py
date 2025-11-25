from fastapi import APIRouter, Request, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
import httpx

from app.core.config import settings
from app.db.session import get_session
from app.services.bot_executor import BotExecutor, find_bot_for_channel
from app.models.conversation import Conversation, Message, ChannelConnection

router = APIRouter()

@router.post("/whatsapp")
async def whatsapp_webhook(
    request: Request,
    session: AsyncSession = Depends(get_session)
):
    """Receive WhatsApp webhooks"""
    data = await request.json()
    
    # Extract message data (simplified - actual WhatsApp format is more complex)
    if 'messages' in data:
        for msg_data in data['messages']:
            await process_incoming_message(
                session=session,
                channel_type='whatsapp',
                sender_id=msg_data.get('from'),
                message_text=msg_data.get('text', {}).get('body', ''),
                external_id=msg_data.get('id')
            )
    
    return {"success": True}

@router.post("/messenger")
async def messenger_webhook(
    request: Request,
    session: AsyncSession = Depends(get_session)
):
    """Receive Messenger webhooks"""
    data = await request.json()
    
    # Extract message data
    if 'entry' in data:
        for entry in data['entry']:
            for messaging in entry.get('messaging', []):
                if 'message' in messaging:
                    await process_incoming_message(
                        session=session,
                        channel_type='messenger',
                        sender_id=messaging['sender']['id'],
                        message_text=messaging['message'].get('text', ''),
                        external_id=messaging['message'].get('mid')
                    )
    
    return {"success": True}

@router.post("/instagram")
async def instagram_webhook(
    request: Request,
    session: AsyncSession = Depends(get_session)
):
    """Receive Instagram webhooks"""
    data = await request.json()
    
    # Similar to Messenger format
    if 'entry' in data:
        for entry in data['entry']:
            for messaging in entry.get('messaging', []):
                if 'message' in messaging:
                    await process_incoming_message(
                        session=session,
                        channel_type='instagram',
                        sender_id=messaging['sender']['id'],
                        message_text=messaging['message'].get('text', ''),
                        external_id=messaging['message'].get('mid')
                    )
    
    return {"success": True}


async def process_incoming_message(
    session: AsyncSession,
    channel_type: str,
    sender_id: str,
    message_text: str,
    external_id: str = None
):
    """Process an incoming message and trigger bot response"""
    
    # Find or create conversation
    # For now, simplified - in production, need proper channel connection lookup
    query = select(Conversation).where(
        Conversation.customer_id == sender_id
    ).limit(1)
    result = await session.execute(query)
    conversation = result.scalar_one_or_none()
    
    if not conversation:
        # Create new conversation (simplified)
        # In production, need to link to proper channel_connection
        conversation = Conversation(
            channel_connection_id=1,  # TODO: Get actual channel connection
            customer_id=sender_id,
            customer_name=sender_id,
            status='active'
        )
        session.add(conversation)
        await session.flush()
    
    # Save incoming message
    incoming_message = Message(
        conversation_id=conversation.id,
        sender_type='customer',
        sender_id=sender_id,
        content=message_text,
        external_id=external_id,
        status='delivered'
    )
    session.add(incoming_message)
    await session.flush()
    
    # Update conversation
    conversation.last_message_content = message_text
    conversation.last_message_at = incoming_message.created_at
    conversation.unread_count += 1
    
    # Find bot to handle this
    bot = await find_bot_for_channel(session, conversation.channel_connection_id)
    
    if bot and conversation.is_bot_active:
        # Execute bot flow
        executor = BotExecutor(session)
        result = await executor.execute_bot_for_message(
            bot_id=bot.id,
            message=incoming_message,
            conversation=conversation
        )
        
        if result['success'] and result.get('response'):
            # Save bot response
            bot_message = Message(
                conversation_id=conversation.id,
                sender_type='bot',
                sender_id=str(bot.id),
                content=result['response'],
                status='sent'
            )
            session.add(bot_message)
            
            # Update conversation
            conversation.last_message_content = result['response']
            conversation.last_message_at = bot_message.created_at
    
    await session.commit()

@router.post("/n8n-proxy")
async def n8n_proxy(request: Request):
    """Proxy requests to n8n"""
    data = await request.json()
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{settings.N8N_URL}/webhook/{data.get('webhook_id')}",
            json=data.get('payload', {}),
            headers={"Authorization": f"Bearer {settings.N8N_API_KEY}"} if settings.N8N_API_KEY else {}
        )
    
    return response.json()
