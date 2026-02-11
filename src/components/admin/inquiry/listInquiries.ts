import { NextFunction, Request, Response } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import { ListInquiries } from '@/components/inquiry/inquiry.service.js';

export const ValidationSchema = {
  query: z.object({
    type: z.enum(['general', 'contact', 'product']).optional(),
    status: z.enum(['pending', 'in_progress', 'resolved', 'closed']).optional(),
    search: z.string().trim().optional(),
    offset: z.coerce
      .number()
      .int()
      .min(0, 'Offset must be greater than 0')
      .default(0),
    limit: z.coerce
      .number()
      .int()
      .min(1, 'Limit must be greater than 0')
      .max(100, 'Limit must be less than 100')
      .default(30),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { type, status, search, offset, limit } = req.validatedQuery as z.infer<
    typeof ValidationSchema.query
  >;

  try {
    const result = await ListInquiries(db, {
      type,
      status,
      search,
      offset,
      limit,
    });

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}
