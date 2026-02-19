import { NextFunction, Request, Response } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import {
  getCategoryById,
  getFilterByCategoryAndName,
  createFilterWithOptions,
} from '@/components/filter/filter.service.js';

export const ValidationSchema = {
  body: z.object({
    category_id: z.uuid({ version: 'v7', message: 'Invalid category ID' }),
    name: z
      .string()
      .trim()
      .nonempty('Name is required')
      .min(1, 'Name is required')
      .max(255, 'Name must be less than 255 characters'),
    options: z
      .array(z.string().trim().nonempty('Option value is required').max(255, 'Option value must be less than 255 characters'))
      .optional()
      .default([]),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient,
) {
  const { category_id, name, options } = req.body as z.infer<typeof ValidationSchema.body>;

  const category = await getCategoryById(db, category_id);

  if (!category) {
    return res.status(400).json({ message: 'Invalid category' });
  }

  const existingFilter = await getFilterByCategoryAndName(db, category_id, name);

  if (existingFilter) {
    return res.status(400).json({ message: 'Filter with this name already exists for this category' });
  }

  try {
    const result = await createFilterWithOptions(db, { category_id, name, options: options ?? [] });
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}
