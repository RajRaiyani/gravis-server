import { NextFunction, Request, Response } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';

export const ValidationSchema = {
  params: z.object({
    image_id: z.uuid({ version: 'v7', message: 'Invalid image ID' }),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient,
) {
  const { image_id } = req.params as z.infer<
    typeof ValidationSchema.params
  >;

  try {

    // Check if image is associated with this product and get its primary status
    const productImage = await db.queryOne<{
      image_id: string;
      is_primary: boolean;
    }>(
      'SELECT image_id, is_primary FROM product_images WHERE image_id = $1',
      [ image_id],
    );

    if (!productImage) {
      return res
        .status(404)
        .json({ error: 'Image is not associated with this product' });
    }

    // Prevent deletion of primary images
    if (productImage.is_primary) {
      return res
        .status(400)
        .json({
          error: 'Cannot delete primary image. Please set another image as primary first.',
        });
    }

    await db.query('BEGIN');

    // Delete product image association
    await db.query(
      'DELETE FROM product_images WHERE image_id = $1',
      [image_id],
    );

    // Mark file as deleted
    await db.query('UPDATE files SET _status = $1 WHERE id = $2', [
      'deleted',
      image_id,
    ]);

    await db.query('COMMIT');

    return res.status(204).send();
  } catch (error) {
    await db.query('ROLLBACK');
    return next(error);
  }
}

