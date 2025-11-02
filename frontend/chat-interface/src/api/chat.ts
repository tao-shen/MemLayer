import apiClient from './client';
import type {
  Session,
  SessionConfig,
  Message,
  RAGMode,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

export interface SendMessageRequest {
  sessionId: string;
  message: string;
  ragMode?: RAGMode;
  context?: {
    memoryIds?: string[];
    includeReflections?: boolean;
  };
}

export interface SendMessageResponse {
  messageId: string;
  response: string;
  ragResults?: any[];
  memoriesCreated?: string[];
  reflectionsGenerated?: string[];
}

export interface CreateSessionRequest {
  name: string;
  config: SessionConfig;
}

export const chatApi = {
  // Send message
  async sendMessage(
    agentId: string,
    request: SendMessageRequest
  ): Promise<SendMessageResponse> {
    const response = await apiClient.post<ApiResponse<SendMessageResponse>>(
      `/v1/agents/${agentId}/chat`,
      request
    );
    return response.data.data;
  },

  // Get messages
  async getMessages(
    agentId: string,
    sessionId: string,
    params?: {
      limit?: number;
      before?: string;
    }
  ): Promise<PaginatedResponse<Message>> {
    const response = await apiClient.get<PaginatedResponse<Message>>(
      `/v1/agents/${agentId}/sessions/${sessionId}/messages`,
      { params }
    );
    return response.data;
  },

  // Create session
  async createSession(agentId: string, request: CreateSessionRequest): Promise<Session> {
    const response = await apiClient.post<ApiResponse<Session>>(
      `/v1/agents/${agentId}/sessions`,
      request
    );
    return response.data.data;
  },

  // Get sessions
  async getSessions(agentId: string): Promise<Session[]> {
    const response = await apiClient.get<ApiResponse<Session[]>>(
      `/v1/agents/${agentId}/sessions`
    );
    return response.data.data;
  },

  // Delete session
  async deleteSession(agentId: string, sessionId: string): Promise<void> {
    await apiClient.delete(`/v1/agents/${agentId}/sessions/${sessionId}`);
  },

  // Rename session
  async renameSession(agentId: string, sessionId: string, newName: string): Promise<Session> {
    const response = await apiClient.patch<ApiResponse<Session>>(
      `/v1/agents/${agentId}/sessions/${sessionId}`,
      { name: newName }
    );
    return response.data.data;
  },
};
