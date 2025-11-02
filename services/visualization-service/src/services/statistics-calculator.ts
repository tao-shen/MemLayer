import {
  AggregatedMemory,
  Statistics,
  TypeDistribution,
  TimeDistribution,
  ImportanceDistribution,
  AccessFrequency,
  StatisticsSummary,
  TimeGranularity,
} from '../types';

export class StatisticsCalculator {
  /**
   * Calculate complete statistics for memories
   */
  calculateStatistics(
    memories: AggregatedMemory[],
    timeGranularity: TimeGranularity = 'day'
  ): Statistics {
    return {
      typeDistribution: this.calculateTypeDistribution(memories),
      timeDistribution: this.calculateTimeDistribution(memories, timeGranularity),
      importanceDistribution: this.calculateImportanceDistribution(memories),
      accessFrequency: this.calculateAccessFrequency(memories),
      summary: this.calculateSummary(memories),
    };
  }

  /**
   * Calculate type distribution
   */
  calculateTypeDistribution(memories: AggregatedMemory[]): TypeDistribution {
    const distribution: TypeDistribution = {
      stm: 0,
      episodic: 0,
      semantic: 0,
      reflection: 0,
    };

    memories.forEach(memory => {
      if (distribution[memory.type] !== undefined) {
        distribution[memory.type]++;
      }
    });

    return distribution;
  }

  /**
   * Calculate time distribution
   */
  calculateTimeDistribution(
    memories: AggregatedMemory[],
    granularity: TimeGranularity
  ): TimeDistribution {
    // Group memories by time buckets
    const buckets = new Map<string, AggregatedMemory[]>();

    memories.forEach(memory => {
      const bucketKey = this.getTimeBucket(memory.timestamp, granularity);
      if (!buckets.has(bucketKey)) {
        buckets.set(bucketKey, []);
      }
      buckets.get(bucketKey)!.push(memory);
    });

    // Convert to time distribution format
    const data = Array.from(buckets.entries())
      .map(([bucketKey, bucketMemories]) => {
        const typeDistribution = this.calculateTypeDistribution(bucketMemories);
        
        return {
          timestamp: this.parseBucketKey(bucketKey, granularity),
          count: bucketMemories.length,
          byType: typeDistribution,
        };
      })
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return {
      granularity,
      data,
    };
  }

  /**
   * Get time bucket key for a timestamp
   */
  private getTimeBucket(timestamp: Date, granularity: TimeGranularity): string {
    const date = new Date(timestamp);
    
    switch (granularity) {
      case 'hour':
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}`;
      case 'day':
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      case 'week':
        const weekNumber = this.getWeekNumber(date);
        return `${date.getFullYear()}-W${weekNumber}`;
      case 'month':
        return `${date.getFullYear()}-${date.getMonth() + 1}`;
      default:
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    }
  }

  /**
   * Parse bucket key back to timestamp
   */
  private parseBucketKey(bucketKey: string, granularity: TimeGranularity): Date {
    const parts = bucketKey.split('-');
    
    switch (granularity) {
      case 'hour':
        return new Date(
          parseInt(parts[0]),
          parseInt(parts[1]) - 1,
          parseInt(parts[2]),
          parseInt(parts[3])
        );
      case 'day':
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      case 'week':
        const year = parseInt(parts[0]);
        const week = parseInt(parts[1].substring(1));
        return this.getDateFromWeek(year, week);
      case 'month':
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
      default:
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
  }

  /**
   * Get week number of year
   */
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  /**
   * Get date from week number
   */
  private getDateFromWeek(year: number, week: number): Date {
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = simple;
    if (dow <= 4) {
      ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    } else {
      ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    }
    return ISOweekStart;
  }

  /**
   * Calculate importance distribution
   */
  calculateImportanceDistribution(memories: AggregatedMemory[]): ImportanceDistribution {
    const ranges = [
      { min: 1, max: 3, count: 0 },
      { min: 4, max: 6, count: 0 },
      { min: 7, max: 10, count: 0 },
    ];

    memories.forEach(memory => {
      if (memory.importance !== undefined) {
        const range = ranges.find(r => memory.importance! >= r.min && memory.importance! <= r.max);
        if (range) {
          range.count++;
        }
      }
    });

    return { ranges };
  }

  /**
   * Calculate access frequency statistics
   */
  calculateAccessFrequency(memories: AggregatedMemory[]): AccessFrequency {
    // Filter episodic memories with access count
    const episodicMemories = memories.filter(
      m => m.type === 'episodic' && m.accessCount !== undefined
    );

    if (episodicMemories.length === 0) {
      return {
        topAccessed: [],
        averageAccessCount: 0,
      };
    }

    // Sort by access count
    const sorted = [...episodicMemories].sort((a, b) => (b.accessCount || 0) - (a.accessCount || 0));

    // Get top 10
    const topAccessed = sorted.slice(0, 10).map(m => ({
      memoryId: m.id,
      accessCount: m.accessCount || 0,
    }));

    // Calculate average
    const totalAccess = episodicMemories.reduce((sum, m) => sum + (m.accessCount || 0), 0);
    const averageAccessCount = totalAccess / episodicMemories.length;

    return {
      topAccessed,
      averageAccessCount,
    };
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(memories: AggregatedMemory[]): StatisticsSummary {
    const typeDistribution = this.calculateTypeDistribution(memories);

    // Calculate average importance
    const memoriesWithImportance = memories.filter(m => m.importance !== undefined);
    const averageImportance = memoriesWithImportance.length > 0
      ? memoriesWithImportance.reduce((sum, m) => sum + (m.importance || 0), 0) / memoriesWithImportance.length
      : 0;

    // Find oldest and newest
    const timestamps = memories.map(m => m.timestamp.getTime());
    const oldestMemory = timestamps.length > 0 ? new Date(Math.min(...timestamps)) : null;
    const newestMemory = timestamps.length > 0 ? new Date(Math.max(...timestamps)) : null;

    return {
      totalMemories: memories.length,
      byType: typeDistribution,
      averageImportance,
      oldestMemory,
      newestMemory,
    };
  }
}
