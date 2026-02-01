import { NextFunction, Request, Response } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import env from '@/config/env.js';

export const ValidationSchema = {
  params: z.object({
    id: z.string().uuid({ message: 'Invalid product ID' }),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient,
) {
  try {
    const { id } = req.params as z.infer<typeof ValidationSchema.params>;

    const productQuery = `
      SELECT
        p.id,
        p.category_id,
        p.name,
        p.description,
        p.tags,
        p.metadata,
        p.sale_price_in_paisa,
        p.sale_price_in_rupee,
        p.created_at,
        p.updated_at,
        p.points,
        json_build_object(
          'id', pc.id,
          'name', pc.name,
          'description', pc.description
        ) as category,
        json_build_object(
          'id', fp.id,
          'key', fp.key,
          'url', ('${env.fileStorageEndpoint}/' || fp.key)
        ) as primary_image,
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
      LEFT JOIN product_images ppi ON p.id = ppi.product_id AND ppi.is_primary = true
      LEFT JOIN files f ON pi.image_id = f.id
      LEFT JOIN files fp ON ppi.image_id = fp.id
      WHERE p.id = $1
      GROUP BY p.id, pc.id, pc.name, pc.description, fp.id, fp.key
    `;

    const product = await db.queryOne(productQuery, [id]);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.status(200).json(product);
  } catch (error) {
    return next(error);
  }
}

