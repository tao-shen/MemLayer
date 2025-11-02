/**
 * 区块链模块核心类型定义
 */

// ============ 配置类型 ============

export interface BlockchainConfig {
  enabled: boolean;
  chains: ChainConfigs;
  assetTypes: AssetTypeConfigs;
  storage: StorageConfig;
  encryption: EncryptionConfig;
  indexer: IndexerConfig;
  accessControl: AccessControlConfig;
}

export interface ChainConfigs {
  solana?: SolanaConfig;
  ethereum?: EthereumConfig;
  polygon?: PolygonConfig;
  custom?: CustomChainConfig[];
}

export interface SolanaConfig {
  enabled: boolean;
  network: 'mainnet-beta' | 'devnet' | 'testnet' | 'localnet';
  rpcUrl?: string;
  programId?: string;
  features: {
    compressedNFT: boolean;
    metaplex: boolean;
    customProgram: boolean;
  };
  batchConfig?: BatchConfig;
}

export interface EthereumConfig {
  enabled: boolean;
  network: 'mainnet' | 'goerli' | 'sepolia' | 'localhost';
  rpcUrl?: string;
  contractAddress?: string;
  features: {
    erc721: boolean;
    erc1155: boolean;
    erc4907: boolean;
  };
}

export interface PolygonConfig {
  enabled: boolean;
  network: 'mainnet' | 'mumbai' | 'localhost';
  rpcUrl?: string;
  contractAddress?: string;
  features: {
    erc721: boolean;
    erc1155: boolean;
  };
}

export interface CustomChainConfig {
  id: string;
  name: string;
  enabled: boolean;
  adapterPath: string;
  config: Record<string, any>;
}

export interface BatchConfig {
  enabled: boolean;
  minSize: number;
  maxSize: number;
  timeout: number;
}

export interface AssetTypeConfigs {
  memory?: MemoryAssetConfig;
  conversation?: ConversationAssetConfig;
  knowledge?: KnowledgeAssetConfig;
  reflection?: ReflectionAssetConfig;
  custom?: CustomAssetConfig[];
}

export interface MemoryAssetConfig {
  enabled: boolean;
  chain: string;
  mintingRules: {
    automatic: boolean;
    minImportance?: number;
    requireReflection?: boolean;
    userApproval?: boolean;
  };
  metadata: {
    includeContent: boolean;
    includeEmbedding: boolean;
    includeContext: boolean;
    customFields?: string[];
  };
  privacy: {
    encryptContent: boolean;
    encryptMetadata: boolean;
    publicMetadata?: string[];
  };
}

export interface ConversationAssetConfig {
  enabled: boolean;
  chain: string;
  mintingRules: {
    automatic: boolean;
    minTurns?: number;
    minDuration?: number;
    requireSummary?: boolean;
  };
  metadata: {
    includeMessages: boolean;
    includeParticipants: boolean;
    includeSummary: boolean;
  };
  privacy: {
    encryptContent: boolean;
    anonymizeParticipants?: boolean;
  };
}

export interface KnowledgeAssetConfig {
  enabled: boolean;
  chain: string;
  mintingRules: {
    automatic: boolean;
    minNodes?: number;
    minEdges?: number;
    requireValidation?: boolean;
  };
  metadata: {
    includeGraph: boolean;
    includeEmbeddings: boolean;
    format: 'json' | 'rdf' | 'graphml';
  };
  privacy: {
    encryptContent: boolean;
  };
}

export interface ReflectionAssetConfig {
  enabled: boolean;
  chain: string;
  mintingRules: {
    automatic: boolean;
    minInsightScore?: number;
  };
  metadata: {
    includeSourceMemories: boolean;
    includeReasoningChain: boolean;
  };
  privacy: {
    encryptContent: boolean;
  };
}

export interface CustomAssetConfig {
  id: string;
  name: string;
  enabled: boolean;
  chain: string;
  handlerPath: string;
  config: Record<string, any>;
}

export interface StorageConfig {
  provider: 'arweave' | 'ipfs' | 'filecoin' | 's3' | 'custom';
  config: Record<string, any>;
}

