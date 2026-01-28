import { NextFunction, Request, Response } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';

export const ValidationSchema = {
  params: z.object({
    id: z.uuid({ version: 'v7', message: 'Invalid product ID' }),
  }),
  body: z.object({
    image_id: z.uuid({ version: 'v7', message: 'Invalid image ID' }),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient,
) {
  const { id } = req.params as z.infer<typeof ValidationSchema.params>;
  const { image_id } = req.body as z.infer<
    typeof ValidationSchema.body
  >;

  try {
    // Check if product exists
    const existingProduct = await db.queryOne<{ id: string }>(
      'SELECT id FROM products WHERE id = $1',
      [id],
    );

    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if image exists in files table
    const existingFile = await db.queryOne<{ id: string }>(
      'SELECT id FROM files WHERE id = $1',
      [image_id],
    );

    if (!existingFile) {
      return res.status(400).json({ message: 'Image file not found' });
    }

    // Check if image is already associated with this product
    const existingProductImage = await db.queryOne<{ image_id: string }>(
      'SELECT image_id FROM product_images WHERE product_id = $1 AND image_id = $2',
      [id, image_id],
    );

    if (existingProductImage) {
      return res
        .status(400)
        .json({ error: 'Image is already associated with this product' });
    }

    await db.query('BEGIN');

    // Insert product image
    await db.query(
      `INSERT INTO product_images (product_id, image_id, is_primary)
      VALUES ($1, $2, $3)`,
      [id, image_id, false],
    );

    // Mark file as saved
    await db.query('UPDATE files SET _status = $1 WHERE id = $2', [
      'saved',
      image_id,
    ]);

    await db.query('COMMIT');

    // Return the created product image
    const productImage = await db.queryOne<{
      product_id: string;
      image_id: string;
      is_primary: boolean;
    }>(
      'SELECT product_id, image_id, is_primary FROM product_images WHERE product_id = $1 AND image_id = $2',
      [id, image_id],
    );

    return res.status(201).json(productImage);
  } catch (error) {
    await db.query('ROLLBACK');
    return next(error);
  }
}

