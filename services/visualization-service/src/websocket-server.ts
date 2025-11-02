import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { VisualizationService } from './services/visualization-service';
import { MemoryUpdate } from './types';

interface AuthenticatedWebSocket extends WebSocket {
  agentId?: string;
  isAlive?: boolean;
}

export class VisualizationWebSocketServer {
  private wss: WebSocketServer;
  private visualizationService: VisualizationService;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(server: Server, visualizationService: VisualizationService) {
    this.visualizationService = visualizationService;
    
    this.wss = new WebSocketServer({
      server,
      path: '/v1/visualization/updates',
    });

    this.setupWebSocketServer();
    this.setupHeartbeat();
  }

  /**
   * Setup WebSocket server
   */
  private setupWebSocketServer() {
    this.wss.on('connection', (ws: AuthenticatedWebSocket, req) => {
      console.log('New WebSocket connection');

      ws.isAlive = true;

      // Handle pong messages for heartbeat
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      // Handle messages from client
      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleMessage(ws, data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          ws.send(JSON.stringify({ error: 'Invalid message format' }));
        }
      });

      // Handle connection close
      ws.on('close', () => {
        console.log('WebSocket connection closed');
        if (ws.agentId) {
          this.unsubscribeFromUpdates(ws);
        }
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(ws: AuthenticatedWebSocket, data: any) {
    switch (data.type) {
      case 'authenticate':
        this.handleAuthentication(ws, data);
        break;
      case 'subscribe':
        this.handleSubscribe(ws, data);
        break;
      case 'unsubscribe':
        this.handleUnsubscribe(ws, data);
        break;
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
      default:
        ws.send(JSON.stringify({ error: 'Unknown message type' }));
    }
  }

  /**
   * Handle authentication
   */
  private handleAuthentication(ws: AuthenticatedWebSocket, data: any) {
    // In production, validate JWT token
    const { token, agentId } = data;

    // TODO: Validate token
    // For now, just accept the agentId
    if (agentId) {
      ws.agentId = agentId;
      ws.send(JSON.stringify({ type: 'authenticated', agentId }));
    } else {
      ws.send(JSON.stringify({ type: 'error', message: 'Authentication failed' }));
      ws.close();
    }
  }

  /**
   * Handle subscribe request
   */
  private handleSubscribe(ws: AuthenticatedWebSocket, data: any) {
    if (!ws.agentId) {
      ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
      return;
    }

    // Subscribe to updates for this agent
    this.subscribeToUpdates(ws);
    ws.send(JSON.stringify({ type: 'subscribed', agentId: ws.agentId }));
  }

  /**
   * Handle unsubscribe request
   */
  private handleUnsubscribe(ws: AuthenticatedWebSocket, data: any) {
    if (ws.agentId) {
      this.unsubscribeFromUpdates(ws);
      ws.send(JSON.stringify({ type: 'unsubscribed', agentId: ws.agentId }));
    }
  }

  /**
   * Subscribe WebSocket to memory updates
   */
  private subscribeToUpdates(ws: AuthenticatedWebSocket) {
    if (!ws.agentId) return;

    const subscription = this.visualizationService.subscribeToUpdates(
      ws.agentId,
      (update: MemoryUpdate) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'memory-update',
            data: update,
          }));
        }
      }
    );

    // Store subscription for cleanup
    (ws as any).subscription = subscription;
  }

  /**
   * Unsubscribe WebSocket from updates
   */
  private unsubscribeFromUpdates(ws: AuthenticatedWebSocket) {
    const subscription = (ws as any).subscription;
    if (subscription) {
      subscription.unsubscribe();
      delete (ws as any).subscription;
    }
  }

  /**
   * Setup heartbeat to detect dead connections
   */
  private setupHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws: WebSocket) => {
        const client = ws as AuthenticatedWebSocket;
        
        if (client.isAlive === false) {
          console.log('Terminating dead connection');
          this.unsubscribeFromUpdates(client);
          return client.terminate();
        }

        client.isAlive = false;
        client.ping();
      });
    }, 30000); // 30 seconds
  }

  /**
   * Broadcast update to all connected clients for an agent
   */
  broadcastUpdate(agentId: string, update: MemoryUpdate) {
    this.wss.clients.forEach((ws: WebSocket) => {
      const client = ws as AuthenticatedWebSocket;
      
      if (client.agentId === agentId && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'memory-update',
          data: update,
        }));
      }
    });
  }

  /**
   * Close WebSocket server
   */
  close() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.wss.clients.forEach((ws: WebSocket) => {
      const client = ws as AuthenticatedWebSocket;
      this.unsubscribeFromUpdates(client);
      ws.close();
    });

    this.wss.close();
  }
}
