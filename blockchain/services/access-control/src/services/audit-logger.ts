/**
 * Audit Logger
 * Logs all access control operations for audit trail
 */

import { Pool } from 'pg';
import { AccessControlConfig, AuditLogEntry, Permission } from '../types';

/**
 * Audit Logger Implementation
 */
export class AuditLogger {
  private db: Pool;

  constructor(private config: AccessControlConfig) {
    this.db = new Pool({
      host: config.postgres.host,
      port: config.postgres.port,
      database: config.postgres.database,
      user: config.postgres.user,
      password: config.postgres.password,
    });
  }

  /**
   * Log access attempt
   */
  async logAccessAttempt(data: {
    walletAddress: string;
    assetId: string;
    permission: Permission;
    allowed: boolean;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      await this.log({
        walletAddress: data.walletAddress,
        action: 'access_attempt',
        assetId: data.assetId,
        details: {
          permission: data.permission,
          allowed: data.allowed,
          reason: data.reason,
        },
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Failed to log access attempt:', error);
    }
  }

  /**
   * Log access grant
   */
  async logAccessGrant(data: {
    walletAddress: string;
    assetId: string;
    grantee: string;
    permissions: Permission[];
    expiresAt?: Date;
    maxAccess?: number;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      await this.log({
        walletAddress: data.walletAddress,
        action: 'grant_access',
        assetId: data.assetId,
        details: {
          grantee: data.grantee,
          permissions: data.permissions,
          expiresAt: data.expiresAt,
          maxAccess: data.maxAccess,
        },
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Failed to log access grant:', error);
    }
  }

  /**
   * Log access revoke
   */
  async logAccessRevoke(data: {
    walletAddress: string;
    assetId: string;
    grantee: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      await this.log({
        walletAddress: data.walletAddress,
        action: 'revoke_access',
        assetId: data.assetId,
        details: {
          grantee: data.grantee,
        },
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Failed to log access revoke:', error);
    }
  }

  /**
   * Log policy update
   */
  async logPolicyUpdate(data: {
    walletAddress: string;
    assetId: string;
    changes: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      await this.log({
        walletAddress: data.walletAddress,
        action: 'update_policy',
        assetId: data.assetId,
        details: {
          changes: data.changes,
        },
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Failed to log policy update:', error);
    }
  }

  /**
   * Log authentication attempt
   */
  async logAuthAttempt(data: {
    walletAddress: string;
    success: boolean;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      await this.log({
        walletAddress: data.walletAddress,
        action: 'authentication',
        details: {
          success: data.success,
          reason: data.reason,
        },
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Failed to log auth attempt:', error);
    }
  }

  /**
   * Generic log method
   */
  private async log(entry: AuditLogEntry): Promise<void> {
    try {
      const query = `
        INSERT INTO blockchain_audit_logs 
        (wallet_address, action, asset_id, details, ip_address, user_agent, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;

      await this.db.query(query, [
        entry.walletAddress,
        entry.action,
        entry.assetId,
        JSON.stringify(entry.details),
        entry.ipAddress,
        entry.userAgent,
        entry.timestamp,
      ]);
    } catch (error) {
      console.error('Failed to write audit log:', error);
      // Don't throw - audit logging should not break the main flow
    }
  }

  /**
   * Query audit logs
   */
  async queryLogs(filters: {
    walletAddress?: string;
    assetId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<AuditLogEntry[]> {
    try {
      let query = 'SELECT * FROM blockchain_audit_logs WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      if (filters.walletAddress) {
        query += ` AND wallet_address = $${paramIndex++}`;
        params.push(filters.walletAddress);
      }

      if (filters.assetId) {
        query += ` AND asset_id = $${paramIndex++}`;
        params.push(filters.assetId);
      }

      if (filters.action) {
        query += ` AND action = $${paramIndex++}`;
        params.push(filters.action);
      }

      if (filters.startDate) {
        query += ` AND timestamp >= $${paramIndex++}`;
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        query += ` AND timestamp <= $${paramIndex++}`;
        params.push(filters.endDate);
      }

      query += ' ORDER BY timestamp DESC';

      if (filters.limit) {
        query += ` LIMIT $${paramIndex++}`;
        params.push(filters.limit);
      }

      if (filters.offset) {
        query += ` OFFSET $${paramIndex++}`;
        params.push(filters.offset);
      }

      const result = await this.db.query(query, params);

      return result.rows.map((row) => ({
        walletAddress: row.wallet_address,
        action: row.action,
        assetId: row.asset_id,
        details: row.details,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        timestamp: row.timestamp,
      }));
    } catch (error) {
      throw new Error(`Failed to query audit logs: ${error.message}`);
    }
  }

  /**
   * Get audit statistics
   */
  async getStatistics(filters: {
    walletAddress?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    totalLogs: number;
    byAction: Record<string, number>;
    byAsset: Record<string, number>;
  }> {
    try {
      let whereClause = 'WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      if (filters.walletAddress) {
        whereClause += ` AND wallet_address = $${paramIndex++}`;
        params.push(filters.walletAddress);
      }

      if (filters.startDate) {
        whereClause += ` AND timestamp >= $${paramIndex++}`;
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        whereClause += ` AND timestamp <= $${paramIndex++}`;
        params.push(filters.endDate);
      }

      // Total logs
      const totalQuery = `SELECT COUNT(*) as count FROM blockchain_audit_logs ${whereClause}`;
      const totalResult = await this.db.query(totalQuery, params);
      const totalLogs = parseInt(totalResult.rows[0].count, 10);

      // By action
      const actionQuery = `
        SELECT action, COUNT(*) as count 
        FROM blockchain_audit_logs ${whereClause}
        GROUP BY action
      `;
      const actionResult = await this.db.query(actionQuery, params);
      const byAction: Record<string, number> = {};
      actionResult.rows.forEach((row) => {
        byAction[row.action] = parseInt(row.count, 10);
      });

      // By asset
      const assetQuery = `
        SELECT asset_id, COUNT(*) as count 
        FROM blockchain_audit_logs ${whereClause} AND asset_id IS NOT NULL
        GROUP BY asset_id
        ORDER BY count DESC
        LIMIT 10
      `;
      const assetResult = await this.db.query(assetQuery, params);
      const byAsset: Record<string, number> = {};
      assetResult.rows.forEach((row) => {
        byAsset[row.asset_id] = parseInt(row.count, 10);
      });

      return {
        totalLogs,
        byAction,
        byAsset,
      };
    } catch (error) {
      throw new Error(`Failed to get audit statistics: ${error.message}`);
    }
  }

  /**
   * Shutdown audit logger
   */
  async shutdown(): Promise<void> {
    await this.db.end();
  }
}
