import { db } from '../database/client';
import { logger } from '../utils/logger';
import {
  MemoryAsset,
  BatchInfo,
  TransferRecord,
  AccessGrant,
  MemoryFilter,
} from '../types';

export class QueryEngine {
  /**
   * Get user's memory assets with filters
   */
  async getUserMemories(
    walletAddress: string,
    filters?: MemoryFilter
  ): Promise<MemoryAsset[]> {
    try {
      let query = `
        SELECT 
          asset_id,
          owner_address,
          arweave_id,
          version,
          batch_id,
          content_hash,
          encryption_key_id,
          created_at,
          updated_at,
          metadata
        FROM memory_assets
        WHERE owner_address = $1
      `;

      const params: any[] = [walletAddress];
      let paramIndex = 2;

      // Apply filters
      if (filters?.agentId) {
        query += ` AND metadata->>'agentId' = $${paramIndex}`;
        params.push(filters.agentId);
        paramIndex++;
      }

      if (filters?.startDate) {
        query += ` AND created_at >= $${paramIndex}`;
        params.push(filters.startDate);
        paramIndex++;
      }

      if (filters?.endDate) {
        query += ` AND created_at <= $${paramIndex}`;
        params.push(filters.endDate);
        paramIndex++;
      }

      // Order by creation date (newest first)
      query += ' ORDER BY created_at DESC';

      // Apply pagination
      if (filters?.limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(filters.limit);
        paramIndex++;
      }

      if (filters?.offset) {
        query += ` OFFSET $${paramIndex}`;
        params.push(filters.offset);
        paramIndex++;
      }

      const result = await db.query<MemoryAsset>(query, params);

      return result.rows.map(this.mapRowToMemoryAsset);
    } catch (error) {
      logger.error('Error querying user memories:', error);
      throw error;
    }
  }

