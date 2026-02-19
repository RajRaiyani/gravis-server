import { NextFunction, Request, Response } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import {
  getFilterById,
  getFilterOptionByFilterAndValue,
  createFilterOption,
} from '@/components/filter/filter.service.js';

export const ValidationSchema = {
  body: z.object({
    filter_id: z.uuid({ version: 'v7', message: 'Invalid filter option ID' }),
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
  const { filter_id, value } = req.body as z.infer<typeof ValidationSchema.body>;

  const filter = await getFilterById(db, filter_id);

  if (!filter) {
    return res.status(404).json({ message: 'Filter not found' });
  }

  const existingOption = await getFilterOptionByFilterAndValue(db, filter_id, value);

  if (existingOption) {
    return res.status(400).json({ message: 'Filter option with this value already exists for this filter' });
  }

  const filterOption = await createFilterOption(db, { filter_id, value });

  return res.status(200).json(filterOption);
}
