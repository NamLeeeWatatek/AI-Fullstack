"""
Bot Executor Service
Handles bot flow execution when messages are received
"""

from typing import Dict, Any, Optional, List
from datetime import datetime
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.bot import Bot
from app.models.flow import Flow
from app.models.execution import WorkflowExecution, NodeExecution
from app.models.conversation import Message, Conversation


class BotExecutor:
    """Execute bot flows in response to messages"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def execute_bot_for_message(
        self,
        bot_id: int,
        message: Message,
        conversation: Conversation
    ) -> Dict[str, Any]:
        """
        Execute a bot's flow in response to a message
        
        Args:
            bot_id: The bot to execute
            message: The incoming message
            conversation: The conversation context
            
        Returns:
            Dict with execution results and response
        """
        # Get bot
        bot = await self.session.get(Bot, bot_id)
        if not bot:
            raise ValueError(f"Bot {bot_id} not found")
        
        if not bot.is_active:
            return {
                "success": False,
                "error": "Bot is not active"
            }
        
        if not bot.flow_id:
            return {
                "success": False,
                "error": "Bot has no flow configured"
            }
        
        # Get flow
        flow = await self.session.get(Flow, bot.flow_id)
        if not flow:
            return {
                "success": False,
                "error": f"Flow {bot.flow_id} not found"
            }
        
        # Create execution record
        execution = WorkflowExecution(
            flow_version_id=flow.id,
            conversation_id=conversation.id,
            status='running',
            started_at=datetime.utcnow(),
            input_data={
                'message': message.content,
                'sender_id': message.sender_id,
                'conversation_id': conversation.id,
                'customer_name': conversation.customer_name
            },
            total_nodes=len(flow.data.get('nodes', [])) if flow.data else 0,
            completed_nodes=0
        )
        
        self.session.add(execution)
        await self.session.flush()
        
        try:
            # Execute the flow
            result = await self._execute_flow(flow, execution, message, conversation)
            
            # Update execution status
            execution.status = 'completed'
            execution.completed_at = datetime.utcnow()
            execution.output_data = result
            execution.completed_nodes = execution.total_nodes
            
            await self.session.commit()
            
            return {
                "success": True,
                "execution_id": execution.id,
                "response": result.get('response'),
                "result": result
            }
            
        except Exception as e:
            # Mark execution as failed
            execution.status = 'failed'
            execution.completed_at = datetime.utcnow()
            execution.error_message = str(e)
            
            await self.session.commit()
            
            return {
                "success": False,
                "execution_id": execution.id,
                "error": str(e)
            }
    
    async def _execute_flow(
        self,
        flow: Flow,
        execution: WorkflowExecution,
        message: Message,
        conversation: Conversation
    ) -> Dict[str, Any]:
        """Execute the flow nodes"""
        
        if not flow.data or 'nodes' not in flow.data:
            raise ValueError("Flow has no nodes")
        
        nodes = flow.data['nodes']
        edges = flow.data.get('edges', [])
        
        # Find start node
        start_nodes = [n for n in nodes if n.get('data', {}).get('type') == 'start']
        if not start_nodes:
            raise ValueError("Flow has no start node")
        
        # Execute nodes in order
        context = {
            'message': message.content,
            'customer_name': conversation.customer_name,
            'conversation_id': conversation.id
        }
        
        response_text = None
        current_node = start_nodes[0]
        visited = set()
        
        while current_node and current_node['id'] not in visited:
            visited.add(current_node['id'])
            
            # Execute node
            node_result = await self._execute_node(
                current_node,
                execution,
                context
            )
            
            # Update context with result
            context[current_node['id']] = node_result
            
            # If this is a message/reply node, capture the response
            node_type = current_node.get('data', {}).get('type', '')
            if node_type in ['message', 'ai-reply', 'send-message']:
                response_text = node_result.get('message') or node_result.get('response')
            
            # Find next node
            next_edges = [e for e in edges if e['source'] == current_node['id']]
            if next_edges:
                next_node_id = next_edges[0]['target']
                current_node = next((n for n in nodes if n['id'] == next_node_id), None)
            else:
                break
        
        return {
            'response': response_text or "I received your message!",
            'context': context,
            'nodes_executed': len(visited)
        }
    
    async def _execute_node(
        self,
        node: Dict[str, Any],
        execution: WorkflowExecution,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute a single node"""
        
        node_data = node.get('data', {})
        node_type = node_data.get('type', '')
        node_config = node_data.get('config', {})
        
        # Create node execution record
        node_execution = NodeExecution(
            workflow_execution_id=execution.id,
            node_id=node['id'],
            node_type=node_type,
            node_label=node_data.get('label', node_type),
            status='running',
            started_at=datetime.utcnow(),
            input_data=context
        )
        
        self.session.add(node_execution)
        await self.session.flush()
        
        try:
            # Execute based on node type
            if node_type == 'start':
                result = {'started': True}
            
            elif node_type == 'message' or node_type == 'send-message':
                # Simple message node
                message_text = node_config.get('message', 'Hello!')
                # Replace variables in message
                message_text = self._replace_variables(message_text, context)
                result = {'message': message_text}
            
            elif node_type == 'ai-reply':
                # AI reply node - for now, echo with prefix
                # TODO: Integrate with actual AI service
                prompt = node_config.get('prompt', '')
                user_message = context.get('message', '')
                result = {
                    'response': f"AI Response: I understand you said '{user_message}'. {prompt}"
                }
            
            elif node_type == 'condition':
                # Condition node
                condition = node_config.get('condition', '')
                result = {'condition_met': True}  # Simplified for now
            
            elif node_type == 'n8n-trigger':
                # n8n webhook trigger
                webhook_url = node_config.get('webhook_url', '')
                result = {
                    'triggered': True,
                    'webhook_url': webhook_url
                }
                # TODO: Actually call n8n webhook
            
            else:
                result = {'executed': True, 'type': node_type}
            
            # Update node execution
            node_execution.status = 'completed'
            node_execution.completed_at = datetime.utcnow()
            node_execution.output_data = result
            
            if node_execution.started_at and node_execution.completed_at:
                duration = (node_execution.completed_at - node_execution.started_at).total_seconds() * 1000
                node_execution.execution_time_ms = int(duration)
            
            await self.session.flush()
            
            return result
            
        except Exception as e:
            node_execution.status = 'failed'
            node_execution.completed_at = datetime.utcnow()
            node_execution.error_message = str(e)
            await self.session.flush()
            raise
    
    def _replace_variables(self, text: str, context: Dict[str, Any]) -> str:
        """Replace {{variable}} placeholders in text"""
        import re
        
        def replace_match(match):
            var_name = match.group(1).strip()
            return str(context.get(var_name, match.group(0)))
        
        return re.sub(r'\{\{([^}]+)\}\}', replace_match, text)


async def find_bot_for_channel(
    session: AsyncSession,
    channel_connection_id: int
) -> Optional[Bot]:
    """
    Find which bot should handle messages for a channel
    For now, returns the first active bot
    TODO: Implement proper bot-channel mapping
    """
    query = select(Bot).where(
        Bot.is_active == True,
        Bot.flow_id.isnot(None)
    ).limit(1)
    
    result = await session.execute(query)
    return result.scalar_one_or_none()
