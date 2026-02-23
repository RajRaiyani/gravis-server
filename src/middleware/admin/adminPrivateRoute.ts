import { Request, Response, NextFunction } from 'express';
import JwtToken from '@/utils/jwtToken.js';



export default function PrivateRoute(req: Request, res: Response, next: NextFunction) {

  const token = req.headers.authorization;

  if (!token || typeof token !== 'string') return res.status(401).json({ message: 'Unauthorized' });
  const parts = token.trim().split(/\s+/);
  if (parts.length < 2 || !/^bearer$/i.test(parts[0])) return res.status(401).json({ message: 'Unauthorized' });
  const tokenString = parts[1];
  if (!tokenString) return res.status(401).json({ message: 'Unauthorized' });

  const payload = JwtToken.decode(tokenString);
  if (!payload || payload.type !== 'admin_access_token') return res.status(401).json({ message: 'Unauthorized' });

  req.user = { id: payload.user_id, is_admin: payload.is_admin };

  next();
}
