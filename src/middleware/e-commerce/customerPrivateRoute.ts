import { Request, Response, NextFunction } from 'express';
import JwtToken from '@/utils/jwtToken.js';
import database from '@/service/database/index.js';

interface CustomerAuthPayload {
  type: 'customer_auth_token';
  customer_id: string;
}

async function CustomerPrivateRoute(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  let payload: CustomerAuthPayload;

  try {
    payload = JwtToken.decode(token) as CustomerAuthPayload;
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  if (payload.type !== 'customer_auth_token') {
    return res.status(401).json({ message: 'Invalid token type' });
  }

  // Check if token is blacklisted
  const db = await database.getConnection();

  try {
    const blacklisted = await db.queryOne(
      `SELECT token FROM tokens
       WHERE token = $1 AND meta_data->>'type' = 'customer_auth_blacklist'`,
      [token]
    );

    if (blacklisted) {
      return res.status(401).json({ message: 'Token has been invalidated' });
    }

    // Verify customer exists
    const customer = await db.queryOne(
      'SELECT id, email, first_name, last_name FROM customers WHERE id = $1',
      [payload.customer_id]
    );

    if (!customer) {
      return res.status(401).json({ message: 'Customer not found' });
    }

    // Only assign the known property 'id' to req.customer to match the expected type
    req.customer = {
      id: customer.id,
    };

    return next();
  } finally {
    db.release();
  }
}

export default CustomerPrivateRoute;
