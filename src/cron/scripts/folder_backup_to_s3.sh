#!/bin/bash
set -e

####################################
# SOURCE FOLDER
####################################
SOURCE_DIR="/Users/yashchauhan/Downloads/Gravish"

####################################
# TEMP ZIP LOCATION
####################################
TMP_DIR="/tmp"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
ZIP_NAME="Gravish-$DATE.zip"
ZIP_PATH="$TMP_DIR/$ZIP_NAME"

####################################
# S3 CONFIG
####################################
S3_BUCKET="s3://sfpl-backup/folder_backup/"
RETENTION_COUNT=3

####################################
# START
####################################
echo "=============================="
echo "Folder backup started: $(date)"
echo "=============================="

####################################
# ZIP FOLDER
####################################
cd "$(dirname "$SOURCE_DIR")" || exit

if ! zip -r "$ZIP_PATH" "$(basename "$SOURCE_DIR")"; then
  echo "❌ Zip failed"
  exit 1
fi

echo "✔ Folder zipped"

####################################
# UPLOAD TO S3
####################################
if ! aws s3 cp "$ZIP_PATH" "$S3_BUCKET"; then
  echo "❌ Upload failed"
  exit 1
fi

echo "✔ Uploaded to S3"

####################################
# DELETE LOCAL ZIP
####################################
rm -f "$ZIP_PATH"
echo "✔ Local zip removed"

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
  echo "✔ No old backups to delete"
fi

echo "=============================="
echo "Folder backup completed"
echo "=============================="
