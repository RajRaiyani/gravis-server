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

  // Delete all items from cart
  await db.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);

  // Update cart updated_at
  await db.query('UPDATE carts SET updated_at = NOW() WHERE id = $1', [cartId]);

  return res.status(200).json({
    message: 'Cart cleared successfully',
    cart_id: cartId,
  });
}
