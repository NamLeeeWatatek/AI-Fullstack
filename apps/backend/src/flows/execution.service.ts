import { Injectable } from '@nestjs/common';
import { ExecutionGateway } from './execution.gateway';

export interface NodeExecution {
  nodeId: string;
  nodeName: string;
  type: string;
  input: any;
  output?: any;
  error?: any;
  startTime: number;
  endTime?: number;
  status: 'pending' | 'running' | 'success' | 'error';
}

export interface FlowExecution {
  executionId: string;
  flowId: string;
  status: 'running' | 'completed' | 'failed';
  startTime: number;
  endTime?: number;
  nodes: NodeExecution[];
  result?: any;
  error?: any;
}

@Injectable()
export class ExecutionService {
  private executions = new Map<string, FlowExecution>();

  constructor(private readonly executionGateway: ExecutionGateway) {}

  async executeFlow(flowId: string, flowData: any, inputData?: any): Promise<string> {
    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const execution: FlowExecution = {
      executionId,
      flowId,
      status: 'running',
      startTime: Date.now(),
      nodes: [],
    };

    this.executions.set(executionId, execution);

    // Emit execution start
    this.executionGateway.emitExecutionStart(executionId, flowId);

    // Execute nodes asynchronously
    this.executeNodes(executionId, flowData, inputData).catch((error) => {
      execution.status = 'failed';
      execution.error = error.message;
      execution.endTime = Date.now();
      this.executionGateway.emitExecutionError(executionId, error.message);
    });

    return executionId;
  }

  private async executeNodes(executionId: string, flowData: any, inputData: any) {
    const execution = this.executions.get(executionId)!;
    const { nodes, edges } = flowData;

    // Build execution order (topological sort)
    const executionOrder = this.buildExecutionOrder(nodes, edges);

    // Execute nodes in order
    for (const nodeId of executionOrder) {
      const node = nodes.find((n: any) => n.id === nodeId);
      if (!node) continue;

      const nodeExecution: NodeExecution = {
        nodeId: node.id,
        nodeName: node.data?.label || node.id,
        type: node.type,
        input: inputData,
        startTime: Date.now(),
        status: 'running',
      };

      execution.nodes.push(nodeExecution);

      // Emit node start
      this.executionGateway.emitNodeExecutionStart(executionId, nodeId);

      try {
        // Execute node
        const output = await this.executeNode(node, inputData);

        nodeExecution.output = output;
        nodeExecution.status = 'success';
        nodeExecution.endTime = Date.now();

        // Emit node complete
        this.executionGateway.emitNodeExecutionComplete(executionId, nodeId, output);

        // Pass output to next node
        inputData = output;
      } catch (error) {
        nodeExecution.error = error.message;
        nodeExecution.status = 'error';
        nodeExecution.endTime = Date.now();

        // Emit node error
        this.executionGateway.emitNodeExecutionError(executionId, nodeId, error.message);

        // Stop execution on error
        throw error;
      }

      // Emit progress
      this.executionGateway.emitExecutionProgress(
        executionId,
        nodeId,
        nodeExecution.status,
        nodeExecution.output,
      );
    }

    // All nodes completed
    execution.status = 'completed';
    execution.endTime = Date.now();
    execution.result = inputData;

    this.executionGateway.emitExecutionComplete(executionId, execution.result);
  }

  private async executeNode(node: any, input: any): Promise<any> {
    const nodeType = node.type;
    const nodeData = node.data;

    // Simulate execution time
    await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1000));

    // Execute based on node type
    switch (nodeType) {
      case 'webhook':
        return this.executeWebhook(nodeData, input);
      case 'send-message':
        return this.executeSendMessage(nodeData, input);
      case 'ai-chat':
        return this.executeAIChat(nodeData, input);
      case 'http-request':
        return this.executeHttpRequest(nodeData, input);
      case 'condition':
        return this.executeCondition(nodeData, input);
      case 'code':
        return this.executeCode(nodeData, input);
      default:
        return {
          success: true,
          message: `Executed ${nodeType}`,
          input,
          output: `Mock output from ${nodeType}`,
        };
    }
  }

  private async executeWebhook(nodeData: any, input: any) {
    return {
      success: true,
      type: 'webhook',
      data: input,
      timestamp: Date.now(),
    };
  }

  private async executeSendMessage(nodeData: any, input: any) {
    return {
      success: true,
      type: 'send-message',
      message: nodeData.message || 'Default message',
      channelId: nodeData.channelId,
      sentAt: Date.now(),
    };
  }

  private async executeAIChat(nodeData: any, input: any) {
    // Mock AI response
    return {
      success: true,
      type: 'ai-chat',
      model: nodeData.model || 'gpt-3.5-turbo',
      prompt: nodeData.prompt,
      response: `Mock AI response for: ${nodeData.prompt}`,
      tokens: 150,
    };
  }

  private async executeHttpRequest(nodeData: any, input: any) {
    // Mock HTTP request
    return {
      success: true,
      type: 'http-request',
      method: nodeData.method || 'GET',
      url: nodeData.url,
      status: 200,
      data: { mock: 'response' },
    };
  }

  private async executeCondition(nodeData: any, input: any) {
    // Mock condition evaluation
    const result = Math.random() > 0.5;
    return {
      success: true,
      type: 'condition',
      result,
      branch: result ? 'true' : 'false',
    };
  }

  private async executeCode(nodeData: any, input: any) {
    // Mock code execution
    return {
      success: true,
      type: 'code',
      code: nodeData.code,
      result: { executed: true, input },
    };
  }

  private buildExecutionOrder(nodes: any[], edges: any[]): string[] {
    // Simple topological sort
    const order: string[] = [];
    const visited = new Set<string>();
    const adjacencyList = new Map<string, string[]>();

    // Build adjacency list
    edges.forEach((edge: any) => {
      if (!adjacencyList.has(edge.source)) {
        adjacencyList.set(edge.source, []);
      }
      adjacencyList.get(edge.source)!.push(edge.target);
    });

    // Find nodes with no incoming edges (start nodes)
    const startNodes = nodes.filter(
      (node) => !edges.some((edge: any) => edge.target === node.id),
    );

    // DFS
    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      order.push(nodeId);

      const neighbors = adjacencyList.get(nodeId) || [];
      neighbors.forEach((neighbor) => visit(neighbor));
    };

    startNodes.forEach((node) => visit(node.id));

    // Add any remaining nodes
    nodes.forEach((node) => {
      if (!visited.has(node.id)) {
        order.push(node.id);
      }
    });

    return order;
  }

  getExecution(executionId: string): FlowExecution | undefined {
    return this.executions.get(executionId);
  }

  getAllExecutions(flowId?: string): FlowExecution[] {
    const executions = Array.from(this.executions.values());
    if (flowId) {
      return executions.filter((e) => e.flowId === flowId);
    }
    return executions;
  }
}