export interface EncryptionConfig {
  enabled: boolean;
  algorithm: 'aes-256-gcm' | 'chacha20-poly1305';
  keyDerivation: 'pbkdf2' | 'argon2' | 'scrypt';
}

export interface IndexerConfig {
  enabled: boolean;
  realtime: boolean;
  cacheProvider: 'redis' | 'memory';
}

export interface AccessControlConfig {
  enabled: boolean;
  defaultPolicy: 'private' | 'public' | 'restricted';
}

// ============ 操作参数类型 ============

export interface MintAssetParams {
  assetType: string;
  chain?: string;
  data: any;
  metadata?: Record<string, any>;
  options?: MintOptions;
  signature?: string;
}

export interface MintOptions {
  encrypt?: boolean;
  storage?: string;
  batch?: boolean;
  priority?: 'low' | 'normal' | 'high';
  force?: boolean;
}

export interface MintBatchParams {
  items: MintAssetParams[];
  continueOnError?: boolean;
}

export interface QueryParams {
  chain: string;
  owner?: string;
  assetType?: string;
  filters?: Record<string, any>;
  limit?: number;
  offset?: number;
}

export interface TransferParams {
  chain: string;
  assetId: string;
  from: string;
  to: string;
  signature: string;
}

export interface AccessParams {
  chain: string;
  assetId: string;
  grantee: string;
  permissions: string[];
  expiresAt?: string;
  signature: string;
}

// ============ 结果类型 ============

export interface MintResult {
  success: boolean;
  assetId?: string;
  transactionId?: string;
  chain?: string;
  storageUri?: string;
  cost?: CostInfo;
  error?: string;
  skipped?: boolean;
}

export interface BatchMintResult {
  success: boolean;
  results: MintResult[];
  errors: Array<{ index: number; error: string }>;
  total: number;
  successful: number;
  failed: number;
}

export interface TransferResult {
  success: boolean;
  transactionId: string;
  error?: string;
}

export interface AccessResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export interface CostInfo {
  amount: number;
  currency: string;
  breakdown?: Record<string, number>;
}

export interface HealthStatus {
  enabled: boolean;
  healthy: boolean;
  chains: Record<string, boolean>;
  storage: Record<string, boolean>;
  timestamp: string;
}

// ============ 资产类型 ============

export interface Asset {
  id: string;
  assetType: string;
  chain: string;
  owner: string;
  storageUri: string;
  metadata: AssetMetadata;
  createdAt: string;
  updatedAt?: string;
}

export interface AssetMetadata {
  name: string;
  description: string;
  image?: string;
  attributes: AssetAttribute[];
  properties?: Record<string, any>;
}

export interface AssetAttribute {
  trait_type: string;
  value: string | number;
  display_type?: string;
}

// ============ 验证类型 ============

export interface ValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
}

// ============ 链操作类型 ============

export interface ChainMintParams {
  assetType: string;
  storageUri: string;
  metadata: AssetMetadata;
  signature?: string;
  options?: MintOptions;
}

export interface ChainMintResult {
  assetId: string;
  transactionId: string;
  cost?: CostInfo;
}

export interface ChainQueryParams {
  owner?: string;
  assetType?: string;
  filters?: Record<string, any>;
  limit?: number;
  offset?: number;
}

export interface ChainAsset {
  id: string;
  owner: string;
  storageUri: string;
  metadata: any;
  createdAt: number;
}

export interface ChainTransferParams {
  assetId: string;
  from: string;
  to: string;
  signature: string;
}

export interface ChainTransferResult {
  transactionId: string;
}

export interface ChainAccessParams {
  assetId: string;
  grantee: string;
  permissions: string[];
  expiresAt?: number;
  signature: string;
}

export interface FeeEstimate {
  amount: number;
  currency: string;
  gasLimit?: number;
  gasPrice?: number;
}

// ============ 存储类型 ============

export interface UploadResult {
  uri: string;
  size: number;
  cost?: CostInfo;
}

export interface UploadItem {
  data: Buffer;
  metadata?: any;
}

export interface BatchUploadResult {
  results: UploadResult[];
  totalSize: number;
  totalCost?: CostInfo;
}

export interface CostEstimate {
  amount: number;
  currency: string;
}
