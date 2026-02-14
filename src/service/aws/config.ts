import { S3Client } from '@aws-sdk/client-s3';
import z from 'zod';
import env from '@/config/env.js';


const awsSchema = z.object({
  region: z.string().min(2).max(255),
  accessKeyId: z.string().min(3).max(255),
  secretAccessKey: z.string().min(3).max(255),
});

const { data: awsOptions, error, success } = awsSchema.safeParse({
  region: env.aws.region,
  accessKeyId: env.aws.accessKeyId,
  secretAccessKey: env.aws.secretAccessKey,
});

if (!success) throw new Error(`Invalid ENV options AWS: ${error.message}`);


export const s3 = new S3Client({
  region: awsOptions.region,
  credentials: {
    accessKeyId: awsOptions.accessKeyId,
    secretAccessKey: awsOptions.secretAccessKey,
  },
});

