import { NextFunction, Request, Response } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';

export const ValidationSchema = {
  params: z.object({
    id: z.uuid({ version: 'v7', message: 'Invalid product ID' }),
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
    const existingProduct = await db.queryOne<{ id: string }>(
      'SELECT id FROM products WHERE id = $1',
      [id],
    );

    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await db.query('BEGIN');

    // Get all product images
    const productImages = await db.queryAll<{ image_id: string }>(
      'SELECT image_id FROM product_images WHERE product_id = $1',
      [id],
    );

    // Delete product images
    await db.query('DELETE FROM product_images WHERE product_id = $1', [id]);

    // Mark image files as deleted
    for (const img of productImages) {
      await db.query('UPDATE files SET _status = $1 WHERE id = $2', [
        'deleted',
        img.image_id,
      ]);
    }

    // Delete product
    const deletedProduct = await db.queryOne(
      'DELETE FROM products WHERE id = $1 RETURNING *',
      [id],
    );

    await db.query('COMMIT');

    return res.status(200).json(deletedProduct);
  } catch (error) {
    await db.query('ROLLBACK');
    return next(error);
  }
}

