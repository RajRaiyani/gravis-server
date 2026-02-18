import { NextFunction, Request, Response } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import { SaveFile, DeleteFile } from '@/components/file/file.service.js';

export const ValidationSchema = {
  params: z.object({
    id: z.uuid({ version: 'v7', message: 'Invalid product category ID' }),
  }),
  body: z.object({
    name: z
      .string()
      .trim()
      .nonempty('Name is required')
      .min(3, 'Name must be at least 3 characters')
      .max(100, 'Name must be less than 100 characters'),
    description: z
      .string()
      .trim()
      .max(500, 'Description must be less than 500 characters'),
    image_id: z.uuid({ version: 'v7', message: 'Invalid image ID' }),
    banner_image_id: z.uuid({ version: 'v7', message: 'Invalid banner image ID' }).optional(),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient,
) {
  const { id } = req.params as z.infer<typeof ValidationSchema.params>;
  const { name, description, image_id, banner_image_id } = req.body as z.infer<
    typeof ValidationSchema.body
  >;

  try {
    const existingCategory = await db.queryOne<{
      id: string;
      name: string;
      image_id: string | null;
      banner_image_id: string | null;
    }>('SELECT id, name, image_id, banner_image_id FROM product_categories WHERE id = $1', [id]);

    if (!existingCategory) {
      return res.status(404).json({ message: 'Product category not found' });
    }

    const duplicateCategory = await db.queryOne<{
      id: string;
      name: string;
    }>(
      'SELECT id, name FROM product_categories WHERE name = $1 AND id <> $2',
      [name, id],
    );

    if (duplicateCategory) {
      return res.status(400).json({ message: 'Product category already exists' });
    }

    await db.query('BEGIN');

    const updatedCategory = await db.queryOne(
      'UPDATE product_categories SET name = $1, description = $2, image_id = $3, banner_image_id = $4 WHERE id = $5 RETURNING *',
      [name, description, image_id, banner_image_id || null, id],
    );

    // Mark the new image as saved
    await SaveFile(db, image_id);

    // If image has changed, optionally mark the old image as deleted
    if (existingCategory.image_id && existingCategory.image_id !== image_id) {
      await DeleteFile(db, existingCategory.image_id);
    }

    // Handle banner image changes
    if (banner_image_id) {
      await SaveFile(db, banner_image_id);
    }
    
    if (existingCategory.banner_image_id && existingCategory.banner_image_id !== banner_image_id) {
      await DeleteFile(db, existingCategory.banner_image_id);
    }

    await db.query('COMMIT');

    return res.status(200).json(updatedCategory);
  } catch (error) {
    await db.query('ROLLBACK');
    return next(error);
  }
}

