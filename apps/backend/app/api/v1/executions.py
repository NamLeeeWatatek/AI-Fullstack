from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

from app.models.execution import WorkflowExecution, NodeExecution
from app.models.flow import Flow
from app.db.session import get_session
from app.core.auth import get_current_user

router = APIRouter()

# Response Models
class NodeExecutionResponse(BaseModel):
    id: int
    node_id: str
    node_type: str
    node_label: str
    status: str
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    execution_time_ms: Optional[int]
    input_data: dict
    output_data: Optional[dict]
    error_message: Optional[str]

    class Config:
        from_attributes = True

class WorkflowExecutionResponse(BaseModel):
    id: int
    flow_id: int  # Changed from flow_version_id
    conversation_id: Optional[int]
    status: str
    started_at: datetime
    completed_at: Optional[datetime]
    input_data: dict
    output_data: Optional[dict]
    error_message: Optional[str]
    total_nodes: int
    completed_nodes: int
    node_executions: List[NodeExecutionResponse] = []
    
    # Computed fields
    duration_ms: Optional[int] = None
    success_rate: Optional[float] = None

    class Config:
        from_attributes = True

class ExecutionCreateRequest(BaseModel):
    flow_id: int
    input_data: dict = {}
    conversation_id: Optional[int] = None

@router.get("/", response_model=List[WorkflowExecutionResponse])
async def list_executions(
    flow_id: Optional[int] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """List workflow executions with optional filters"""
    query = select(WorkflowExecution)
    
    if flow_id:
        query = query.where(WorkflowExecution.flow_id == flow_id)
    
    if status:
        query = query.where(WorkflowExecution.status == status)
    
    query = query.order_by(WorkflowExecution.started_at.desc()).offset(skip).limit(limit)
    
    result = await session.execute(query)
    executions = result.scalars().all()
    
    # Enrich with computed fields
    response_data = []
    for execution in executions:
        exec_dict = execution.model_dump()
        
        # Calculate duration
        if execution.completed_at and execution.started_at:
            duration = (execution.completed_at - execution.started_at).total_seconds() * 1000
            exec_dict['duration_ms'] = int(duration)
        
        # Calculate success rate
        if execution.total_nodes > 0:
            exec_dict['success_rate'] = (execution.completed_nodes / execution.total_nodes) * 100
        
        exec_dict['node_executions'] = []
        response_data.append(WorkflowExecutionResponse(**exec_dict))
    
    return response_data

@router.get("/{execution_id}", response_model=WorkflowExecutionResponse)
async def get_execution(
    execution_id: int,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Get detailed execution information including all node executions"""
    execution = await session.get(WorkflowExecution, execution_id)
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    # Get node executions
    node_query = select(NodeExecution).where(
        NodeExecution.workflow_execution_id == execution_id
    ).order_by(NodeExecution.started_at)
    
    node_result = await session.execute(node_query)
    node_executions = node_result.scalars().all()
    
    # Build response
    exec_dict = execution.model_dump()
    
    # Calculate duration
    if execution.completed_at and execution.started_at:
        duration = (execution.completed_at - execution.started_at).total_seconds() * 1000
        exec_dict['duration_ms'] = int(duration)
    
    # Calculate success rate
    if execution.total_nodes > 0:
        exec_dict['success_rate'] = (execution.completed_nodes / execution.total_nodes) * 100
    
    # Add node executions
    exec_dict['node_executions'] = [
        NodeExecutionResponse.model_validate(node) for node in node_executions
    ]
    
    return WorkflowExecutionResponse(**exec_dict)

@router.post("/", response_model=WorkflowExecutionResponse)
async def create_execution(
    request: ExecutionCreateRequest,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Create and start a new workflow execution"""
    from app.services.flow_executor import FlowExecutor
    
    # Get flow
    flow = await session.get(Flow, request.flow_id)
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    
    # Execute workflow
    executor = FlowExecutor(session)
    execution = await executor.execute_flow(
        flow_id=request.flow_id,
        input_data=request.input_data,
        conversation_id=request.conversation_id
    )
    
    # Get node executions
    node_query = select(NodeExecution).where(
        NodeExecution.workflow_execution_id == execution.id
    ).order_by(NodeExecution.started_at)
    
    node_result = await session.execute(node_query)
    node_executions = node_result.scalars().all()
    
    # Build response
    exec_dict = execution.model_dump()
    
    # Calculate duration
    if execution.completed_at and execution.started_at:
        duration = (execution.completed_at - execution.started_at).total_seconds() * 1000
        exec_dict['duration_ms'] = int(duration)
    
    # Calculate success rate
    if execution.total_nodes > 0:
        exec_dict['success_rate'] = (execution.completed_nodes / execution.total_nodes) * 100
    
    # Add node executions
    exec_dict['node_executions'] = [
        NodeExecutionResponse.model_validate(node) for node in node_executions
    ]
    
    return WorkflowExecutionResponse(**exec_dict)

@router.post("/{execution_id}/cancel")
async def cancel_execution(
    execution_id: int,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Cancel a running execution"""
    execution = await session.get(WorkflowExecution, execution_id)
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    if execution.status != 'running':
        raise HTTPException(status_code=400, detail="Execution is not running")
    
    execution.status = 'cancelled'
    execution.completed_at = datetime.utcnow()
    
    session.add(execution)
    await session.commit()
    
    return {"status": "cancelled", "message": "Execution cancelled successfully"}

@router.delete("/{execution_id}")
async def delete_execution(
    execution_id: int,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Delete an execution record"""
    execution = await session.get(WorkflowExecution, execution_id)
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    await session.delete(execution)
    await session.commit()
    
    return {"status": "success", "message": "Execution deleted"}
