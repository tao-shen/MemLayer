import apiClient from './client';
import type {
  Memory,
  MemoryType,
  Entity,
  Relationship,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

export interface GetMemoriesParams {
  types?: MemoryType[];
  startDate?: string;
  endDate?: string;
  minImportance?: number;
  maxImportance?: number;
  searchQuery?: string;
  limit?: number;
  offset?: number;
}

export interface MemoryDetailsResponse {
  memory: Memory;
  relatedMemories: Memory[];
  entities: Entity[];
  relationships: Relationship[];
}

export interface SearchMemoriesRequest {
  query: string;
  types?: MemoryType[];
  topK?: number;
}

export interface SearchResult {
  memory: Memory;
  score: number;
}

export const memoryApi = {
  // Get memories
  async getMemories(
    agentId: string,
    params?: GetMemoriesParams
  ): Promise<PaginatedResponse<Memory>> {
    const response = await apiClient.get<PaginatedResponse<Memory>>(
      `/v1/agents/${agentId}/memories`,
      {
        params: {
          ...params,
          types: params?.types?.join(','),
        },
      }
    );
    return response.data;
  },

  // Get memory details
  async getMemoryDetails(agentId: string, memoryId: string): Promise<MemoryDetailsResponse> {
    const response = await apiClient.get<ApiResponse<MemoryDetailsResponse>>(
      `/v1/agents/${agentId}/memories/${memoryId}`
    );
    return response.data.data;
  },

  // Search memories
  async searchMemories(
    agentId: string,
    request: SearchMemoriesRequest
  ): Promise<SearchResult[]> {
    const response = await apiClient.post<ApiResponse<SearchResult[]>>(
      `/v1/agents/${agentId}/memories/search`,
      request
    );
    return response.data.data;
  },
};
