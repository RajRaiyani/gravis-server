import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import JwtToken from '@/utils/jwtToken.js';
import bcrypt from 'bcryptjs';

export const ValidationSchema = {
  body: z.object({
    token: z.string().trim().nonempty(),
    otp: z.string().trim().length(6),
  }),
};

interface RegistrationTokenPayload {
  type: 'customer_registration_token';
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone_number: string | null;
  guest_cart_id: string | null;
}

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { token, otp } = req.body as z.infer<typeof ValidationSchema.body>;

  let tokenData: RegistrationTokenPayload;

  try {
    tokenData = JwtToken.decode(token) as RegistrationTokenPayload;
  } catch {
    return res.status(400).json({ message: 'Invalid or expired token' });
  }

  if (tokenData.type !== 'customer_registration_token') {
    return res.status(400).json({ message: 'Invalid token type' });
  }

  const dbToken = await db.queryOne(
    'SELECT meta_data FROM tokens WHERE token = $1 AND expires_at > NOW()',
    [token]
  );

  if (!dbToken) {
    return res.status(400).json({ message: 'Token has been used or expired' });
  }

  if (dbToken.meta_data.otp !== otp) {
    return res.status(400).json({ message: 'Invalid OTP' });
  }

  const passwordHash = await bcrypt.hash(tokenData.password, 10);

  try {
    await db.query('BEGIN');

    const customer = await db.queryOne(
      `INSERT INTO customers (first_name, last_name, email, password_hash, phone_number, is_email_verified)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, first_name, last_name, full_name, email, phone_number, is_email_verified, created_at`,
      [
        tokenData.first_name,
        tokenData.last_name,
        tokenData.email,
        passwordHash,
        tokenData.phone_number,
      ]
    );

    // Handle guest cart merge/transfer
    let cartId: string | null = null;

    if (tokenData.guest_cart_id) {
      const guestCart = await db.queryOne(
        'SELECT id FROM carts WHERE id = $1 AND customer_id IS NULL',
        [tokenData.guest_cart_id]
      );

      if (guestCart) {
        // Transfer guest cart to customer
        await db.query(
          'UPDATE carts SET customer_id = $1, updated_at = NOW() WHERE id = $2',
          [customer.id, guestCart.id]
        );
        cartId = guestCart.id;
      }
    }

    await db.query('DELETE FROM tokens WHERE token = $1', [token]);

    await db.query('COMMIT');

    const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 3600000); // 7 days

    const authTokenPayload = {
      type: 'customer_auth_token',
      customer_id: customer.id,
    };

    const authToken = JwtToken.encode(authTokenPayload, {
      expiresIn: `${tokenExpiresAt.getTime() - Date.now()}ms`,
    });

    return res.status(200).json({
      token: authToken,
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
      cart_id: cartId,
      expires_at: tokenExpiresAt.toISOString(),
    });
  } catch (err) {
    await db.query('ROLLBACK');
    throw err;
  }
}
