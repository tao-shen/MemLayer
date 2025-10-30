import { db } from '../database/client';
import { logger } from '../utils/logger';
import {
  ProgramEvent,
  EventType,
  MemoryAsset,
  BatchInfo,
  TransferRecord,
  AccessGrant,
  MemoryMintedEvent,
  MemoryTransferredEvent,
  AccessPolicyUpdatedEvent,
  VersionCreatedEvent,
  BatchCreatedEvent,
} from '../types';

export class DataIndexer {
  /**
   * Index a memory minted event
   */
  async indexMemoryMinted(event: ProgramEvent): Promise<void> {
    try {
      const data = event.data as MemoryMintedEvent;
      
      const query = `
        INSERT INTO memory_assets (
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
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (asset_id) DO UPDATE SET
          updated_at = EXCLUDED.updated_at
      `;

      await db.query(query, [
        data.assetId,
        data.owner.toBase58(),
        data.arweaveId,
        1, // Initial version
        data.batchId || null,
        data.contentHash.toString('hex'),
        '', // Will be set by encryption service
        event.timestamp,
        event.timestamp,
        JSON.stringify({
          merkleTree: data.merkleTree.toBase58(),
          leafIndex: data.leafIndex,
          slot: event.slot,
          signature: event.signature,
        }),
      ]);

      logger.info(`Indexed memory minted: ${data.assetId}`);
    } catch (error) {
      logger.error('Error indexing memory minted event:', error);
      throw error;
    }
  }

  /**
   * Index a memory transferred event
   */
  async indexMemoryTransferred(event: ProgramEvent): Promise<void> {
    try {
      const data = event.data as MemoryTransferredEvent;

      await db.transaction(async (client) => {
        // Update owner in memory_assets
        const updateQuery = `
          UPDATE memory_assets
          SET owner_address = $1, updated_at = $2
          WHERE asset_id = $3
        `;
        await client.query(updateQuery, [
          data.toOwner.toBase58(),
          event.timestamp,
          data.assetId,
        ]);

        // Insert transfer record
        const insertQuery = `
          INSERT INTO transfer_history (
            asset_id,
            from_address,
            to_address,
            transaction_signature,
            transferred_at
          ) VALUES ($1, $2, $3, $4, $5)
        `;
        await client.query(insertQuery, [
          data.assetId,
          data.fromOwner.toBase58(),
          data.toOwner.toBase58(),
          event.signature,
          event.timestamp,
        ]);
      });

      logger.info(`Indexed memory transfer: ${data.assetId}`);
    } catch (error) {
      logger.error('Error indexing memory transferred event:', error);
      throw error;
    }
  }

  /**
   * Index an access policy updated event
   */
  async indexAccessPolicyUpdated(event: ProgramEvent): Promise<void> {
    try {
      const data = event.data as AccessPolicyUpdatedEvent;

      // Parse permissions bitmap
      const permissions: string[] = [];
      if (data.permissions & 1) permissions.push('read');
      if (data.permissions & 2) permissions.push('write');
      if (data.permissions & 4) permissions.push('transfer');

      const query = `
        INSERT INTO access_grants (
          asset_id,
          grantee_address,
          permissions,
          expires_at,
          max_access,
          current_access,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (asset_id, grantee_address) 
        DO UPDATE SET
          permissions = EXCLUDED.permissions,
          expires_at = EXCLUDED.expires_at,
          max_access = EXCLUDED.max_access,
          created_at = EXCLUDED.created_at,
          revoked_at = NULL
      `;

      // Note: We need to find the asset_id from owner address
      // This is a simplified version - in production, you'd need to query the asset first
      await db.query(query, [
        '', // asset_id - needs to be resolved
        data.grantee.toBase58(),
        permissions,
        data.expiresAt ? new Date(data.expiresAt * 1000) : null,
        data.maxAccess || null,
        0,
        event.timestamp,
      ]);

      logger.info(`Indexed access policy update for grantee: ${data.grantee.toBase58()}`);
    } catch (error) {
      logger.error('Error indexing access policy updated event:', error);
      throw error;
    }
  }

