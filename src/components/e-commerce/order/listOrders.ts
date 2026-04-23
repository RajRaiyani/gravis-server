import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { DatabaseClient } from '@/service/database/index.js';

export const ValidationSchemaConfig = {
  query: z.object({
    offset: z.coerce.number().int().min(0).default(0),
    limit: z.coerce.number().int().min(1).max(100).default(30),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  _next: NextFunction,
  db: DatabaseClient
) {
  const customer_id = req.customer.id;
  const { offset, limit } = req.query as unknown as z.infer<typeof ValidationSchemaConfig.query>;

  const orders = await db.queryAll(
    `SELECT
      o.id,
      o.serial,
      o.payment_status,
      o.status,
      o.total_amount_in_paisa,
      o.paid_amount_in_paisa,
      o.is_paid,
      o.created_at,
      COALESCE(SUM(oi.quantity), 0)::int as total_item_count
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE o.customer_id = $1
      AND o.payment_status IN ('paid', 'partially_paid')
    GROUP BY o.id
    ORDER BY o.created_at DESC
    OFFSET $2 LIMIT $3`,
    [customer_id, offset, limit]
  );

  const totalOrders = await db.queryOne(
    `SELECT COUNT(*)::int as total
    FROM orders
    WHERE customer_id = $1
      AND payment_status IN ('paid', 'partially_paid')`,
    [customer_id]
  );

  return res.status(200).json({
    orders,
    meta: {
      offset,
      limit,
      total: totalOrders?.total || 0,
    },
  });
}
