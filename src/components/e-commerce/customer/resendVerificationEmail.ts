import { z } from 'zod';
import { DatabaseClient } from '@/service/database/index.js';
import { Request, Response, NextFunction } from 'express';
import JwtToken from '@/utils/jwtToken.js';
import { SendMail } from '@/service/mail/index.js';
import customerVerifyEmail from '@/utils/emailTemplates/customer/customerVerifyEmail.js';

export const ValidationSchema = {
  body: z.object({
    token: z.string().trim().nonempty(),
  }),
};

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000);
}

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
  const { token } = req.body as z.infer<typeof ValidationSchema.body>;

  let tokenData: RegistrationTokenPayload;

  try {
    tokenData = JwtToken.decode(token) as RegistrationTokenPayload;
  } catch {
    return res.status(400).json({ message: 'Invalid or expired token' });
  }

  if (tokenData.type !== 'customer_registration_token') {
    return res.status(400).json({ message: 'Invalid token type' });
  }

  const existingToken = await db.queryOne(
    'SELECT token FROM tokens WHERE token = $1',
    [token]
  );

  if (!existingToken) {
    return res.status(400).json({ message: 'Token not found or already used' });
  }

  await db.query('DELETE FROM tokens WHERE token = $1', [token]);

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const newToken = JwtToken.encode(
    {
      type: 'customer_registration_token',
      first_name: tokenData.first_name,
      last_name: tokenData.last_name,
      email: tokenData.email,
      password: tokenData.password,
      phone_number: tokenData.phone_number,
      guest_cart_id: tokenData.guest_cart_id,
    },
    { expiresIn: `${expiresAt.getTime() - Date.now()}ms` }
  );

  const otp = generateOtp().toString();

  await db.query(
    'INSERT INTO tokens (token, expires_at, meta_data) VALUES ($1, $2, $3)',
    [newToken, expiresAt.toISOString(), { otp, type: 'customer_registration' }]
  );

  const mailHtml = customerVerifyEmail(otp);

  await SendMail(tokenData.email, 'Verify your email', mailHtml);

  return res.status(200).json({
    token: newToken,
    expires_at: expiresAt.toISOString(),
  });
}
