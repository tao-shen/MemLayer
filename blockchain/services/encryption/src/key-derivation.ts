import crypto from 'crypto';
import { Keypair } from '@solana/web3.js';
import nacl from 'tweetnacl';
import { MasterKey, ContentKey, KeyDerivationParams } from './types';

/**
 * Key Derivation Service
 * Derives encryption keys from wallet signatures using PBKDF2
 */
export class KeyDerivationService {
  private readonly iterations: number;
  private readonly keyLength: number = 32; // 256 bits
  private readonly digest: string = 'sha256';

  constructor(iterations: number = 100000) {
    this.iterations = iterations;
  }

  /**
   * Generate master key from wallet signature
   * Uses PBKDF2 to derive a strong key from the signature
   */
  async generateMasterKey(
    walletAddress: string,
    signature: Buffer
  ): Promise<MasterKey> {
    try {
      // Use wallet address as salt
      const salt = Buffer.from(walletAddress);

      // Derive key using PBKDF2
      const key = await this.deriveKey(signature, salt, this.iterations);

      // Generate unique key ID
      const keyId = this.generateKeyId(walletAddress, key);

      return {
        keyId,
        key,
        createdAt: new Date(),
        walletAddress,
      };
    } catch (error) {
      throw new Error(`Failed to generate master key: ${error.message}`);
    }
  }

  /**
   * Derive content-specific key from master key
   */
  async deriveContentKey(
    masterKey: MasterKey,
    contentId: string
  ): Promise<ContentKey> {
    try {
      // Use content ID as additional entropy
      const salt = Buffer.from(contentId);

      // Derive content key from master key
      const key = await this.deriveKey(masterKey.key, salt, 10000);

      // Generate unique key ID
      const keyId = this.generateKeyId(contentId, key);

      return {
        keyId,
        key,
        contentId,
        masterKeyId: masterKey.keyId,
        createdAt: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to derive content key: ${error.message}`);
    }
  }

  /**
   * Derive key using PBKDF2
   */
  private async deriveKey(
    password: Buffer,
    salt: Buffer,
    iterations: number
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(
        password,
        salt,
        iterations,
        this.keyLength,
        this.digest,
        (err, derivedKey) => {
          if (err) reject(err);
          else resolve(derivedKey);
        }
      );
    });
  }

  /**
   * Generate unique key ID
   */
  private generateKeyId(identifier: string, key: Buffer): string {
    const hash = crypto
      .createHash('sha256')
      .update(identifier)
      .update(key)
      .digest('hex');
    return hash.substring(0, 16);
  }

  /**
   * Verify wallet signature
   * Used to authenticate key derivation requests
   */
  verifyWalletSignature(
    message: string,
    signature: Buffer,
    publicKey: Buffer
  ): boolean {
    try {
      const messageBytes = Buffer.from(message);
      return nacl.sign.detached.verify(messageBytes, signature, publicKey);
    } catch (error) {
      return false;
    }
  }

  /**
   * Create signature message for key derivation
   */
  createSignatureMessage(walletAddress: string, timestamp: number): string {
    return `Derive encryption key for wallet ${walletAddress} at ${timestamp}`;
  }

  /**
   * Derive key from Solana keypair (for testing)
   */
  async deriveKeyFromKeypair(keypair: Keypair): Promise<Buffer> {
    const signature = nacl.sign.detached(
      Buffer.from('key-derivation'),
      keypair.secretKey
    );
    return this.deriveKey(
      Buffer.from(signature),
      Buffer.from(keypair.publicKey.toBytes()),
      this.iterations
    );
  }

  /**
   * Rotate master key
   * Generates a new master key while maintaining the same wallet association
   */
  async rotateMasterKey(
    oldMasterKey: MasterKey,
    newSignature: Buffer
  ): Promise<MasterKey> {
    const newMasterKey = await this.generateMasterKey(
      oldMasterKey.walletAddress,
      newSignature
    );

    // Set expiration on old key
    oldMasterKey.expiresAt = new Date();

    return newMasterKey;
  }

  /**
   * Get key derivation parameters
   */
  getDerivationParams(): KeyDerivationParams {
    return {
      salt: Buffer.alloc(0), // Will be set per operation
      iterations: this.iterations,
      keyLength: this.keyLength,
      digest: this.digest,
    };
  }

  /**
   * Validate key strength
   */
  validateKeyStrength(key: Buffer): boolean {
    if (key.length !== this.keyLength) {
      return false;
    }

    // Check for all zeros (weak key)
    const allZeros = key.every((byte) => byte === 0);
    if (allZeros) {
      return false;
    }

    // Check for all same values (weak key)
    const firstByte = key[0];
    const allSame = key.every((byte) => byte === firstByte);
    if (allSame) {
      return false;
    }

    return true;
  }
}
