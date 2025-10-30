# Blockchain Database Schema

This directory contains the PostgreSQL database schema and migrations for the blockchain memory assets system.

## Overview

The database schema supports:
- Memory asset indexing and metadata storage
- Batch minting tracking
- Access control management
- Transfer history
- Audit logging
- Cost tracking and analytics

## Database Tables

### Core Tables

1. **memory_assets** - Indexed memory assets on blockchain
   - Primary key: `asset_id`
   - Stores asset metadata, ownership, and references to Arweave

2. **memory_batches** - Batch minting information
   - Primary key: `batch_id`
   - Tracks batch status, costs, and transaction signatures

3. **access_grants** - Access control grants
   - Manages who can access which memory assets
   - Supports time-limited and usage-limited grants

4. **transfer_history** - Ownership transfer records
   - Complete audit trail of asset transfers

5. **minting_queue** - Pending minting operations
   - Manages asynchronous minting workflow

6. **blockchain_audit_logs** - Comprehensive audit trail
   - Records all blockchain operations

### Supporting Tables

7. **version_history** - Asset version tracking
8. **merkle_trees** - Merkle tree management
9. **cost_tracking** - Cost analytics

## Migrations

### Running Migrations

```bash
# Set database connection parameters
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=memory_platform
export DB_USER=postgres
export DB_PASSWORD=your_password

# Run all pending migrations
./migrations/migrate.sh up

# Check migration status
./migrations/migrate.sh status

# Rollback a specific migration
./migrations/migrate.sh down 001_create_blockchain_tables

# Reset database (DANGEROUS!)
./migrations/migrate.sh reset
```

### Migration Files

- `001_create_blockchain_tables.sql` - Initial schema creation
- `001_create_blockchain_tables_rollback.sql` - Rollback script
- `migrate.sh` - Migration management script

## Views

### active_memory_assets
Shows active memory assets with batch information and grant counts.

### batch_statistics
Daily statistics on batch minting operations.

### user_statistics
Per-user statistics on minting activity.

## Indexes

All tables have appropriate indexes for:
- Primary key lookups
- Foreign key relationships
- Common query patterns (by owner, by date, by status)
- Full-text search where applicable

## Triggers

- **update_memory_assets_updated_at** - Automatically updates `updated_at` timestamp

## Usage Examples

### Query user's memory assets

```sql
SELECT * FROM memory_assets
WHERE owner_address = 'wallet_address_here'
ORDER BY created_at DESC;
```

### Get batch statistics

```sql
SELECT * FROM batch_statistics
WHERE date >= CURRENT_DATE - INTERVAL '30 days';
```

### Check active access grants

```sql
SELECT ag.*, ma.owner_address
FROM access_grants ag
JOIN memory_assets ma ON ag.asset_id = ma.asset_id
WHERE ag.grantee_address = 'wallet_address_here'
  AND ag.revoked_at IS NULL
  AND (ag.expires_at IS NULL OR ag.expires_at > NOW());
```

### Track costs over time

```sql
SELECT 
  DATE_TRUNC('day', timestamp) as date,
  COUNT(*) as operations,
  SUM(total_cost_lamports) as total_cost,
  AVG(total_cost_lamports) as avg_cost
FROM cost_tracking
WHERE wallet_address = 'wallet_address_here'
GROUP BY DATE_TRUNC('day', timestamp)
ORDER BY date DESC;
```

## Maintenance

### Cleanup Old Records

```sql
-- Clean up old completed minting queue entries (older than 7 days)
DELETE FROM minting_queue
WHERE status = 'completed'
  AND completed_at < NOW() - INTERVAL '7 days';

-- Archive old audit logs (older than 90 days)
-- Consider moving to archive table instead of deleting
DELETE FROM blockchain_audit_logs
WHERE timestamp < NOW() - INTERVAL '90 days';
```

### Vacuum and Analyze

```bash
# Regular maintenance
psql -h localhost -U postgres -d memory_platform -c "VACUUM ANALYZE;"

# Full vacuum (requires more locks)
psql -h localhost -U postgres -d memory_platform -c "VACUUM FULL ANALYZE;"
```

## Backup and Restore

### Backup

```bash
# Full database backup
pg_dump -h localhost -U postgres -d memory_platform -F c -f backup.dump

# Schema only
pg_dump -h localhost -U postgres -d memory_platform -s -f schema.sql

# Data only
pg_dump -h localhost -U postgres -d memory_platform -a -f data.sql
```

### Restore

```bash
# Restore from custom format
pg_restore -h localhost -U postgres -d memory_platform -c backup.dump

# Restore from SQL
psql -h localhost -U postgres -d memory_platform -f backup.sql
```

## Performance Tuning

### Recommended PostgreSQL Settings

```ini
# postgresql.conf recommendations for blockchain workload

# Memory
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 16MB
maintenance_work_mem = 128MB

# Checkpoints
checkpoint_completion_target = 0.9
wal_buffers = 16MB

# Query Planning
random_page_cost = 1.1  # For SSD
effective_io_concurrency = 200

# Logging
log_min_duration_statement = 1000  # Log slow queries (>1s)
```

### Index Maintenance

```sql
-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;

-- Rebuild bloated indexes
REINDEX TABLE memory_assets;
```

## Security

### Recommended Permissions

```sql
-- Create dedicated user
CREATE USER blockchain_service WITH PASSWORD 'secure_password';

-- Grant necessary permissions
GRANT CONNECT ON DATABASE memory_platform TO blockchain_service;
GRANT USAGE ON SCHEMA public TO blockchain_service;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO blockchain_service;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO blockchain_service;

-- Revoke unnecessary permissions
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
```

### Row-Level Security (Optional)

```sql
-- Enable RLS on sensitive tables
ALTER TABLE memory_assets ENABLE ROW LEVEL SECURITY;

-- Create policy for owner access
CREATE POLICY owner_access ON memory_assets
  FOR ALL
  USING (owner_address = current_setting('app.current_user'));
```

## Monitoring

### Key Metrics to Monitor

1. **Table sizes**
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

2. **Query performance**
```sql
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

3. **Connection count**
```sql
SELECT count(*) FROM pg_stat_activity;
```

## Troubleshooting

### Common Issues

1. **Migration fails with "relation already exists"**
   - Check migration status: `./migrate.sh status`
   - Manually verify table existence
   - Consider running rollback first

2. **Slow queries**
   - Check EXPLAIN ANALYZE output
   - Verify indexes are being used
   - Consider adding missing indexes

3. **Disk space issues**
   - Run VACUUM to reclaim space
   - Archive old audit logs
   - Check for table bloat

## Development

### Adding New Migrations

1. Create new migration file: `002_your_migration_name.sql`
2. Create corresponding rollback: `002_your_migration_name_rollback.sql`
3. Test migration: `./migrate.sh up`
4. Test rollback: `./migrate.sh down 002_your_migration_name`
5. Commit both files

### Testing

```bash
# Create test database
createdb memory_platform_test

# Run migrations
DB_NAME=memory_platform_test ./migrate.sh up

# Run tests
npm test

# Cleanup
dropdb memory_platform_test
```
