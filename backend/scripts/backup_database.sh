#!/bin/bash
# ===============================================
# Grade Portal - Database Backup Script
# ===============================================
# Purpose: Create automated backups of MySQL database
# Usage: ./backup_database.sh [backup_dir] [days_to_keep]
# Example: ./backup_database.sh ./backups 30

set -e

# Configuration
BACKUP_DIR="${1:-./ backups}"
DAYS_TO_KEEP="${2:-30}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/gradeportal_$TIMESTAMP.sql.gz"

# MySQL credentials (use environment variables)
DB_HOST="${MYSQL_HOST:-localhost}"
DB_PORT="${MYSQL_PORT:-3306}"
DB_NAME="${MYSQL_DATABASE:-gradeportal}"
DB_USER="${MYSQL_USER:-gradeportal}"
DB_PASSWORD="${MYSQL_PASSWORD:-}"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Grade Portal Database Backup"
echo "=========================================="
echo "Timestamp: $TIMESTAMP"
echo "Database: $DB_NAME"
echo "Backup Directory: $BACKUP_DIR"
echo

# Create backup directory if it doesn't exist
if [ ! -d "$BACKUP_DIR" ]; then
    echo "📁 Creating backup directory: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
fi

# Perform backup
echo "⏳ Starting database backup..."

if [ -z "$DB_PASSWORD" ]; then
    # Without password (for socket authentication)
    mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" \
        --single-transaction --quick --lock-tables=false \
        "$DB_NAME" | gzip > "$BACKUP_FILE"
else
    # With password
    mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" \
        --single-transaction --quick --lock-tables=false \
        "$DB_NAME" | gzip > "$BACKUP_FILE"
fi

if [ $? -eq 0 ]; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}✓ Backup completed successfully${NC}"
    echo "📦 File: $BACKUP_FILE"
    echo "📊 Size: $SIZE"
else
    echo -e "${RED}✗ Backup failed!${NC}"
    exit 1
fi

# Clean up old backups
echo
echo "🧹 Cleaning up backups older than $DAYS_TO_KEEP days..."
CUTOFF_DATE=$(date -d "$DAYS_TO_KEEP days ago" +"%Y%m%d")

OLD_FILES=0
while IFS= read -r file; do
    if [ -f "$file" ]; then
        FILE_DATE=$(basename "$file" | sed 's/gradeportal_\([0-9]*\)_.*/\1/')
        if [ "$FILE_DATE" -lt "$CUTOFF_DATE" ]; then
            echo "🗑️  Removing: $(basename "$file")"
            rm "$file"
            ((OLD_FILES++))
        fi
    fi
done < <(find "$BACKUP_DIR" -name "gradeportal_*.sql.gz" -type f)

if [ $OLD_FILES -gt 0 ]; then
    echo "✓ Removed $OLD_FILES old backup(s)"
else
    echo "✓ No old backups to remove"
fi

# Show current backups
echo
echo "📋 Current backups:"
ls -lh "$BACKUP_DIR"/gradeportal_*.sql.gz 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'

echo
echo -e "${GREEN}=========================================="
echo "Backup completed successfully!"
echo "==========================================${NC}"
