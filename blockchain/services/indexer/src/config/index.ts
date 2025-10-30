import dotenv from 'dotenv';
import { Connection, clusterApiUrl } from '@solana/web3.js';

dotenv.config();

export interface IndexerConfig {
  helius: {
    apiKey: string;
    rpcUrl: string;
  };
  solana: {
    network: 'mainnet-beta' | 'devnet' | 'testnet';
    programId: string;
    connection: Connection;
  };
  database: {
    url: string;
  };
  redis: {
    url: string;
  };
  indexer: {
    startSlot: number;
    batchSize: number;
    pollInterval: number;
    maxRetries: number;
  };
  cache: {
    ttlSeconds: number;
    maxSize: number;
  };
  logging: {
    level: string;
  };
}

function getHeliusRpcUrl(): string {
  const apiKey = process.env.HELIUS_API_KEY;
  if (!apiKey) {
    throw new Error('HELIUS_API_KEY is required');
  }

  const network = process.env.SOLANA_NETWORK || 'devnet';
  
  if (network === 'mainnet-beta') {
    return `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;
  } else if (network === 'devnet') {
    return `https://devnet.helius-rpc.com/?api-key=${apiKey}`;
  } else {
    return clusterApiUrl(network as any);
  }
}

function createConnection(): Connection {
  const rpcUrl = getHeliusRpcUrl();
  
  return new Connection(rpcUrl, {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 60000,
    wsEndpoint: rpcUrl.replace('https://', 'wss://').replace('http://', 'ws://'),
  });
}

export const config: IndexerConfig = {
  helius: {
    apiKey: process.env.HELIUS_API_KEY || '',
    rpcUrl: getHeliusRpcUrl(),
  },
  solana: {
    network: (process.env.SOLANA_NETWORK as any) || 'devnet',
    programId: process.env.MEMORY_ASSET_PROGRAM_ID || '',
    connection: createConnection(),
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/memory_platform',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  indexer: {
    startSlot: parseInt(process.env.INDEXER_START_SLOT || '0'),
    batchSize: parseInt(process.env.INDEXER_BATCH_SIZE || '100'),
    pollInterval: parseInt(process.env.INDEXER_POLL_INTERVAL || '1000'),
    maxRetries: parseInt(process.env.INDEXER_MAX_RETRIES || '3'),
  },
  cache: {
    ttlSeconds: parseInt(process.env.CACHE_TTL_SECONDS || '60'),
    maxSize: parseInt(process.env.CACHE_MAX_SIZE || '10000'),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

// Validate required configuration
export function validateConfig(): void {
  if (!config.helius.apiKey) {
    throw new Error('HELIUS_API_KEY is required');
  }
  
  if (!config.solana.programId) {
    throw new Error('MEMORY_ASSET_PROGRAM_ID is required');
  }
  
  if (!config.database.url) {
    throw new Error('DATABASE_URL is required');
  }
}

// Connection pool management
export class ConnectionPool {
  private connections: Connection[] = [];
  private currentIndex = 0;
  private readonly poolSize: number;

  constructor(poolSize: number = 3) {
    this.poolSize = poolSize;
    this.initializePool();
  }

  private initializePool(): void {
    for (let i = 0; i < this.poolSize; i++) {
      this.connections.push(createConnection());
    }
  }

  getConnection(): Connection {
    const connection = this.connections[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.poolSize;
    return connection;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const connection = this.getConnection();
      await connection.getSlot();
      return true;
    } catch (error) {
      return false;
    }
  }

  async close(): Promise<void> {
    // Connections don't need explicit closing in @solana/web3.js
    this.connections = [];
  }
}

export const connectionPool = new ConnectionPool();
