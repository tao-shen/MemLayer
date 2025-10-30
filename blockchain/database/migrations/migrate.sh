#!/bin/bash

# Database Migration Script
# Manages PostgreSQL database migrations for blockchain memory assets

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="$SCRIPT_DIR"
MIGRATION_TABLE="schema_migrations"

# Database connection parameters (can be overridden by environment variables)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-memory_platform}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-}"

# Build connection string
if [ -n "$DB_PASSWORD" ]; then
  PGPASSWORD="$DB_PASSWORD"
  export PGPASSWORD
fi

PSQL_CMD="psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"

# Functions
print_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Check if database exists
check_database() {
  print_info "Checking database connection..."
  if $PSQL_CMD -c '\q' 2>/dev/null; then
    print_info "Database connection successful"
    return 0
  else
    print_error "Cannot connect to database"
    return 1
  fi
}

# Create migration tracking table
create_migration_table() {
  print_info "Creating migration tracking table..."
  $PSQL_CMD <<EOF
CREATE TABLE IF NOT EXISTS $MIGRATION_TABLE (
  id SERIAL PRIMARY KEY,
  version VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
EOF
  print_info "Migration tracking table ready"
}

# Get applied migrations
get_applied_migrations() {
  $PSQL_CMD -t -c "SELECT version FROM $MIGRATION_TABLE ORDER BY version;" 2>/dev/null || echo ""
}

# Check if migration is applied
is_migration_applied() {
  local version=$1
  local applied=$(get_applied_migrations)
  if echo "$applied" | grep -q "$version"; then
    return 0
  else
    return 1
  fi
}

# Apply a migration
apply_migration() {
  local migration_file=$1
  local version=$(basename "$migration_file" .sql)
  local name=$(echo "$version" | sed 's/^[0-9]*_//')

  if is_migration_applied "$version"; then
    print_warn "Migration $version already applied, skipping"
    return 0
  fi

  print_info "Applying migration: $version"
  
  # Start transaction
  $PSQL_CMD <<EOF
BEGIN;

-- Apply migration
\i $migration_file

-- Record migration
INSERT INTO $MIGRATION_TABLE (version, name) VALUES ('$version', '$name');

COMMIT;
EOF

  if [ $? -eq 0 ]; then
    print_info "Migration $version applied successfully"
    return 0
  else
    print_error "Migration $version failed"
    return 1
  fi
}

# Rollback a migration
rollback_migration() {
  local version=$1
  
  if ! is_migration_applied "$version"; then
    print_warn "Migration $version not applied, nothing to rollback"
    return 0
  fi

  # Check if rollback file exists
  local rollback_file="${MIGRATIONS_DIR}/${version}_rollback.sql"
  if [ ! -f "$rollback_file" ]; then
    print_error "Rollback file not found: $rollback_file"
    return 1
  fi

  print_info "Rolling back migration: $version"
  
  $PSQL_CMD <<EOF
BEGIN;

-- Apply rollback
\i $rollback_file

-- Remove migration record
DELETE FROM $MIGRATION_TABLE WHERE version = '$version';

COMMIT;
EOF

  if [ $? -eq 0 ]; then
    print_info "Migration $version rolled back successfully"
    return 0
  else
    print_error "Rollback of migration $version failed"
    return 1
  fi
}

# Run all pending migrations
migrate_up() {
  print_info "Running pending migrations..."
  
  local migration_files=$(ls -1 "$MIGRATIONS_DIR"/*.sql 2>/dev/null | grep -v "_rollback.sql" | sort)
  
  if [ -z "$migration_files" ]; then
    print_warn "No migration files found"
    return 0
  fi

  local applied_count=0
  local skipped_count=0

  for migration_file in $migration_files; do
    if apply_migration "$migration_file"; then
      applied_count=$((applied_count + 1))
    else
      print_error "Migration failed, stopping"
      return 1
    fi
  done

  print_info "Migrations complete: $applied_count applied"
}

# Show migration status
show_status() {
  print_info "Migration Status:"
  echo ""
  
  local applied=$(get_applied_migrations)
  
  if [ -z "$applied" ]; then
    print_warn "No migrations applied yet"
    return 0
  fi

  echo "Applied migrations:"
  $PSQL_CMD -c "SELECT version, name, applied_at FROM $MIGRATION_TABLE ORDER BY version;"
}

# Reset database (DANGEROUS!)
reset_database() {
  print_warn "This will drop all tables and reset the database!"
  read -p "Are you sure? (yes/no): " confirm
  
  if [ "$confirm" != "yes" ]; then
    print_info "Reset cancelled"
    return 0
  fi

  print_info "Resetting database..."
  
  $PSQL_CMD <<EOF
-- Drop all tables
DROP TABLE IF EXISTS cost_tracking CASCADE;
DROP TABLE IF EXISTS merkle_trees CASCADE;
DROP TABLE IF EXISTS version_history CASCADE;
DROP TABLE IF EXISTS blockchain_audit_logs CASCADE;
DROP TABLE IF EXISTS minting_queue CASCADE;
DROP TABLE IF EXISTS transfer_history CASCADE;
DROP TABLE IF EXISTS access_grants CASCADE;
DROP TABLE IF EXISTS memory_batches CASCADE;
DROP TABLE IF EXISTS memory_assets CASCADE;
DROP TABLE IF EXISTS $MIGRATION_TABLE CASCADE;

-- Drop views
DROP VIEW IF EXISTS user_statistics CASCADE;
DROP VIEW IF EXISTS batch_statistics CASCADE;
DROP VIEW IF EXISTS active_memory_assets CASCADE;
EOF

  print_info "Database reset complete"
}

# Main command handler
case "${1:-}" in
  up)
    check_database || exit 1
    create_migration_table
    migrate_up
    ;;
  
  down)
    if [ -z "$2" ]; then
      print_error "Usage: $0 down <version>"
      exit 1
    fi
    check_database || exit 1
    rollback_migration "$2"
    ;;
  
  status)
    check_database || exit 1
    create_migration_table
    show_status
    ;;
  
  reset)
    check_database || exit 1
    reset_database
    ;;
  
  *)
    echo "Database Migration Tool"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  up              Run all pending migrations"
    echo "  down <version>  Rollback a specific migration"
    echo "  status          Show migration status"
    echo "  reset           Reset database (drop all tables)"
    echo ""
    echo "Environment Variables:"
    echo "  DB_HOST         Database host (default: localhost)"
    echo "  DB_PORT         Database port (default: 5432)"
    echo "  DB_NAME         Database name (default: memory_platform)"
    echo "  DB_USER         Database user (default: postgres)"
    echo "  DB_PASSWORD     Database password"
    echo ""
    exit 1
    ;;
esac
