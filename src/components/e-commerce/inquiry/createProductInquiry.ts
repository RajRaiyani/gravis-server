import { NextFunction, Request, Response } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import { CreateProductInquiry } from '@/components/inquiry/inquiry.service.js';
import ServerError from '@/utils/serverError.js';

export const ValidationSchema = {
  body: z.object({
    product_id: z.uuid({ version: 'v7', message: 'Invalid product ID' }),
    message: z
      .string()
      .trim()
      .nonempty('Message is required')
      .min(1, 'Message is required')
      .max(1000, 'Message must be less than 1000 characters'),
    quantity: z.number().int().min(1).max(1000).optional(),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { product_id, message, quantity } = req.body as z.infer<
    typeof ValidationSchema.body
  >;

  try {
    // Customer authentication is required
    const customer_id = req.customer?.id;

    if (!customer_id) {
      throw new ServerError(
        'UNAUTHORIZED',
        'You must be logged in to submit a product inquiry'
      );
    }

    const inquiry = await CreateProductInquiry(db, {
      customer_id,
      product_id,
      message,
      quantity,
    });

    return res.status(201).json({
      inquiry,
      message: 'Your product inquiry has been submitted successfully',
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Product not found') {
        return res.status(404).json({ message: error.message });
      }
      if (
        error.message ===
        'You already have a pending inquiry for this product'
      ) {
        return res.status(400).json({ message: error.message });
      }
    }
    return next(error);
  }
}
