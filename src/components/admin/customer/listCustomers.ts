import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';

export const ValidationSchema = {
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
    sort_by: z.enum(['created_at', 'first_name', 'email']).default('created_at'),
    sort_order: z.enum(['asc', 'desc']).default('desc'),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const search = (req.query.search as string) || null;
  const sort_by = (req.query.sort_by as string) || 'created_at';
  const sort_order = (req.query.sort_order as string) || 'desc';

  const allowedSortBy = ['created_at', 'first_name', 'email'];
  const safeSortBy = allowedSortBy.includes(sort_by) ? sort_by : 'created_at';
  const safeSortOrder = sort_order === 'asc' ? 'asc' : 'desc';

  const offset = (page - 1) * limit;

  let whereClause = '';
  const params: any[] = [];
  let paramIndex = 1;

  if (search && search.trim() !== '') {
    whereClause = `WHERE (
      LOWER(first_name) LIKE LOWER($${paramIndex}) OR
      LOWER(last_name) LIKE LOWER($${paramIndex}) OR
      LOWER(email) LIKE LOWER($${paramIndex}) OR
      LOWER(full_name) LIKE LOWER($${paramIndex})
    )`;
    params.push(`%${search.trim()}%`);
    paramIndex++;
  }

  const countQuery = `SELECT COUNT(*) as total FROM customers ${whereClause}`;
  const countResult = await db.queryOne<{ total: string }>(countQuery, params);
  const total = parseInt(countResult?.total || '0', 10);

  const limitParamIndex = paramIndex;
  const offsetParamIndex = paramIndex + 1;
  const dataParams = [...params, limit, offset];

  const customers = await db.queryAll(
    `SELECT
      id, first_name, last_name, full_name, email,
      phone_number, is_email_verified, is_phone_number_verified,
      created_at, updated_at
    FROM customers
    ${whereClause}
    ORDER BY ${safeSortBy} ${safeSortOrder}
    LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}`,
    dataParams
  );

  return res.status(200).json({
    customers,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  });
}
