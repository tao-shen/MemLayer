import { QdrantClient } from '@qdrant/js-client-rest';

// Collection names
export const COLLECTIONS = {
  EPISODIC_MEMORIES: 'episodic_memories',
  SEMANTIC_MEMORIES: 'semantic_memories',
  REFLECTIONS: 'reflections',
} as const;

// Qdrant client singleton
let qdrantClient: QdrantClient;

export interface QdrantConfig {
  host?: string;
  port?: number;
  apiKey?: string;
}

export function getQdrantClient(config?: QdrantConfig): QdrantClient {
  if (!qdrantClient) {
    const host = config?.host || process.env.QDRANT_HOST || 'localhost';
    const port = config?.port || parseInt(process.env.QDRANT_PORT || '6333');
    const apiKey = config?.apiKey || process.env.QDRANT_API_KEY;

    qdrantClient = new QdrantClient({
      url: `http://${host}:${port}`,
      apiKey: apiKey || undefined,
    });
  }
  return qdrantClient;
}

// Initialize collections
export async function initializeCollections(dimension: number = 1536): Promise<void> {
  const client = getQdrantClient();

  // Create episodic memories collection
  try {
    await client.getCollection(COLLECTIONS.EPISODIC_MEMORIES);
  } catch {
    await client.createCollection(COLLECTIONS.EPISODIC_MEMORIES, {
      vectors: {
        size: dimension,
        distance: 'Cosine',
      },
      optimizers_config: {
        default_segment_number: 2,
      },
      replication_factor: 1,
    });
    console.log(`Created collection: ${COLLECTIONS.EPISODIC_MEMORIES}`);
  }

  // Create semantic memories collection
  try {
    await client.getCollection(COLLECTIONS.SEMANTIC_MEMORIES);
  } catch {
    await client.createCollection(COLLECTIONS.SEMANTIC_MEMORIES, {
      vectors: {
        size: dimension,
        distance: 'Cosine',
      },
      optimizers_config: {
        default_segment_number: 2,
      },
      replication_factor: 1,
    });
    console.log(`Created collection: ${COLLECTIONS.SEMANTIC_MEMORIES}`);
  }

  // Create reflections collection
  try {
    await client.getCollection(COLLECTIONS.REFLECTIONS);
  } catch {
    await client.createCollection(COLLECTIONS.REFLECTIONS, {
      vectors: {
        size: dimension,
        distance: 'Cosine',
      },
      optimizers_config: {
        default_segment_number: 2,
      },
      replication_factor: 1,
    });
    console.log(`Created collection: ${COLLECTIONS.REFLECTIONS}`);
  }
}

// Vector search interface
export interface VectorSearchParams {
  collection: string;
  vector: number[];
  limit?: number;
  filter?: Record<string, any>;
  scoreThreshold?: number;
}

export interface VectorSearchResult {
  id: string;
  score: number;
  payload: Record<string, any>;
}

export async function vectorSearch(params: VectorSearchParams): Promise<VectorSearchResult[]> {
  const client = getQdrantClient();
  const { collection, vector, limit = 10, filter, scoreThreshold } = params;

  const searchResult = await client.search(collection, {
    vector,
    limit,
    filter: filter as any,
    score_threshold: scoreThreshold,
    with_payload: true,
  });

  return searchResult.map((result) => ({
    id: result.id.toString(),
    score: result.score,
    payload: result.payload as Record<string, any>,
  }));
}

// Upsert vector
export interface VectorUpsertParams {
  collection: string;
  id: string;
  vector: number[];
  payload: Record<string, any>;
}

export async function upsertVector(params: VectorUpsertParams): Promise<void> {
  const client = getQdrantClient();
  const { collection, id, vector, payload } = params;

  await client.upsert(collection, {
    wait: true,
    points: [
      {
        id,
        vector,
        payload,
      },
    ],
  });
}

// Batch upsert vectors
export async function batchUpsertVectors(
  collection: string,
  points: Array<{ id: string; vector: number[]; payload: Record<string, any> }>
): Promise<void> {
  const client = getQdrantClient();

  await client.upsert(collection, {
    wait: true,
    points,
  });
}

// Delete vector
export async function deleteVector(collection: string, id: string): Promise<void> {
  const client = getQdrantClient();

  await client.delete(collection, {
    wait: true,
    points: [id],
  });
}

// Delete vectors by filter
export async function deleteVectorsByFilter(
  collection: string,
  filter: Record<string, any>
): Promise<void> {
  const client = getQdrantClient();

  await client.delete(collection, {
    wait: true,
    filter: filter as any,
  });
}

// Get collection info
export async function getCollectionInfo(collection: string) {
  const client = getQdrantClient();
  return await client.getCollection(collection);
}

// Health check
export async function checkVectorDbHealth(): Promise<boolean> {
  try {
    const client = getQdrantClient();
    await client.getCollections();
    return true;
  } catch (error) {
    console.error('Vector DB health check failed:', error);
    return false;
  }
}

export { QdrantClient };
