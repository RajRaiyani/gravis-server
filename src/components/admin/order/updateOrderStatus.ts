import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { DatabaseClient } from '@/service/database/index.js';
import ValidationSchema from '@/config/validationSchema.js';

const ORDER_STATUSES = [
  'pending',
  'processing',
  'out_for_delivery',
  'delivered',
  'complete',
  'cancel',
] as const;

export const ValidationSchemaConfig = {
  params: z.object({
    id: ValidationSchema.uuid(),
  }),
  body: z.object({
    status: z.enum(ORDER_STATUSES),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { id } = req.params as z.infer<typeof ValidationSchemaConfig.params>;
  const { status } = req.body as z.infer<typeof ValidationSchemaConfig.body>;

  const existingOrder = await db.queryOne('SELECT id FROM orders WHERE id = $1', [id]);
  if (!existingOrder) return res.status(404).json({ message: 'Order not found' });

  const updatedOrder = await db.queryOne(
    `UPDATE orders
      SET status = $1
      WHERE id = $2
      RETURNING
        id,
        serial,
        status,
        payment_status,
        total_amount_in_paisa,
        paid_amount_in_paisa,
        is_paid,
        created_at`,
    [status, id]
  );

  return res.status(200).json({ order: updatedOrder });
}
