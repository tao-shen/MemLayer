import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import { chatApi, memoryApi, visualizationApi, blockchainApi } from '@/api';
import type { GetMemoriesParams, GetVisualizationDataParams, GetAssetsParams } from '@/api';

// Query keys
export const queryKeys = {
  sessions: (agentId: string) => ['sessions', agentId] as const,
  messages: (agentId: string, sessionId: string) => ['messages', agentId, sessionId] as const,
  memories: (agentId: string, params?: GetMemoriesParams) =>
    ['memories', agentId, params] as const,
  memoryDetails: (agentId: string, memoryId: string) =>
    ['memoryDetails', agentId, memoryId] as const,
  visualizationData: (agentId: string, params?: GetVisualizationDataParams) =>
    ['visualizationData', agentId, params] as const,
  statistics: (agentId: string) => ['statistics', agentId] as const,
  assets: (params?: GetAssetsParams) => ['assets', params] as const,
  assetDetails: (assetAddress: string) => ['assetDetails', assetAddress] as const,
};

// Create QueryClient with optimized caching options
export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes - cache persists for 10 minutes
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnWindowFocus: false,
        refetchOnReconnect: true, // Refetch when network reconnects
        refetchOnMount: true, // Refetch when component mounts if data is stale
      },
      mutations: {
        retry: 1,
        retryDelay: 1000,
      },
    },
  });

// Custom hooks

// Sessions
export const useSessionsQuery = (agentId: string) => {
  return useQuery({
    queryKey: queryKeys.sessions(agentId),
    queryFn: () => chatApi.getSessions(agentId),
    enabled: !!agentId,
  });
};

// Messages
export const useMessagesQuery = (agentId: string, sessionId: string) => {
  return useQuery({
    queryKey: queryKeys.messages(agentId, sessionId),
    queryFn: () => chatApi.getMessages(agentId, sessionId, { limit: 50 }),
    enabled: !!agentId && !!sessionId,
  });
};

// Memories
export const useMemoriesQuery = (agentId: string, params?: GetMemoriesParams) => {
  return useQuery({
    queryKey: queryKeys.memories(agentId, params),
    queryFn: () => memoryApi.getMemories(agentId, params),
    enabled: !!agentId,
  });
};

// Memory details
export const useMemoryDetailsQuery = (agentId: string, memoryId: string) => {
  return useQuery({
    queryKey: queryKeys.memoryDetails(agentId, memoryId),
    queryFn: () => memoryApi.getMemoryDetails(agentId, memoryId),
    enabled: !!agentId && !!memoryId,
  });
};

// Visualization data
export const useVisualizationDataQuery = (
  agentId: string,
  params?: GetVisualizationDataParams
) => {
  return useQuery({
    queryKey: queryKeys.visualizationData(agentId, params),
    queryFn: () => visualizationApi.getVisualizationData(agentId, params),
    enabled: !!agentId,
  });
};

// Statistics
export const useStatisticsQuery = (agentId: string) => {
  return useQuery({
    queryKey: queryKeys.statistics(agentId),
    queryFn: () => visualizationApi.getStatistics(agentId),
    enabled: !!agentId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

// Assets
export const useAssetsQuery = (params?: GetAssetsParams) => {
  return useQuery({
    queryKey: queryKeys.assets(params),
    queryFn: () => blockchainApi.getAssets(params),
    enabled: !!params?.agentId || !!params?.owner,
  });
};

// Asset details
export const useAssetDetailsQuery = (assetAddress: string) => {
  return useQuery({
    queryKey: queryKeys.assetDetails(assetAddress),
    queryFn: () => blockchainApi.getAssetDetails(assetAddress),
    enabled: !!assetAddress,
  });
};

// Mutations

// Send message with optimistic update
export const useSendMessageMutation = (agentId: string, sessionId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (message: string) =>
      chatApi.sendMessage(agentId, {
        sessionId,
        message,
      }),
    // Optimistic update
    onMutate: async (message: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.messages(agentId, sessionId) });

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData(queryKeys.messages(agentId, sessionId));

      // Optimistically update to the new value
      queryClient.setQueryData(queryKeys.messages(agentId, sessionId), (old: any) => {
        const newMessage = {
          id: `temp-${Date.now()}`,
          role: 'user',
          content: message,
          timestamp: new Date().toISOString(),
        };
        return old ? [...old, newMessage] : [newMessage];
      });

      return { previousMessages };
    },
    // On error, rollback
    onError: (err, message, context: any) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(
          queryKeys.messages(agentId, sessionId),
          context.previousMessages
        );
      }
    },
    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages(agentId, sessionId) });
    },
  });
};

// Create session
export const useCreateSessionMutation = (agentId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: any) => chatApi.createSession(agentId, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions(agentId) });
    },
  });
};

// Delete session
export const useDeleteSessionMutation = (agentId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => chatApi.deleteSession(agentId, sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions(agentId) });
    },
  });
};

// Mint memory
export const useMintMemoryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: any) => blockchainApi.mintMemory(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
};

// Prefetching utilities

// Prefetch session messages on hover
export const usePrefetchMessages = () => {
  const queryClient = useQueryClient();

  return (agentId: string, sessionId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.messages(agentId, sessionId),
      queryFn: () => chatApi.getMessages(agentId, sessionId, { limit: 50 }),
      staleTime: 5 * 60 * 1000,
    });
  };
};

// Prefetch memory details on hover
export const usePrefetchMemoryDetails = () => {
  const queryClient = useQueryClient();

  return (agentId: string, memoryId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.memoryDetails(agentId, memoryId),
      queryFn: () => memoryApi.getMemoryDetails(agentId, memoryId),
      staleTime: 5 * 60 * 1000,
    });
  };
};

// Prefetch asset details on hover
export const usePrefetchAssetDetails = () => {
  const queryClient = useQueryClient();

  return (assetAddress: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.assetDetails(assetAddress),
      queryFn: () => blockchainApi.getAssetDetails(assetAddress),
      staleTime: 5 * 60 * 1000,
    });
  };
};

// Cache invalidation utilities
export const useInvalidateQueries = () => {
  const queryClient = useQueryClient();

  return {
    invalidateSessions: (agentId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions(agentId) });
    },
    invalidateMessages: (agentId: string, sessionId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages(agentId, sessionId) });
    },
    invalidateMemories: (agentId: string) => {
      queryClient.invalidateQueries({ queryKey: ['memories', agentId] });
    },
    invalidateVisualization: (agentId: string) => {
      queryClient.invalidateQueries({ queryKey: ['visualizationData', agentId] });
      queryClient.invalidateQueries({ queryKey: ['statistics', agentId] });
    },
    invalidateAssets: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
    invalidateAll: () => {
      queryClient.invalidateQueries();
    },
  };
};
