import { io, type Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

type MessageHandler = (data: any) => void;



class WebSocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private messageBuffer: any[] = [];
  private batchTimeout: ReturnType<typeof setTimeout> | null = null;
  private batchWindow = 100; // 100ms batch window

  connect(token: string, agentId: string, sessionId?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.socket = io(WS_URL, {
        auth: {
          token,
          agentId,
          sessionId,
        },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
      });

      this.socket.on('connect', () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        this.handleDisconnect();
      });

      this.socket.on('authenticated', (data) => {
        console.log('WebSocket authenticated:', data);
      });

      // Message handlers
      this.socket.on('chat-stream', (data) => {
        this.handleMessage('chat-stream', data);
      });

      this.socket.on('memory-update', (data) => {
        this.batchMessage('memory-update', data);
      });

      this.socket.on('visualization-update', (data) => {
        this.batchMessage('visualization-update', data);
      });

      this.socket.on('minting-progress', (data) => {
        this.handleMessage('minting-progress', data);
      });

      this.socket.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.messageHandlers.clear();
    this.messageBuffer = [];
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
  }

  on(event: string, handler: MessageHandler): void {
    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, new Set());
    }
    this.messageHandlers.get(event)!.add(handler);
  }

  off(event: string, handler: MessageHandler): void {
    const handlers = this.messageHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  emit(event: string, data: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('WebSocket not connected, cannot emit:', event);
    }
  }

  private handleMessage(type: string, data: any): void {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  }

  private batchMessage(type: string, data: any): void {
    this.messageBuffer.push({ type, data });

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(() => {
      this.flushMessageBuffer();
    }, this.batchWindow);
  }

  private flushMessageBuffer(): void {
    if (this.messageBuffer.length === 0) return;

    const buffer = [...this.messageBuffer];
    this.messageBuffer = [];

    // Group messages by type
    const grouped = buffer.reduce((acc, msg) => {
      if (!acc[msg.type]) {
        acc[msg.type] = [];
      }
      acc[msg.type].push(msg.data);
      return acc;
    }, {} as Record<string, any[]>);

    // Emit grouped messages
    Object.entries(grouped).forEach(([type, messages]) => {
      this.handleMessage(type, messages);
    });
  }

  private handleDisconnect(): void {
    this.reconnectAttempts++;

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.min(
        this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
        30000
      );
      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const wsClient = new WebSocketClient();

// Hook for using WebSocket in React components
export const useWebSocket = () => {
  return wsClient;
};
