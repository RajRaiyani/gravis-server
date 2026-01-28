import { NextFunction, Request, Response } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import env from '@/config/env.js';

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {

  const listQuery = `
    SELECT
      pc.id,
      pc.name,
      pc.description,
      pc.image_id,
      json_build_object(
        'id', f.id,
        'key', f.key,
        'url', ('${env.fileStorageEndpoint}/' || f.key)
      ) as image
    FROM product_categories pc
    LEFT JOIN files f ON pc.image_id = f.id
  `;

  const data = await db.queryAll(listQuery);

  return res.status(200).json(data);
}

