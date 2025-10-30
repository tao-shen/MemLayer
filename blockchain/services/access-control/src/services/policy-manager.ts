/**
 * Policy Manager
 * Manages access policies for memory assets
 */

import { Connection, PublicKey } from '@solana/web3.js';
import Redis from 'ioredis';
import { Pool } from 'pg';
import {
  AccessPolicy,
  AccessGrant,
  Permission,
  AccessControlConfig,
} from '../types';

/**
 * Policy Manager Implementation
 */
export class PolicyManager {
  private connection: Connection;
  private programId: PublicKey;
  private redis: Redis;
  private db: Pool;
  private policyTTL: number;
  private policyPrefix = 'policy:';

  constructor(private config: AccessControlConfig) {
    // Initialize Solana connection
    this.connection = new Connection(config.solana.rpcUrl, 'confirmed');
    this.programId = new PublicKey(config.solana.programId);

    // Initialize Redis
    this.redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
    });

    // Initialize PostgreSQL
    this.db = new Pool({
      host: config.postgres.host,
      port: config.postgres.port,
      database: config.postgres.database,
      user: config.postgres.user,
      password: config.postgres.password,
    });

    this.policyTTL = config.cache.policyTTL;
  }

  /**
   * Get access policy for asset
   */
  async getAccessPolicy(assetId: string): Promise<AccessPolicy | null> {
    try {
      // Try cache first
      const cached = await this.getCachedPolicy(assetId);
      if (cached) {
        return cached;
      }

      // Fetch from database
      const policy = await this.fetchPolicyFromDatabase(assetId);

      if (policy) {
        // Cache policy
        await this.cachePolicy(assetId, policy);
      }

      return policy;
    } catch (error) {
      throw new Error(`Failed to get access policy: ${error.message}`);
    }
  }

  /**
   * Update access policy
   */
  async updateAccessPolicy(
    assetId: string,
    policy: Partial<AccessPolicy>
  ): Promise<void> {
    try {
      // Get current policy
      const currentPolicy = await this.getAccessPolicy(assetId);

      if (!currentPolicy) {
        throw new Error(`Policy not found for asset: ${assetId}`);
      }

      // Merge updates
      const updatedPolicy: AccessPolicy = {
        ...currentPolicy,
        ...policy,
        updatedAt: new Date(),
      };

      // Update in database
      await this.savePolicyToDatabase(assetId, updatedPolicy);

      // Update cache
      await this.cachePolicy(assetId, updatedPolicy);

      // Invalidate related caches
      await this.invalidateRelatedCaches(assetId);
    } catch (error) {
      throw new Error(`Failed to update access policy: ${error.message}`);
    }
  }

  /**
   * Grant access to user
   */
  async grantAccess(
    assetId: string,
    grantee: string,
    permissions: Permission[],
    options?: {
      expiresAt?: Date;
      maxAccess?: number;
    }
  ): Promise<void> {
    try {
      // Get current policy
      const policy = await this.getAccessPolicy(assetId);

      if (!policy) {
        throw new Error(`Policy not found for asset: ${assetId}`);
      }

      // Check if grant already exists
      const existingGrantIndex = policy.allowList.findIndex(
        (g) => g.grantee === grantee && !g.revokedAt
      );

      const newGrant: AccessGrant = {
        grantee,
        permissions,
        expiresAt: options?.expiresAt,
        maxAccess: options?.maxAccess,
        currentAccess: 0,
        createdAt: new Date(),
      };

      if (existingGrantIndex >= 0) {
        // Update existing grant
        policy.allowList[existingGrantIndex] = newGrant;
      } else {
        // Add new grant
        policy.allowList.push(newGrant);
      }

      // Save to database
      await this.saveGrantToDatabase(assetId, newGrant);

      // Update policy
      await this.updateAccessPolicy(assetId, { allowList: policy.allowList });
    } catch (error) {
      throw new Error(`Failed to grant access: ${error.message}`);
    }
  }

  /**
   * Revoke access from user
   */
  async revokeAccess(assetId: string, grantee: string): Promise<void> {
    try {
      // Get current policy
      const policy = await this.getAccessPolicy(assetId);

      if (!policy) {
        throw new Error(`Policy not found for asset: ${assetId}`);
      }

      // Find and revoke grant
      const grantIndex = policy.allowList.findIndex(
        (g) => g.grantee === grantee && !g.revokedAt
      );

      if (grantIndex < 0) {
        throw new Error(`No active grant found for grantee: ${grantee}`);
      }

      // Mark as revoked
      policy.allowList[grantIndex].revokedAt = new Date();

      // Update database
      await this.revokeGrantInDatabase(assetId, grantee);

      // Update policy
      await this.updateAccessPolicy(assetId, { allowList: policy.allowList });
    } catch (error) {
      throw new Error(`Failed to revoke access: ${error.message}`);
    }
  }

  /**
   * Check if user has permission
   */
  async hasPermission(
    assetId: string,
    walletAddress: string,
    permission: Permission
  ): Promise<boolean> {
    try {
      const policy = await this.getAccessPolicy(assetId);

      if (!policy) {
        return false;
      }

      // Owner has all permissions
      if (policy.owner === walletAddress) {
        return true;
      }

      // Check allow list
      const grant = policy.allowList.find(
        (g) => g.grantee === walletAddress && !g.revokedAt
      );

      if (!grant) {
        return policy.defaultPolicy === 'allow';
      }

      // Check if grant has expired
      if (grant.expiresAt && new Date() > grant.expiresAt) {
        return false;
      }

      // Check if max access reached
      if (grant.maxAccess && grant.currentAccess >= grant.maxAccess) {
        return false;
      }

      // Check if permission is granted
      return grant.permissions.includes(permission);
    } catch (error) {
      throw new Error(`Failed to check permission: ${error.message}`);
    }
  }

  /**
   * Increment access count
   */
  async incrementAccessCount(assetId: string, grantee: string): Promise<void> {
    try {
      const policy = await this.getAccessPolicy(assetId);

      if (!policy) {
        return;
      }

      const grant = policy.allowList.find(
        (g) => g.grantee === grantee && !g.revokedAt
      );

      if (grant) {
        grant.currentAccess++;

        // Update in database
        await this.updateGrantAccessCount(assetId, grantee, grant.currentAccess);

        // Update cache
        await this.cachePolicy(assetId, policy);
      }
    } catch (error) {
      throw new Error(`Failed to increment access count: ${error.message}`);
    }
  }

  /**
   * Get active grants for asset
   */
  async getActiveGrants(assetId: string): Promise<AccessGrant[]> {
    try {
      const policy = await this.getAccessPolicy(assetId);

      if (!policy) {
        return [];
      }

      const now = new Date();

      return policy.allowList.filter((grant) => {
        // Not revoked
        if (grant.revokedAt) return false;

        // Not expired
        if (grant.expiresAt && grant.expiresAt < now) return false;

        // Not exceeded max access
        if (grant.maxAccess && grant.currentAccess >= grant.maxAccess) return false;

        return true;
      });
    } catch (error) {
      throw new Error(`Failed to get active grants: ${error.message}`);
    }
  }

  /**
   * Get grants for user
   */
  async getGrantsForUser(walletAddress: string): Promise<
    Array<{
      assetId: string;
      grant: AccessGrant;
    }>
  > {
    try {
      const query = `
        SELECT asset_id, grantee_address, permissions, expires_at, 
               max_access, current_access, created_at, revoked_at
        FROM access_grants
        WHERE grantee_address = $1 AND revoked_at IS NULL
        ORDER BY created_at DESC
      `;

      const result = await this.db.query(query, [walletAddress]);

      return result.rows.map((row) => ({
        assetId: row.asset_id,
        grant: {
          grantee: row.grantee_address,
          permissions: row.permissions,
          expiresAt: row.expires_at,
          maxAccess: row.max_access,
          currentAccess: row.current_access,
          createdAt: row.created_at,
          revokedAt: row.revoked_at,
        },
      }));
    } catch (error) {
      throw new Error(`Failed to get grants for user: ${error.message}`);
    }
  }

  /**
   * Fetch policy from on-chain (Solana)
   */
  private async fetchPolicyFromChain(assetId: string): Promise<AccessPolicy | null> {
    try {
      // Derive PDA for access policy
      const [policyPda] = await PublicKey.findProgramAddress(
        [Buffer.from('policy'), Buffer.from(assetId)],
        this.programId
      );

      // Fetch account data
      const accountInfo = await this.connection.getAccountInfo(policyPda);

      if (!accountInfo) {
        return null;
      }

      // Parse policy data (simplified - actual implementation would use Borsh)
      // This is a placeholder
      return null;
    } catch (error) {
      throw new Error(`Failed to fetch policy from chain: ${error.message}`);
    }
  }

  /**
   * Fetch policy from database
   */
  private async fetchPolicyFromDatabase(assetId: string): Promise<AccessPolicy | null> {
    try {
      // Get asset owner
      const assetQuery = `
        SELECT owner_address FROM memory_assets WHERE asset_id = $1
      `;
      const assetResult = await this.db.query(assetQuery, [assetId]);

      if (assetResult.rows.length === 0) {
        return null;
      }

      const owner = assetResult.rows[0].owner_address;

      // Get grants
      const grantsQuery = `
        SELECT grantee_address, permissions, expires_at, max_access, 
               current_access, created_at, revoked_at
        FROM access_grants
        WHERE asset_id = $1
        ORDER BY created_at DESC
      `;
      const grantsResult = await this.db.query(grantsQuery, [assetId]);

      const allowList: AccessGrant[] = grantsResult.rows.map((row) => ({
        grantee: row.grantee_address,
        permissions: row.permissions,
        expiresAt: row.expires_at,
        maxAccess: row.max_access,
        currentAccess: row.current_access,
        createdAt: row.created_at,
        revokedAt: row.revoked_at,
      }));

      return {
        owner,
        allowList,
        defaultPolicy: 'deny',
        updatedAt: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to fetch policy from database: ${error.message}`);
    }
  }

  /**
   * Save policy to database
   */
  private async savePolicyToDatabase(
    assetId: string,
    policy: AccessPolicy
  ): Promise<void> {
    // Policy is stored via grants, so this is a no-op
    // The actual grants are saved via saveGrantToDatabase
  }

  /**
   * Save grant to database
   */
  private async saveGrantToDatabase(
    assetId: string,
    grant: AccessGrant
  ): Promise<void> {
    try {
      const query = `
        INSERT INTO access_grants 
        (asset_id, grantee_address, grantor_address, permissions, expires_at, max_access, current_access)
        VALUES ($1, $2, (SELECT owner_address FROM memory_assets WHERE asset_id = $1), $3, $4, $5, $6)
        ON CONFLICT (asset_id, grantee_address) 
        DO UPDATE SET 
          permissions = EXCLUDED.permissions,
          expires_at = EXCLUDED.expires_at,
          max_access = EXCLUDED.max_access,
          revoked_at = NULL
      `;

      await this.db.query(query, [
        assetId,
        grant.grantee,
        grant.permissions,
        grant.expiresAt,
        grant.maxAccess,
        grant.currentAccess,
      ]);
    } catch (error) {
      throw new Error(`Failed to save grant to database: ${error.message}`);
    }
  }

  /**
   * Revoke grant in database
   */
  private async revokeGrantInDatabase(assetId: string, grantee: string): Promise<void> {
    try {
      const query = `
        UPDATE access_grants
        SET revoked_at = NOW()
        WHERE asset_id = $1 AND grantee_address = $2 AND revoked_at IS NULL
      `;

      await this.db.query(query, [assetId, grantee]);
    } catch (error) {
      throw new Error(`Failed to revoke grant in database: ${error.message}`);
    }
  }

  /**
   * Update grant access count
   */
  private async updateGrantAccessCount(
    assetId: string,
    grantee: string,
    count: number
  ): Promise<void> {
    try {
      const query = `
        UPDATE access_grants
        SET current_access = $3
        WHERE asset_id = $1 AND grantee_address = $2
      `;

      await this.db.query(query, [assetId, grantee, count]);
    } catch (error) {
      throw new Error(`Failed to update access count: ${error.message}`);
    }
  }

  /**
   * Cache policy in Redis
   */
  private async cachePolicy(assetId: string, policy: AccessPolicy): Promise<void> {
    try {
      const key = this.getPolicyKey(assetId);
      const value = JSON.stringify(policy);
      await this.redis.setex(key, this.policyTTL, value);
    } catch (error) {
      // Log error but don't throw - caching is not critical
      console.error('Failed to cache policy:', error);
    }
  }

  /**
   * Get cached policy
   */
  private async getCachedPolicy(assetId: string): Promise<AccessPolicy | null> {
    try {
      const key = this.getPolicyKey(assetId);
      const value = await this.redis.get(key);

      if (!value) {
        return null;
      }

      return JSON.parse(value);
    } catch (error) {
      // Log error but don't throw - caching is not critical
      console.error('Failed to get cached policy:', error);
      return null;
    }
  }

  /**
   * Invalidate policy cache
   */
  private async invalidateRelatedCaches(assetId: string): Promise<void> {
    try {
      const key = this.getPolicyKey(assetId);
      await this.redis.del(key);
    } catch (error) {
      console.error('Failed to invalidate cache:', error);
    }
  }

  /**
   * Get policy cache key
   */
  private getPolicyKey(assetId: string): string {
    return `${this.policyPrefix}${assetId}`;
  }

  /**
   * Shutdown policy manager
   */
  async shutdown(): Promise<void> {
    await this.redis.quit();
    await this.db.end();
  }
}
