import { NextFunction, Request, Response } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';

export const ValidationSchema = {
  params: z.object({
    id: z.uuid({ version: 'v7', message: 'Invalid product category ID' }),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient,
) {
  const { id } = req.params as z.infer<typeof ValidationSchema.params>;

  try {
    const existingCategory = await db.queryOne<{
      id: string;
      image_id: string | null;
    }>('SELECT id, image_id FROM product_categories WHERE id = $1', [id]);

    if (!existingCategory) {
      return res.status(404).json({ message: 'Product category not found' });
    }

    const productUsingCategory = await db.queryOne<{ id: string }>(
      'SELECT id FROM products WHERE category_id = $1 LIMIT 1',
      [id],
    );

    if (productUsingCategory) {
      return res.status(400).json({
        error:
          'Cannot delete product category because it is associated with existing products',
      });
    }

    await db.query('BEGIN');

    const deletedCategory = await db.queryOne(
      'DELETE FROM product_categories WHERE id = $1 RETURNING *',
      [id],
    );

    if (existingCategory.image_id) {
      await db.query('UPDATE files SET _status = $1 WHERE id = $2', [
        'deleted',
        existingCategory.image_id,
      ]);
    }

    await db.query('COMMIT');

    return res.status(200).json(deletedCategory);
  } catch (error) {
    await db.query('ROLLBACK');
    return next(error);
  }
}

