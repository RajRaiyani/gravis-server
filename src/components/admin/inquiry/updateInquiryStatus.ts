import { NextFunction, Request, Response } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import { UpdateInquiryStatus, GetInquiry } from '@/components/inquiry/inquiry.service.js';

export const ValidationSchema = {
  params: z.object({
    id: z.uuid({ version: 'v7', message: 'Invalid inquiry ID' }),
  }),
  body: z.object({
    status: z.enum(['pending', 'in_progress', 'resolved', 'closed'], {
      message: 'Invalid status',
    }),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { id } = req.params as z.infer<typeof ValidationSchema.params>;
  const { status } = req.body as z.infer<typeof ValidationSchema.body>;

  try {
    // Check if inquiry exists
    const existingInquiry = await GetInquiry(db, id);

    if (!existingInquiry) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }

    // Update status
    await UpdateInquiryStatus(db, id, status);

    // Fetch updated inquiry
    const updatedInquiry = await GetInquiry(db, id);

    return res.status(200).json({ inquiry: updatedInquiry });
  } catch (error) {
    return next(error);
  }
}
