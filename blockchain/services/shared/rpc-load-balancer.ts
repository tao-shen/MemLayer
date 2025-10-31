/**
 * RPC Load Balancer
 * Manages multiple RPC endpoints with health checking and automatic failover
 */

import { EventEmitter } from 'events';
import { Connection } from '@solana/web3.js';

/**
 * RPC endpoint configuration
 */
interface RPCEndpoint {
  url: string;
  weight: number;
  priority: number;
}

/**
 * RPC endpoint health status
 */
interface RPCHealth {
  url: string;
  isHealthy: boolean;
  latency: number;
  lastCheck: Date;
  consecutiveFailures: number;
  successRate: number;
}

/**
 * Load balancer configuration
 */
interface LoadBalancerConfig {
  endpoints: RPCEndpoint[];
  healthCheckInterval: number;
  healthCheckTimeout: number;
  maxConsecutiveFailures: number;
  minSuccessRate: number;
}

/**
 * RPC Load Balancer Implementation
 */
export class RPCLoadBalancer extends EventEmitter {
  private endpoints: Map<string, RPCEndpoint> = new Map();
  private healthStatus: Map<string, RPCHealth> = new Map();
  private connections: Map<string, Connection> = new Map();
  private healthCheckTimer?: NodeJS.Timeout;
  private requestCounts: Map<string, number> = new Map();

  constructor(private config: LoadBalancerConfig) {
    super();

    // Initialize endpoints
    for (const endpoint of config.endpoints) {
      this.endpoints.set(endpoint.url, endpoint);
      this.healthStatus.set(endpoint.url, {
        url: endpoint.url,
        isHealthy: true,
        latency: 0,
        lastCheck: new Date(),
        consecutiveFailures: 0,
        successRate: 1.0,
      });
      this.requestCounts.set(endpoint.url, 0);
    }

    // Start health checks
    this.startHealthChecks();

    console.log('RPC Load Balancer initialized', {
      endpoints: config.endpoints.length,
    });
  }

  /**
   * Get connection using load balancing
   */
  getConnection(): Connection {
    const endpoint = this.selectEndpoint();
    
    if (!endpoint) {
      throw new Error('No healthy RPC endpoints available');
    }

    // Get or create connection
    let connection = this.connections.get(endpoint.url);
    if (!connection) {
      connection = new Connection(endpoint.url, 'confirmed');
      this.connections.set(endpoint.url, connection);
    }

    // Increment request count
    const count = this.requestCounts.get(endpoint.url) || 0;
    this.requestCounts.set(endpoint.url, count + 1);

    return connection;
  }

  /**
   * Get specific endpoint connection
   */
  getConnectionByUrl(url: string): Connection | null {
    const health = this.healthStatus.get(url);
    if (!health || !health.isHealthy) {
      return null;
    }

    let connection = this.connections.get(url);
    if (!connection) {
      connection = new Connection(url, 'confirmed');
      this.connections.set(url, connection);
    }

    return connection;
  }

  /**
   * Report request success
   */
  reportSuccess(url: string): void {
    const health = this.healthStatus.get(url);
    if (!health) return;

    health.consecutiveFailures = 0;
    health.successRate = Math.min(1.0, health.successRate + 0.01);
    
    this.healthStatus.set(url, health);
  }

  /**
   * Report request failure
   */
  reportFailure(url: string): void {
    const health = this.healthStatus.get(url);
    if (!health) return;

    health.consecutiveFailures++;
    health.successRate = Math.max(0, health.successRate - 0.05);

    // Mark as unhealthy if too many failures
    if (health.consecutiveFailures >= this.config.maxConsecutiveFailures) {
      health.isHealthy = false;
      this.emit('endpoint:unhealthy', { url });
      console.warn('RPC endpoint marked unhealthy', { url });
    }

    this.healthStatus.set(url, health);
  }

  /**
   * Get health statistics
   */
  getHealthStats(): {
    total: number;
    healthy: number;
    unhealthy: number;
    avgLatency: number;
    avgSuccessRate: number;
  } {
    const healthArray = Array.from(this.healthStatus.values());
    const healthy = healthArray.filter(h => h.isHealthy);

    return {
      total: healthArray.length,
      healthy: healthy.length,
      unhealthy: healthArray.length - healthy.length,
      avgLatency: healthy.reduce((sum, h) => sum + h.latency, 0) / (healthy.length || 1),
      avgSuccessRate: healthy.reduce((sum, h) => sum + h.successRate, 0) / (healthy.length || 1),
    };
  }

