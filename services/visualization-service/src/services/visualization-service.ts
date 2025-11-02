import { createClient, RedisClientType } from 'redis';
import { EventEmitter } from 'events';
import {
  VisualizationQuery,
  VisualizationData,
  TimelineQuery,
  TimelineData,
  GraphQuery,
  MemoryGraph,
  StatisticsOptions,
  Statistics,
  UpdateCallback,
  Subscription,
  MemoryUpdate,
  Milestone,
  TimelineMemory,
  GraphOptions,
} from '../types';
import { DataAggregator } from './data-aggregator';
import { GraphBuilder } from './graph-builder';
import { StatisticsCalculator } from './statistics-calculator';

export class VisualizationService extends EventEmitter {
  private dataAggregator: DataAggregator;
  private graphBuilder: GraphBuilder;
  private statisticsCalculator: StatisticsCalculator;
  private redisClient: RedisClientType | null = null;
  private cacheEnabled: boolean;
  private cacheTTL: number = 300; // 5 minutes

  constructor(memoryServiceUrl?: string, enableCache: boolean = true) {
    super();
    this.dataAggregator = new DataAggregator(memoryServiceUrl);
    this.graphBuilder = new GraphBuilder();
    this.statisticsCalculator = new StatisticsCalculator();
    this.cacheEnabled = enableCache;

    if (enableCache) {
      this.initializeRedis();
    }
  }

  /**
   * Initialize Redis client for caching
   */
  private async initializeRedis() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      this.redisClient = createClient({ url: redisUrl });
      
