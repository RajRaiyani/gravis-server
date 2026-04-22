import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const customerId = req.customer.id;

  const rows = await db.queryAll(
    `SELECT
      a.id,
      a.type,
      a.address,
      a.city,
      a.postal_code,
      a.state_id,
      s.name as state_name,
      s.gst_code as state_gst_code
    FROM addresses a
    LEFT JOIN states s ON s.id = a.state_id
    WHERE a.customer_id = $1`,
    [customerId]
  );

  const billing_address = rows.find((row) => row.type === 'billing') || null;
  const shipping_address = rows.find((row) => row.type === 'shipping') || null;

  return res.status(200).json({
    billing_address,
    shipping_address,
  });
}
