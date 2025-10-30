import { EncryptedData, MasterKey } from './types';
import { EncryptionEngine } from './encryption-engine';
import { KeyDerivationService } from './key-derivation';

/**
 * Re-encryption Service
 * Handles re-encryption of data when ownership changes
 */
export class ReencryptionService {
  private encryptionEngine: EncryptionEngine;
  private keyDerivation: KeyDerivationService;

  constructor(config: any) {
    this.encryptionEngine = new EncryptionEngine(config);
    this.keyDerivation = new KeyDerivationService(config.keyDerivationIterations);
  }

  /**
   * Re-encrypt data for a new owner
   * Used when transferring memory assets
   */
  async reencryptForTransfer(
    encryptedData: EncryptedData,
    oldOwnerKey: Buffer,
    newOwnerKey: Buffer
  ): Promise<EncryptedData> {
    try {
      // Step 1: Decrypt with old owner's key
      const plaintext = await this.encryptionEngine.decrypt(encryptedData, oldOwnerKey);

      // Step 2: Encrypt with new owner's key
      const reencrypted = await this.encryptionEngine.encrypt(plaintext, newOwnerKey);

      console.log('Data re-encrypted for new owner');
      return reencrypted;
    } catch (error) {
      throw new Error(`Re-encryption failed: ${error.message}`);
    }
  }

  /**
   * Re-encrypt data with a new key (for key rotation)
   */
  async reencryptForKeyRotation(
    encryptedData: EncryptedData,
    oldKey: Buffer,
    newKey: Buffer
  ): Promise<EncryptedData> {
    try {
      // Decrypt with old key
      const plaintext = await this.encryptionEngine.decrypt(encryptedData, oldKey);

      // Encrypt with new key
      const reencrypted = await this.encryptionEngine.encrypt(plaintext, newKey);

      console.log('Data re-encrypted with new key');
      return reencrypted;
    } catch (error) {
      throw new Error(`Key rotation re-encryption failed: ${error.message}`);
    }
  }

  /**
   * Batch re-encrypt multiple items
   */
  async batchReencrypt(
    items: Array<{ data: EncryptedData; id: string }>,
    oldKey: Buffer,
    newKey: Buffer
  ): Promise<Array<{ data: EncryptedData; id: string }>> {
    const results: Array<{ data: EncryptedData; id: string }> = [];

    for (const item of items) {
      try {
        const reencrypted = await this.reencryptForKeyRotation(
          item.data,
          oldKey,
          newKey
        );
        results.push({ data: reencrypted, id: item.id });
      } catch (error) {
        console.error(`Failed to re-encrypt item ${item.id}:`, error);
        throw error;
      }
    }

    console.log(`Batch re-encrypted ${results.length} items`);
    return results;
  }

  /**
   * Verify new owner identity before re-encryption
   */
  async verifyNewOwner(
    newOwnerAddress: string,
    signature: Buffer,
    publicKey: Buffer
  ): boolean {
    try {
      const message = `Transfer ownership to ${newOwnerAddress}`;
      return this.keyDerivation.verifyWalletSignature(message, signature, publicKey);
    } catch (error) {
      console.error('Owner verification failed:', error);
      return false;
    }
  }

  /**
   * Securely delete old encrypted data after re-encryption
   */
  async secureDelete(encryptedData: EncryptedData): Promise<void> {
    // Overwrite sensitive data
    if (encryptedData.ciphertext) {
      encryptedData.ciphertext = '';
    }
    if (encryptedData.iv) {
      encryptedData.iv = '';
    }
    if (encryptedData.authTag) {
      encryptedData.authTag = '';
    }
    if (encryptedData.keyId) {
      encryptedData.keyId = '';
    }

    console.log('Old encrypted data securely deleted');
  }

  /**
   * Create re-encryption proof for audit trail
   */
  createReencryptionProof(
    oldOwner: string,
    newOwner: string,
    contentHash: string
  ): ReencryptionProof {
    return {
      oldOwner,
      newOwner,
      contentHash,
      timestamp: new Date(),
      proofHash: this.encryptionEngine.hashContent(
        `${oldOwner}${newOwner}${contentHash}${Date.now()}`
      ),
    };
  }

  /**
   * Verify re-encryption proof
   */
  verifyReencryptionProof(proof: ReencryptionProof): boolean {
    const expectedHash = this.encryptionEngine.hashContent(
      `${proof.oldOwner}${proof.newOwner}${proof.contentHash}${proof.timestamp.getTime()}`
    );
    return proof.proofHash === expectedHash;
  }
}

/**
 * Re-encryption proof for audit trail
 */
interface ReencryptionProof {
  oldOwner: string;
  newOwner: string;
  contentHash: string;
  timestamp: Date;
  proofHash: string;
}
