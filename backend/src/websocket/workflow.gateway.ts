import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  namespace: /^\/ws\/workflows\/.+$/,
  cors: {
    origin: '*',
  },
})
export class WorkflowGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WorkflowGateway.name);
  private readonly workflowRooms = new Map<string, Set<string>>();

  handleConnection(client: Socket) {
    const namespace = client.nsp.name;
    const workflowId = this.extractWorkflowId(namespace);
    if (workflowId) {
      if (!this.workflowRooms.has(workflowId)) {
        this.workflowRooms.set(workflowId, new Set());
      }
      this.workflowRooms.get(workflowId).add(client.id);
      client.join(workflowId);
      this.logger.log(`Client ${client.id} connected to workflow ${workflowId}`);
    }
  }

  handleDisconnect(client: Socket) {
    const namespace = client.nsp.name;
    const workflowId = this.extractWorkflowId(namespace);
    if (workflowId && this.workflowRooms.has(workflowId)) {
      this.workflowRooms.get(workflowId).delete(client.id);
      if (this.workflowRooms.get(workflowId).size === 0) {
        this.workflowRooms.delete(workflowId);
      }
      this.logger.log(`Client ${client.id} disconnected from workflow ${workflowId}`);
    }
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, payload: { workflowId: string }) {
    const workflowId = payload.workflowId;
    client.join(workflowId);
    this.logger.log(`Client ${client.id} subscribed to workflow ${workflowId}`);
  }

  emitNodeStatusChanged(workflowId: string, nodeId: string, status: string): void {
    this.server.to(workflowId).emit('node_status_changed', {
      nodeId,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  emitExecutionStarted(workflowId: string, executionId: string): void {
    this.server.to(workflowId).emit('execution_started', {
      executionId,
      timestamp: new Date().toISOString(),
    });
  }

  emitExecutionFinished(workflowId: string, executionId: string, output: any): void {
    this.server.to(workflowId).emit('execution_finished', {
      executionId,
      output,
      timestamp: new Date().toISOString(),
    });
  }

  emitExecutionError(workflowId: string, executionId: string, error: string): void {
    this.server.to(workflowId).emit('execution_error', {
      executionId,
      error,
      timestamp: new Date().toISOString(),
    });
  }

  emitExecutionCreated(workflowId: string, execution: any): void {
    this.server.to(workflowId).emit('execution_created', {
      execution,
      timestamp: new Date().toISOString(),
    });
  }

  emitExecutionUpdated(workflowId: string, execution: any): void {
    this.server.to(workflowId).emit('execution_updated', {
      execution,
      timestamp: new Date().toISOString(),
    });
  }

  private extractWorkflowId(namespace: string): string | null {
    const match = namespace.match(/\/ws\/workflows\/(.+)$/);
    return match ? match[1] : null;
  }
}
