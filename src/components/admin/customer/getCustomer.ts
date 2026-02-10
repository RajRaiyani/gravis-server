import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import env from '@/config/env.js';

export const ValidationSchema = {
  params: z.object({
    id: z.uuid(),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { id } = req.params as z.infer<typeof ValidationSchema.params>;

  const customer = await db.queryOne(
    `SELECT
      id, first_name, last_name, full_name, email,
      phone_number, is_email_verified, is_phone_number_verified,
      created_at, updated_at
    FROM customers
    WHERE id = $1`,
    [id]
  );

  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  // Get customer's cart with items
  const cart = await db.queryOne(
    `
    WITH products_with_images AS (
      SELECT
        p.id,
        p.name,
        p.sale_price_in_paisa,
        p.sale_price_in_rupee,
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
      c.id,
      c.created_at,
      c.updated_at,
      COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', ci.id,
            'product_id', ci.product_id,
            'quantity', ci.quantity,
            'product_name', p.name,
            'sale_price_in_paisa', p.sale_price_in_paisa,
            'sale_price_in_rupee', p.sale_price_in_rupee,
            'description', p.description,
            'primary_image', p.primary_image
          )
        ) FILTER (WHERE ci.id IS NOT NULL),
        '[]'::jsonb
      ) as items
    FROM carts c
    LEFT JOIN cart_items ci ON c.id = ci.cart_id
    LEFT JOIN products_with_images p ON ci.product_id = p.id
    WHERE c.customer_id = $1
    GROUP BY c.id
    `,
    [id]
  );

  let cartResponse = null;

  if (cart) {
    const items = cart.items || [];
    const total_in_paisa = items.reduce(
      (sum: number, item: any) => sum + (item.quantity * item.sale_price_in_paisa),
      0
    );

    cartResponse = {
      id: cart.id,
      items,
      items_count: items.length,
      total_in_paisa,
      total_in_rupee: total_in_paisa / 100,
      created_at: cart.created_at,
      updated_at: cart.updated_at,
    };
  }

  return res.status(200).json({
    customer,
    cart: cartResponse,
  });
}
