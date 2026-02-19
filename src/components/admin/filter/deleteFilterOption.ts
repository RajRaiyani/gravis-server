import { NextFunction, Request, Response } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import { getFilterOptionById, deleteFilterOption } from '@/components/filter/filter.service.js';

export const ValidationSchema = {
  params: z.object({
    id: z.uuid({ version: 'v7', message: 'Invalid filter option ID' }),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient,
) {
  const { id } = req.params as z.infer<typeof ValidationSchema.params>;

  const filterOption = await getFilterOptionById(db, id);

  if (!filterOption) {
    return res.status(404).json({ message: 'Filter option not found' });
  }

  await deleteFilterOption(db, id);

  return res.status(204).send();
}
