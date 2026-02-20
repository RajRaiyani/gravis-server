import { NextFunction, Request, Response } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import { CreateGuestProductInquiry } from '@/components/inquiry/inquiry.service.js';

export const ValidationSchema = {
  body: z.object({
    product_id: z.uuid({ version: 'v7', message: 'Invalid product ID' }),
    message: z
      .string()
      .trim()
      .max(1000, 'Message must be less than 1000 characters')
      .optional(),
    name: z
      .string()
      .trim()
      .min(1, 'Name is required')
      .max(255, 'Name must be less than 255 characters'),
    phone_number: z
      .string()
      .trim()
      .regex(/^[0-9]{10}$/, { message: 'Phone number must be 10 digits' }),
    quantity: z.number().int().min(1).max(1000).optional(),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  try {
    const body = req.body as z.infer<typeof ValidationSchema.body>;
    const { product_id, message, name, phone_number, quantity } = body;

    const inquiry = await CreateGuestProductInquiry(db, {
      product_id,
      message,
      name,
      phone_number,
      quantity,
    });

    return res.status(201).json({
      inquiry,
      message: 'Your product inquiry has been submitted successfully',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Product not found') {
      return res.status(404).json({ message: error.message });
    }
    return next(error);
  }
}
