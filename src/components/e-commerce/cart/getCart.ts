import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import env from '@/config/env.js';

export const ValidationSchema = {
  headers: z.object({
    'x-guest-id': z.uuid({ version: 'v7', message: 'Invalid guest ID' }).optional(),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const customer_id = req.customer?.id;
  const guest_id = customer_id ? null : req.headers['x-guest-id'] as string | undefined;


  let cart = await db.queryOne(`

    WITH products_with_images AS (
      SELECT
        p.id,
        p.name,
        p.sale_price_in_paisa,
        p.sale_price_in_rupee,
        p.sale_price,
        p.description,
        jsonb_build_object(
          'id', f.id,
          'key', f.key,
          'url', ('${env.fileStorageEndpoint}/' || f.key)
        ) as primary_image
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
      LEFT JOIN files f ON pi.image_id = f.id
    )
      SELECT
        COALESCE(
          array_agg(
            jsonb_build_object(
              'product_id', ci.product_id,
              'quantity', ci.quantity,
              'product_name', p.name,
              'sale_price_in_paisa', p.sale_price_in_paisa,
              'description', p.description,
              'primary_image', p.primary_image
            )
          ) FILTER (WHERE ci.product_id IS NOT NULL),
          ARRAY[]::jsonb[]
        ) as items
      FROM carts c
      LEFT JOIN cart_items ci ON c.id = ci.cart_id
      LEFT JOIN products_with_images p ON ci.product_id = p.id
      WHERE c.customer_id = $1 OR ($1 is null and c.guest_id = $2)
      GROUP BY c.id
    `,
  [customer_id, guest_id]
  );

  if (!cart) {
    cart = { items: [] };
  }

  cart.total = cart.items.reduce((sum: number, item: any) => sum + item.quantity * item.sale_price_in_paisa, 0);
  return res.status(200).json(cart);
}
