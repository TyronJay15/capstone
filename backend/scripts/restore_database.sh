#!/bin/bash
# ===============================================
# Grade Portal - Database Restore Script
# ===============================================
# Purpose: Restore database from backup
# Usage: ./restore_database.sh <backup_file>
# Example: ./restore_database.sh ./backups/gradeportal_20260524_120000.sql.gz

set -e

# Configuration
BACKUP_FILE="${1:?Error: Backup file path required. Usage: ./restore_database.sh <backup_file>}"
DB_HOST="${MYSQL_HOST:-localhost}"
DB_PORT="${MYSQL_PORT:-3306}"
DB_NAME="${MYSQL_DATABASE:-gradeportal}"
DB_USER="${MYSQL_USER:-gradeportal}"
DB_PASSWORD="${MYSQL_PASSWORD:-}"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Grade Portal Database Restore"
echo "=========================================="
echo

# Validate backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}✗ Error: Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

# Check file size
SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "📦 Backup file: $BACKUP_FILE"
echo "📊 File size: $SIZE"
echo

# Confirm restoration (safety check)
echo -e "${YELLOW}⚠️  WARNING: This will RESTORE the database from backup!${NC}"
echo -e "${YELLOW}This may overwrite current data in: $DB_NAME${NC}"
echo
read -p "Are you sure you want to restore? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Restore cancelled."
    exit 0
fi

echo
echo "⏳ Starting database restore..."

# Create temporary extraction
TEMP_DIR=$(mktemp -d)
TEMP_SQL="$TEMP_DIR/dump.sql"

# Extract gzip file
echo "🔧 Extracting backup file..."
gunzip -c "$BACKUP_FILE" > "$TEMP_SQL"

if [ ! -f "$TEMP_SQL" ] || [ ! -s "$TEMP_SQL" ]; then
    echo -e "${RED}✗ Failed to extract backup file!${NC}"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Test database connection
echo "🔍 Testing database connection..."
if [ -z "$DB_PASSWORD" ]; then
    CONNECT_TEST=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -e "SELECT 1" 2>&1)
else
    CONNECT_TEST=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1" 2>&1)
fi

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Failed to connect to database!${NC}"
    echo "Error: $CONNECT_TEST"
    rm -rf "$TEMP_DIR"
    exit 1
fi

echo "✓ Database connection successful"
echo

# Drop existing database or tables (optional - for full restore)
read -p "Drop existing database before restore? (yes/no): " DROP_DB

if [ "$DROP_DB" = "yes" ]; then
    echo "🗑️  Dropping existing database: $DB_NAME"
    if [ -z "$DB_PASSWORD" ]; then
        mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -e "DROP DATABASE IF EXISTS $DB_NAME;"
        mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -e "CREATE DATABASE $DB_NAME CHARACTER SET utf8mb4;"
    else
        mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "DROP DATABASE IF EXISTS $DB_NAME;"
        mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE $DB_NAME CHARACTER SET utf8mb4;"
    fi
    echo "✓ Database recreated"
else
    echo "⚠️  Restoring into existing database (will update tables)"
fi

echo
echo "⏳ Restoring database (this may take a while)..."

# Perform restore
if [ -z "$DB_PASSWORD" ]; then
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" "$DB_NAME" < "$TEMP_SQL"
else
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$TEMP_SQL"
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database restore completed successfully!${NC}"
else
    echo -e "${RED}✗ Database restore failed!${NC}"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Cleanup
rm -rf "$TEMP_DIR"

# Verify restore
echo
echo "🔍 Verifying restore..."
if [ -z "$DB_PASSWORD" ]; then
    TABLE_COUNT=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" "$DB_NAME" -se "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$DB_NAME';")
else
    TABLE_COUNT=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -se "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$DB_NAME';")
fi

echo "📊 Tables in database: $TABLE_COUNT"

if [ "$TABLE_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Database appears to be restored correctly${NC}"
else
    echo -e "${YELLOW}⚠️  Warning: No tables found in database${NC}"
fi

echo
echo -e "${GREEN}=========================================="
echo "Restore completed!"
echo "==========================================${NC}"
