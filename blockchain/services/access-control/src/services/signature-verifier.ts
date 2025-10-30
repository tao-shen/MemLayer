/**
 * Signature Verifier
 * Verifies Solana wallet signatures for authentication
 */

import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { randomBytes } from 'crypto';
import Redis from 'ioredis';
import {
  SignatureVerificationRequest,
  SignatureVerificationResult,
  Challenge,
  AccessControlConfig,
} from '../types';

/**
 * Signature Verifier Implementation
 */
export class SignatureVerifier {
  private redis: Redis;
  private challengeTTL: number;
  private nonceLength: number;
  private challengePrefix = 'challenge:';

  constructor(private config: AccessControlConfig) {
    this.redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
    });

    this.challengeTTL = config.challenge.ttl;
    this.nonceLength = config.challenge.nonceLength;
  }

  /**
   * Verify Ed25519 signature
   */
  async verifySignature(
    request: SignatureVerificationRequest
  ): Promise<SignatureVerificationResult> {
    try {
      // Decode public key
      const publicKey = new PublicKey(request.publicKey);
      const publicKeyBytes = publicKey.toBytes();

      // Decode signature
      const signatureBytes = bs58.decode(request.signature);

      // Encode message
      const messageBytes = new TextEncoder().encode(request.message);

      // Verify signature
      const valid = nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKeyBytes
      );

      if (!valid) {
        return {
          valid: false,
          error: 'Invalid signature',
        };
      }

      return {
        valid: true,
        publicKey: request.publicKey,
      };
    } catch (error) {
      return {
        valid: false,
        error: `Signature verification failed: ${error.message}`,
      };
    }
  }

  /**
   * Generate challenge for wallet authentication
   */
  async generateChallenge(walletAddress: string): Promise<Challenge> {
    try {
      // Generate random nonce
      const nonce = randomBytes(this.nonceLength).toString('hex');

      // Create challenge message
      const timestamp = Date.now();
      const expiresAt = timestamp + this.challengeTTL * 1000;

      const message = this.buildChallengeMessage(walletAddress, nonce, timestamp);

      const challenge: Challenge = {
        message,
        nonce,
        timestamp,
        expiresAt,
      };

      // Store challenge in Redis
      const key = this.getChallengeKey(walletAddress, nonce);
      await this.redis.setex(key, this.challengeTTL, JSON.stringify(challenge));

      return challenge;
    } catch (error) {
      throw new Error(`Failed to generate challenge: ${error.message}`);
    }
  }

  /**
   * Verify challenge response
   */
  async verifyChallenge(
    walletAddress: string,
    nonce: string,
    signature: string
  ): Promise<boolean> {
    try {
      // Retrieve challenge from Redis
      const key = this.getChallengeKey(walletAddress, nonce);
      const challengeData = await this.redis.get(key);

      if (!challengeData) {
        throw new Error('Challenge not found or expired');
      }

      const challenge: Challenge = JSON.parse(challengeData);

      // Check if challenge has expired
      if (Date.now() > challenge.expiresAt) {
        await this.redis.del(key);
        throw new Error('Challenge expired');
      }

      // Verify signature
      const result = await this.verifySignature({
        message: challenge.message,
        signature,
        publicKey: walletAddress,
      });

      if (!result.valid) {
        throw new Error(result.error || 'Invalid signature');
      }

      // Delete challenge after successful verification (one-time use)
      await this.redis.del(key);

      return true;
    } catch (error) {
      throw new Error(`Challenge verification failed: ${error.message}`);
    }
  }

  /**
   * Verify message with timestamp (anti-replay)
   */
  async verifyMessageWithTimestamp(
    message: string,
    signature: string,
    publicKey: string,
    maxAge: number = 300 // 5 minutes default
  ): Promise<SignatureVerificationResult> {
    try {
      // Verify signature first
      const result = await this.verifySignature({
        message,
        signature,
        publicKey,
      });

      if (!result.valid) {
        return result;
      }

      // Extract timestamp from message
      const timestamp = this.extractTimestamp(message);

      if (!timestamp) {
        return {
          valid: false,
          error: 'Message does not contain valid timestamp',
        };
      }

      // Check if message is too old (replay attack prevention)
      const age = (Date.now() - timestamp) / 1000;

      if (age > maxAge) {
        return {
          valid: false,
          error: `Message too old: ${age}s (max: ${maxAge}s)`,
        };
      }

      if (age < -60) {
        // Allow 1 minute clock skew
        return {
          valid: false,
          error: 'Message timestamp is in the future',
        };
      }

      // Check if nonce has been used (prevent replay)
      const nonce = this.extractNonce(message);
      if (nonce) {
        const nonceKey = `nonce:${publicKey}:${nonce}`;
        const exists = await this.redis.exists(nonceKey);

        if (exists) {
          return {
            valid: false,
            error: 'Nonce already used (replay attack detected)',
          };
        }

        // Store nonce with TTL
        await this.redis.setex(nonceKey, maxAge * 2, '1');
      }

      return {
        valid: true,
        publicKey,
      };
    } catch (error) {
      return {
        valid: false,
        error: `Verification failed: ${error.message}`,
      };
    }
  }

  /**
   * Build challenge message
   */
  private buildChallengeMessage(
    walletAddress: string,
    nonce: string,
    timestamp: number
  ): string {
    return `Sign this message to authenticate with Memory Platform\n\nWallet: ${walletAddress}\nNonce: ${nonce}\nTimestamp: ${timestamp}`;
  }

  /**
   * Extract timestamp from message
   */
  private extractTimestamp(message: string): number | null {
    const match = message.match(/timestamp[:\s]+(\d+)/i);
    return match ? parseInt(match[1], 10) : null;
  }

  /**
   * Extract nonce from message
   */
  private extractNonce(message: string): string | null {
    const match = message.match(/nonce[:\s]+([a-f0-9]+)/i);
    return match ? match[1] : null;
  }

  /**
   * Get challenge key for Redis
   */
  private getChallengeKey(walletAddress: string, nonce: string): string {
    return `${this.challengePrefix}${walletAddress}:${nonce}`;
  }

  /**
   * Validate Solana public key format
   */
  validatePublicKey(publicKey: string): boolean {
    try {
      new PublicKey(publicKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate signature format
   */
  validateSignature(signature: string): boolean {
    try {
      const decoded = bs58.decode(signature);
      return decoded.length === 64; // Ed25519 signature is 64 bytes
    } catch {
      return false;
    }
  }

  /**
   * Clean up expired challenges
   */
  async cleanupExpiredChallenges(): Promise<number> {
    try {
      const pattern = `${this.challengePrefix}*`;
      const keys = await this.redis.keys(pattern);

      let cleaned = 0;

      for (const key of keys) {
        const ttl = await this.redis.ttl(key);
        if (ttl <= 0) {
          await this.redis.del(key);
          cleaned++;
        }
      }

      return cleaned;
    } catch (error) {
      throw new Error(`Failed to cleanup challenges: ${error.message}`);
    }
  }

  /**
   * Get challenge statistics
   */
  async getChallengeStats(): Promise<{
    active: number;
    total: number;
  }> {
    try {
      const pattern = `${this.challengePrefix}*`;
      const keys = await this.redis.keys(pattern);

      return {
        active: keys.length,
        total: keys.length,
      };
    } catch (error) {
      throw new Error(`Failed to get challenge stats: ${error.message}`);
    }
  }

  /**
   * Shutdown verifier
   */
  async shutdown(): Promise<void> {
    await this.redis.quit();
  }
}
