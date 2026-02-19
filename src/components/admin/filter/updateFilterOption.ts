import { NextFunction, Request, Response } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import { getFilterOptionById, getFilterOptionByFilterAndValue, updateFilterOption } from '@/components/filter/filter.service.js';

export const ValidationSchema = {
  params: z.object({
    id: z.uuid({ version: 'v7', message: 'Invalid filter option ID' }),
  }),
  body: z.object({
    value: z
      .string()
      .trim()
      .nonempty('Option value is required')
      .max(255, 'Option value must be less than 255 characters'),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient,
) {
  const { id } = req.params as z.infer<typeof ValidationSchema.params>;
  const { value } = req.body as z.infer<typeof ValidationSchema.body>;

  const filterOption = await getFilterOptionById(db, id);

  if (!filterOption) {
    return res.status(404).json({ message: 'Filter option not found' });
  }

  const duplicate = await getFilterOptionByFilterAndValue(db, filterOption.filter_id, value);

  if (duplicate && duplicate.id !== id) {
    return res.status(400).json({ message: 'Filter option with this value already exists for this filter' });
  }

  const updated = await updateFilterOption(db, id, value);

  return res.status(200).json(updated);
}
