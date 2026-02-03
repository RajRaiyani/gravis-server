import { NextFunction, Request, Response } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import { ListProducts } from '@/components/product/product.service.js';

export const ValidationSchema = {
  query: z.object({
    category_id: z
      .uuid({ version: 'v7', message: 'Invalid category ID' })
      .optional(),
    search: z.string().trim().toLowerCase().optional(),
    offset: z.coerce.number().int().min(0, 'Offset must be greater than 0').default(0),
    limit: z.coerce.number().int().min(1, 'Limit must be greater than 0').max(100, 'Limit must be less than 100').default(30),
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

    const data = await ListProducts(db, { category_id, search, offset, limit });

    return res.status(200).json(data);

  } catch (error) {
    return next(error);
  }
}

