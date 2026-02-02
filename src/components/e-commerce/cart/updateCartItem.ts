import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';

export const ValidationSchema = {
  params: z.object({
    cart_id: z.string().uuid().optional(),
    item_id: z.string().uuid(),
  }),
  body: z.object({
    quantity: z.number().int().min(1).max(100),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { item_id } = req.params as z.infer<typeof ValidationSchema.params>;
  const { quantity } = req.body as z.infer<typeof ValidationSchema.body>;

  let cartId: string | null = null;

  // Determine cart based on authentication
  if (req.customer?.id) {
    const customerCart = await db.queryOne(
      'SELECT id FROM carts WHERE customer_id = $1',
      [req.customer.id]
    );
    cartId = customerCart?.id || null;
  } else if (req.params.cart_id) {
    const guestCart = await db.queryOne(
      'SELECT id FROM carts WHERE id = $1 AND customer_id IS NULL',
      [req.params.cart_id]
    );
    cartId = guestCart?.id || null;
  }

  if (!cartId) {
    return res.status(404).json({ message: 'Cart not found' });
  }

  // Verify item belongs to cart
  const existingItem = await db.queryOne(
    `SELECT ci.id, ci.product_id, p.name, p.sale_price_in_paisa
     FROM cart_items ci
     JOIN products p ON ci.product_id = p.id
     WHERE ci.id = $1 AND ci.cart_id = $2`,
    [item_id, cartId]
  );

  if (!existingItem) {
    return res.status(404).json({ message: 'Cart item not found' });
  }

  const cartItem = await db.queryOne(
    `UPDATE cart_items
     SET quantity = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING id, cart_id, product_id, quantity, created_at, updated_at`,
    [quantity, item_id]
  );

  // Update cart updated_at
  await db.query('UPDATE carts SET updated_at = NOW() WHERE id = $1', [cartId]);

  return res.status(200).json({
    item: {
      id: cartItem.id,
      product_id: cartItem.product_id,
      product_name: existingItem.name,
      quantity: cartItem.quantity,
      price_in_paisa: existingItem.sale_price_in_paisa,
      subtotal_in_paisa: cartItem.quantity * existingItem.sale_price_in_paisa,
      created_at: cartItem.created_at,
      updated_at: cartItem.updated_at,
    },
  });
}
