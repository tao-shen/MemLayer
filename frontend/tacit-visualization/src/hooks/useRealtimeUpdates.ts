import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { wsClient } from '../api/websocket';
import { TacitUpdate } from '../types';

/**
 * Hook to handle real-time tacit knowledge updates via WebSocket
 */
export function useRealtimeUpdates(agentId: string, enabled: boolean = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !agentId) return;

    // Connect to WebSocket
    wsClient.connect(agentId).catch(error => {
      console.error('Failed to connect to WebSocket:', error);
    });

    // Subscribe to updates
    const unsubscribe = wsClient.subscribe((update: TacitUpdate) => {
      console.log('Received tacit knowledge update:', update);

      // Invalidate relevant queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['visualization-data', agentId] });
      queryClient.invalidateQueries({ queryKey: ['timeline-data', agentId] });
      queryClient.invalidateQueries({ queryKey: ['graph-data', agentId] });
      queryClient.invalidateQueries({ queryKey: ['statistics', agentId] });
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
      wsClient.disconnect();
    };
  }, [agentId, enabled, queryClient]);
}
