import fs from 'fs';
import archiver from 'archiver';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

import env from '@/config/env.js';

/* ---------------- CONFIG ---------------- */

const SOURCE_DIR = '/Users/yashchauhan/Downloads/Gravish';
const RETENTION_COUNT = 4;

const s3 = new S3Client({
  region: env.aws.region!,
  credentials: {
    accessKeyId: env.aws.accessKeyId!,
    secretAccessKey: env.aws.secretAccessKey!,
  },
});

function formatTimestamp(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${day}_${h}-${min}-${s}`;
}

function formatLogTime(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${day} ${h}:${min}:${s}`;
}

const log = (msg: string) =>
  console.log(`[${formatLogTime()}] ${msg}`);

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
      Bucket: env.aws.s3Bucket!,
      Key: key,
      Body: stream,
    })
  );
}

async function applyRetention(prefix: string) {
  const res = await s3.send(
    new ListObjectsV2Command({
      Bucket: env.aws.s3Bucket!,
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
        Bucket: env.aws.s3Bucket!,
        Key: f.Key!,
      })
    );
  }

  log(`Retention cleanup: deleted ${oldFiles.length} old archives`);
}

/* ---------------- MAIN TASK ---------------- */

export async function task() {
  const start = Date.now();

  try {
    const date = formatTimestamp();

    // Extract folder name dynamically
    const folderName = path.basename(SOURCE_DIR);

    // Folder structure in S3
    const s3Folder = `folder_backup/${folderName}/`;

    // Local temp zip file
    const zipPath = `/tmp/${folderName}-${date}.zip`;

    // Final S3 object key
    const key = `${s3Folder}${date}.zip`;

    log('FOLDER BACKUP STARTED');
    log(`Source: ${SOURCE_DIR}`);
    log(`S3 Path: s3://${env.aws.s3Bucket}/${key}`);

    log('Zipping folder...');
    await zipFolder(SOURCE_DIR, zipPath);

    const sizeMB = (fs.statSync(zipPath).size / 1024 / 1024).toFixed(2);
    log(`Zip created (${sizeMB} MB)`);

    log('Uploading to S3...');
    await uploadToS3(zipPath, key);

    fs.unlinkSync(zipPath);
    log('Local temp file removed');

    await applyRetention(s3Folder);

    const duration = ((Date.now() - start) / 1000).toFixed(1);
    log(`FOLDER BACKUP COMPLETED in ${duration}s`);
  } catch (err) {
    log('FOLDER BACKUP FAILED ❌');
    console.error(err);
    process.exit(1);
  }
}

/* ---------------- AUTO RUN ---------------- */

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  task();
}
