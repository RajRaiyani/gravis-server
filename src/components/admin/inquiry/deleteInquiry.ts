import { NextFunction, Request, Response } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import { DeleteInquiry, GetInquiry } from '@/components/inquiry/inquiry.service.js';

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
    // Check if inquiry exists
    const existingInquiry = await GetInquiry(db, id);

    if (!existingInquiry) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }

    // Delete inquiry
    await DeleteInquiry(db, id);

    return res.status(200).json({
      message: 'Inquiry deleted successfully',
      inquiry_id: id,
    });
  } catch (error) {
    return next(error);
  }
}