  /**
   * Get endpoint statistics
   */
  getEndpointStats(): Array<{
    url: string;
    isHealthy: boolean;
    latency: number;
    successRate: number;
    requestCount: number;
  }> {
    return Array.from(this.healthStatus.values()).map(health => ({
      url: health.url,
      isHealthy: health.isHealthy,
      latency: health.latency,
      successRate: health.successRate,
      requestCount: this.requestCounts.get(health.url) || 0,
    }));
  }

  /**
   * Select endpoint using weighted round-robin
   */
  private selectEndpoint(): RPCEndpoint | null {
    const healthyEndpoints = Array.from(this.endpoints.values())
      .filter(endpoint => {
        const health = this.healthStatus.get(endpoint.url);
        return health && health.isHealthy;
      })
      .sort((a, b) => b.priority - a.priority);

    if (healthyEndpoints.length === 0) {
      return null;
    }

    // Select based on weight and latency
    const weights = healthyEndpoints.map(endpoint => {
      const health = this.healthStatus.get(endpoint.url)!;
      const latencyFactor = 1 / (health.latency + 1);
      const successFactor = health.successRate;
      return endpoint.weight * latencyFactor * successFactor;
    });

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < healthyEndpoints.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return healthyEndpoints[i];
      }
    }

    return healthyEndpoints[0];
  }

  /**
   * Start health checks
   */
  private startHealthChecks(): void {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthChecks().catch(error => {
        console.error('Health check error', { error: error.message });
      });
    }, this.config.healthCheckInterval);

    // Perform initial health check
    this.performHealthChecks().catch(error => {
      console.error('Initial health check error', { error: error.message });
    });
  }

  /**
   * Perform health checks on all endpoints
   */
  private async performHealthChecks(): Promise<void> {
    const checks = Array.from(this.endpoints.keys()).map(url =>
      this.checkEndpointHealth(url)
    );

    await Promise.allSettled(checks);
  }

  /**
   * Check health of single endpoint
   */
  private async checkEndpointHealth(url: string): Promise<void> {
    const health = this.healthStatus.get(url);
    if (!health) return;

    const startTime = Date.now();

    try {
      const connection = new Connection(url, 'confirmed');
      
      // Test with getVersion call
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Health check timeout')), this.config.healthCheckTimeout)
      );

      await Promise.race([
        connection.getVersion(),
        timeoutPromise,
      ]);

      const latency = Date.now() - startTime;

      // Update health status
      health.isHealthy = true;
      health.latency = latency;
      health.lastCheck = new Date();
      health.consecutiveFailures = 0;

      // Gradually improve success rate
      if (health.successRate < this.config.minSuccessRate) {
        health.successRate = Math.min(1.0, health.successRate + 0.1);
      }

      this.healthStatus.set(url, health);

      this.emit('endpoint:healthy', { url, latency });
    } catch (error) {
      health.consecutiveFailures++;
      health.lastCheck = new Date();

      if (health.consecutiveFailures >= this.config.maxConsecutiveFailures) {
        health.isHealthy = false;
        this.emit('endpoint:unhealthy', { url, error: error.message });
      }

      this.healthStatus.set(url, health);
    }
  }

  /**
   * Add endpoint
   */
  addEndpoint(endpoint: RPCEndpoint): void {
    this.endpoints.set(endpoint.url, endpoint);
    this.healthStatus.set(endpoint.url, {
      url: endpoint.url,
      isHealthy: true,
      latency: 0,
      lastCheck: new Date(),
      consecutiveFailures: 0,
      successRate: 1.0,
    });
    this.requestCounts.set(endpoint.url, 0);

    console.log('Added RPC endpoint', { url: endpoint.url });
    this.emit('endpoint:added', { url: endpoint.url });
  }

  /**
   * Remove endpoint
   */
  removeEndpoint(url: string): void {
    this.endpoints.delete(url);
    this.healthStatus.delete(url);
    this.connections.delete(url);
    this.requestCounts.delete(url);

    console.log('Removed RPC endpoint', { url });
    this.emit('endpoint:removed', { url });
  }

  /**
   * Shutdown
   */
  shutdown(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    this.connections.clear();
    console.log('RPC Load Balancer shutdown complete');
  }
}
