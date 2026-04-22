import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';

export const ValidationSchema = {
  params: z.object({
    type: z.enum(['billing', 'shipping']),
  }),
  body: z.object({
    address: z.string().trim().nonempty('Address is required'),
    city: z.string().trim().nonempty('City is required').max(255),
    state_id: z.uuid('Please select a valid state'),
    postal_code: z.string().trim().min(4).max(10),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const customerId = req.customer.id;
  const { type } = req.params as z.infer<typeof ValidationSchema.params>;
  const { address, city, state_id, postal_code } = req.body as z.infer<typeof ValidationSchema.body>;

  const existing = await db.queryOne(
    'SELECT id FROM addresses WHERE customer_id = $1 AND type = $2',
    [customerId, type]
  );

  const savedAddress = existing
    ? await db.queryOne(
      `UPDATE addresses
       SET address = $1, city = $2, state_id = $3, postal_code = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING id, type, address, city, postal_code, state_id`,
      [address, city, state_id, postal_code, existing.id]
    )
    : await db.queryOne(
      `INSERT INTO addresses (type, customer_id, address, state_id, city, postal_code)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, type, address, city, postal_code, state_id`,
      [type, customerId, address, state_id, city, postal_code]
    );

  return res.status(200).json({
    address: savedAddress,
  });
}
