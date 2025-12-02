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

export type Workflow = {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  nodes?: Node[];
  edges?: Edge[];
  createdAt: string;
  updatedAt: string;
};

export type Node = {
  id: string;
  type: 'trigger' | 'http' | 'transform' | 'agent' | 'delay';
  subtype?: 'manual' | 'webhook' | 'cron';
  workflowId: string;
  position?: { x: number; y: number };
  config?: Record<string, any>;
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  bodyTemplate?: string;
  template?: Record<string, any>;
  name?: string;
  status?: 'idle' | 'progress' | 'passed' | 'error';
  createdAt: string;
  updatedAt: string;
};

export type Edge = {
  id: string;
  workflowId: string;
  sourceNodeId: string;
  targetNodeId: string;
  createdAt: string;
};

export type CreateWorkflowDto = {
  name: string;
  description?: string;
  status?: 'active' | 'inactive';
};

export type CreateNodeDto = {
  type: 'trigger' | 'http' | 'transform' | 'agent' | 'delay';
  subtype?: 'manual' | 'webhook' | 'cron';
  workflowId: string;
  position?: { x: number; y: number };
  config?: Record<string, any>;
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  bodyTemplate?: string;
  template?: Record<string, any>;
  name?: string;
};

export type CreateEdgeDto = {
  workflowId: string;
  sourceNodeId: string;
  targetNodeId: string;
};

export const workflowsApi = {
  async getAll(): Promise<Workflow[]> {
    const response = await api.get<Workflow[]>('/workflows');
    return response.data;
  },

  async getById(id: string): Promise<Workflow> {
    const response = await api.get<Workflow>(`/workflows/${id}`);
    return response.data;
  },

  async create(data: CreateWorkflowDto): Promise<Workflow> {
    const response = await api.post<Workflow>('/workflows', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateWorkflowDto>): Promise<Workflow> {
    const response = await api.patch<Workflow>(`/workflows/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/workflows/${id}`);
  },

  async getNodes(workflowId: string): Promise<Node[]> {
    const response = await api.get<Node[]>(`/nodes/workflow/${workflowId}`);
    return response.data;
  },

  async createNode(data: CreateNodeDto): Promise<Node> {
    const response = await api.post<Node>('/nodes', data);
    return response.data;
  },

  async updateNode(id: string, data: Partial<CreateNodeDto>): Promise<Node> {
    console.log('API updateNode called:', { id, data, position: data.position });
    const response = await api.patch<Node>(`/nodes/${id}`, data);
    console.log('API updateNode response:', response.data);
    return response.data;
  },

  async deleteNode(id: string): Promise<void> {
    await api.delete(`/nodes/${id}`);
  },

  async getEdges(workflowId: string): Promise<Edge[]> {
    const response = await api.get<Edge[]>(`/nodes/edges/workflow/${workflowId}`);
    return response.data;
  },

  async createEdge(data: CreateEdgeDto): Promise<Edge> {
    const response = await api.post<Edge>('/nodes/edges', data);
    return response.data;
  },

  async deleteEdge(id: string): Promise<void> {
    await api.delete(`/nodes/edges/${id}`);
  },

  async executeWorkflow(workflowId: string, input?: Record<string, any>): Promise<any> {
    const response = await api.post(`/executions/workflow/${workflowId}`, { input });
    return response.data;
  },

  async getLatestExecution(workflowId: string): Promise<any> {
    const response = await api.get(`/executions/workflow/${workflowId}/latest`);
    return response.data;
  },

  async getExecutionNode(executionId: string, nodeId: string): Promise<any> {
    const response = await api.get(`/executions/${executionId}/nodes/${nodeId}`);
    return response.data;
  },

  async getWebhookInfo(nodeId: string): Promise<{ path: string; url: string } | null> {
    try {
      const response = await api.get(`/nodes/${nodeId}/webhook-info`);
      return response.data;
    } catch (error) {
      return null;
    }
  },

  async getExecutions(workflowId: string): Promise<any[]> {
    const response = await api.get(`/executions?workflowId=${workflowId}`);
    return response.data;
  },

  async clearExecutions(workflowId: string): Promise<void> {
    await api.delete(`/executions?workflowId=${workflowId}`);
  },

  async startCron(nodeId: string): Promise<void> {
    await api.post(`/nodes/${nodeId}/cron/start`, {});
  },

  async stopCron(nodeId: string): Promise<void> {
    await api.post(`/nodes/${nodeId}/cron/stop`, {});
  },
};
