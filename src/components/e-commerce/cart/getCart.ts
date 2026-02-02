import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';

export const ValidationSchema = {
  params: z.object({
    cart_id: z.string().uuid().optional(),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  let cartId: string | null = null;

  // Check if customer is authenticated
  if (req.customer?.id) {
    // Get customer's cart
    const customerCart = await db.queryOne(
      'SELECT id FROM carts WHERE customer_id = $1',
      [req.customer.id]
    );
    cartId = customerCart?.id || null;
  } else if (req.params.cart_id) {
    // Guest cart - verify it's not assigned to any customer
    const guestCart = await db.queryOne(
      'SELECT id FROM carts WHERE id = $1 AND customer_id IS NULL',
      [req.params.cart_id]
    );
    cartId = guestCart?.id || null;
  }

  if (!cartId) {
    return res.status(200).json({
      cart: null,
      items: [],
      total_items: 0,
      total_amount: 0,
    });
  }

  const cart = await db.queryOne(
    'SELECT id, customer_id, created_at, updated_at FROM carts WHERE id = $1',
    [cartId]
  );

  const items = await db.queryAll(
    `SELECT
      ci.id,
      ci.product_id,
      ci.quantity,
      ci.created_at,
      ci.updated_at,
      p.name as product_name,
      p.sale_price_in_paisa,
      p.description,
      (SELECT pi.image_id FROM product_images pi
      WHERE pi.product_id = p.id AND pi.is_primary = true
      LIMIT 1) as image_id
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.cart_id = $1
    ORDER BY ci.created_at DESC`,
    [cartId]
  );

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce(
    (sum, item) => sum + item.quantity * item.sale_price_in_paisa,
    0
  );

  return res.status(200).json({
    cart: {
      id: cart.id,
      customer_id: cart.customer_id,
      created_at: cart.created_at,
      updated_at: cart.updated_at,
    },
    items: items.map((item) => ({
      id: item.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      price_in_paisa: item.sale_price_in_paisa,
      subtotal_in_paisa: item.quantity * item.sale_price_in_paisa,
      image_path: item.image_path,
      created_at: item.created_at,
      updated_at: item.updated_at,
    })),
    total_items: totalItems,
    total_amount_in_paisa: totalAmount,
  });
}
