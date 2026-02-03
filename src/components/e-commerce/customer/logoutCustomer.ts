import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  const expiresAt = new Date(Date.now() + 7 * 24 * 3600000);

  await db.query(`--sql
      INSERT INTO tokens (token, expires_at, meta_data)
      VALUES ($1, $2, $3)
      ON CONFLICT (token) DO NOTHING`,
  [
    token,
    expiresAt.toISOString(),
    { type: 'customer_auth_blacklist', invalidated_at: new Date().toISOString() },
  ]
  );

  return res.status(200).json({ message: 'Logged out successfully' });
}
