import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';

export const ValidationSchema = {
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    is_email_verified: z.boolean().optional(),
    is_phone_number_verified: z.boolean().optional(),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { id } = req.params as z.infer<typeof ValidationSchema.params>;
  const { is_email_verified, is_phone_number_verified } = req.body as z.infer<
    typeof ValidationSchema.body
  >;

  const existingCustomer = await db.queryOne(
    'SELECT id FROM customers WHERE id = $1',
    [id]
  );

  if (!existingCustomer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  // Build dynamic update query
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (is_email_verified !== undefined) {
    updates.push(`is_email_verified = $${paramIndex++}`);
    values.push(is_email_verified);
  }

  if (is_phone_number_verified !== undefined) {
    updates.push(`is_phone_number_verified = $${paramIndex++}`);
    values.push(is_phone_number_verified);
  }

  if (updates.length === 0) {
    return res.status(400).json({ message: 'No fields to update' });
  }

  updates.push('updated_at = NOW()');
  values.push(id);

  const customer = await db.queryOne(
    `UPDATE customers
     SET ${updates.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING id, first_name, last_name, full_name, email, phone_number,
               is_email_verified, is_phone_number_verified, created_at, updated_at`,
    values
  );

  return res.status(200).json({ customer });
}
