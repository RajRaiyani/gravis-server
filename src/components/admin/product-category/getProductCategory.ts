import { NextFunction, Request, Response } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import env from '@/config/env.js';

export const ValidationSchema = {
  params: z.object({
    id: z.uuid({ version: 'v7', message: 'Invalid product category ID' }),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient,
) {
  const { id } = req.params as z.infer<typeof ValidationSchema.params>;

  const categoryQuery = `
    SELECT
      pc.id,
      pc.name,
      pc.description,
      pc.image_id,
      pc.created_at,
      pc.updated_at,
      json_build_object(
        'id', f.id,
        'key', f.key,
        'url', ('${env.fileStorageEndpoint}/' || f.key)
      ) as image
    FROM product_categories pc
    LEFT JOIN files f ON pc.image_id = f.id
    WHERE pc.id = $1
  `;

  const category = await db.queryOne(categoryQuery, [id]);

  if (!category) {
    return res.status(404).json({ message: 'Product category not found' });
  }

  return res.status(200).json(category);
}

