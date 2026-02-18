import { NextFunction, Request, Response } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';

export const ValidationSchema = {
  body: z.object({
    name: z.string().trim().nonempty('Name is required')
      .min(3, 'Name must be at least 3 characters').max(100, 'Name must be less than 100 characters'),
    description: z.string().trim().max(500, 'Description must be less than 500 characters'),
    image_id: z.uuid({ version: 'v7', message: 'Invalid image ID' }),
    banner_image_id: z.uuid({ version: 'v7', message: 'Invalid banner image ID' }).optional(),
  }),
};

export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) {
  const { name, description, image_id, banner_image_id } = req.body as z.infer<typeof ValidationSchema.body>;

  const productCategory = await db.queryOne('SELECT id, name FROM product_categories WHERE name = $1', [name]);
  if (productCategory) return res.status(400).json({ message: 'Product category already exists' });

  try{
    await db.query('BEGIN');
    const newProductCategory = await db.queryOne('INSERT INTO product_categories (name, description, image_id, banner_image_id) VALUES ($1, $2, $3, $4) RETURNING *', [name, description, image_id, banner_image_id || null]);
    await db.query('UPDATE files SET _status = $1 WHERE id = $2', ['saved', image_id]);
    if (banner_image_id) {
      await db.query('UPDATE files SET _status = $1 WHERE id = $2', ['saved', banner_image_id]);
    }
    await db.query('COMMIT');
    return res.status(200).json(newProductCategory);
  }catch(error){
    await db.query('ROLLBACK');
    throw error;
  }
}
