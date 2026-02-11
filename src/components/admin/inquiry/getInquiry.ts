import { NextFunction, Request, Response } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import { GetInquiry } from '@/components/inquiry/inquiry.service.js';

export const ValidationSchema = {
  params: z.object({
    id: z.uuid({ version: 'v7', message: 'Invalid inquiry ID' }),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { id } = req.params as z.infer<typeof ValidationSchema.params>;

  try {
    const inquiry = await GetInquiry(db, id);

    if (!inquiry) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }

    return res.status(200).json({ inquiry });
  } catch (error) {
    return next(error);
  }
}
