import OpenAI from 'openai';

export interface EmbeddingConfig {
  apiKey: string;
  model?: string;
  dimension?: number;
  timeout?: number;
  maxRetries?: number;
}

export class EmbeddingClient {
  private openai: OpenAI;
  private model: string;
  private dimension: number;

  constructor(config: EmbeddingConfig) {
    this.openai = new OpenAI({
      apiKey: config.apiKey,
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
    });
    this.model = config.model || 'text-embedding-3-small';
    this.dimension = config.dimension || 1536;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: this.model,
      input: text,
      dimensions: this.dimension,
    });
    return response.data[0].embedding;
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const response = await this.openai.embeddings.create({
      model: this.model,
      input: texts,
      dimensions: this.dimension,
    });
    return response.data.map((item) => item.embedding);
  }

  getDimension(): number {
    return this.dimension;
  }
}

let embeddingClient: EmbeddingClient | null = null;

export function getEmbeddingClient(): EmbeddingClient {
  if (!embeddingClient) {
    embeddingClient = new EmbeddingClient({
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
      dimension: parseInt(process.env.EMBEDDING_DIMENSION || '1536'),
      timeout: parseInt(process.env.EMBEDDING_TIMEOUT || '30000'),
      maxRetries: parseInt(process.env.EMBEDDING_MAX_RETRIES || '3'),
    });
  }
  return embeddingClient;
}
