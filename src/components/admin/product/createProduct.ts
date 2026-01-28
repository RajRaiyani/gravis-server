import { NextFunction, Request, Response } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';

export const ValidationSchema = {
  body: z.object({
    category_id: z.uuid({ version: 'v7', message: 'Invalid category ID' }),
    name: z
      .string()
      .trim()
      .nonempty('Name is required')
      .min(3, 'Name must be at least 3 characters')
      .max(255, 'Name must be less than 255 characters'),
    description: z
      .string()
      .trim()
      .max(2000, 'Description must be less than 2000 characters')
      .optional(),
    tags: z.array(z.string()).max(20, 'Maximum 20 tags allowed').default([]),
    metadata: z.object({}).default({}),
    points: z.array(z.string().trim().max(70, 'Points must be less than 70 characters')).default([]),
    technical_details: z.array(z.object({
      label: z.string().trim().min(1, 'Label is required'),
      value: z.string().trim().min(1, 'Value is required'),
    })).default([]),
    sale_price: z
      .number()
      .int()
      .min(0, 'Sale price must be greater than or equal to 0').transform(val => Math.round(val*100)),
    image_id: z.uuid({ version: 'v7', message: 'Invalid image ID' }),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient,
) {
  const {
    category_id,
    name,
    description,
    tags,
    metadata,
    sale_price,
    image_id,
    points,
    technical_details,
  } = req.body as z.infer<typeof ValidationSchema.body>;

  // Check if category exists
  const category = await db.queryOne<{ id: string }>(
    'SELECT id FROM product_categories WHERE id = $1',
    [category_id],
  );

  if (!category) {
    return res.status(400).json({ message: 'Invalid category' });
  }

  // Check if product with same name exists
  const existingProduct = await db.queryOne<{ id: string }>(
    'SELECT id FROM products WHERE name = $1',
    [name],
  );

  if (existingProduct) {
    return res
      .status(400)
      .json({ error: 'Product with this name already exists' });
  }

  try {
    await db.query('BEGIN');

    // Create product
    const newProduct = await db.queryOne(
      `INSERT INTO products (category_id, name, description, tags, metadata, sale_price_in_paisa, points, technical_details)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        category_id,
        name,
        description || null,
        tags || [],
        metadata || {},
        sale_price,
        points || [],
        technical_details || [],
      ],
    );

    // Insert product images

    await db.query(
      `INSERT INTO product_images (product_id, image_id, is_primary)
        VALUES ($1, $2, $3)`,
      [newProduct.id, image_id, true],
    );

    // Mark file as saved
    await db.query('UPDATE files SET _status = $1 WHERE id = $2', [
      'saved',
      image_id,
    ]);


    await db.query('COMMIT');

    return res.status(200).json(newProduct);
  } catch (error) {
    await db.query('ROLLBACK');
    return next(error);
  }
}