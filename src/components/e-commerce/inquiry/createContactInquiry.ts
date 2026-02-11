import { NextFunction, Request, Response } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import { CreateContactInquiry } from '@/components/inquiry/inquiry.service.js';

export const ValidationSchema = {
  body: z.object({
    name: z
      .string()
      .trim()
      .nonempty('Name is required')
      .min(1, 'Name must be at least 1 character')
      .max(255, 'Name must be less than 255 characters'),
    email: z.email({ message: 'Invalid email address' }).toLowerCase(),
    phone_number: z
      .string()
      .trim()
      .nonempty('Phone number is required')
      .regex(/^[0-9]{10}$/, { message: 'Phone number must be 10 digits' }),
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
  db: DatabaseClient
) {
  const { name, email, phone_number, message } = req.body as z.infer<
    typeof ValidationSchema.body
  >;

  try {
    const inquiry = await CreateContactInquiry(db, {
      name,
      email,
      phone_number,
      message,
    });

    return res.status(201).json({
      inquiry,
      message: 'Your inquiry has been submitted successfully',
    });
  } catch (error) {
    return next(error);
  }
}
