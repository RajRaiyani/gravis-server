import fs from 'fs';
import archiver from 'archiver';
import path from 'path';
import { fileURLToPath } from 'url';
import { s3 } from '@/service/aws/index.js';
import {
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import Constants from '@/config/constant.js';
import env from '@/config/env.js';

/* ---------------- CONFIG ---------------- */

const SOURCE_DIR = env.fileStoragePath;
const RETENTION_COUNT = 2;
const BACKUP_BUCKET = env.aws.s3BackupBucket;
const s3BackupKey = 'gravis/file-backups';



function formatTimestamp(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${day}_${h}-${min}-${s}`;
}


/* ---------------- HELPERS ---------------- */

async function zipFolder(source: string, out: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(out);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);
    archive.directory(source, false);
    archive.finalize();

    output.on('close', resolve);
    archive.on('error', reject);
  });
}

async function uploadToS3(filePath: string, key: string) {
  const stream = fs.createReadStream(filePath);

  await s3.send(
    new PutObjectCommand({
      Bucket: BACKUP_BUCKET,
      Key: key,
      Body: stream,
    })
  );
}

async function applyRetention(prefix: string) {
  const res = await s3.send(
    new ListObjectsV2Command({
      Bucket: BACKUP_BUCKET,
      Prefix: prefix,
    })
  );

  const files = (res.Contents || []).sort(
    (a, b) =>
      new Date(a.LastModified!).getTime() -
      new Date(b.LastModified!).getTime()
  );

  if (files.length <= RETENTION_COUNT) return;

  const oldFiles = files.slice(0, files.length - RETENTION_COUNT);

  for (const f of oldFiles) {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: BACKUP_BUCKET,
        Key: f.Key!,
      })
    );
  }

}

/* ---------------- MAIN TASK ---------------- */

export async function task() {

  const date = formatTimestamp();

  // Local temp zip file
  const zipPath = path.join(Constants.temporaryFileStoragePath, `${date}.zip`);

  // Final S3 object key
  const key = path.join(s3BackupKey, `${date}.zip`);

  await zipFolder(SOURCE_DIR, zipPath);

  await uploadToS3(zipPath, key);

  fs.unlinkSync(zipPath);

  await applyRetention(s3BackupKey);

}

/* ---------------- AUTO RUN ---------------- */

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  task().catch(console.error);
}
