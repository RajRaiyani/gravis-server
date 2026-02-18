import { NextFunction, Request, Response } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import { ListProducts } from '@/components/product/product.service.js';

export const ValidationSchema = {
  // Explicitly declare empty params so validator doesn't expect an :id
  params: z.object({}),
  query: z.object({
    limit: z
      .coerce
      .number()
      .int()
      .min(1, 'Limit must be greater than 0')
      .max(100, 'Limit must be less than 100')
      .default(10),
    offset: z
      .coerce
      .number()
      .int()
      .min(0, 'Offset must be greater than or equal to 0')
      .default(0),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient,
) {
  try {
    const { limit, offset } = req.validatedQuery as z.infer<typeof ValidationSchema.query>;

    const customer_id = req.customer?.id;

    const data = await ListProducts(db, {
      limit,
      offset,
      customer_id,
      only_featured: true,
    });

    return res.status(200).json(data);
  } catch (error) {
    return next(error);
  }
}

