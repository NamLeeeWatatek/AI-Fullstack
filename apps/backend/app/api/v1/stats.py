from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, func
from datetime import datetime, timedelta
from app.db.session import get_session
from app.core.auth import get_current_user
from app.models.flow import Flow
from app.models.bot import Bot
from app.models.conversation import Conversation, Message

router = APIRouter()

@router.get("/dashboard")
async def get_dashboard_stats(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    # Count flows
    flow_count_query = select(func.count()).select_from(Flow)
    flow_count = (await session.execute(flow_count_query)).scalar() or 0

    # Count active bots
    bot_count_query = select(func.count()).select_from(Bot).where(Bot.is_active == True)
    bot_count = (await session.execute(bot_count_query)).scalar() or 0

    # Count total conversations
    conversation_count_query = select(func.count()).select_from(Conversation)
    conversation_count = (await session.execute(conversation_count_query)).scalar() or 0

    # Count messages today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    messages_today_query = select(func.count()).select_from(Message).where(
        Message.created_at >= today_start
    )
    messages_today = (await session.execute(messages_today_query)).scalar() or 0

    stats = {
        "total_flows": flow_count,
        "active_bots": bot_count,
        "total_conversations": conversation_count,
        "messages_today": messages_today
    }
    
    return stats


@router.get("/flows/{flow_id}")
async def get_flow_stats(
    flow_id: int,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Get execution statistics for a specific flow"""
    from app.models.execution import WorkflowExecution
    
    # Total executions
    total_query = select(func.count()).select_from(WorkflowExecution).where(
        WorkflowExecution.flow_id == flow_id
    )
    total_executions = (await session.execute(total_query)).scalar() or 0
    
    # Successful executions
    success_query = select(func.count()).select_from(WorkflowExecution).where(
        WorkflowExecution.flow_id == flow_id,
        WorkflowExecution.status == 'completed'
    )
    successful_executions = (await session.execute(success_query)).scalar() or 0
    
    # Calculate success rate
    success_rate = 0
    if total_executions > 0:
        success_rate = round((successful_executions / total_executions) * 100, 1)
    
    # Average duration (only for completed executions)
    avg_duration_query = select(
        func.avg(
            func.extract('epoch', WorkflowExecution.completed_at - WorkflowExecution.started_at) * 1000
        )
    ).where(
        WorkflowExecution.flow_id == flow_id,
        WorkflowExecution.status == 'completed',
        WorkflowExecution.completed_at.isnot(None)
    )
    avg_duration = (await session.execute(avg_duration_query)).scalar()
    avg_duration_ms = int(avg_duration) if avg_duration else 0
    
    return {
        "flow_id": flow_id,
        "total_executions": total_executions,
        "successful_executions": successful_executions,
        "failed_executions": total_executions - successful_executions,
        "success_rate": success_rate,
        "avg_duration_ms": avg_duration_ms
    }
