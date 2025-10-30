import { PublicKey } from '@solana/web3.js';

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

export interface TransferRecord {
  id: number;
  assetId: string;
  fromAddress: string;
  toAddress: string;
  transactionSignature: string;
  transferredAt: Date;
}

export interface AccessGrant {
  id: number;
  assetId: string;
  granteeAddress: string;
  permissions: string[];
  expiresAt?: Date;
  maxAccess?: number;
  currentAccess: number;
  createdAt: Date;
  revokedAt?: Date;
}

export interface MemoryFilter {
  agentId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface SyncStatus {
  currentSlot: number;
  latestSlot: number;
  syncLag: number;
  isRunning: boolean;
  lastSyncTime: Date;
  eventsProcessed: number;
  errorsCount: number;
}

// Event types from Solana program
export enum EventType {
  MEMORY_MINTED = 'MemoryMinted',
  MEMORY_TRANSFERRED = 'MemoryTransferred',
  ACCESS_POLICY_UPDATED = 'AccessPolicyUpdated',
  VERSION_CREATED = 'VersionCreated',
  BATCH_CREATED = 'BatchCreated',
}

export interface ProgramEvent {
  type: EventType;
  data: any;
  slot: number;
  signature: string;
  timestamp: Date;
}

export interface MemoryMintedEvent {
  assetId: string;
  owner: PublicKey;
  arweaveId: string;
  batchId?: string;
  merkleTree: PublicKey;
  leafIndex: number;
  contentHash: Buffer;
}

export interface MemoryTransferredEvent {
  assetId: string;
  fromOwner: PublicKey;
  toOwner: PublicKey;
  merkleTree: PublicKey;
}

export interface AccessPolicyUpdatedEvent {
  owner: PublicKey;
  grantee: PublicKey;
  permissions: number;
  expiresAt?: number;
  maxAccess?: number;
}

export interface VersionCreatedEvent {
  assetId: string;
  owner: PublicKey;
  version: number;
  arweaveId: string;
  contentHash: Buffer;
}

export interface BatchCreatedEvent {
  batchId: string;
  owner: PublicKey;
  memoryCount: number;
  merkleTree: PublicKey;
}
