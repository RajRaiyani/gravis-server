import { Request, Response, NextFunction } from 'express';
import JwtToken from '@/utils/jwtToken.js';

interface CustomerAuthPayload {
  type: 'customer_auth_token';
  customer_id: string;
}

interface GuestAuthPayload {
  type: 'guest_token';
  guest_id: string;
}

async function ParseToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

  const token = authHeader.split(' ')[1];

  if (!token) return next();

  const payload = JwtToken.decode(token) as CustomerAuthPayload | GuestAuthPayload;
  if (!payload) return next();

  if (payload.type === 'customer_auth_token') {
    req.customer = {
      id: payload.customer_id,
    };
  } else if (payload.type === 'guest_token') {
    req.guest = {
      id: payload.guest_id,
    };
  }

  return next();
}

export default ParseToken;
