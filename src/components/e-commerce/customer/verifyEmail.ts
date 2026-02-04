import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import JwtToken from '@/utils/jwtToken.js';
import bcrypt from 'bcryptjs';

export const ValidationSchema = {
  headers: z.object({
    'x-guest-id': z.uuid({ version: 'v7', message: 'Invalid guest ID' }).optional(),
  }),
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
}

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { token, otp } = req.body as z.infer<typeof ValidationSchema.body>;
  const guest_id = req.headers['x-guest-id'] as string | undefined;

  const tokenData = JwtToken.decode(token) as RegistrationTokenPayload | null;

  if (!tokenData) {
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

  // Transfer guest cart to new customer (new customer won't have existing cart)
  if (guest_id) {
    await db.query(
      `UPDATE carts SET customer_id = $1, guest_id = NULL, updated_at = NOW()
       WHERE guest_id = $2 AND customer_id IS NULL`,
      [customer.id, guest_id]
    );
  }

  // Delete used token
  await db.query('DELETE FROM tokens WHERE token = $1', [token]);

  const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 3600000);

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
    expires_at: tokenExpiresAt.toISOString(),
  });
}
