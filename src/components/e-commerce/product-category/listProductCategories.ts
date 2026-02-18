import { NextFunction, Request, Response } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import env from '@/config/env.js';

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient,
) {
  try {
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
        ) as image,
        json_build_object(
          'id', fb.id,
          'key', fb.key,
          'url', ('${env.fileStorageEndpoint}/' || fb.key)
        ) as banner_image
      FROM product_categories pc
      LEFT JOIN files f ON pc.image_id = f.id
      LEFT JOIN files fb ON pc.banner_image_id = fb.id
      ORDER BY pc.name ASC
    `;

    const data = await db.queryAll(listQuery);

    return res.status(200).json(data);
  } catch (error) {
    return next(error);
  }
}

