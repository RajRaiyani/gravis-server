import { Request, Response, NextFunction } from 'express';
import JwtToken from '@/utils/jwtToken.js';

interface CustomerAuthPayload {
  type: 'customer_auth_token';
  customer_id: string;
}

async function ParseCustomer(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

  const token = authHeader.split(' ')[1];

  if (!token) return next();

  const payload = JwtToken.decode(token) as CustomerAuthPayload;
  if (!payload || payload.type !== 'customer_auth_token') return next();

  req.customer = {
    id: payload.customer_id,
  };

  return next();
}

export default ParseCustomer;
