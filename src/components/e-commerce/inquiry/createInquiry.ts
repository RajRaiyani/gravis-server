import { NextFunction, Request, Response } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';

export const ValidationSchema = {
  body: z.object({
    name: z
      .string()
      .trim()
      .nonempty('Full name is required')
      .min(1, 'Full name must be at least 1 character')
      .max(255, 'Full name must be less than 255 characters'),
    phone_number: z
      .string()
      .trim()
      .nonempty('Phone number is required')
      .regex(/^[0-9]{10}$/, { message: "Phone number must be 10 digits" }),
    email: z.email({ message: "Invalid email address" }).toLowerCase(),
    message: z
      .string()
      .trim()
      .nonempty('Message is required')
      .min(1, 'Message is required')
      .max(1000, 'Message must be less than 1000 characters'),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient,
) {
  try {
    const { name, phone_number, email, message } = req.body as z.infer<
      typeof ValidationSchema.body
    >;

    // Insert inquiry into database
    const newInquiry = await db.queryOne(
      `INSERT INTO inquiries (name, phone_number, email, message, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [name, phone_number, email, message, 'pending'],
    );

    return res.status(200).json(newInquiry);
  } catch (error) {
    return next(error);
  }
}

