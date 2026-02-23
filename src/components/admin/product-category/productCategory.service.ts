import { DatabaseClient } from '@/service/database/index.js';
import env from '@/config/env.js';

export async function listProductCategories(db: DatabaseClient) {
  const listQuery = `
    SELECT
      pc.id,
      pc.name,
      pc.description,
      pc.image_id,
      json_build_object(
        'id', f.id,
        'key', f.key,
        'url', ('${env.fileStorageEndpoint}/' || f.key)
      ) AS image,
      json_build_object(
        'id', fb.id,
        'key', fb.key,
        'url', ('${env.fileStorageEndpoint}/' || fb.key)
      ) AS banner_image
    FROM product_categories pc
    LEFT JOIN files f ON pc.image_id = f.id
    LEFT JOIN files fb ON pc.banner_image_id = fb.id
    ORDER BY pc.name ASC
  `;
  const data = await db.queryAll(listQuery);
  return data;
}

export async function listCategoryFilters(db: DatabaseClient, category_id: string) {
  const filters = await db.queryAll(`
    SELECT
      f.id,
      f.category_id,
      f.name,
      json_agg(
        json_build_object(
          'id', fo.id,
          'filter_id', f.id,
          'value', fo.value
        )
      ) FILTER (WHERE fo.id IS NOT NULL) AS options
    FROM filters f
    LEFT JOIN filter_options fo ON f.id = fo.filter_id
    WHERE f.category_id = $1
    GROUP BY f.id, f.category_id, f.name
    ORDER BY f.name ASC
  `, [category_id]);

  return (filters || []).map((row: { id: string; category_id: string; name: string; options: unknown }) => ({
    id: row.id,
    category_id: row.category_id,
    name: row.name,
    slug: row.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    sort_order: 0,
    options: row.options ?? [],
  }));
}
