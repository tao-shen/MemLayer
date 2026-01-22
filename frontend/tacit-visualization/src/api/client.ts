import axios, { AxiosInstance } from 'axios';
import {
  VisualizationData,
  TimelineData,
  TacitGraph,
  Statistics,
  TacitFilters,
  LayoutAlgorithm,
  TimeGranularity,
} from '../types';

class VisualizationAPIClient {
  private client: AxiosInstance;

  constructor(baseURL: string = '/v1') {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for auth token
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor for date parsing
    this.client.interceptors.response.use((response) => {
      this.parseDates(response.data);
      return response;
    });
  }

  /**
   * Parse date strings to Date objects
   */
  private parseDates(obj: any): void {
    if (obj === null || obj === undefined) return;

    if (typeof obj === 'string') {
      const datePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
      if (datePattern.test(obj)) {
        return new Date(obj) as any;
      }
    }

    if (Array.isArray(obj)) {
      obj.forEach(item => this.parseDates(item));
    } else if (typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        obj[key] = this.parseDates(obj[key]);
      });
    }
  }

  /**
   * Get visualization data
   */
  async getVisualizationData(
    agentId: string,
    filters?: TacitFilters,
    options?: {
      includeRelationships?: boolean;
      includeSimilarities?: boolean;
      similarityThreshold?: number;
    }
  ): Promise<VisualizationData> {
    const params = this.buildFilterParams(filters);
    
    if (options?.includeRelationships) {
      params.includeRelationships = 'true';
    }
    if (options?.includeSimilarities) {
      params.includeSimilarities = 'true';
    }
    if (options?.similarityThreshold !== undefined) {
      params.similarityThreshold = options.similarityThreshold.toString();
    }

    const response = await this.client.get(
      `/agents/${agentId}/visualization/data`,
      { params }
    );
    return response.data;
  }

  /**
   * Get timeline data
   */
  async getTimelineData(
    agentId: string,
    filters?: TacitFilters,
    includeMilestones: boolean = true
  ): Promise<TimelineData> {
    const params = this.buildFilterParams(filters);
    params.includeMilestones = includeMilestones ? 'true' : 'false';

    const response = await this.client.get(
      `/agents/${agentId}/visualization/timeline`,
      { params }
    );
    return response.data;
  }

  /**
   * Get graph data
   */
  async getGraphData(
    agentId: string,
    filters?: TacitFilters,
    options?: {
      layout?: LayoutAlgorithm;
      showSimilarityEdges?: boolean;
      similarityThreshold?: number;
    }
  ): Promise<TacitGraph> {
    const params = this.buildFilterParams(filters);
    
    if (options?.layout) {
      params.layout = options.layout;
    }
    if (options?.showSimilarityEdges) {
      params.showSimilarityEdges = 'true';
    }
    if (options?.similarityThreshold !== undefined) {
      params.similarityThreshold = options.similarityThreshold.toString();
    }

    const response = await this.client.get(
      `/agents/${agentId}/visualization/graph`,
      { params }
    );
    return response.data;
  }

  /**
   * Get statistics
   */
  async getStatistics(
    agentId: string,
    options?: {
      timeGranularity?: TimeGranularity;
      includeAccessFrequency?: boolean;
    }
  ): Promise<Statistics> {
    const params: any = {};
    
    if (options?.timeGranularity) {
      params.timeGranularity = options.timeGranularity;
    }
    if (options?.includeAccessFrequency) {
      params.includeAccessFrequency = 'true';
    }

    const response = await this.client.get(
      `/agents/${agentId}/visualization/statistics`,
      { params }
    );
    return response.data;
  }

  /**
   * Export data
   */
  async exportData(
    agentId: string,
    format: 'json' | 'csv',
    filters?: TacitFilters,
    includeMetadata: boolean = true
  ): Promise<Blob> {
    const response = await this.client.post(
      `/agents/${agentId}/visualization/export`,
      {
        format,
        includeMetadata,
        filters,
      },
      {
        responseType: 'blob',
      }
    );
    return response.data;
  }

  /**
   * Build filter params for API requests
   */
  private buildFilterParams(filters?: TacitFilters): any {
    const params: any = {};

    if (!filters) return params;

    if (filters.types && filters.types.length > 0) {
      params.types = filters.types.join(',');
    }

    if (filters.timeRange) {
      params.startDate = filters.timeRange.start.toISOString();
      params.endDate = filters.timeRange.end.toISOString();
    }

    if (filters.importanceRange) {
      params.minImportance = filters.importanceRange.min;
      params.maxImportance = filters.importanceRange.max;
    }

    if (filters.searchQuery) {
      params.searchQuery = filters.searchQuery;
    }

    if (filters.sessionId) {
      params.sessionId = filters.sessionId;
    }

    return params;
  }
}

export const apiClient = new VisualizationAPIClient();
