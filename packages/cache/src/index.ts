import Redis, { RedisOptions } from 'ioredis';

// Redis client singleton
let redisClient: Redis;

export interface CacheConfig {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
}

export function getRedisClient(config?: CacheConfig): Redis {
  if (!redisClient) {
    const options: RedisOptions = {
      host: config?.host || process.env.REDIS_HOST || 'localhost',
      port: config?.port || parseInt(process.env.REDIS_PORT || '6379'),
      password: config?.password || process.env.REDIS_PASSWORD || undefined,
      db: config?.db || 0,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    };

    redisClient = new Redis(options);

    redisClient.on('error', (err) => {
      console.error('Redis client error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Redis client connected');
    });
  }
  return redisClient;
}

// Close Redis connection
export async function closeRedisClient(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
  }
}

// Cache operations
export async function get<T = any>(key: string): Promise<T | null> {
  const client = getRedisClient();
  const value = await client.get(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return value as T;
  }
}

export async function set(key: string, value: any, ttlSeconds?: number): Promise<void> {
  const client = getRedisClient();
  const serialized = typeof value === 'string' ? value : JSON.stringify(value);
  if (ttlSeconds) {
    await client.setex(key, ttlSeconds, serialized);
  } else {
    await client.set(key, serialized);
  }
}

export async function del(key: string): Promise<void> {
  const client = getRedisClient();
  await client.del(key);
}

export async function exists(key: string): Promise<boolean> {
  const client = getRedisClient();
  const result = await client.exists(key);
  return result === 1;
}

export async function expire(key: string, seconds: number): Promise<void> {
  const client = getRedisClient();
  await client.expire(key, seconds);
}

export async function ttl(key: string): Promise<number> {
  const client = getRedisClient();
  return await client.ttl(key);
}

// List operations
export async function lpush(key: string, ...values: string[]): Promise<number> {
  const client = getRedisClient();
  return await client.lpush(key, ...values);
}

export async function rpush(key: string, ...values: string[]): Promise<number> {
  const client = getRedisClient();
  return await client.rpush(key, ...values);
}

export async function lpop(key: string): Promise<string | null> {
  const client = getRedisClient();
  return await client.lpop(key);
}

export async function rpop(key: string): Promise<string | null> {
  const client = getRedisClient();
  return await client.rpop(key);
}

export async function lrange(key: string, start: number, stop: number): Promise<string[]> {
  const client = getRedisClient();
  return await client.lrange(key, start, stop);
}

export async function llen(key: string): Promise<number> {
  const client = getRedisClient();
  return await client.llen(key);
}

export async function ltrim(key: string, start: number, stop: number): Promise<void> {
  const client = getRedisClient();
  await client.ltrim(key, start, stop);
}

// Hash operations
export async function hset(key: string, field: string, value: string): Promise<void> {
  const client = getRedisClient();
  await client.hset(key, field, value);
}

export async function hget(key: string, field: string): Promise<string | null> {
  const client = getRedisClient();
  return await client.hget(key, field);
}

export async function hgetall(key: string): Promise<Record<string, string>> {
  const client = getRedisClient();
  return await client.hgetall(key);
}

export async function hdel(key: string, ...fields: string[]): Promise<void> {
  const client = getRedisClient();
  await client.hdel(key, ...fields);
}

// Set operations
export async function sadd(key: string, ...members: string[]): Promise<number> {
  const client = getRedisClient();
  return await client.sadd(key, ...members);
}

export async function smembers(key: string): Promise<string[]> {
  const client = getRedisClient();
  return await client.smembers(key);
}

export async function sismember(key: string, member: string): Promise<boolean> {
  const client = getRedisClient();
  const result = await client.sismember(key, member);
  return result === 1;
}

export async function srem(key: string, ...members: string[]): Promise<number> {
  const client = getRedisClient();
  return await client.srem(key, ...members);
}

// Sorted set operations
export async function zadd(key: string, score: number, member: string): Promise<number> {
  const client = getRedisClient();
  return await client.zadd(key, score, member);
}

export async function zrange(key: string, start: number, stop: number): Promise<string[]> {
  const client = getRedisClient();
  return await client.zrange(key, start, stop);
}

export async function zrangebyscore(
  key: string,
  min: number | string,
  max: number | string
): Promise<string[]> {
  const client = getRedisClient();
  return await client.zrangebyscore(key, min, max);
}

export async function zrem(key: string, ...members: string[]): Promise<number> {
  const client = getRedisClient();
  return await client.zrem(key, ...members);
}

// Pattern matching
export async function keys(pattern: string): Promise<string[]> {
  const client = getRedisClient();
  return await client.keys(pattern);
}

export async function scan(
  cursor: string,
  pattern?: string,
  count?: number
): Promise<[string, string[]]> {
  const client = getRedisClient();
  if (pattern && count) {
    return await client.scan(cursor, 'MATCH', pattern, 'COUNT', count);
  } else if (pattern) {
    return await client.scan(cursor, 'MATCH', pattern);
  } else if (count) {
    return await client.scan(cursor, 'COUNT', count);
  }
  return await client.scan(cursor);
}

// Increment/Decrement
export async function incr(key: string): Promise<number> {
  const client = getRedisClient();
  return await client.incr(key);
}

export async function incrby(key: string, increment: number): Promise<number> {
  const client = getRedisClient();
  return await client.incrby(key, increment);
}

export async function decr(key: string): Promise<number> {
  const client = getRedisClient();
  return await client.decr(key);
}

export async function decrby(key: string, decrement: number): Promise<number> {
  const client = getRedisClient();
  return await client.decrby(key, decrement);
}

// Cache with TTL helper
export async function cacheWithTTL<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number = 3600
): Promise<T> {
  const cached = await get<T>(key);
  if (cached !== null) {
    return cached;
  }

  const value = await fetchFn();
  await set(key, value, ttlSeconds);
  return value;
}

// Health check
export async function checkCacheHealth(): Promise<boolean> {
  try {
    const client = getRedisClient();
    await client.ping();
    return true;
  } catch (error) {
    console.error('Cache health check failed:', error);
    return false;
  }
}

// Flush operations (use with caution)
export async function flushdb(): Promise<void> {
  const client = getRedisClient();
  await client.flushdb();
}

export async function flushall(): Promise<void> {
  const client = getRedisClient();
  await client.flushall();
}

export { Redis };
