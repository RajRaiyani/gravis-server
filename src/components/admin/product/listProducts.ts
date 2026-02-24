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
    offset: z.coerce.number().int().min(0, 'Offset must be 0 or greater').default(0),
    limit: z.coerce.number().int().min(1, 'Limit must be greater than 0').max(100, 'Limit must be less than 100').default(30),
    option_ids: z.unknown().optional(),
    filter_option_ids: z.unknown().optional(),
    only_featured: z
      .union([z.boolean(), z.literal('true'), z.literal('false'), z.string()])
      .optional()
      .transform((v) => v === true || v === 'true'),
  })
    .transform((q) => {
      const uuidV7 = z.string().uuid({ version: 'v7', message: 'Invalid option ID' });
      const norm = (val: unknown): string[] => {
        if (val == null) return [];
        const arr = Array.isArray(val) ? val : [val];
        return arr.filter((x): x is string => typeof x === 'string' && uuidV7.safeParse(x).success);
      };
      const merged = [...new Set([...norm(q.option_ids), ...norm(q.filter_option_ids)])];
      return { ...q, filter_option_ids: merged };
    }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient,
) {
  try {
    const { category_id, search, offset, limit, filter_option_ids, only_featured } = req.validatedQuery as z.infer<typeof ValidationSchema.query>;

    const customer_id = req.customer?.id;

    const data = await ListProducts(db, {
      category_id,
      search,
      offset,
      limit,
      customer_id,
      filter_option_ids,
      only_featured,
    });

    return res.status(200).json(data);
  } catch (error) {
    return next(error);
  }
}