      this.redisClient.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.cacheEnabled = false;
      });

      await this.redisClient.connect();
      console.log('Redis connected for visualization caching');
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      this.cacheEnabled = false;
    }
  }

  /**
   * Get visualization data with optional relationships and similarities
   */
  async getVisualizationData(query: VisualizationQuery): Promise<VisualizationData> {
    const cacheKey = this.getCacheKey('viz-data', query);

    // Try cache first
    if (this.cacheEnabled && this.redisClient) {
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Aggregate memories
    const memories = await this.dataAggregator.aggregateMemories(query.agentId, query.filters);

    const data: VisualizationData = {
      memories,
      metadata: {
        totalCount: memories.length,
        filteredCount: memories.length,
        appliedFilters: query.filters || {},
      },
    };

    // Optionally include relationships
    if (query.includeRelationships) {
      const memoryIds = memories.map(m => m.id);
      data.relationships = await this.dataAggregator.getMemoryRelationships(memoryIds);
    }

    // Optionally include similarities
    if (query.includeSimilarities) {
      const memoryIds = memories.map(m => m.id);
      const threshold = query.similarityThreshold || 0.7;
      data.similarities = await this.dataAggregator.calculateSimilarities(memoryIds, threshold);
    }

    // Cache the result
    if (this.cacheEnabled && this.redisClient) {
      await this.setCache(cacheKey, data);
    }

    return data;
  }

  /**
   * Get timeline data
   */
  async getTimelineData(query: TimelineQuery): Promise<TimelineData> {
    const cacheKey = this.getCacheKey('timeline', query);

    // Try cache first
    if (this.cacheEnabled && this.redisClient) {
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Get memories
    const memories = await this.dataAggregator.aggregateMemories(query.agentId, query.filters);

    // Sort by timestamp
    memories.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Calculate time range
    const timestamps = memories.map(m => m.timestamp.getTime());
    const timeRange = {
      start: timestamps.length > 0 ? new Date(Math.min(...timestamps)) : new Date(),
      end: timestamps.length > 0 ? new Date(Math.max(...timestamps)) : new Date(),
    };

    // Calculate positions for timeline
    const timelineMemories: TimelineMemory[] = memories.map((memory, index) => {
      const totalTime = timeRange.end.getTime() - timeRange.start.getTime();
      const memoryTime = memory.timestamp.getTime() - timeRange.start.getTime();
      const x = totalTime > 0 ? (memoryTime / totalTime) * 1000 : 500; // Normalize to 0-1000

      // Stagger y positions to avoid overlap
      const y = (index % 5) * 30;

      return {
        ...memory,
        x,
        y,
      };
    });

    // Identify milestones (high importance memories)
    const milestones: Milestone[] = [];
    if (query.includeMilestones) {
      const highImportanceMemories = memories.filter(m => (m.importance || 0) >= 8);
      
      // Group by day
      const milestoneGroups = new Map<string, typeof memories>();
      highImportanceMemories.forEach(memory => {
        const dateKey = memory.timestamp.toISOString().split('T')[0];
        if (!milestoneGroups.has(dateKey)) {
          milestoneGroups.set(dateKey, []);
        }
        milestoneGroups.get(dateKey)!.push(memory);
      });

      milestoneGroups.forEach((groupMemories, dateKey) => {
        milestones.push({
          timestamp: new Date(dateKey),
          label: `${groupMemories.length} important event(s)`,
          memoryIds: groupMemories.map(m => m.id),
        });
      });
    }

    const timelineData: TimelineData = {
      memories: timelineMemories,
      timeRange,
      milestones,
    };

    // Cache the result
    if (this.cacheEnabled && this.redisClient) {
      await this.setCache(cacheKey, timelineData);
    }

    return timelineData;
  }

  /**
   * Get graph data
   */
  async getGraphData(query: GraphQuery): Promise<MemoryGraph> {
    const cacheKey = this.getCacheKey('graph', query);

    // Try cache first
    if (this.cacheEnabled && this.redisClient) {
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Get memories
    const memories = await this.dataAggregator.aggregateMemories(query.agentId, query.filters);
    const memoryIds = memories.map(m => m.id);

    // Get relationships
    const relationships = await this.dataAggregator.getMemoryRelationships(memoryIds);

    // Build graph options
    const graphOptions: GraphOptions = {
      layout: query.layout || 'force-directed',
      width: 1200,
      height: 800,
      includeSimilarityEdges: query.showSimilarityEdges || false,
      similarityThreshold: query.similarityThreshold || 0.7,
    };

    // Build graph
    let graph = await this.graphBuilder.buildGraph(memories, graphOptions, relationships);

    // Add similarity edges if requested
    if (query.showSimilarityEdges) {
      const similarities = await this.dataAggregator.calculateSimilarities(
        memoryIds,
        query.similarityThreshold || 0.7
      );
      graph = await this.graphBuilder.addSimilarityEdges(graph, similarities);
    }

    // Cache the result
    if (this.cacheEnabled && this.redisClient) {
      await this.setCache(cacheKey, graph);
    }

    return graph;
  }

  /**
   * Get statistics
   */
  async getStatistics(agentId: string, options: StatisticsOptions = {}): Promise<Statistics> {
    const cacheKey = this.getCacheKey('stats', { agentId, ...options });

    // Try cache first
    if (this.cacheEnabled && this.redisClient) {
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Get all memories
    const memories = await this.dataAggregator.aggregateMemories(agentId);

    // Calculate statistics
    const statistics = this.statisticsCalculator.calculateStatistics(
      memories,
      options.timeGranularity || 'day'
    );

    // Cache the result
    if (this.cacheEnabled && this.redisClient) {
      await this.setCache(cacheKey, statistics);
    }

    return statistics;
  }

  /**
   * Subscribe to real-time memory updates
   */
  subscribeToUpdates(agentId: string, callback: UpdateCallback): Subscription {
    const listener = (update: MemoryUpdate) => {
      if (update.memory.agentId === agentId) {
        callback(update);
      }
    };

    this.on('memory-update', listener);

    return {
      unsubscribe: () => {
        this.off('memory-update', listener);
      },
    };
  }

  /**
   * Emit memory update (called by external event listener)
   */
  emitMemoryUpdate(update: MemoryUpdate) {
    this.emit('memory-update', update);
    
    // Invalidate cache for this agent
    if (this.cacheEnabled && this.redisClient) {
      this.invalidateCache(update.memory.agentId);
    }
  }

  /**
   * Generate cache key
   */
  private getCacheKey(prefix: string, data: any): string {
    const hash = JSON.stringify(data);
    return `viz:${prefix}:${Buffer.from(hash).toString('base64').substring(0, 32)}`;
  }

  /**
   * Get data from cache
   */
  private async getFromCache(key: string): Promise<any | null> {
    try {
      if (!this.redisClient) return null;
      
      const cached = await this.redisClient.get(key);
      if (cached) {
        return JSON.parse(cached, this.dateReviver);
      }
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set data in cache
   */
  private async setCache(key: string, data: any): Promise<void> {
    try {
      if (!this.redisClient) return;
      
      await this.redisClient.setEx(key, this.cacheTTL, JSON.stringify(data));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Invalidate cache for an agent
   */
  private async invalidateCache(agentId: string): Promise<void> {
    try {
      if (!this.redisClient) return;
      
      // Delete all keys matching the agent pattern
      const pattern = `viz:*:*${agentId}*`;
      const keys = await this.redisClient.keys(pattern);
      
      if (keys.length > 0) {
        await this.redisClient.del(keys);
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  /**
   * Date reviver for JSON.parse
   */
  private dateReviver(key: string, value: any): any {
    if (typeof value === 'string') {
      const datePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
      if (datePattern.test(value)) {
        return new Date(value);
      }
    }
    return value;
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }
}
