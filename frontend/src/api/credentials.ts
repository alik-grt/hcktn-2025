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

export type CredentialType = 'api_key' | 'oauth2' | 'custom_headers';

export type Credential = {
  id: string;
  name: string;
  type: CredentialType;
  config: Record<string, any>;
  createdAt: string;
  updatedAt: string;
};

export type CreateCredentialDto = {
  name: string;
  type: CredentialType;
  config: Record<string, any>;
};

export const credentialsApi = {
  async getAll(): Promise<Credential[]> {
    const response = await api.get<Credential[]>('/credentials');
    return response.data;
  },

  async getById(id: string): Promise<Credential> {
    const response = await api.get<Credential>(`/credentials/${id}`);
    return response.data;
  },

  async create(data: CreateCredentialDto): Promise<Credential> {
    const response = await api.post<Credential>('/credentials', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateCredentialDto>): Promise<Credential> {
    const response = await api.patch<Credential>(`/credentials/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/credentials/${id}`);
  },

  async testConnection(id: string): Promise<{ success: boolean; message?: string }> {
    const response = await api.post<{ success: boolean; message?: string }>(
      `/credentials/${id}/test`,
    );
    return response.data;
  },
};
