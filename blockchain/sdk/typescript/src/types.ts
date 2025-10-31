import { PublicKey } from '@solana/web3.js';

export interface MemoryInput {
  content: string;
  metadata?: Record<string, any>;
  agentId: string;
}

export interface MintOptions {
  priority?: 'low' | 'medium' | 'high';
  batch?: boolean;
}

export interface MintResult {
  assetId: string;
  arweaveId: string;
  transactionSignature: string;
  cost: number;
  timestamp: Date;
}

export interface BatchMintResult {
  batchId: string;
  assetIds: string[];
  totalCost: number;
  successCount: number;
  failedCount: number;
}

export interface MemoryAsset {
  assetId: string;
  owner: string;
  arweaveId: string;
  version: number;
  batchId?: string;
  contentHash: string;
  encryptionKeyId: string;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
}

export interface AccessGrant {
  grantee: string;
  permissions: string[];
  expiresAt?: Date;
  maxAccess?: number;
  currentAccess: number;
}

export interface AccessPolicy {
  owner: string;
  grants: AccessGrant[];
  defaultPolicy: 'allow' | 'deny';
}

export interface TransferRecord {
  id: number;
  assetId: string;
  fromAddress: string;
  toAddress: string;
  transactionSignature: string;
  transferredAt: Date;
}

export interface BatchInfo {
  batchId: string;
  ownerAddress: string;
  memoryCount: number;
  totalSizeBytes: number;
  merkleTreeAddress: string;
  transactionSignature: string;
  totalCostLamports: number;
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: Date;
  confirmedAt?: Date;
}

export interface CostEstimate {
  solanaCost: number;
  arweaveCost: number;
  totalCost: number;
  totalCostUSD?: number;
}

export interface SDKConfig {
  apiEndpoint: string;
  network?: 'mainnet-beta' | 'devnet' | 'testnet';
  rpcEndpoint?: string;
}

export interface WalletAdapter {
  publicKey: PublicKey | null;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
  signTransaction?: (transaction: any) => Promise<any>;
}
