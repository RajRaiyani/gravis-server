import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import CustomerSchema from './customer.validation.js';

export const ValidationSchema = {
  body: z.object({
    first_name: CustomerSchema.firstName().optional(),
    last_name: CustomerSchema.lastName().optional(),
    phone_number: CustomerSchema.phoneNumber(),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { first_name, last_name, phone_number } = req.body as z.infer<
    typeof ValidationSchema.body
  >;

  const customerId = req.customer.id;

  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (first_name !== undefined) {
    updates.push(`first_name = $${paramIndex++}`);
    values.push(first_name);
  }

  if (last_name !== undefined) {
    updates.push(`last_name = $${paramIndex++}`);
    values.push(last_name);
  }

  if (phone_number !== undefined) {
    updates.push(`phone_number = $${paramIndex++}`);
    values.push(phone_number);
  }

  if (updates.length === 0) {
    return res.status(400).json({ message: 'No fields to update' });
  }

  updates.push('updated_at = NOW()');
  values.push(customerId);

  const customer = await db.queryOne(
    `UPDATE customers
     SET ${updates.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING id, first_name, last_name, full_name, email, phone_number,
               is_email_verified, is_phone_number_verified, created_at, updated_at`,
    values
  );

  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  return res.status(200).json({
    customer: {
      id: customer.id,
      first_name: customer.first_name,
      last_name: customer.last_name,
      full_name: customer.full_name,
      email: customer.email,
      phone_number: customer.phone_number,
      is_email_verified: customer.is_email_verified,
      is_phone_number_verified: customer.is_phone_number_verified,
      created_at: customer.created_at,
      updated_at: customer.updated_at,
    },
  });
}
