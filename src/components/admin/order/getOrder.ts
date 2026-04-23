import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { DatabaseClient } from '@/service/database/index.js';
import ValidationSchema from '@/config/validationSchema.js';
import env from '@/config/env.js';

export const ValidationSchemaConfig = {
  params: z.object({
    id: ValidationSchema.uuid(),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { id } = req.params as z.infer<typeof ValidationSchemaConfig.params>;

  const order = await db.queryOne(
    `SELECT
        o.id,
        o.serial,
        o.serial_number,
        o.payment_status,
        o.status,
        o.total_amount_in_paisa,
        o.paid_amount_in_paisa,
        o.is_paid,
        o.razorpay_payment_id,
        o.razorpay_order_id,
        o.created_at,
        o.billing_details,
        o.billing_address,
        o.shipping_address,
        c.id as customer_id,
        c.full_name as customer_name,
        c.email as customer_email,
        c.phone_number as customer_phone_number
      FROM orders o
      LEFT JOIN customers c ON c.id = o.customer_id
      WHERE o.id = $1`,
    [id]
  );

  if (!order) return res.status(404).json({ message: 'Order not found' });

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
    [id]
  );

  return res.status(200).json({
    order: {
      ...order,
      items,
    },
  });
}
