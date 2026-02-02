import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';

export const ValidationSchema = {
  params: z.object({
    cart_id: z.uuid().optional(),
  }),
  body: z.object({
    product_id: z.uuid(),
    quantity: z.number().int().min(1).max(100).default(1),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { product_id, quantity } = req.body as z.infer<typeof ValidationSchema.body>;

  // Verify product exists
  const product = await db.queryOne(
    'SELECT id, name, sale_price_in_paisa FROM products WHERE id = $1',
    [product_id]
  );

  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  let cartId: string | null = null;

  try {
    await db.query('BEGIN');

    // Determine cart based on authentication
    if (req.customer?.id) {
      // Customer cart
      const customerCart = await db.queryOne(
        'SELECT id FROM carts WHERE customer_id = $1',
        [req.customer.id]
      );

      if (customerCart) {
        cartId = customerCart.id;
      } else {
        // Create new cart for customer
        const newCart = await db.queryOne(
          'INSERT INTO carts (customer_id) VALUES ($1) RETURNING id',
          [req.customer.id]
        );
        cartId = newCart.id;
      }
    } else if (req.params.cart_id) {
      // Guest cart
      const guestCart = await db.queryOne(
        'SELECT id FROM carts WHERE id = $1 AND customer_id IS NULL',
        [req.params.cart_id]
      );

      if (!guestCart) {
        await db.query('ROLLBACK');
        return res.status(404).json({ message: 'Cart not found' });
      }
      cartId = guestCart.id;
    } else {
      // Create new guest cart
      const newCart = await db.queryOne(
        'INSERT INTO carts (customer_id) VALUES (NULL) RETURNING id',
        []
      );
      cartId = newCart.id;
    }

    // Check if product already in cart
    const existingItem = await db.queryOne(
      'SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2',
      [cartId, product_id]
    );

    let cartItem;

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;

      if (newQuantity > 100) {
        await db.query('ROLLBACK');
        return res.status(400).json({ message: 'Maximum quantity per item is 100' });
      }

      cartItem = await db.queryOne(
        `UPDATE cart_items
         SET quantity = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING id, cart_id, product_id, quantity, created_at, updated_at`,
        [newQuantity, existingItem.id]
      );
    } else {
      // Add new item
      cartItem = await db.queryOne(
        `INSERT INTO cart_items (cart_id, product_id, quantity)
         VALUES ($1, $2, $3)
         RETURNING id, cart_id, product_id, quantity, created_at, updated_at`,
        [cartId, product_id, quantity]
      );
    }

    // Update cart updated_at
    await db.query('UPDATE carts SET updated_at = NOW() WHERE id = $1', [cartId]);

    await db.query('COMMIT');

    return res.status(200).json({
      cart_id: cartId,
      item: {
        id: cartItem.id,
        product_id: cartItem.product_id,
        product_name: product.name,
        quantity: cartItem.quantity,
        price_in_paisa: product.sale_price_in_paisa,
        subtotal_in_paisa: cartItem.quantity * product.sale_price_in_paisa,
        created_at: cartItem.created_at,
        updated_at: cartItem.updated_at,
      },
    });
  } catch (err) {
    await db.query('ROLLBACK');
    throw err;
  }
}
