/**
 * Encrypted data structure
 */
export interface EncryptedData {
  ciphertext: string;
  iv: string;
  authTag: string;
  keyId: string;
  algorithm: 'AES-256-GCM';
}

/**
 * Encryption configuration
 */
export interface EncryptionConfig {
  algorithm?: string;
  keyDerivationIterations?: number;
  keyRotationEnabled?: boolean;
  keyRotationIntervalDays?: number;
}

/**
 * Master key structure
 */
export interface MasterKey {
  keyId: string;
  key: Buffer;
  createdAt: Date;
  expiresAt?: Date;
  walletAddress: string;
}

/**
 * Content key structure
 */
export interface ContentKey {
  keyId: string;
  key: Buffer;
  contentId: string;
  masterKeyId: string;
  createdAt: Date;
}

/**
 * Key derivation parameters
 */
export interface KeyDerivationParams {
  salt: Buffer;
  iterations: number;
  keyLength: number;
  digest: string;
}

/**
 * Encryption result with metadata
 */
export interface EncryptionResult {
  encrypted: EncryptedData;
  contentHash: string;
  size: number;
  timestamp: Date;
}

/**
 * Decryption result with metadata
 */
export interface DecryptionResult {
  content: string;
  contentHash: string;
  verified: boolean;
  timestamp: Date;
}