  /**
   * Index a version created event
   */
  async indexVersionCreated(event: ProgramEvent): Promise<void> {
    try {
      const data = event.data as VersionCreatedEvent;

      const query = `
        UPDATE memory_assets
        SET 
          version = $1,
          arweave_id = $2,
          content_hash = $3,
          updated_at = $4,
          metadata = jsonb_set(
            COALESCE(metadata, '{}'::jsonb),
            '{versions}',
            COALESCE(metadata->'versions', '[]'::jsonb) || $5::jsonb
          )
        WHERE asset_id = $6
      `;

      const versionInfo = JSON.stringify({
        version: data.version,
        arweaveId: data.arweaveId,
        contentHash: data.contentHash.toString('hex'),
        createdAt: event.timestamp,
      });

      await db.query(query, [
        data.version,
        data.arweaveId,
        data.contentHash.toString('hex'),
        event.timestamp,
        versionInfo,
        data.assetId,
      ]);

      logger.info(`Indexed version ${data.version} for asset: ${data.assetId}`);
    } catch (error) {
      logger.error('Error indexing version created event:', error);
      throw error;
    }
  }

  /**
   * Index a batch created event
   */
  async indexBatchCreated(event: ProgramEvent): Promise<void> {
    try {
      const data = event.data as BatchCreatedEvent;

      const query = `
        INSERT INTO memory_batches (
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
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (batch_id) DO UPDATE SET
          status = EXCLUDED.status,
          confirmed_at = EXCLUDED.confirmed_at
      `;

      await db.query(query, [
        data.batchId,
        data.owner.toBase58(),
        data.memoryCount,
        0, // Will be updated later
        data.merkleTree.toBase58(),
        event.signature,
        0, // Will be calculated
        'confirmed',
        event.timestamp,
        event.timestamp,
      ]);

      logger.info(`Indexed batch created: ${data.batchId}`);
    } catch (error) {
      logger.error('Error indexing batch created event:', error);
      throw error;
    }
  }

  /**
   * Process an event based on its type
   */
  async processEvent(event: ProgramEvent): Promise<void> {
    try {
      switch (event.type) {
        case EventType.MEMORY_MINTED:
          await this.indexMemoryMinted(event);
          break;
        case EventType.MEMORY_TRANSFERRED:
          await this.indexMemoryTransferred(event);
          break;
        case EventType.ACCESS_POLICY_UPDATED:
          await this.indexAccessPolicyUpdated(event);
          break;
        case EventType.VERSION_CREATED:
          await this.indexVersionCreated(event);
          break;
        case EventType.BATCH_CREATED:
          await this.indexBatchCreated(event);
          break;
        default:
          logger.warn(`Unknown event type: ${event.type}`);
      }
    } catch (error) {
      logger.error(`Error processing event ${event.type}:`, error);
      throw error;
    }
  }

  /**
   * Get indexing statistics
   */
  async getStats(): Promise<{
    totalMemories: number;
    totalBatches: number;
    totalTransfers: number;
    totalGrants: number;
  }> {
    try {
      const memoriesResult = await db.query('SELECT COUNT(*) as count FROM memory_assets');
      const batchesResult = await db.query('SELECT COUNT(*) as count FROM memory_batches');
      const transfersResult = await db.query('SELECT COUNT(*) as count FROM transfer_history');
      const grantsResult = await db.query('SELECT COUNT(*) as count FROM access_grants WHERE revoked_at IS NULL');

      return {
        totalMemories: parseInt(memoriesResult.rows[0].count),
        totalBatches: parseInt(batchesResult.rows[0].count),
        totalTransfers: parseInt(transfersResult.rows[0].count),
        totalGrants: parseInt(grantsResult.rows[0].count),
      };
    } catch (error) {
      logger.error('Error getting indexer stats:', error);
      throw error;
    }
  }

  /**
   * Clear all indexed data (for testing/resync)
   */
  async clearAll(): Promise<void> {
    try {
      await db.transaction(async (client) => {
        await client.query('DELETE FROM access_grants');
        await client.query('DELETE FROM transfer_history');
        await client.query('DELETE FROM memory_batches');
        await client.query('DELETE FROM memory_assets');
      });

      logger.info('Cleared all indexed data');
    } catch (error) {
      logger.error('Error clearing indexed data:', error);
      throw error;
    }
  }
}

export default DataIndexer;
