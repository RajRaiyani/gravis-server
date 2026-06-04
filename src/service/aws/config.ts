import { existsSync } from 'fs';
import { S3Client } from '@aws-sdk/client-s3';
import z from 'zod';
import env from '@/config/env.js';

const awsSchema = z.object({
  region: z.string().min(2).max(255),
  accessKeyId: z.string().min(3).max(255),
  secretAccessKey: z.string().min(3).max(255),
});

let cachedClient: S3Client | null = null;

export function isAwsConfigured(): boolean {
  return awsSchema.safeParse({
    region: env.aws.region,
    accessKeyId: env.aws.accessKeyId,
    secretAccessKey: env.aws.secretAccessKey,
  }).success;
}

/** Returns S3 client; throws only when called without valid AWS env. */
export function getS3(): S3Client {
  if (cachedClient) return cachedClient;

  const { data: awsOptions, error, success } = awsSchema.safeParse({
    region: env.aws.region,
    accessKeyId: env.aws.accessKeyId,
    secretAccessKey: env.aws.secretAccessKey,
  });

  if (!success) {
    throw new Error(
      `AWS is not configured. Set AWS_REGION, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY. ${error.message}`,
    );
  }

  cachedClient = new S3Client({
    region: awsOptions.region,
    credentials: {
      accessKeyId: awsOptions.accessKeyId,
      secretAccessKey: awsOptions.secretAccessKey,
    },
  });

  return cachedClient;
}

export function isS3BackupConfigured(): boolean {
  return isAwsConfigured() && !!env.aws.s3BackupBucket;
}
