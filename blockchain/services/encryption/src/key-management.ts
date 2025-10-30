import crypto from 'crypto';
import { MasterKey, ContentKey, EncryptionConfig } from './types';

/**
 * Key Management Service
 * Manages secure storage and retrieval of encryption keys
 */
export class KeyManagementService {
  private keyStore: Map<string, Buffer> = new Map();
  private keyMetadata: Map<string, KeyMetadata> = new Map();

  constructor(private config: EncryptionConfig) {}

  /**
   * Store encrypted key securely
   */
  async storeKey(keyId: string, key: Buffer, metadata?: Partial<KeyMetadata>): Promise<void> {
    try {
      // Encrypt key before storage (using a master encryption key)
      const encryptedKey = this.encryptKeyForStorage(key);
      
      this.keyStore.set(keyId, encryptedKey);
      this.keyMetadata.set(keyId, {
        keyId,
        createdAt: new Date(),
        lastAccessedAt: new Date(),
        accessCount: 0,
        ...metadata,
      });

      console.log(`Key stored: ${keyId}`);
    } catch (error) {
      throw new Error(`Failed to store key: ${error.message}`);
    }
  }

  /**
   * Retrieve key from secure storage
   */
  async retrieveKey(keyId: string): Promise<Buffer> {
    try {
      const encryptedKey = this.keyStore.get(keyId);
      
      if (!encryptedKey) {
        throw new Error(`Key not found: ${keyId}`);
      }

      // Update access metadata
      const metadata = this.keyMetadata.get(keyId);
      if (metadata) {
        metadata.lastAccessedAt = new Date();
        metadata.accessCount++;
      }

      // Decrypt key
      return this.decryptKeyFromStorage(encryptedKey);
    } catch (error) {
      throw new Error(`Failed to retrieve key: ${error.message}`);
    }
  }

  /**
   * Delete key from storage
   */
  async deleteKey(keyId: string): Promise<void> {
    try {
      // Securely wipe key from memory
      const key = this.keyStore.get(keyId);
      if (key) {
        key.fill(0); // Overwrite with zeros
      }

      this.keyStore.delete(keyId);
      this.keyMetadata.delete(keyId);

      console.log(`Key deleted: ${keyId}`);
    } catch (error) {
      throw new Error(`Failed to delete key: ${error.message}`);
    }
  }

  /**
   * Rotate keys for a wallet
   */
  async rotateKeys(walletAddress: string): Promise<void> {
    try {
      // Find all keys for this wallet
      const keysToRotate: string[] = [];
      
      for (const [keyId, metadata] of this.keyMetadata.entries()) {
        if (metadata.walletAddress === walletAddress) {
          keysToRotate.push(keyId);
        }
      }

      console.log(`Rotating ${keysToRotate.length} keys for wallet: ${walletAddress}`);

      // Mark old keys as expired
      for (const keyId of keysToRotate) {
        const metadata = this.keyMetadata.get(keyId);
        if (metadata) {
          metadata.expiresAt = new Date();
          metadata.rotated = true;
        }
      }

      // New keys will be generated on next access
    } catch (error) {
      throw new Error(`Failed to rotate keys: ${error.message}`);
    }
  }

  /**
   * Check if key exists
   */
  hasKey(keyId: string): boolean {
    return this.keyStore.has(keyId);
  }

  /**
   * Get key metadata
   */
  getKeyMetadata(keyId: string): KeyMetadata | undefined {
    return this.keyMetadata.get(keyId);
  }

  /**
   * List all keys for a wallet
   */
  listKeysForWallet(walletAddress: string): KeyMetadata[] {
    const keys: KeyMetadata[] = [];
    
    for (const metadata of this.keyMetadata.values()) {
      if (metadata.walletAddress === walletAddress) {
        keys.push(metadata);
      }
    }

    return keys;
  }

  /**
   * Clean up expired keys
   */
  async cleanupExpiredKeys(): Promise<number> {
    let deletedCount = 0;
    const now = new Date();

    for (const [keyId, metadata] of this.keyMetadata.entries()) {
      if (metadata.expiresAt && metadata.expiresAt < now) {
        await this.deleteKey(keyId);
        deletedCount++;
      }
    }

    console.log(`Cleaned up ${deletedCount} expired keys`);
    return deletedCount;
  }

