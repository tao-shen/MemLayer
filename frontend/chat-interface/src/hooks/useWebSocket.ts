import { useEffect, useCallback, useState } from 'react';
import { wsClient } from '@/api/websocket';

export const useWebSocketConnection = (agentId: string, sessionId?: string) => {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token || !agentId) return;

    wsClient
      .connect(token, agentId, sessionId)
      .then(() => {
        setConnected(true);
        setError(null);
      })
      .catch((err) => {
        setConnected(false);
        setError(err.message);
      });

    return () => {
      wsClient.disconnect();
      setConnected(false);
    };
  }, [agentId, sessionId]);

  return { connected, error };
};

export const useWebSocketEvent = <T = any>(
  event: string,
  handler: (data: T) => void
) => {
  useEffect(() => {
    wsClient.on(event, handler);
    return () => {
      wsClient.off(event, handler);
    };
  }, [event, handler]);
};

export const useWebSocketEmit = () => {
  return useCallback((event: string, data: any) => {
    wsClient.emit(event, data);
  }, []);
};
