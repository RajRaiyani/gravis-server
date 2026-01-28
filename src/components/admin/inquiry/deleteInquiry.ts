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

    // Check if inquiry exists
    const existingInquiry = await db.queryOne<{ id: string }>(
      'SELECT id FROM inquiries WHERE id = $1',
      [id],
    );

    if (!existingInquiry) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }

    // Delete inquiry
    const deletedInquiry = await db.queryOne(
      'DELETE FROM inquiries WHERE id = $1 RETURNING *',
      [id],
    );

    return res.status(200).json({ data: deletedInquiry });
  } catch (error) {
    return next(error);
  }
}

