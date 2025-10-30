/**
 * Type definitions for Access Control Service
 */

/**
 * Access policy
 */
export interface AccessPolicy {
  owner: string;
  allowList: AccessGrant[];
  defaultPolicy: 'deny' | 'allow';
  updatedAt: Date;
}

/**
 * Access grant
 */
export interface AccessGrant {
  grantee: string;
  permissions: Permission[];
  expiresAt?: Date;
  maxAccess?: number;
  currentAccess: number;
  createdAt: Date;
  revokedAt?: Date;
}

/**
 * Permission types
 */
export type Permission = 'read' | 'write' | 'transfer';

/**
 * Signature verification request
 */
export interface SignatureVerificationRequest {
  message: string;
  signature: string;
  publicKey: string;
}

/**
 * Signature verification result
 */
export interface SignatureVerificationResult {
  valid: boolean;
  publicKey?: string;
  error?: string;
}

/**
 * Challenge for signature verification
 */
export interface Challenge {
  message: string;
  nonce: string;
  timestamp: number;
  expiresAt: number;
}

/**
 * Access check request
 */
export interface AccessCheckRequest {
  assetId: string;
  walletAddress: string;
  signature: string;
  permission: Permission;
}

/**
 * Access check result
 */
export interface AccessCheckResult {
  allowed: boolean;
  reason?: string;
  policy?: AccessPolicy;
}

/**
 * Grant access request
 */
export interface GrantAccessRequest {
  assetId: string;
  grantee: string;
  permissions: Permission[];
  expiresAt?: Date;
  maxAccess?: number;
}

/**
 * Revoke access request
 */
export interface RevokeAccessRequest {
  assetId: string;
  grantee: string;
}

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  walletAddress: string;
  action: string;
  assetId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

/**
 * Service configuration
 */
export interface AccessControlConfig {
  solana: {
    rpcUrl: string;
    programId: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
  postgres: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  };
  challenge: {
    ttl: number; // Time to live in seconds
    nonceLength: number;
  };
  cache: {
    policyTTL: number; // Policy cache TTL in seconds
  };
}
