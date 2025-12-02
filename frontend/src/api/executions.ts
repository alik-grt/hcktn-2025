import axios from 'axios';

const getApiBaseUrl = () => {
  if (import.meta.env.PROD) {
    return '/api';
  }
  return import.meta.env.VITE_API_URL || '/api';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

export type Execution = {
  id: string;
  workflowId: string;
  workflow?: {
    id: string;
    name: string;
  };
  status: 'running' | 'completed' | 'failed' | 'stopped';
  input?: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  executionNodes?: ExecutionNode[];
  createdAt?: string;
  startedAt?: string;
  finishedAt?: string;
};

export type ExecutionNode = {
  id: string;
  executionId: string;
  nodeId: string;
  status: 'idle' | 'progress' | 'passed' | 'error';
  input?: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  duration?: number;
  startedAt?: string;
  finishedAt?: string;
};

export const executionsApi = {
  async getAll(workflowId?: string): Promise<Execution[]> {
    const params = workflowId ? { workflowId } : {};
    const response = await api.get<Execution[]>('/executions', { params });
    return response.data;
  },

  async getById(id: string): Promise<Execution> {
    const response = await api.get<Execution>(`/executions/${id}`);
    return response.data;
  },

  async getExecutionNodes(id: string): Promise<ExecutionNode[]> {
    const response = await api.get<ExecutionNode[]>(`/executions/${id}/nodes`);
    return response.data;
  },
};

