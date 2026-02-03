import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const cart = await db.queryOne(
    'INSERT INTO carts (customer_id) VALUES (NULL) RETURNING id, created_at',
    []
  );

  return res.status(201).json({
    cart_id: cart.id,
    created_at: cart.created_at,
  });
}
