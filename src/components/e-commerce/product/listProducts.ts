import { NextFunction, Request, Response } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import env from '@/config/env.js';

export const ValidationSchema = {
  query: z.object({
    category_id: z
      .uuid({ version: 'v7', message: 'Invalid category ID' })
      .optional(),
    search: z.string().trim().toLowerCase().optional(),
    offset: z.string().default('0').transform(val => parseInt(val, 10))
      .pipe(z.number().int().min(0, 'Offset must be greater than 0')),
    limit: z.string().default('30').transform(val => parseInt(val, 10))
      .pipe(z.number().int().min(1, 'Limit must be greater than 0').max(100, 'Limit must be less than 100')),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient,
) {
  try {
    const { category_id, search, offset, limit } = req.validatedQuery as z.infer<typeof ValidationSchema.query>;


    // Build WHERE conditions
    let whereClause = ' WHERE 1=1 ';

    if (category_id) whereClause += ' AND p.category_id = $category_id';

    if (search) whereClause += ' AND (p.name ILIKE LOWER($search)) ';


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
      ${whereClause}
      GROUP BY p.id, pc.id, pc.name, pc.description, fp.id, fp.key
      ORDER BY p.created_at DESC
      LIMIT $limit OFFSET $offset
    `;


    const data = await db.namedQueryAll(listQuery, {
      limit,
      offset,
      category_id,
      search: search ? `%${search}%` : null,
    });

    return res.status(200).json(data);

  } catch (error) {
    return next(error);
  }
}

