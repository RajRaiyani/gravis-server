import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { DatabaseClient } from '@/service/database/index.js';
import ValidationSchema from '@/config/validationSchema.js';

export const ValidationSchemaConfig = {
  params: z.object({
    id: ValidationSchema.uuid(),
  }),
  body: z.object({
    is_paid: z.literal(true),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { id } = req.params as z.infer<typeof ValidationSchemaConfig.params>;

  const existingOrder = await db.queryOne(
    'SELECT id, payment_status, is_paid FROM orders WHERE id = $1',
    [id]
  );

  if (!existingOrder) return res.status(404).json({ message: 'Order not found' });

  if (existingOrder.is_paid) {
    return res.status(400).json({ message: 'Order is already marked as paid' });
  }

  if (existingOrder.payment_status !== 'partially_paid') {
    return res
      .status(400)
      .json({ message: 'Only partially paid orders can be marked as fully paid' });
  }

  const updatedOrder = await db.queryOne(
    `UPDATE orders
      SET
        is_paid = $1,
        payment_status = $2
      WHERE id = $3
      RETURNING
        id,
        serial,
        status,
        payment_status,
        total_amount_in_paisa,
        paid_amount_in_paisa,
        is_paid,
        created_at`,
    [true, 'paid', id]
  );

  return res.status(200).json({ order: updatedOrder });
}
