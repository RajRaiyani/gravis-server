import { z } from 'zod';
import CustomerSchema from './customer.validation.js';
import { DatabaseClient } from '@/service/database/index.js';
import { Request, Response, NextFunction } from 'express';
import JwtToken from '@/utils/jwtToken.js';
import { SendMail } from '@/service/mail/index.js';
import customerVerifyEmail from '@/utils/emailTemplates/customer/customerVerifyEmail.js';

export const ValidationSchema = {
  body: z.object({
    first_name: CustomerSchema.firstName(),
    last_name: CustomerSchema.lastName(),
    email: CustomerSchema.email(),
    password: CustomerSchema.password(),
    phone_number: CustomerSchema.phoneNumber()
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
  const { first_name, last_name, email, password, phone_number } =
    req.body as z.infer<typeof ValidationSchema.body>;

  const existingCustomer = await db.queryOne(
    'SELECT id FROM customers WHERE LOWER(email) = LOWER($1)',
    [email]
  );

  if (existingCustomer) {
    return res.status(400).json({ message: 'Customer with this email already exists' });
  }

  const tokenPayload = {
    type: 'customer_registration_token',
    first_name,
    last_name,
    email,
    password,
    phone_number: phone_number || null
  };

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const token = JwtToken.encode(tokenPayload, {
    expiresIn: `${expiresAt.getTime() - Date.now()}ms`,
  });

  const otp = generateOtp().toString();

  await db.query(
    'INSERT INTO tokens (token, expires_at, meta_data) VALUES ($1, $2, $3)',
    [token, expiresAt.toISOString(), { otp, type: 'customer_registration' }]
  );

  const mailHtml = customerVerifyEmail(otp);

  await SendMail(email, 'Verify your email', mailHtml);

  return res.status(200).json({
    token,
    expires_at: expiresAt.toISOString(),
  });
}
