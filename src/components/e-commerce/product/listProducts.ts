import { NextFunction, Request, Response } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import { ListProducts } from '@/components/product/product.service.js';

const uuidString = z.uuid({ version: 'v7', message: 'Invalid option ID' });

export const ValidationSchema = {
  query: z.object({
    category_id: z
      .uuid({ version: 'v7', message: 'Invalid category ID' })
      .optional(),
    search: z.string().trim().toLowerCase().optional(),
    offset: z.coerce.number().int().min(0, 'Offset must be greater than 0').default(0),
    limit: z.coerce.number().int().min(1, 'Limit must be greater than 0').max(100, 'Limit must be less than 100').default(30),
    option_ids: z.array(z.uuid({ version: 'v7', message: 'Invalid option ID' })).optional(),
    option_id: z.union([uuidString, z.array(uuidString)]).optional(),
  }),
};

function parseOptionIds(query: { option_ids?: string; option_id?: string | string[] }): string[] | undefined {
  const fromOptionIds = query.option_ids
    ? query.option_ids.split(',').map((id) => id.trim()).filter(Boolean)
    : [];
  const fromOptionId = query.option_id != null
    ? (Array.isArray(query.option_id) ? query.option_id : [query.option_id])
    : [];
  const raw = fromOptionIds.length > 0 ? fromOptionIds : fromOptionId;
  if (raw.length === 0) return undefined;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const valid = raw.filter((id) => uuidRegex.test(id));
  return valid.length > 0 ? valid : undefined;
}

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient,
) {
  try {
    const query = req.validatedQuery as z.infer<typeof ValidationSchema.query>;
    const { category_id, search, offset, limit } = query;
    const option_ids = parseOptionIds(query);

    const customer_id = req.customer?.id;

    const data = await ListProducts(db, {
      category_id,
      search,
      offset,
      limit,
      customer_id,
      option_ids,
    });

    return res.status(200).json(data);
  } catch (error) {
    return next(error);
  }
}
