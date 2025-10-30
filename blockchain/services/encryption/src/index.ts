/**
 * Encryption Service
 * Main entry point for encryption functionality
 */

export { EncryptionEngine } from './encryption-engine';
export { KeyDerivationService } from './key-derivation';
export { KeyManagementService } from './key-management';
export { ReencryptionService } from './reencryption';

export * from './types';

// Re-export for convenience
import { EncryptionEngine } from './encryption-engine';
import { KeyDerivationService } from './key-derivation';
import { KeyManagementService } from './key-management';
import { ReencryptionService } from './reencryption';
import { EncryptionConfig } from './types';

/**
 * Complete Encryption Service
 * Combines all encryption functionality
 */
export class EncryptionService {
  public engine: EncryptionEngine;
  public keyDerivation: KeyDerivationService;
  public keyManagement: KeyManagementService;
  public reencryption: ReencryptionService;

  constructor(config: EncryptionConfig) {
    this.engine = new EncryptionEngine(config);
    this.keyDerivation = new KeyDerivationService(config.keyDerivationIterations);
    this.keyManagement = new KeyManagementService(config);
    this.reencryption = new ReencryptionService(config);
  }

  /**
   * Initialize encryption service
   */
  async initialize(): Promise<void> {
    console.log('Encryption service initialized');
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    // Clean up expired keys
    await this.keyManagement.cleanupExpiredKeys();
    console.log('Encryption service shutdown');
  }

  /**
   * Get service statistics
   */
  getStatistics() {
    return {
      keyManagement: this.keyManagement.getStatistics(),
    };
  }
}
