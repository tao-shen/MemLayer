-- Blockchain Memory Assets Database Schema
-- Migration: 001_create_blockchain_tables
-- Description: Create tables for blockchain memory asset management

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Memory Assets Table
-- ============================================================================
-- Stores indexed information about memory assets on the blockchain
CREATE TABLE IF NOT EXISTS memory_assets (
  asset_id VARCHAR(64) PRIMARY KEY,
  owner_address VARCHAR(44) NOT NULL,
  arweave_id VARCHAR(64) NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  batch_id VARCHAR(64),
  content_hash VARCHAR(64) NOT NULL,
  encryption_key_id VARCHAR(64) NOT NULL,
  agent_id VARCHAR(64) NOT NULL,
  memory_type VARCHAR(20) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for memory_assets
CREATE INDEX idx_memory_assets_owner ON memory_assets(owner_address);
CREATE INDEX idx_memory_assets_batch ON memory_assets(batch_id);
CREATE INDEX idx_memory_assets_created ON memory_assets(created_at DESC);
CREATE INDEX idx_memory_assets_agent ON memory_assets(agent_id);
CREATE INDEX idx_memory_assets_type ON memory_assets(memory_type);
CREATE INDEX idx_memory_assets_arweave ON memory_assets(arweave_id);

-- ============================================================================
-- Memory Batches Table
-- ============================================================================
-- Stores information about batches of memories minted together
CREATE TABLE IF NOT EXISTS memory_batches (
  batch_id VARCHAR(64) PRIMARY KEY,
  owner_address VARCHAR(44) NOT NULL,
  memory_count INTEGER NOT NULL,
  total_size_bytes BIGINT NOT NULL,
  merkle_tree_address VARCHAR(44) NOT NULL,
  transaction_signature VARCHAR(88) NOT NULL,
  total_cost_lamports BIGINT NOT NULL,
  solana_cost_lamports BIGINT NOT NULL,
  arweave_cost_winston BIGINT NOT NULL,
  priority_fee_lamports BIGINT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  confirmed_at TIMESTAMP,
  error_message TEXT
);

-- Indexes for memory_batches
CREATE INDEX idx_memory_batches_owner ON memory_batches(owner_address, created_at DESC);
CREATE INDEX idx_memory_batches_status ON memory_batches(status);
CREATE INDEX idx_memory_batches_created ON memory_batches(created_at DESC);
CREATE INDEX idx_memory_batches_signature ON memory_batches(transaction_signature);

-- ============================================================================
-- Access Grants Table
-- ============================================================================
-- Stores access control grants for memory assets
CREATE TABLE IF NOT EXISTS access_grants (
  id SERIAL PRIMARY KEY,
  asset_id VARCHAR(64) NOT NULL,
  grantee_address VARCHAR(44) NOT NULL,
  grantor_address VARCHAR(44) NOT NULL,
  permissions VARCHAR(20)[] NOT NULL,
  expires_at TIMESTAMP,
  max_access INTEGER,
  current_access INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP,
  revoked_by VARCHAR(44),
  CONSTRAINT fk_access_grants_asset
    FOREIGN KEY (asset_id)
    REFERENCES memory_assets(asset_id)
    ON DELETE CASCADE
);

-- Indexes for access_grants
CREATE INDEX idx_access_grants_asset ON access_grants(asset_id);
CREATE INDEX idx_access_grants_grantee ON access_grants(grantee_address);
CREATE INDEX idx_access_grants_asset_grantee ON access_grants(asset_id, grantee_address);
CREATE INDEX idx_access_grants_active ON access_grants(asset_id, grantee_address) 
  WHERE revoked_at IS NULL;

-- ============================================================================
-- Transfer History Table
-- ============================================================================
-- Records all ownership transfers of memory assets
CREATE TABLE IF NOT EXISTS transfer_history (
  id SERIAL PRIMARY KEY,
  asset_id VARCHAR(64) NOT NULL,
  from_address VARCHAR(44) NOT NULL,
  to_address VARCHAR(44) NOT NULL,
  transaction_signature VARCHAR(88) NOT NULL,
  transferred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB,
  CONSTRAINT fk_transfer_history_asset
    FOREIGN KEY (asset_id)
    REFERENCES memory_assets(asset_id)
    ON DELETE CASCADE
);

-- Indexes for transfer_history
CREATE INDEX idx_transfer_history_asset ON transfer_history(asset_id, transferred_at DESC);
CREATE INDEX idx_transfer_history_from ON transfer_history(from_address, transferred_at DESC);
CREATE INDEX idx_transfer_history_to ON transfer_history(to_address, transferred_at DESC);
CREATE INDEX idx_transfer_history_signature ON transfer_history(transaction_signature);

-- ============================================================================
-- Minting Queue Table
-- ============================================================================
-- Manages the queue of pending minting requests
CREATE TABLE IF NOT EXISTS minting_queue (
  id SERIAL PRIMARY KEY,
  request_id VARCHAR(64) UNIQUE NOT NULL,
  owner_address VARCHAR(44) NOT NULL,
  memory_content TEXT NOT NULL,
  memory_metadata JSONB,
  agent_id VARCHAR(64) NOT NULL,
  priority VARCHAR(10) NOT NULL DEFAULT 'medium',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  batch_id VARCHAR(64),
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- Indexes for minting_queue
CREATE INDEX idx_minting_queue_status ON minting_queue(status, priority, created_at);
CREATE INDEX idx_minting_queue_owner ON minting_queue(owner_address);
CREATE INDEX idx_minting_queue_batch ON minting_queue(batch_id);
CREATE INDEX idx_minting_queue_request ON minting_queue(request_id);

-- ============================================================================
-- Blockchain Audit Logs Table
-- ============================================================================
-- Comprehensive audit trail for all blockchain operations
CREATE TABLE IF NOT EXISTS blockchain_audit_logs (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(44) NOT NULL,
  action VARCHAR(50) NOT NULL,
  asset_id VARCHAR(64),
  transaction_signature VARCHAR(88),
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for blockchain_audit_logs
CREATE INDEX idx_audit_logs_wallet ON blockchain_audit_logs(wallet_address, timestamp DESC);
CREATE INDEX idx_audit_logs_action ON blockchain_audit_logs(action, timestamp DESC);
CREATE INDEX idx_audit_logs_asset ON blockchain_audit_logs(asset_id, timestamp DESC);
CREATE INDEX idx_audit_logs_timestamp ON blockchain_audit_logs(timestamp DESC);

-- ============================================================================
-- Version History Table
-- ============================================================================
-- Tracks version history for memory assets
CREATE TABLE IF NOT EXISTS version_history (
  id SERIAL PRIMARY KEY,
  asset_id VARCHAR(64) NOT NULL,
  version_number INTEGER NOT NULL,
  arweave_id VARCHAR(64) NOT NULL,
  content_hash VARCHAR(64) NOT NULL,
  changes_description TEXT,
  created_by VARCHAR(44) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB,
  CONSTRAINT fk_version_history_asset
    FOREIGN KEY (asset_id)
    REFERENCES memory_assets(asset_id)
    ON DELETE CASCADE,
  CONSTRAINT unique_asset_version UNIQUE (asset_id, version_number)
);

-- Indexes for version_history
CREATE INDEX idx_version_history_asset ON version_history(asset_id, version_number DESC);
CREATE INDEX idx_version_history_created ON version_history(created_at DESC);

-- ============================================================================
-- Merkle Trees Table
-- ============================================================================
-- Tracks Merkle trees used for compressed NFTs
CREATE TABLE IF NOT EXISTS merkle_trees (
  tree_address VARCHAR(44) PRIMARY KEY,
  max_depth INTEGER NOT NULL,
  max_buffer_size INTEGER NOT NULL,
  current_size INTEGER NOT NULL DEFAULT 0,
  capacity INTEGER NOT NULL,
  utilization_percent DECIMAL(5,2) GENERATED ALWAYS AS (
    (current_size::DECIMAL / capacity::DECIMAL) * 100
  ) STORED,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_mint_at TIMESTAMP,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
);

-- Indexes for merkle_trees
CREATE INDEX idx_merkle_trees_status ON merkle_trees(status);
CREATE INDEX idx_merkle_trees_utilization ON merkle_trees(utilization_percent);

-- ============================================================================
-- Cost Tracking Table
-- ============================================================================
-- Tracks costs for analytics and reporting
CREATE TABLE IF NOT EXISTS cost_tracking (
  id SERIAL PRIMARY KEY,
  operation_type VARCHAR(50) NOT NULL,
  operation_id VARCHAR(64) NOT NULL,
  wallet_address VARCHAR(44) NOT NULL,
  solana_cost_lamports BIGINT NOT NULL,
  arweave_cost_winston BIGINT NOT NULL,
  priority_fee_lamports BIGINT NOT NULL,
  total_cost_lamports BIGINT NOT NULL,
  total_cost_usd DECIMAL(10,4),
  sol_price_usd DECIMAL(10,4),
  ar_price_usd DECIMAL(10,4),
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for cost_tracking
CREATE INDEX idx_cost_tracking_operation ON cost_tracking(operation_type, timestamp DESC);
CREATE INDEX idx_cost_tracking_wallet ON cost_tracking(wallet_address, timestamp DESC);
CREATE INDEX idx_cost_tracking_timestamp ON cost_tracking(timestamp DESC);

-- ============================================================================
-- Triggers
-- ============================================================================

-- Update updated_at timestamp on memory_assets
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_memory_assets_updated_at
  BEFORE UPDATE ON memory_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Increment current_access on access_grants
CREATE OR REPLACE FUNCTION increment_access_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE access_grants
  SET current_access = current_access + 1
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Views
-- ============================================================================

-- Active memory assets view
CREATE OR REPLACE VIEW active_memory_assets AS
SELECT 
  ma.*,
  mb.transaction_signature,
  mb.confirmed_at,
  COUNT(ag.id) as active_grants_count
FROM memory_assets ma
LEFT JOIN memory_batches mb ON ma.batch_id = mb.batch_id
LEFT JOIN access_grants ag ON ma.asset_id = ag.asset_id 
  AND ag.revoked_at IS NULL
GROUP BY ma.asset_id, mb.transaction_signature, mb.confirmed_at;

-- Batch statistics view
CREATE OR REPLACE VIEW batch_statistics AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as batch_count,
  SUM(memory_count) as total_memories,
  AVG(memory_count) as avg_memories_per_batch,
  SUM(total_cost_lamports) as total_cost,
  AVG(total_cost_lamports) as avg_cost_per_batch
FROM memory_batches
WHERE status = 'completed'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- User statistics view
CREATE OR REPLACE VIEW user_statistics AS
SELECT 
  owner_address,
  COUNT(DISTINCT asset_id) as total_assets,
  COUNT(DISTINCT batch_id) as total_batches,
  MIN(created_at) as first_mint_at,
  MAX(created_at) as last_mint_at,
  SUM(CASE WHEN batch_id IS NOT NULL THEN 1 ELSE 0 END) as batched_mints,
  COUNT(DISTINCT agent_id) as unique_agents
FROM memory_assets
GROUP BY owner_address;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE memory_assets IS 'Indexed memory assets stored on blockchain';
COMMENT ON TABLE memory_batches IS 'Batches of memories minted together';
COMMENT ON TABLE access_grants IS 'Access control grants for memory assets';
COMMENT ON TABLE transfer_history IS 'History of asset ownership transfers';
COMMENT ON TABLE minting_queue IS 'Queue of pending minting operations';
COMMENT ON TABLE blockchain_audit_logs IS 'Audit trail for all blockchain operations';
COMMENT ON TABLE version_history IS 'Version history for memory assets';
COMMENT ON TABLE merkle_trees IS 'Merkle trees used for compressed NFTs';
COMMENT ON TABLE cost_tracking IS 'Cost tracking for analytics';

-- ============================================================================
-- Initial Data
-- ============================================================================

-- Insert default Merkle tree (if needed for testing)
-- INSERT INTO merkle_trees (tree_address, max_depth, max_buffer_size, capacity, status)
-- VALUES ('11111111111111111111111111111111', 14, 64, 16384, 'active')
-- ON CONFLICT (tree_address) DO NOTHING;

-- ============================================================================
-- Grants (adjust as needed for your environment)
-- ============================================================================

-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO blockchain_service;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO blockchain_service;

-- ============================================================================
-- Indexer State Table
-- ============================================================================
-- Stores indexer service state information
CREATE TABLE IF NOT EXISTS indexer_state (
  key VARCHAR(50) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for indexer_state
CREATE INDEX idx_indexer_state_updated ON indexer_state(updated_at DESC);

COMMENT ON TABLE indexer_state IS 'Stores indexer service state (e.g., last processed slot)';
