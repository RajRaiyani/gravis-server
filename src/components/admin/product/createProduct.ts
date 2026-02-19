import { NextFunction, Request, Response } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { z } from 'zod';
import { SaveFile } from '@/components/file/file.service.js';
import { syncProductFilterOptionMappings, listProductFilterOptionMappings } from '@/components/filter/filter.service.js';

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
      .min(0, 'Sale price must be greater than or equal to 0')
      .max(100000000, 'Sale price must be less than 100000000 rupees').transform(val => Math.round(val*100)),
    image_id: z.uuid({ version: 'v7', message: 'Invalid image ID' }),
    product_label: z.string().trim().max(100, 'Product label must be less than 100 characters').optional(),
    warranty_label: z.string().trim().max(255, 'Warranty label must be less than 255 characters').optional(),
    is_featured: z.boolean().default(false),
    filter_option_ids: z.array(z.string().uuid('Invalid filter option ID')).optional().default([]),
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
    product_label,
    warranty_label,
    is_featured,
    filter_option_ids,
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
      `INSERT INTO products (category_id, name, description, tags, metadata, sale_price_in_paisa, points, technical_details, product_label, warranty_label, is_featured)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        category_id,
        name,
        description || null,
        tags || [],
        metadata || {},
        sale_price,
        points || [],
        technical_details || [],
        product_label || null,
        warranty_label || null,
        is_featured,
      ],
    );

    // Insert product images
    await db.query(
      `INSERT INTO product_images (product_id, image_id, is_primary)
        VALUES ($1, $2, $3)`,
      [newProduct.id, image_id, true],
    );

    // Mark file as saved
    await SaveFile(db, image_id);

    await syncProductFilterOptionMappings(db, newProduct.id, category_id, filter_option_ids ?? []);

    await db.query('COMMIT');

    const filterOptions = await listProductFilterOptionMappings(db, newProduct.id);
    return res.status(200).json({ ...newProduct, filter_options: filterOptions });
  } catch (error: any) {
    await db.query('ROLLBACK');
    if (error?.message?.startsWith('Invalid filter_option_ids')) {
      return res.status(400).json({ message: error.message });
    }
    return next(error);
  }
}