  /**
   * Get storage statistics
   */
  getStatistics(): KeyStorageStats {
    const stats: KeyStorageStats = {
      totalKeys: this.keyStore.size,
      activeKeys: 0,
      expiredKeys: 0,
      rotatedKeys: 0,
      totalAccessCount: 0,
    };

    const now = new Date();

    for (const metadata of this.keyMetadata.values()) {
      stats.totalAccessCount += metadata.accessCount;

      if (metadata.expiresAt && metadata.expiresAt < now) {
        stats.expiredKeys++;
      } else if (metadata.rotated) {
        stats.rotatedKeys++;
      } else {
        stats.activeKeys++;
      }
    }

    return stats;
  }

  /**
   * Encrypt key for storage (using master encryption key)
   */
  private encryptKeyForStorage(key: Buffer): Buffer {
    // In production, use a proper KMS or HSM
    // For now, use a simple encryption with a master key
    const masterKey = this.getMasterEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', masterKey, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(key),
      cipher.final(),
    ]);

    // Prepend IV to encrypted data
    return Buffer.concat([iv, encrypted]);
  }

  /**
   * Decrypt key from storage
   */
  private decryptKeyFromStorage(encryptedKey: Buffer): Buffer {
    const masterKey = this.getMasterEncryptionKey();
    const iv = encryptedKey.slice(0, 16);
    const encrypted = encryptedKey.slice(16);
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', masterKey, iv);
    
    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
  }

  /**
   * Get master encryption key (should be from secure storage in production)
   */
  private getMasterEncryptionKey(): Buffer {
    // In production, retrieve from environment variable or KMS
    const keyString = process.env.MASTER_ENCRYPTION_KEY || 'default-master-key-change-in-production';
    return crypto.scryptSync(keyString, 'salt', 32);
  }

  /**
   * Export keys for backup (encrypted)
   */
  async exportKeys(walletAddress: string): Promise<EncryptedKeyBackup> {
    const keys = this.listKeysForWallet(walletAddress);
    const keyData: Array<{ keyId: string; key: string }> = [];

    for (const metadata of keys) {
      const key = await this.retrieveKey(metadata.keyId);
      keyData.push({
        keyId: metadata.keyId,
        key: key.toString('base64'),
      });
    }

    // Encrypt backup
    const backupData = JSON.stringify(keyData);
    const encrypted = this.encryptKeyForStorage(Buffer.from(backupData));

    return {
      walletAddress,
      encryptedData: encrypted.toString('base64'),
      timestamp: new Date(),
      keyCount: keyData.length,
    };
  }

  /**
   * Import keys from backup
   */
  async importKeys(backup: EncryptedKeyBackup): Promise<number> {
    try {
      const encrypted = Buffer.from(backup.encryptedData, 'base64');
      const decrypted = this.decryptKeyFromStorage(encrypted);
      const keyData = JSON.parse(decrypted.toString());

      let importedCount = 0;

      for (const item of keyData) {
        const key = Buffer.from(item.key, 'base64');
        await this.storeKey(item.keyId, key, {
          walletAddress: backup.walletAddress,
        });
        importedCount++;
      }

      console.log(`Imported ${importedCount} keys for wallet: ${backup.walletAddress}`);
      return importedCount;
    } catch (error) {
      throw new Error(`Failed to import keys: ${error.message}`);
    }
  }
}

/**
 * Key metadata interface
 */
interface KeyMetadata {
  keyId: string;
  createdAt: Date;
  lastAccessedAt: Date;
  accessCount: number;
  expiresAt?: Date;
  rotated?: boolean;
  walletAddress?: string;
}

/**
 * Key storage statistics
 */
interface KeyStorageStats {
  totalKeys: number;
  activeKeys: number;
  expiredKeys: number;
  rotatedKeys: number;
  totalAccessCount: number;
}

/**
 * Encrypted key backup
 */
interface EncryptedKeyBackup {
  walletAddress: string;
  encryptedData: string;
  timestamp: Date;
  keyCount: number;
}
