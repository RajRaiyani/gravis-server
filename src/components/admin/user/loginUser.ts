import { NextFunction, Request, Response } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import bcryptjs from 'bcryptjs';
import JwtToken from '@/utils/jwtToken.js';

const TokenExpiryInMilliSeconds = 1000 * 60 * 60 * 24; // 1 day

export const ValidationSchema = {
  body: z.object({
    email_or_phone_number: z.union([
      z.email({ message: 'Invalid email address' }).toLowerCase(),
      z.string().regex(/^[0-9]{10}$/, { message: 'Invalid phone number' }).length(10, 'Phone number must be 10 digits')
    ]),
    password: z.string().max(30, 'Password must be less than 30 characters'),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { email_or_phone_number, password } = req.body as z.infer<typeof ValidationSchema.body>;

  const user = await db.queryOne('SELECT * FROM users WHERE email = $1 OR phone_number = $2', [
    email_or_phone_number,
    email_or_phone_number,
  ]);

  if (!user) {
    return res.status(400).json({ message: 'Invalid email or phone number or password' });
  }

  const isPasswordValid = await bcryptjs.compare(password, user.password_hash);

  if (!isPasswordValid) {
    return res.status(400).json({ message: 'Invalid email or phone number or password' });
  }

  const tokenPayload = {
    type: 'admin_access_token',
    user_id: user.id,
    is_admin: user.is_admin,
  };

  const expiryDate = new Date(Date.now() + TokenExpiryInMilliSeconds);

  const token = JwtToken.encode(tokenPayload, {
    expiresIn: `${TokenExpiryInMilliSeconds / 1000}s`,
  });

  return res.status(200).json({
    token,
    expires_at: expiryDate.toISOString(),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone_number: user.phone_number,
      is_admin: user.is_admin,
    },
  });
}
