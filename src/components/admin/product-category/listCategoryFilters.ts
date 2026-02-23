import { NextFunction, Request, Response } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import { listCategoryFilters } from '@/components/admin/product-category/productCategory.service.js';

export const ValidationSchema = {
  params: z.object({
    category_id: z.uuid({ version: 'v7', message: 'Invalid category ID' }),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient,
) {
  try {
    const { category_id } = req.params as z.infer<typeof ValidationSchema.params>;
    const filters = await listCategoryFilters(db, category_id);
    return res.status(200).json(filters);
  } catch (error) {
    return next(error);
  }
}
