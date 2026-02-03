import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import JwtToken from '../../../utils/jwtToken.js';
import { SendMail } from '@/service/mail/index.js';
import customerForgotPassword from '../../../utils/emailTemplates/customer/customerForgotPassword.js';

export const ValidationSchema = {
  body: z.object({
    email: z.email().toLowerCase(),
    redirect_url: z.url(),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { email, redirect_url } = req.body as z.infer<typeof ValidationSchema.body>;

  const customer = await db.queryOne(
    'SELECT id, first_name FROM customers WHERE LOWER(email) = LOWER($1)',
    [email]
  );

  if (!customer) {
    return res.status(200).json({
      message: 'If an account exists with this email, a reset link has been sent',
    });
  }

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  const payload = {
    type: 'customer_password_reset',
    customer_id: customer.id,
  };

  const token = JwtToken.encode(payload, {
    expiresIn: `${expiresAt.getTime() - Date.now()}ms`,
  });

  await db.query(
    'INSERT INTO tokens (token, expires_at, meta_data) VALUES ($1, $2, $3)',
    [
      token,
      expiresAt,
      {
        type: 'customer_password_reset',
        customer_id: customer.id,
        redirect_url,
      },
    ]
  );

  const magicLink = `${redirect_url}?token=${token}`;

  await SendMail(
    email,
    'Reset your password',
    customerForgotPassword(magicLink, customer.first_name)
  );

  return res.status(200).json({
    message: 'If an account exists with this email, a reset link has been sent',
  });
}
