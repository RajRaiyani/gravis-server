import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';

export const ValidationSchema = {
  params: z.object({
    id: z.string().uuid(),
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

  const cart = await db.queryOne(
    `SELECT
      c.id,
      c.created_at,
      c.updated_at,
      (SELECT COUNT(*) FROM cart_items WHERE cart_id = c.id) as items_count,
      (SELECT COALESCE(SUM(ci.quantity * p.sale_price_in_paisa), 0)
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.cart_id = c.id) as total_amount_in_paisa
    FROM carts c
    WHERE c.customer_id = $1`,
    [id]
  );

  return res.status(200).json({
    customer,
    cart: cart
      ? {
        id: cart.id,
        items_count: parseInt(cart.items_count, 10),
        total_amount_in_paisa: parseInt(cart.total_amount_in_paisa, 10),
        created_at: cart.created_at,
        updated_at: cart.updated_at,
      }
      : null,
  });
}
