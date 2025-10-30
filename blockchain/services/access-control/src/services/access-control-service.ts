/**
 * Access Control Service
 * Main service for managing access control
 */

import { SignatureVerifier } from './signature-verifier';
import { PolicyManager } from './policy-manager';
import { AuditLogger } from './audit-logger';
import {
  AccessCheckRequest,
  AccessCheckResult,
  GrantAccessRequest,
  RevokeAccessRequest,
  AccessControlConfig,
  Permission,
} from '../types';

/**
 * Access Control Service Implementation
 */
export class AccessControlService {
  private signatureVerifier: SignatureVerifier;
  private policyManager: PolicyManager;
  private auditLogger: AuditLogger;

  constructor(private config: AccessControlConfig) {
    this.signatureVerifier = new SignatureVerifier(config);
    this.policyManager = new PolicyManager(config);
    this.auditLogger = new AuditLogger(config);
  }

  /**
   * Check if user has access to asset
   */
  async checkAccess(request: AccessCheckRequest): Promise<AccessCheckResult> {
    try {
      // Verify signature
      const verificationResult = await this.signatureVerifier.verifyMessageWithTimestamp(
        this.buildAccessMessage(request.assetId, request.permission),
        request.signature,
        request.walletAddress
      );

      if (!verificationResult.valid) {
        await this.auditLogger.logAccessAttempt({
          walletAddress: request.walletAddress,
          assetId: request.assetId,
          permission: request.permission,
          allowed: false,
          reason: verificationResult.error,
        });

        return {
          allowed: false,
          reason: `Signature verification failed: ${verificationResult.error}`,
        };
      }

      // Get policy
      const policy = await this.policyManager.getAccessPolicy(request.assetId);

      if (!policy) {
        await this.auditLogger.logAccessAttempt({
          walletAddress: request.walletAddress,
          assetId: request.assetId,
          permission: request.permission,
          allowed: false,
          reason: 'Policy not found',
        });

        return {
          allowed: false,
          reason: 'Access policy not found for asset',
        };
      }

      // Check permission
      const hasPermission = await this.policyManager.hasPermission(
        request.assetId,
        request.walletAddress,
        request.permission
      );

      if (!hasPermission) {
        await this.auditLogger.logAccessAttempt({
          walletAddress: request.walletAddress,
          assetId: request.assetId,
          permission: request.permission,
          allowed: false,
          reason: 'Permission denied',
        });

        return {
          allowed: false,
          reason: 'Permission denied',
          policy,
        };
      }

      // Increment access count if not owner
      if (policy.owner !== request.walletAddress) {
        await this.policyManager.incrementAccessCount(
          request.assetId,
          request.walletAddress
        );
      }

      // Log successful access
      await this.auditLogger.logAccessAttempt({
        walletAddress: request.walletAddress,
        assetId: request.assetId,
        permission: request.permission,
        allowed: true,
      });

      return {
        allowed: true,
        policy,
      };
    } catch (error) {
      await this.auditLogger.logAccessAttempt({
        walletAddress: request.walletAddress,
        assetId: request.assetId,
        permission: request.permission,
        allowed: false,
        reason: error.message,
      });

      throw new Error(`Access check failed: ${error.message}`);
    }
  }

  /**
   * Grant access to user
   */
  async grantAccess(
    request: GrantAccessRequest,
    grantor: string,
    signature: string
  ): Promise<void> {
    try {
      // Verify grantor signature
      const verificationResult = await this.signatureVerifier.verifyMessageWithTimestamp(
        this.buildGrantMessage(request.assetId, request.grantee, request.permissions),
        signature,
        grantor
      );

      if (!verificationResult.valid) {
        throw new Error(`Signature verification failed: ${verificationResult.error}`);
      }

      // Get policy
      const policy = await this.policyManager.getAccessPolicy(request.assetId);

      if (!policy) {
        throw new Error('Access policy not found for asset');
      }

      // Verify grantor is owner
      if (policy.owner !== grantor) {
        throw new Error('Only asset owner can grant access');
      }

      // Grant access
      await this.policyManager.grantAccess(
        request.assetId,
        request.grantee,
        request.permissions,
        {
          expiresAt: request.expiresAt,
          maxAccess: request.maxAccess,
        }
      );

      // Log grant
      await this.auditLogger.logAccessGrant({
        walletAddress: grantor,
        assetId: request.assetId,
        grantee: request.grantee,
        permissions: request.permissions,
        expiresAt: request.expiresAt,
        maxAccess: request.maxAccess,
      });
    } catch (error) {
      throw new Error(`Failed to grant access: ${error.message}`);
    }
  }

