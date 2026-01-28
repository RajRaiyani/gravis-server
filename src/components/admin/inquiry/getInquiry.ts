import { NextFunction, Request, Response } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';

export const ValidationSchema = {
  params: z.object({
    id: z.uuid({ version: 'v7', message: 'Invalid inquiry ID' }),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient,
) {
  try {
    const { id } = req.params as z.infer<typeof ValidationSchema.params>;

    const inquiryQuery = `
      SELECT
        id,
        name,
        email,
        phone_number,
        message,
        status,
        created_at,
        updated_at
      FROM inquiries
      WHERE id = $1
    `;

    const inquiry = await db.queryOne(inquiryQuery, [id]);

    if (!inquiry) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }

    return res.status(200).json({ data: inquiry });
  } catch (error) {
    return next(error);
  }
}

