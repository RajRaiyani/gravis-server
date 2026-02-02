import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import bcrypt from 'bcryptjs';
import { SendMail } from '@/service/mail/index.js';
import customerPasswordChanged from '@/utils/emailTemplates/customer/customerPasswordChanged.js';

export const ValidationSchema = {
  body: z.object({
    current_password: z.string().nonempty(),
    new_password: z.string().min(6).max(100),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { current_password, new_password } = req.body as z.infer<
    typeof ValidationSchema.body
  >;

  const customerId = req.customer.id;

  const customer = await db.queryOne(
    'SELECT id, password_hash, email, first_name FROM customers WHERE id = $1',
    [customerId]
  );

  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  const isPasswordValid = await bcrypt.compare(current_password, customer.password_hash);

  if (!isPasswordValid) {
    return res.status(400).json({ message: 'Current password is incorrect' });
  }

  if (current_password === new_password) {
    return res
      .status(400)
      .json({ message: 'New password must be different from current password' });
  }

  const newPasswordHash = await bcrypt.hash(new_password, 10);

  await db.query(
    'UPDATE customers SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [newPasswordHash, customerId]
  );

  SendMail(
    customer.email,
    'Password changed successfully',
    customerPasswordChanged(customer.first_name)
  );

  return res.status(200).json({
    message: 'Password changed successfully',
  });
}
