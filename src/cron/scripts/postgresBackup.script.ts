import fs from 'fs';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

import env from '@/config/env.js';

const RETENTION_COUNT = 3;
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

function execPromise(cmd: string) {
  return new Promise<void>((resolve, reject) => {
    exec(cmd, (err) => (err ? reject(err) : resolve()));
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

  const oldFiles = files.slice(0, Math.max(0, files.length - RETENTION_COUNT));

  for (const f of oldFiles) {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: env.aws.s3Bucket!,
        Key: f.Key!,
      })
    );
  }
}
export async function task() {
  const date = formatTimestamp();
  const tmpFile = `/tmp/${date}.sql`;

  const { host, port, user, password, database } = env.database;
  const folder = `postgres/${database}/`;
  const key = `${folder}${date}.sql`;

  log('PG BACKUP STARTED');

  await execPromise(
    `PGPASSWORD=${password} pg_dump -h ${host} -p ${port} -U ${user} ${database} > ${tmpFile}`
  );

  await uploadToS3(tmpFile, key);
  fs.unlinkSync(tmpFile);
  await applyRetention(folder);

  log('PG BACKUP COMPLETED');
}

// AUTO RUN WHEN EXECUTED DIRECTLY
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  task().catch((err) => {
    console.error('PG BACKUP FAILED ❌');
    console.error(err);
    process.exit(1);
  });
}

