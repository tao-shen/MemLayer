import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import {
  VisualizationData,
  TimelineData,
  TacitGraph,
  Statistics,
  TacitFilters,
  LayoutAlgorithm,
  TimeGranularity,
} from '../types';

/**
 * Hook to fetch visualization data
 */
export function useVisualizationData(
  agentId: string,
  filters?: TacitFilters,
  options?: {
    includeRelationships?: boolean;
    includeSimilarities?: boolean;
    similarityThreshold?: number;
  }
): UseQueryResult<VisualizationData> {
  return useQuery({
    queryKey: ['visualization-data', agentId, filters, options],
    queryFn: () => apiClient.getVisualizationData(agentId, filters, options),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!agentId,
  });
}

/**
 * Hook to fetch timeline data
 */
export function useTimelineData(
  agentId: string,
  filters?: TacitFilters,
  includeMilestones: boolean = true
): UseQueryResult<TimelineData> {
  return useQuery({
    queryKey: ['timeline-data', agentId, filters, includeMilestones],
    queryFn: () => apiClient.getTimelineData(agentId, filters, includeMilestones),
    staleTime: 5 * 60 * 1000,
    enabled: !!agentId,
  });
}

/**
 * Hook to fetch graph data
 */
export function useGraphData(
  agentId: string,
  filters?: TacitFilters,
  options?: {
    layout?: LayoutAlgorithm;
    showSimilarityEdges?: boolean;
    similarityThreshold?: number;
  }
): UseQueryResult<TacitGraph> {
  return useQuery({
    queryKey: ['graph-data', agentId, filters, options],
    queryFn: () => apiClient.getGraphData(agentId, filters, options),
    staleTime: 5 * 60 * 1000,
    enabled: !!agentId,
  });
}

/**
 * Hook to fetch statistics
 */
export function useStatistics(
  agentId: string,
  options?: {
    timeGranularity?: TimeGranularity;
    includeAccessFrequency?: boolean;
  }
): UseQueryResult<Statistics> {
  return useQuery({
    queryKey: ['statistics', agentId, options],
    queryFn: () => apiClient.getStatistics(agentId, options),
    staleTime: 5 * 60 * 1000,
    enabled: !!agentId,
  });
}
