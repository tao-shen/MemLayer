import crypto from 'crypto';
import { EncryptedData, EncryptionConfig } from './types';

/**
 * Encryption Engine using AES-256-GCM
 * Provides secure encryption and decryption for memory content
 */
export class EncryptionEngine {
  private algorithm: string = 'aes-256-gcm';
  private ivLength: number = 12; // 12 bytes for GCM
  private authTagLength: number = 16; // 16 bytes auth tag
  private keyLength: number = 32; // 256 bits

  constructor(private config: EncryptionConfig) {}

  /**
   * Encrypt content using AES-256-GCM
   */
  async encrypt(content: string, key: Buffer): Promise<EncryptedData> {
    try {
      // Validate key length
      if (key.length !== this.keyLength) {
        throw new Error(`Invalid key length. Expected ${this.keyLength} bytes, got ${key.length}`);
      }

      // Generate random IV
      const iv = crypto.randomBytes(this.ivLength);

      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, key, iv, {
        authTagLength: this.authTagLength,
      });

      // Encrypt content
      let ciphertext = cipher.update(content, 'utf8', 'base64');
      ciphertext += cipher.final('base64');

      // Get auth tag
      const authTag = cipher.getAuthTag();

      return {
        ciphertext,
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64'),
        algorithm: 'AES-256-GCM',
        keyId: '', // Will be set by key management service
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt content using AES-256-GCM
   */
  async decrypt(encryptedData: EncryptedData, key: Buffer): Promise<string> {
    try {
      // Validate key length
      if (key.length !== this.keyLength) {
        throw new Error(`Invalid key length. Expected ${this.keyLength} bytes, got ${key.length}`);
      }

      // Validate algorithm
      if (encryptedData.algorithm !== 'AES-256-GCM') {
        throw new Error(`Unsupported algorithm: ${encryptedData.algorithm}`);
      }

      // Parse IV and auth tag
      const iv = Buffer.from(encryptedData.iv, 'base64');
      const authTag = Buffer.from(encryptedData.authTag, 'base64');

      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv, {
        authTagLength: this.authTagLength,
      });

      // Set auth tag
      decipher.setAuthTag(authTag);

      // Decrypt content
      let plaintext = decipher.update(encryptedData.ciphertext, 'base64', 'utf8');
      plaintext += decipher.final('utf8');

      return plaintext;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Encrypt buffer data
   */
  async encryptBuffer(data: Buffer, key: Buffer): Promise<EncryptedData> {
    const base64Content = data.toString('base64');
    return this.encrypt(base64Content, key);
  }

  /**
   * Decrypt to buffer
   */
  async decryptToBuffer(encryptedData: EncryptedData, key: Buffer): Promise<Buffer> {
    const base64Content = await this.decrypt(encryptedData, key);
    return Buffer.from(base64Content, 'base64');
  }

  /**
   * Generate random encryption key
   */
  generateKey(): Buffer {
    return crypto.randomBytes(this.keyLength);
  }

  /**
   * Validate encrypted data structure
   */
  validateEncryptedData(data: any): data is EncryptedData {
    return (
      typeof data === 'object' &&
      typeof data.ciphertext === 'string' &&
      typeof data.iv === 'string' &&
      typeof data.authTag === 'string' &&
      typeof data.algorithm === 'string' &&
      data.algorithm === 'AES-256-GCM'
    );
  }

  /**
   * Hash content for integrity verification
   */
  hashContent(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Verify content hash
   */
  verifyContentHash(content: string, expectedHash: string): boolean {
    const actualHash = this.hashContent(content);
    return actualHash === expectedHash;
  }
}
