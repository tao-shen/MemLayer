-- Rollback Migration: 001_create_blockchain_tables
-- Description: Drop all blockchain-related tables and objects

-- Drop views
DROP VIEW IF EXISTS user_statistics CASCADE;
DROP VIEW IF EXISTS batch_statistics CASCADE;
DROP VIEW IF EXISTS active_memory_assets CASCADE;

-- Drop triggers
DROP TRIGGER IF EXISTS update_memory_assets_updated_at ON memory_assets;

-- Drop functions
DROP FUNCTION IF EXISTS increment_access_count();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop tables (in reverse order of dependencies)
DROP TABLE IF EXISTS cost_tracking CASCADE;
DROP TABLE IF EXISTS merkle_trees CASCADE;
DROP TABLE IF EXISTS version_history CASCADE;
DROP TABLE IF EXISTS blockchain_audit_logs CASCADE;
DROP TABLE IF EXISTS minting_queue CASCADE;
DROP TABLE IF EXISTS transfer_history CASCADE;
DROP TABLE IF EXISTS access_grants CASCADE;
DROP TABLE IF EXISTS memory_batches CASCADE;
DROP TABLE IF EXISTS memory_assets CASCADE;

-- Note: We don't drop the UUID extension as it might be used by other parts of the system
-- DROP EXTENSION IF EXISTS "uuid-ossp";
