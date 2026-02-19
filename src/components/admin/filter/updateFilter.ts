import { NextFunction, Request, Response } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import { getFilterById, getFilterByCategoryAndName, updateFilter } from '@/components/filter/filter.service.js';

export const ValidationSchema = {
  params: z.object({
    id: z.uuid({ version: 'v7', message: 'Invalid filter ID' }),
  }),
  body: z.object({
    name: z
      .string()
      .trim()
      .nonempty('Name is required')
      .min(1, 'Name is required')
      .max(255, 'Name must be less than 255 characters'),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient,
) {
  const { id } = req.params as z.infer<typeof ValidationSchema.params>;
  const { name } = req.body as z.infer<typeof ValidationSchema.body>;

  const filter = await getFilterById(db, id);

  if (!filter) {
    return res.status(404).json({ message: 'Filter not found' });
  }

  const duplicate = await getFilterByCategoryAndName(db, filter.category_id, name);

  if (duplicate && duplicate.id !== id) {
    return res.status(400).json({ message: 'Filter with this name already exists for this category' });
  }

  const updated = await updateFilter(db, id, name);

  return res.status(200).json(updated);
}
