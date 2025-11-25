"""
Flow Executor Service
Executes workflow nodes and tracks execution progress
"""
from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.execution import WorkflowExecution, NodeExecution
from app.models.flow import Flow
import asyncio


class FlowExecutor:
    """Executes workflow and tracks node execution"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def execute_flow(
        self, 
        flow_id: int, 
        input_data: Dict[str, Any] = None,
        conversation_id: int = None
    ) -> WorkflowExecution:
        """Execute a workflow and return execution record"""
        
        # Get flow
        flow = await self.session.get(Flow, flow_id)
        if not flow:
            raise ValueError(f"Flow {flow_id} not found")
        
        # Get nodes and edges
        nodes = flow.data.get('nodes', []) if flow.data else []
        edges = flow.data.get('edges', []) if flow.data else []
        
        # Create execution record
        execution = WorkflowExecution(
            flow_id=flow_id,  # Changed from flow_version_id
            conversation_id=conversation_id,
            status='running',
            started_at=datetime.utcnow(),
            input_data=input_data or {},
            total_nodes=len(nodes),
            completed_nodes=0
        )
        
        self.session.add(execution)
        await self.session.commit()
        await self.session.refresh(execution)
        
        try:
            # Execute workflow
            results = await self._execute_workflow(execution, nodes, edges)
            
            # Update execution status
            execution.status = 'completed'
            execution.completed_at = datetime.utcnow()
            execution.output_data = results
            execution.completed_nodes = len([r for r in results.values() if not r.get('error')])
            
        except Exception as e:
            execution.status = 'failed'
            execution.completed_at = datetime.utcnow()
            execution.error_message = str(e)
        
        self.session.add(execution)
        await self.session.commit()
        await self.session.refresh(execution)
        
        return execution
    
    async def _execute_workflow(
        self, 
        execution: WorkflowExecution,
        nodes: List[Dict],
        edges: List[Dict]
    ) -> Dict[str, Any]:
        """Execute workflow nodes in order"""
        
        # Find trigger nodes (nodes with no incoming edges)
        trigger_nodes = [
            node for node in nodes
            if not any(edge['target'] == node['id'] for edge in edges)
        ]
        
        if not trigger_nodes:
            raise ValueError("No trigger node found")
        
        execution_results = {}
        
        # Execute nodes in order (simple BFS)
        queue = trigger_nodes.copy()
        visited = set()
        
        while queue:
            current_node = queue.pop(0)
            node_id = current_node['id']
            
            if node_id in visited:
                continue
            
            visited.add(node_id)
            
            # Execute node
            result = await self._execute_node(
                execution, 
                current_node, 
                execution_results
            )
            execution_results[node_id] = result
            
            # Find next nodes
            next_edges = [e for e in edges if e['source'] == node_id]
            next_nodes = [
                n for n in nodes 
                if any(e['target'] == n['id'] for e in next_edges)
            ]
            queue.extend(next_nodes)
        
        return execution_results
    
    async def _execute_node(
        self,
        execution: WorkflowExecution,
        node: Dict,
        previous_results: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute a single node and create node execution record"""
        
        node_id = node['id']
        node_data = node.get('data', {})
        node_type = node_data.get('type', '')
        node_label = node_data.get('label', node_type)
        config = node_data.get('config', {})
        
        # Create node execution record
        node_execution = NodeExecution(
            workflow_execution_id=execution.id,
            node_id=node_id,
            node_type=node_type,
            node_label=node_label,
            status='running',
            started_at=datetime.utcnow(),
            input_data=config
        )
        
        self.session.add(node_execution)
        await self.session.commit()
        
        try:
            # Execute based on node type
            result = await self._execute_node_logic(node_type, config, previous_results)
            
            # Update node execution
            node_execution.status = 'completed'
            node_execution.completed_at = datetime.utcnow()
            node_execution.output_data = result
            
            if node_execution.started_at and node_execution.completed_at:
                duration = (node_execution.completed_at - node_execution.started_at).total_seconds() * 1000
                node_execution.execution_time_ms = int(duration)
            
        except Exception as e:
            node_execution.status = 'failed'
            node_execution.completed_at = datetime.utcnow()
            node_execution.error_message = str(e)
            result = {'error': str(e)}
        
        self.session.add(node_execution)
        await self.session.commit()
        
        return result
    
    async def _execute_node_logic(
        self,
        node_type: str,
        config: Dict[str, Any],
        previous_results: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute node logic based on type"""
        
        # N8N Integration nodes
        if node_type.startswith('n8n-'):
            from app.services.n8n_executor import N8NExecutor
            executor = N8NExecutor()
            return await executor.execute(node_type, config)
        
        # Trigger nodes
        if node_type.startswith('trigger-'):
            return {
                'triggered': True,
                'timestamp': datetime.utcnow().isoformat()
            }
        
        # AI nodes - these would call actual AI services
        if node_type in ['ai-suggest', 'ai-openai', 'ai-gemini']:
            # TODO: Call actual AI service
            return {
                'suggestion': f"AI response for: {config.get('prompt', '')}",
                'model': node_type.replace('ai-', ''),
                'tokens_used': 50
            }
        
        if node_type == 'ai-classify':
            categories = config.get('categories', [])
            if categories:
                return {
                    'category': categories[0],
                    'confidence': 0.85
                }
        
        # Message nodes
        if node_type.startswith('send-'):
            platform = node_type.replace('send-', '')
            return {
                'sent': True,
                'platform': platform,
                'message': config.get('message', ''),
                'timestamp': datetime.utcnow().isoformat()
            }
        
        # Media nodes
        if node_type.startswith('media-'):
            return {
                'processed': True,
                'media_url': config.get('media_url', ''),
                'type': node_type
            }
        
        # Action nodes
        if node_type == 'action-http':
            # TODO: Make actual HTTP request
            return {
                'executed': True,
                'url': config.get('url', ''),
                'method': config.get('method', 'GET')
            }
        
        if node_type == 'action-code':
            # TODO: Execute code safely
            return {
                'executed': True,
                'code_length': len(config.get('code', ''))
            }
        
        # Logic nodes
        if node_type == 'logic-condition':
            return {
                'evaluated': True,
                'operator': config.get('operator', 'equals'),
                'result': True
            }
        
        # Default
        return {
            'executed': True,
            'node_type': node_type
        }
