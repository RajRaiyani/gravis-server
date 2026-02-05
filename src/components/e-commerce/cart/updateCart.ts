import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { v7 as uuidv7 } from 'uuid';
import JwtToken from '@/utils/jwtToken.js';

export const ValidationSchema = {
  params: z.object({
    product_id: z.uuid({ version: 'v7', message: 'Invalid product ID' }),
  }),
  body: z.object({
    quantity: z.number().int().min(0).max(100).default(1),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { product_id } = req.params as z.infer<typeof ValidationSchema.params>;
  const { quantity } = req.body as z.infer<typeof ValidationSchema.body>;
  const customer_id = req.customer?.id;
  let guest_id = req.guest?.id;

  // Verify product exists
  const product = await db.queryOne(
    'SELECT id, name, sale_price_in_paisa FROM products WHERE id = $1',
    [product_id]
  );

  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  let cartId: string | null = null;

  // Determine cart based on authentication
  if (customer_id) {

    const customerCart = await db.queryOne(
      'SELECT id FROM carts WHERE customer_id = $1',
      [customer_id]
    );

    if (customerCart) {
      cartId = customerCart.id;
    } else {
      const newCart = await db.queryOne(
        'INSERT INTO carts (customer_id) VALUES ($1) RETURNING id',
        [customer_id]
      );
      cartId = newCart.id;
      guest_id = null;
    }

  } else {
    if (!guest_id) {
      guest_id = uuidv7();
    }

    const guestCart = await db.queryOne(
      'SELECT id FROM carts WHERE guest_id = $1',
      [guest_id]
    );

    if (!guestCart) {
      const newGuestCart = await db.queryOne('INSERT INTO carts (guest_id) VALUES ($1) RETURNING id', [guest_id]);
      cartId = newGuestCart.id;
    }else {
      cartId = guestCart.id;
    }

  }

  if (!cartId) {
    return res.status(404).json({ message: 'Cart not found' });
  }

  if (quantity > 0) {
    await db.queryOne(`
      INSERT INTO cart_items (cart_id, product_id, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (cart_id, product_id)
      DO UPDATE
      SET quantity = $3
    `, [cartId, product_id, quantity]);
  } else {
    await db.queryOne('DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2', [cartId, product_id]);
  }

  let guestToken = null;

  if (guest_id) {
    guestToken = JwtToken.encode({
      type: 'guest_token',
      guest_id: guest_id,
    });
  }

  return res.status(200).json({
    token: guestToken,
    product_id: product_id,
  });
}
