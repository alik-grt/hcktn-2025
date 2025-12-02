import { ref, onUnmounted, type Ref } from 'vue';
import { io, Socket } from 'socket.io-client';

export type NodeStatus = 'idle' | 'progress' | 'passed' | 'error';

export type NodeStatusChangedEvent = {
  nodeId: string;
  status: NodeStatus;
  timestamp: string;
};

export type ExecutionStartedEvent = {
  executionId: string;
  timestamp: string;
};

export type ExecutionFinishedEvent = {
  executionId: string;
  output: any;
  timestamp: string;
};

export type ExecutionErrorEvent = {
  executionId: string;
  error: string;
  timestamp: string;
};

export type ExecutionCreatedEvent = {
  execution: any;
  timestamp: string;
};

export type ExecutionUpdatedEvent = {
  execution: any;
  timestamp: string;
};

export function useWorkflowSocket(workflowId: Ref<string | null> | string | null) {
  const socket = ref<Socket | null>(null);
  const isConnected = ref(false);
  const nodeStatuses = ref<Map<string, NodeStatus>>(new Map());
  const executionFinished = ref<ExecutionFinishedEvent | null>(null);
  const executions = ref<any[]>([]);

  const getWorkflowId = () => {
    if (typeof workflowId === 'string' || workflowId === null) {
      return workflowId;
    }
    return workflowId.value;
  };

  const connect = () => {
    const id = getWorkflowId();
    if (!id || socket.value?.connected) {
      return;
    }

    const namespace = `/ws/workflows/${id}`;
    let apiUrl: string;
    const viteApiUrl = (import.meta as any).env?.VITE_API_URL;
    const isProd = (import.meta as any).env?.PROD;
    if (viteApiUrl) {
      apiUrl = viteApiUrl;
    } else if (isProd) {
      apiUrl = window.location.origin;
    } else {
      apiUrl = 'http://localhost:3000';
    }
    socket.value = io(`${apiUrl}${namespace}`, {
      transports: ['websocket'],
    });

    socket.value.on('connect', () => {
      isConnected.value = true;
      socket.value?.emit('subscribe', { workflowId: id });
    });

    socket.value.on('disconnect', () => {
      isConnected.value = false;
    });

    socket.value.on('node_status_changed', (data: NodeStatusChangedEvent) => {
      console.log('Node status changed:', data);
      nodeStatuses.value.set(data.nodeId, data.status);
      nodeStatuses.value = new Map(nodeStatuses.value);
    });

    socket.value.on('execution_started', (data: ExecutionStartedEvent) => {
      console.log('Execution started:', data);
    });

    socket.value.on('execution_finished', (data: ExecutionFinishedEvent) => {
      console.log('Execution finished:', data);
      executionFinished.value = data;
    });

    socket.value.on('execution_error', (data: ExecutionErrorEvent) => {
      console.error('Execution error:', data);
    });

    socket.value.on('execution_created', (data: ExecutionCreatedEvent) => {
      console.log('Execution created:', data);
      if (!data.execution) {
        return;
      }
      const existingIndex = executions.value.findIndex((e) => e?.id === data.execution.id);
      if (existingIndex === -1) {
        const newExecutions = [data.execution, ...executions.value];
        newExecutions.sort((a, b) => {
          const dateA = new Date(a.startedAt || a.createdAt || 0).getTime();
          const dateB = new Date(b.startedAt || b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        executions.value = newExecutions;
      }
    });

    socket.value.on('execution_updated', (data: ExecutionUpdatedEvent) => {
      console.log('Execution updated:', data);
      if (!data.execution) {
        return;
      }
      const existingIndex = executions.value.findIndex((e) => e?.id === data.execution.id);
      if (existingIndex !== -1) {
        const newExecutions = [...executions.value];
        newExecutions[existingIndex] = data.execution;
        executions.value = newExecutions;
      } else {
        const newExecutions = [data.execution, ...executions.value];
        newExecutions.sort((a, b) => {
          const dateA = new Date(a.startedAt || a.createdAt || 0).getTime();
          const dateB = new Date(b.startedAt || b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        executions.value = newExecutions;
      }
    });
  };

  const disconnect = () => {
    if (socket.value) {
      socket.value.removeAllListeners();
      socket.value.disconnect();
      socket.value = null;
      isConnected.value = false;
    }
  };

  const getNodeStatus = (nodeId: string): NodeStatus => {
    return nodeStatuses.value.get(nodeId) || 'idle';
  };

  const resetNodeStatuses = () => {
    nodeStatuses.value.clear();
  };

  const resetNodeStatusesForNodes = (nodeIds: string[]) => {
    for (const nodeId of nodeIds) {
      nodeStatuses.value.delete(nodeId);
    }
    nodeStatuses.value = new Map(nodeStatuses.value);
  };

  onUnmounted(() => {
    disconnect();
  });

  return {
    socket,
    isConnected,
    nodeStatuses,
    executionFinished,
    executions,
    connect,
    disconnect,
    getNodeStatus,
    resetNodeStatuses,
    resetNodeStatusesForNodes,
  };
}
