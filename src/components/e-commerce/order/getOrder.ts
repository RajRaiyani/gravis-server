import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { DatabaseClient } from '@/service/database/index.js';
import ValidationSchema from '@/config/validationSchema.js';
import ServerError from '@/utils/serverError.js';
import env from '@/config/env.js';

export const ValidationSchemaConfig = {
  params: z.object({
    order_id: ValidationSchema.uuid(),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  _next: NextFunction,
  db: DatabaseClient
) {
  const customer_id = req.customer.id;
  const { order_id } = req.params as z.infer<typeof ValidationSchemaConfig.params>;

  const order = await db.queryOne(
    `SELECT
      id,
      serial,
      payment_status,
      status,
      total_amount_in_paisa,
      paid_amount_in_paisa,
      is_paid,
      razorpay_payment_id,
      razorpay_order_id,
      created_at,
      billing_details,
      billing_address,
      shipping_address
    FROM orders
    WHERE id = $1 AND customer_id = $2`,
    [order_id, customer_id]
  );

  if (!order) throw new ServerError('NOT_FOUND', 'Order not found');

  const items = await db.queryAll(
    `SELECT
      oi.id,
      oi.product_id,
      oi.product_name,
      oi.quantity,
      oi.price_in_paisa,
      p.description,
      (
        SELECT jsonb_build_object(
          'id', f.id,
          'key', f.key,
          'url', ('${env.fileStorageEndpoint}/' || f.key)
        )
        FROM product_images pi
        LEFT JOIN files f ON f.id = pi.image_id
        WHERE pi.product_id = oi.product_id
          AND pi.is_primary = true
        LIMIT 1
      ) as primary_image
    FROM order_items oi
    LEFT JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = $1`,
    [order_id]
  );

  return res.status(200).json({
    order: {
      ...order,
      items,
    },
  });
}
