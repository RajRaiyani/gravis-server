import { NextFunction, Request, Response } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import { getFilterById, deleteFilter } from '@/components/filter/filter.service.js';

export const ValidationSchema = {
  params: z.object({
    id: z.uuid({ version: 'v7', message: 'Invalid filter ID' }),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient,
) {
  const { id } = req.params as z.infer<typeof ValidationSchema.params>;

  const filter = await getFilterById(db, id);

  if (!filter) {
    return res.status(404).json({ message: 'Filter not found' });
  }

  await deleteFilter(db, id);

  return res.status(204).send();
}
