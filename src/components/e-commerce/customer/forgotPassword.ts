import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import JwtToken from '../../../utils/jwtToken.js';
import { sendOTP } from '@/service/sms/index.js';

export const ValidationSchema = {
  body: z.object({
    phone_number: z.string().trim().min(10).max(15),
  }),
};

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000);
}

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { phone_number } = req.body as z.infer<typeof ValidationSchema.body>;

  const customer = await db.queryOne(
    'SELECT id FROM customers WHERE phone_number = $1',
    [phone_number]
  );

  if (!customer) {
    return res.status(200).json({
      message: 'If an account exists with this phone number, an OTP has been sent',
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

  const otp = generateOtp().toString();

  await db.query(
    'INSERT INTO tokens (token, expires_at, meta_data) VALUES ($1, $2, $3)',
    [
      token,
      expiresAt,
      {
        type: 'customer_password_reset',
        customer_id: customer.id,
        otp,
      },
    ]
  );

  await sendOTP(phone_number, otp);

  return res.status(200).json({
    message: 'If an account exists with this phone number, an OTP has been sent',
    token,
    expires_at: expiresAt.toISOString(),
  });
}