  /**
   * Revoke access from user
   */
  async revokeAccess(
    request: RevokeAccessRequest,
    revoker: string,
    signature: string
  ): Promise<void> {
    try {
      // Verify revoker signature
      const verificationResult = await this.signatureVerifier.verifyMessageWithTimestamp(
        this.buildRevokeMessage(request.assetId, request.grantee),
        signature,
        revoker
      );

      if (!verificationResult.valid) {
        throw new Error(`Signature verification failed: ${verificationResult.error}`);
      }

      // Get policy
      const policy = await this.policyManager.getAccessPolicy(request.assetId);

      if (!policy) {
        throw new Error('Access policy not found for asset');
      }

      // Verify revoker is owner
      if (policy.owner !== revoker) {
        throw new Error('Only asset owner can revoke access');
      }

      // Revoke access
      await this.policyManager.revokeAccess(request.assetId, request.grantee);

      // Log revocation
      await this.auditLogger.logAccessRevoke({
        walletAddress: revoker,
        assetId: request.assetId,
        grantee: request.grantee,
      });
    } catch (error) {
      throw new Error(`Failed to revoke access: ${error.message}`);
    }
  }

  /**
   * Get access policy for asset
   */
  async getAccessPolicy(assetId: string) {
    return await this.policyManager.getAccessPolicy(assetId);
  }

  /**
   * Get active grants for asset
   */
  async getActiveGrants(assetId: string) {
    return await this.policyManager.getActiveGrants(assetId);
  }

  /**
   * Get grants for user
   */
  async getGrantsForUser(walletAddress: string) {
    return await this.policyManager.getGrantsForUser(walletAddress);
  }

  /**
   * Generate authentication challenge
   */
  async generateChallenge(walletAddress: string) {
    return await this.signatureVerifier.generateChallenge(walletAddress);
  }

  /**
   * Verify authentication challenge
   */
  async verifyChallenge(walletAddress: string, nonce: string, signature: string) {
    return await this.signatureVerifier.verifyChallenge(walletAddress, nonce, signature);
  }

  /**
   * Build access message for signing
   */
  private buildAccessMessage(assetId: string, permission: Permission): string {
    const timestamp = Date.now();
    const nonce = Math.random().toString(36).substring(7);
    return `Access Request\nAsset: ${assetId}\nPermission: ${permission}\nTimestamp: ${timestamp}\nNonce: ${nonce}`;
  }

  /**
   * Build grant message for signing
   */
  private buildGrantMessage(
    assetId: string,
    grantee: string,
    permissions: Permission[]
  ): string {
    const timestamp = Date.now();
    const nonce = Math.random().toString(36).substring(7);
    return `Grant Access\nAsset: ${assetId}\nGrantee: ${grantee}\nPermissions: ${permissions.join(',')}\nTimestamp: ${timestamp}\nNonce: ${nonce}`;
  }

  /**
   * Build revoke message for signing
   */
  private buildRevokeMessage(assetId: string, grantee: string): string {
    const timestamp = Date.now();
    const nonce = Math.random().toString(36).substring(7);
    return `Revoke Access\nAsset: ${assetId}\nGrantee: ${grantee}\nTimestamp: ${timestamp}\nNonce: ${nonce}`;
  }

  /**
   * Shutdown service
   */
  async shutdown(): Promise<void> {
    await this.signatureVerifier.shutdown();
    await this.policyManager.shutdown();
    await this.auditLogger.shutdown();
  }
}
