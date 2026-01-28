import { NextFunction, Request, Response } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';

export const ValidationSchema = {
  query: z.object({
    offset: z
      .string()
      .default('0')
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().int().min(0, 'Offset must be greater than or equal to 0')),
    limit: z
      .string()
      .default('30')
      .transform((val) => parseInt(val, 10))
      .pipe(
        z.number().int().min(1, 'Limit must be greater than 0').max(100, 'Limit must be less than 100'),
      ),
    status: z.enum(['pending', 'in_progress', 'resolved', 'closed'],'Invalid status').optional(),
    search: z.string().trim().optional(),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient,
) {
  try {
    const { offset, limit, status, search } = req.validatedQuery as z.infer<
      typeof ValidationSchema.query
    >;

    // Build WHERE conditions
    let whereClause = ' WHERE 1=1 ';
    const params: (string | number)[] = [];
    let paramIndex = 1;

    if (status) {
      whereClause += ` AND i.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (search) {
      whereClause += ` AND (
        i.name ILIKE $${paramIndex} OR
        i.email ILIKE $${paramIndex} OR
        i.phone_number ILIKE $${paramIndex} OR
        i.message ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Count total records
    const countQuery = `SELECT COUNT(*) as total FROM inquiries i ${whereClause}`;
    const countResult = await db.queryOne<{ total: string }>(countQuery, params);
    const total = parseInt(countResult.total, 10);

    // Get inquiries with pagination
    const listQuery = `
      SELECT
        i.id,
        i.name,
        i.email,
        i.phone_number,
        i.message,
        i.status,
        i.created_at
      FROM inquiries i
      ${whereClause}
      ORDER BY i.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    const data = await db.queryAll(listQuery, params);

    return res.status(200).json({
      data,
      meta: {
        total,
        offset,
        limit,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    return next(error);
  }
}

