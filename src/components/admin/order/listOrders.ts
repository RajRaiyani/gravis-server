import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { DatabaseClient } from '@/service/database/index.js';

export const ValidationSchema = {
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().optional(),
    status: z
      .enum(['pending', 'processing', 'out_for_delivery', 'delivered', 'complete', 'cancel'])
      .optional(),
    payment_statuses: z.string().trim().optional(),
    sort_by: z
      .enum(['created_at', 'serial_number', 'total_amount_in_paisa', 'total_item_count'])
      .default('created_at'),
    sort_order: z.enum(['asc', 'desc']).default('desc'),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { page, limit, search, status, payment_statuses, sort_by, sort_order } = req
    .validatedQuery as z.infer<typeof ValidationSchema.query>;

  const offset = (page - 1) * limit;
  const whereConditions: string[] = [];
  const params: Array<string | number | string[]> = [];

  if (search) {
    params.push(`%${search}%`);
    const searchParam = `$${params.length}`;
    whereConditions.push(
      `(o.serial ILIKE ${searchParam} OR c.full_name ILIKE ${searchParam} OR c.email ILIKE ${searchParam} OR c.phone_number ILIKE ${searchParam})`
    );
  }

  if (status) {
    params.push(status);
    whereConditions.push(`o.status = $${params.length}`);
  }

  if (payment_statuses) {
    const allowedPaymentStatuses = new Set(['pending', 'paid', 'partially_paid', 'failed']);
    const parsedPaymentStatuses = payment_statuses
      .split(',')
      .map((value) => value.trim())
      .filter((value) => allowedPaymentStatuses.has(value));

    if (parsedPaymentStatuses.length) {
      params.push(parsedPaymentStatuses);
      whereConditions.push(`o.payment_status = ANY($${params.length}::order_payment_status[])`);
    }
  }

  const whereClause = whereConditions.length ? `WHERE ${whereConditions.join(' AND ')}` : '';
  const sortColumn = sort_by === 'total_item_count' ? 'total_item_count' : `o.${sort_by}`;

  const dataParams = [...params, limit, offset];
  const orders = await db.queryAll(
    `SELECT
        o.id,
        o.serial,
        o.serial_number,
        o.payment_status,
        o.status,
        o.total_amount_in_paisa,
        o.paid_amount_in_paisa,
        o.is_paid,
        o.created_at,
        c.id as customer_id,
        c.full_name as customer_name,
        c.email as customer_email,
        c.phone_number as customer_phone_number,
        COALESCE(SUM(oi.quantity), 0)::int as total_item_count
      FROM orders o
      LEFT JOIN customers c ON c.id = o.customer_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      ${whereClause}
      GROUP BY o.id, c.id
      ORDER BY ${sortColumn} ${sort_order}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    dataParams
  );

  return res.status(200).json({
    orders,
  });
}
