import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import JwtToken from '@/utils/jwtToken.js';
import bcrypt from 'bcryptjs';

export const ValidationSchema = {
  body: z.object({
    email: z.email().toLowerCase(),
    password: z.string().trim().nonempty().max(100),
    guest_cart_id: z.string().uuid().optional(),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { email, password, guest_cart_id } = req.body as z.infer<
    typeof ValidationSchema.body
  >;

  const customer = await db.queryOne(
    `SELECT
      id, password_hash, first_name, last_name, full_name,
      email, phone_number, is_email_verified, created_at
    FROM customers
    WHERE LOWER(email) = LOWER($1)`,
    [email]
  );

  if (!customer) {
    return res.status(400).json({ message: 'Invalid email or password' });
  }

  const isPasswordValid = await bcrypt.compare(password, customer.password_hash);

  if (!isPasswordValid) {
    return res.status(400).json({ message: 'Invalid email or password' });
  }

  let cartId: string | null = null;

  try {
    await db.query('BEGIN');

    // Handle guest cart merge
    if (guest_cart_id) {
      const guestCart = await db.queryOne(
        'SELECT id FROM carts WHERE id = $1 AND customer_id IS NULL',
        [guest_cart_id]
      );

      if (guestCart) {
        // Check if customer already has a cart
        const customerCart = await db.queryOne(
          'SELECT id FROM carts WHERE customer_id = $1',
          [customer.id]
        );

        if (customerCart) {
          // Merge: Move guest cart items to customer cart
          // For duplicate products, sum the quantities
          await db.query(
            `INSERT INTO cart_items (cart_id, product_id, quantity)
             SELECT $1, gi.product_id, gi.quantity
             FROM cart_items gi
             WHERE gi.cart_id = $2
             ON CONFLICT (cart_id, product_id)
             DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity, updated_at = NOW()`,
            [customerCart.id, guestCart.id]
          );

          // Delete guest cart items and cart
          await db.query('DELETE FROM cart_items WHERE cart_id = $1', [guestCart.id]);
          await db.query('DELETE FROM carts WHERE id = $1', [guestCart.id]);

          cartId = customerCart.id;
        } else {
          // Transfer: Assign guest cart to customer
          await db.query(
            'UPDATE carts SET customer_id = $1, updated_at = NOW() WHERE id = $2',
            [customer.id, guestCart.id]
          );
          cartId = guestCart.id;
        }
      }
    }

    // If no cart was assigned, check for existing customer cart
    if (!cartId) {
      const existingCart = await db.queryOne(
        'SELECT id FROM carts WHERE customer_id = $1',
        [customer.id]
      );
      cartId = existingCart?.id || null;
    }

    await db.query('COMMIT');
  } catch (err) {
    await db.query('ROLLBACK');
    throw err;
  }

  const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 3600000); // 7 days

  const authTokenPayload = {
    type: 'customer_auth_token',
    customer_id: customer.id,
  };

  const authToken = JwtToken.encode(authTokenPayload, {
    expiresIn: `${tokenExpiresAt.getTime() - Date.now()}ms`,
  });

  return res.status(200).json({
    customer: {
      id: customer.id,
      first_name: customer.first_name,
      last_name: customer.last_name,
      full_name: customer.full_name,
      email: customer.email,
      phone_number: customer.phone_number,
      is_email_verified: customer.is_email_verified,
      created_at: customer.created_at,
    },
    token: authToken,
    cart_id: cartId,
    expires_at: tokenExpiresAt.toISOString(),
  });
}
