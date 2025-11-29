import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_DOMAIN || 'http://localhost:3000',
    credentials: true,
  },
  namespace: /^\/ws\/execute\/\d+$/,
  path: '/api/v1/socket.io',
})
export class ExecutionGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  handleConnection(client: any) {
    console.log(`Execution client connected: ${client.id}`);
  }

  handleDisconnect(client: any) {
    console.log(`Execution client disconnected: ${client.id}`);
  }

  // Emit execution events
  emitExecutionStart(executionId: string, flowId: string) {
    this.server.emit(`execution:${executionId}:start`, {
      executionId,
      flowId,
      timestamp: Date.now(),
    });
  }

  emitExecutionProgress(
    executionId: string,
    nodeId: string,
    status: string,
    data?: any,
  ) {
    this.server.emit(`execution:${executionId}:progress`, {
      executionId,
      nodeId,
      status,
      data,
      timestamp: Date.now(),
    });
  }

  emitExecutionComplete(executionId: string, result: any) {
    this.server.emit(`execution:${executionId}:complete`, {
      executionId,
      result,
      timestamp: Date.now(),
    });
  }

  emitExecutionError(executionId: string, error: any) {
    this.server.emit(`execution:${executionId}:error`, {
      executionId,
      error,
      timestamp: Date.now(),
    });
  }

  emitNodeExecutionStart(executionId: string, nodeId: string) {
    this.server.emit(`execution:${executionId}:node:${nodeId}:start`, {
      executionId,
      nodeId,
      timestamp: Date.now(),
    });
  }

  emitNodeExecutionComplete(executionId: string, nodeId: string, output: any) {
    this.server.emit(`execution:${executionId}:node:${nodeId}:complete`, {
      executionId,
      nodeId,
      output,
      timestamp: Date.now(),
    });
  }

  emitNodeExecutionError(executionId: string, nodeId: string, error: any) {
    this.server.emit(`execution:${executionId}:node:${nodeId}:error`, {
      executionId,
      nodeId,
      error,
      timestamp: Date.now(),
    });
  }
}
