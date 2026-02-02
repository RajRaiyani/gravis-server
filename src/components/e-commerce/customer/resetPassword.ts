import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import JwtToken from '@/utils/jwtToken.js';
import bcrypt from 'bcryptjs';
import { SendMail } from '@/service/mail/index.js';
import customerPasswordChanged from '@/utils/emailTemplates/customer/customerPasswordChanged.js';

export const ValidationSchema = {
  body: z.object({
    token: z.string().nonempty(),
    new_password: z.string().min(6).max(100),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { token, new_password } = req.body as z.infer<typeof ValidationSchema.body>;

  let payload: { type: string; customer_id: string };

  try {
    payload = JwtToken.decode(token) as { type: string; customer_id: string };
  } catch {
    return res.status(400).json({ message: 'Invalid or expired token' });
  }

  if (payload.type !== 'customer_password_reset') {
    return res.status(400).json({ message: 'Invalid token type' });
  }

  const record = await db.queryOne(
    'SELECT expires_at, meta_data FROM tokens WHERE token = $1',
    [token]
  );

  if (!record) {
    return res.status(400).json({ message: 'Invalid or already used token' });
  }

  if (record.meta_data.type !== 'customer_password_reset') {
    return res.status(400).json({ message: 'Invalid token type' });
  }

  if (new Date(record.expires_at) < new Date()) {
    return res.status(400).json({ message: 'Token has expired' });
  }

  const passwordHash = await bcrypt.hash(new_password, 10);

  try {
    await db.query('BEGIN');

    const customer = await db.queryOne(
      `UPDATE customers SET password_hash = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING email, first_name`,
      [passwordHash, record.meta_data.customer_id]
    );

    await db.query('DELETE FROM tokens WHERE token = $1', [token]);

    // Invalidate all existing auth tokens for this customer (optional security measure)
    await db.query(
      'DELETE FROM tokens WHERE meta_data->>\'customer_id\' = $1 AND meta_data->>\'type\' = \'customer_auth_blacklist\'',
      [record.meta_data.customer_id]
    );

    await db.query('COMMIT');

    // Send confirmation email
    if (customer) {
      SendMail(
        customer.email,
        'Password changed successfully',
        customerPasswordChanged(customer.first_name)
      );
    }

    return res.status(200).json({
      message: 'Password reset successful',
    });
  } catch (err) {
    await db.query('ROLLBACK');
    throw err;
  }
}
