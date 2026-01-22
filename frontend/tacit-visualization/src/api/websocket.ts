import { TacitUpdate } from '../types';

type MessageHandler = (update: TacitUpdate) => void;

export class VisualizationWebSocketClient {
  private ws: WebSocket | null = null;
  private agentId: string | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;

  constructor(private wsUrl: string = 'ws://localhost:3000/v1/visualization/updates') {}

  /**
   * Connect to WebSocket server
   */
  connect(agentId: string, token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        reject(new Error('Connection already in progress'));
        return;
      }

      this.isConnecting = true;
      this.agentId = agentId;

      try {
        this.ws = new WebSocket(this.wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;

          // Authenticate
          this.send({
            type: 'authenticate',
            agentId,
            token: token || localStorage.getItem('auth_token'),
          });

          // Subscribe to updates
          this.send({
            type: 'subscribe',
          });

          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket closed');
          this.isConnecting = false;
          this.attemptReconnect();
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(message: any) {
    switch (message.type) {
      case 'authenticated':
        console.log('WebSocket authenticated');
        break;

      case 'subscribed':
        console.log('Subscribed to updates');
        break;

      case 'memory-update':
        this.notifyHandlers(message.data);
        break;

      case 'pong':
        // Heartbeat response
        break;

      case 'error':
        console.error('WebSocket error:', message.message);
        break;

      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  /**
   * Send message to server
   */
  private send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  /**
   * Subscribe to memory updates
   */
  subscribe(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);

    // Return unsubscribe function
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  /**
   * Notify all handlers of an update
   */
  private notifyHandlers(update: MemoryUpdate) {
    this.messageHandlers.forEach(handler => {
      try {
        handler(update);
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    });
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      if (this.agentId) {
        this.connect(this.agentId).catch(error => {
          console.error('Reconnect failed:', error);
        });
      }
    }, delay);
  }

  /**
   * Send ping to keep connection alive
   */
  ping() {
    this.send({ type: 'ping' });
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    if (this.ws) {
      this.send({ type: 'unsubscribe' });
      this.ws.close();
      this.ws = null;
    }
    this.messageHandlers.clear();
    this.agentId = null;
    this.reconnectAttempts = 0;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
export const wsClient = new VisualizationWebSocketClient();
