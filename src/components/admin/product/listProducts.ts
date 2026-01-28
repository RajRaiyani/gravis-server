import { NextFunction, Request, Response } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import env from '@/config/env.js';

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient,
) {
  const listQuery = `
    SELECT
      p.id,
      p.category_id,
      p.name,
      p.description,
      p.tags,
      p.metadata,
      p.sale_price_in_paisa,
      p.sale_price_in_rupee,
      p.sale_price_in_rupee as sale_price,
      p.created_at,
      p.updated_at,
      p.points,
      json_build_object(
        'id', pc.id,
        'name', pc.name
      ) as category,
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'image_id', pi.image_id,
            'is_primary', pi.is_primary,
            'image', json_build_object(
              'id', f.id,
              'key', f.key,
              'url', ('${env.fileStorageEndpoint}/' || f.key)
            )
          )
        ) FILTER (WHERE pi.image_id IS NOT NULL),
        '[]'::json
      ) as images
    FROM products p
    LEFT JOIN product_categories pc ON p.category_id = pc.id
    LEFT JOIN product_images pi ON p.id = pi.product_id
    LEFT JOIN files f ON pi.image_id = f.id
    GROUP BY p.id, pc.id, pc.name
    ORDER BY p.created_at DESC
  `;

  const data = await db.queryAll(listQuery);

  return res.status(200).json(data);
}

