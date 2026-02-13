#!/bin/bash
set -e

####################################
# DATABASE CONFIG
####################################
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="gravis"
DB_USER="postgres"
DB_PASSWORD="yash2117"

####################################
# TEMP BACKUP LOCATION
####################################
TMP_DIR="/tmp"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
FILE_NAME="$DB_NAME-$DATE.sql"
FILE_PATH="$TMP_DIR/$FILE_NAME"

####################################
# S3 CONFIG
####################################
S3_BUCKET="s3://sfpl-backup/postgres/"
RETENTION_COUNT=3

####################################
# START
####################################
export PGPASSWORD="$DB_PASSWORD"

echo "=============================="
echo "Backup started: $(date)"
echo "=============================="

####################################
# CREATE BACKUP
####################################
if ! pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" \
  > "$FILE_PATH"; then
  echo "❌ Database dump failed"
  exit 1
fi

echo "✔ Database dumped"

####################################
# UPLOAD TO S3
####################################
if ! aws s3 cp "$FILE_PATH" "$S3_BUCKET"; then
  echo "❌ Upload to S3 failed"
  exit 1
fi

echo "✔ Uploaded to S3"

####################################
# DELETE LOCAL FILE IMMEDIATELY
####################################
rm -f "$FILE_PATH"
echo "✔ Local temp file removed"

####################################
# S3 RETENTION (KEEP LAST 3)
####################################
echo "Running S3 retention cleanup..."

TOTAL_FILES=$(aws s3 ls "$S3_BUCKET" | wc -l)

if [ "$TOTAL_FILES" -gt "$RETENTION_COUNT" ]; then
  DELETE_COUNT=$((TOTAL_FILES - RETENTION_COUNT))

  aws s3 ls "$S3_BUCKET" \
    | sort \
    | head -n "$DELETE_COUNT" \
    | awk '{print $4}' \
    | xargs -I {} aws s3 rm "$S3_BUCKET{}"

  echo "✔ Deleted $DELETE_COUNT old backup(s) from S3"
else
  echo "✔ No old backups to delete from S3"
fi

unset PGPASSWORD

echo "=============================="
echo "Backup completed successfully"
echo "=============================="
