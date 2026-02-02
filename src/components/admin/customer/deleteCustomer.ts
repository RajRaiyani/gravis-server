import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';

export const ValidationSchema = {
  params: z.object({
    id: z.string().uuid(),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { id } = req.params as z.infer<typeof ValidationSchema.params>;

  const existingCustomer = await db.queryOne(
    'SELECT id FROM customers WHERE id = $1',
    [id]
  );

  if (!existingCustomer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  try {
    await db.query('BEGIN');

    await db.query(
      `DELETE FROM cart_items
       WHERE cart_id IN (SELECT id FROM carts WHERE customer_id = $1)`,
      [id]
    );

    await db.query('DELETE FROM carts WHERE customer_id = $1', [id]);

    await db.query(
      'DELETE FROM tokens WHERE meta_data->>\'customer_id\' = $1',
      [id]
    );

    await db.query('DELETE FROM customers WHERE id = $1', [id]);

    await db.query('COMMIT');

    return res.status(200).json({
      message: 'Customer deleted successfully',
      customer_id: id,
    });
  } catch (err) {
    await db.query('ROLLBACK');
    throw err;
  }
}
