import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const customerId = req.customer.id;

  const customer = await db.queryOne(
    `SELECT
      id, first_name, last_name, full_name, email,
      phone_number, is_email_verified, is_phone_number_verified,
      created_at, updated_at
    FROM customers
    WHERE id = $1`,
    [customerId]
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
