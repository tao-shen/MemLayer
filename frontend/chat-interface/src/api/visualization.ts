import apiClient from './client';
import type {
  Memory,
  Entity,
  Relationship,
  GraphNode,
  GraphEdge,
  Statistics,
  ApiResponse,
} from '@/types';

export interface GetVisualizationDataParams {
  types?: string;
  startDate?: string;
  endDate?: string;
  minImportance?: number;
  maxImportance?: number;
  includeRelationships?: boolean;
  includeSimilarities?: boolean;
}

export interface VisualizationDataResponse {
  memories: Memory[];
  entities: Entity[];
  relationships: Relationship[];
  statistics: Statistics;
}

export interface GetGraphParams {
  layout?: 'force' | 'hierarchical' | 'radial';
  showSimilarityEdges?: boolean;
}

export interface GraphDataResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GetStatisticsParams {
  timeGranularity?: 'hour' | 'day' | 'week' | 'month';
}

export interface ExportDataRequest {
  format: 'json' | 'csv' | 'png' | 'svg';
  filters?: GetVisualizationDataParams;
}

export const visualizationApi = {
  // Get visualization data
  async getVisualizationData(
    agentId: string,
    params?: GetVisualizationDataParams
  ): Promise<VisualizationDataResponse> {
    const response = await apiClient.get<ApiResponse<VisualizationDataResponse>>(
      `/v1/agents/${agentId}/visualization/data`,
      { params }
    );
    return response.data.data;
  },

  // Get timeline data
  async getTimelineData(
    agentId: string,
    params?: GetVisualizationDataParams
  ): Promise<Memory[]> {
    const response = await apiClient.get<ApiResponse<Memory[]>>(
      `/v1/agents/${agentId}/visualization/timeline`,
      { params }
    );
    return response.data.data;
  },

  // Get graph data
  async getGraphData(agentId: string, params?: GetGraphParams): Promise<GraphDataResponse> {
    const response = await apiClient.get<ApiResponse<GraphDataResponse>>(
      `/v1/agents/${agentId}/visualization/graph`,
      { params }
    );
    return response.data.data;
  },

  // Get statistics
  async getStatistics(agentId: string, params?: GetStatisticsParams): Promise<Statistics> {
    const response = await apiClient.get<ApiResponse<Statistics>>(
      `/v1/agents/${agentId}/visualization/statistics`,
      { params }
    );
    return response.data.data;
  },

  // Export data
  async exportData(agentId: string, request: ExportDataRequest): Promise<Blob> {
    const response = await apiClient.post(
      `/v1/agents/${agentId}/visualization/export`,
      request,
      {
        responseType: 'blob',
      }
    );
    return response.data;
  },
};
