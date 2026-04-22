import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const states = await db.queryAll(
    `SELECT id, name, gst_code, is_union_territory
     FROM states
     ORDER BY name ASC`
  );

  return res.status(200).json({
    states,
  });
}
