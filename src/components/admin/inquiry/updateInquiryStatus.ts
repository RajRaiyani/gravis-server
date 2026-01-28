import { NextFunction, Request, Response } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';

export const ValidationSchema = {
  params: z.object({
    id: z.uuid({ version: 'v7', message: 'Invalid inquiry ID' }),
  }),
  body: z.object({
    status: z.enum(['pending', 'in_progress', 'resolved', 'closed'],'Invalid status'),
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
    const { status } = req.body as z.infer<typeof ValidationSchema.body>;

    // Check if inquiry exists
    const existingInquiry = await db.queryOne<{ id: string }>(
      'SELECT id FROM inquiries WHERE id = $1',
      [id],
    );

    if (!existingInquiry) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }

    // Update inquiry status
    const updatedInquiry = await db.queryOne(
      `UPDATE inquiries
      SET status = $1
      WHERE id = $2
      RETURNING *`,
      [status, id],
    );

    return res.status(200).json({ data: updatedInquiry });
  } catch (error) {
    return next(error);
  }
}