  /**
   * Get a specific memory asset by ID
   */
  async getMemoryAsset(assetId: string): Promise<MemoryAsset | null> {
    try {
      const query = `
        SELECT 
          asset_id,
          owner_address,
          arweave_id,
          version,
          batch_id,
          content_hash,
          encryption_key_id,
          created_at,
          updated_at,
          metadata
        FROM memory_assets
        WHERE asset_id = $1
      `;

      const result = await db.query<MemoryAsset>(query, [assetId]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToMemoryAsset(result.rows[0]);
    } catch (error) {
      logger.error(`Error querying memory asset ${assetId}:`, error);
      throw error;
    }
  }

  /**
   * Get batch information
   */
  async getBatchInfo(batchId: string): Promise<BatchInfo | null> {
    try {
      const query = `
        SELECT 
          batch_id,
          owner_address,
          memory_count,
          total_size_bytes,
          merkle_tree_address,
          transaction_signature,
          total_cost_lamports,
          status,
          created_at,
          confirmed_at
        FROM memory_batches
        WHERE batch_id = $1
      `;

      const result = await db.query<BatchInfo>(query, [batchId]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToBatchInfo(result.rows[0]);
    } catch (error) {
      logger.error(`Error querying batch ${batchId}:`, error);
      throw error;
    }
  }

  /**
   * Get memories in a batch
   */
  async getBatchMemories(batchId: string): Promise<MemoryAsset[]> {
    try {
      const query = `
        SELECT 
          asset_id,
          owner_address,
          arweave_id,
          version,
          batch_id,
          content_hash,
          encryption_key_id,
          created_at,
          updated_at,
          metadata
        FROM memory_assets
        WHERE batch_id = $1
        ORDER BY created_at ASC
      `;

      const result = await db.query<MemoryAsset>(query, [batchId]);

      return result.rows.map(this.mapRowToMemoryAsset);
    } catch (error) {
      logger.error(`Error querying batch memories ${batchId}:`, error);
      throw error;
    }
  }

  /**
   * Get transfer history for an asset
   */
  async getTransferHistory(assetId: string): Promise<TransferRecord[]> {
    try {
      const query = `
        SELECT 
          id,
          asset_id,
          from_address,
          to_address,
          transaction_signature,
          transferred_at
        FROM transfer_history
        WHERE asset_id = $1
        ORDER BY transferred_at DESC
      `;

      const result = await db.query<TransferRecord>(query, [assetId]);

      return result.rows.map(this.mapRowToTransferRecord);
    } catch (error) {
      logger.error(`Error querying transfer history for ${assetId}:`, error);
      throw error;
    }
  }

  /**
   * Get access grants for an asset
   */
  async getAccessGrants(assetId: string): Promise<AccessGrant[]> {
    try {
      const query = `
        SELECT 
          id,
          asset_id,
          grantee_address,
          permissions,
          expires_at,
          max_access,
          current_access,
          created_at,
          revoked_at
        FROM access_grants
        WHERE asset_id = $1 AND revoked_at IS NULL
        ORDER BY created_at DESC
      `;

      const result = await db.query<AccessGrant>(query, [assetId]);

      return result.rows.map(this.mapRowToAccessGrant);
    } catch (error) {
      logger.error(`Error querying access grants for ${assetId}:`, error);
      throw error;
    }
  }

  /**
   * Check if a wallet has access to an asset
   */
  async hasAccess(assetId: string, walletAddress: string): Promise<boolean> {
    try {
      // Check if user is owner
      const ownerQuery = `
        SELECT 1 FROM memory_assets
        WHERE asset_id = $1 AND owner_address = $2
      `;
      const ownerResult = await db.query(ownerQuery, [assetId, walletAddress]);

      if (ownerResult.rows.length > 0) {
        return true;
      }

      // Check if user has active grant
      const grantQuery = `
        SELECT 1 FROM access_grants
        WHERE asset_id = $1 
          AND grantee_address = $2
          AND revoked_at IS NULL
          AND (expires_at IS NULL OR expires_at > NOW())
          AND (max_access IS NULL OR current_access < max_access)
      `;
      const grantResult = await db.query(grantQuery, [assetId, walletAddress]);

      return grantResult.rows.length > 0;
    } catch (error) {
      logger.error(`Error checking access for ${assetId}:`, error);
      throw error;
    }
  }

  /**
   * Search memories by content hash
   */
  async searchByContentHash(contentHash: string): Promise<MemoryAsset[]> {
    try {
      const query = `
        SELECT 
          asset_id,
          owner_address,
          arweave_id,
          version,
          batch_id,
          content_hash,
          encryption_key_id,
          created_at,
          updated_at,
          metadata
        FROM memory_assets
        WHERE content_hash = $1
        ORDER BY created_at DESC
      `;

      const result = await db.query<MemoryAsset>(query, [contentHash]);

      return result.rows.map(this.mapRowToMemoryAsset);
    } catch (error) {
      logger.error('Error searching by content hash:', error);
      throw error;
    }
  }

  /**
   * Get user's batch history
   */
  async getUserBatches(
    walletAddress: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<BatchInfo[]> {
    try {
      const query = `
        SELECT 
          batch_id,
          owner_address,
          memory_count,
          total_size_bytes,
          merkle_tree_address,
          transaction_signature,
          total_cost_lamports,
          status,
          created_at,
          confirmed_at
        FROM memory_batches
        WHERE owner_address = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await db.query<BatchInfo>(query, [walletAddress, limit, offset]);

      return result.rows.map(this.mapRowToBatchInfo);
    } catch (error) {
      logger.error('Error querying user batches:', error);
      throw error;
    }
  }

  /**
   * Get statistics for a user
   */
  async getUserStats(walletAddress: string): Promise<{
    totalMemories: number;
    totalBatches: number;
    totalTransfers: number;
    totalGrantsGiven: number;
    totalGrantsReceived: number;
  }> {
    try {
      const memoriesQuery = 'SELECT COUNT(*) as count FROM memory_assets WHERE owner_address = $1';
      const batchesQuery = 'SELECT COUNT(*) as count FROM memory_batches WHERE owner_address = $1';
      const transfersQuery = `
        SELECT COUNT(*) as count FROM transfer_history 
        WHERE from_address = $1 OR to_address = $1
      `;
      const grantsGivenQuery = `
        SELECT COUNT(*) as count FROM access_grants ag
        JOIN memory_assets ma ON ag.asset_id = ma.asset_id
        WHERE ma.owner_address = $1 AND ag.revoked_at IS NULL
      `;
      const grantsReceivedQuery = `
        SELECT COUNT(*) as count FROM access_grants
        WHERE grantee_address = $1 AND revoked_at IS NULL
      `;

      const [memories, batches, transfers, grantsGiven, grantsReceived] = await Promise.all([
        db.query(memoriesQuery, [walletAddress]),
        db.query(batchesQuery, [walletAddress]),
        db.query(transfersQuery, [walletAddress]),
        db.query(grantsGivenQuery, [walletAddress]),
        db.query(grantsReceivedQuery, [walletAddress]),
      ]);

      return {
        totalMemories: parseInt(memories.rows[0].count),
        totalBatches: parseInt(batches.rows[0].count),
        totalTransfers: parseInt(transfers.rows[0].count),
        totalGrantsGiven: parseInt(grantsGiven.rows[0].count),
        totalGrantsReceived: parseInt(grantsReceived.rows[0].count),
      };
    } catch (error) {
      logger.error('Error getting user stats:', error);
      throw error;
    }
  }

  // Mapping functions
  private mapRowToMemoryAsset(row: any): MemoryAsset {
    return {
      assetId: row.asset_id,
      owner: row.owner_address,
      arweaveId: row.arweave_id,
      version: row.version,
      batchId: row.batch_id,
      contentHash: row.content_hash,
      encryptionKeyId: row.encryption_key_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      metadata: row.metadata || {},
    };
  }

  private mapRowToBatchInfo(row: any): BatchInfo {
    return {
      batchId: row.batch_id,
      ownerAddress: row.owner_address,
      memoryCount: row.memory_count,
      totalSizeBytes: row.total_size_bytes,
      merkleTreeAddress: row.merkle_tree_address,
      transactionSignature: row.transaction_signature,
      totalCostLamports: row.total_cost_lamports,
      status: row.status,
      createdAt: row.created_at,
      confirmedAt: row.confirmed_at,
    };
  }

  private mapRowToTransferRecord(row: any): TransferRecord {
    return {
      id: row.id,
      assetId: row.asset_id,
      fromAddress: row.from_address,
      toAddress: row.to_address,
      transactionSignature: row.transaction_signature,
      transferredAt: row.transferred_at,
    };
  }

  private mapRowToAccessGrant(row: any): AccessGrant {
    return {
      id: row.id,
      assetId: row.asset_id,
      granteeAddress: row.grantee_address,
      permissions: row.permissions,
      expiresAt: row.expires_at,
      maxAccess: row.max_access,
      currentAccess: row.current_access,
      createdAt: row.created_at,
      revokedAt: row.revoked_at,
    };
  }
}

export default QueryEngine;
