import { DatabaseClient } from '@/service/database/index.js';

export async function getCategoryById(db: DatabaseClient, category_id: string) {
  return db.queryOne<{ id: string }>(
    'SELECT id FROM product_categories WHERE id = $1',
    [category_id],
  );
}

export async function getFilterById(db: DatabaseClient, id: string) {
  return db.queryOne<{ id: string; category_id: string; name: string }>(
    'SELECT id, category_id, name FROM filters WHERE id = $1',
    [id],
  );
}

export async function getFilterByCategoryAndName(
  db: DatabaseClient,
  category_id: string,
  name: string,
) {
  return db.queryOne<{ id: string }>(
    'SELECT id FROM filters WHERE category_id = $1 AND name = $2',
    [category_id, name],
  );
}

export async function getFilterOptionById(db: DatabaseClient, id: string) {
  return db.queryOne<{ id: string; filter_id: string; value: string }>(
    'SELECT id, filter_id, value FROM filter_options WHERE id = $1',
    [id],
  );
}

export async function getFilterOptionByFilterAndValue(
  db: DatabaseClient,
  filter_id: string,
  value: string,
) {
  return db.queryOne<{ id: string }>(
    'SELECT id FROM filter_options WHERE filter_id = $1 AND value = $2',
    [filter_id, value],
  );
}

export async function createFilter(db: DatabaseClient, data: { category_id: string, name: string }) {

  const filter = await db.queryOne(`
    INSERT INTO filters (category_id, name) VALUES ($1, $2) RETURNING *
    `, [data.category_id, data.name]);

  return filter;
}

export async function createFilterOption(db: DatabaseClient, data: { filter_id: string, value: string }) {
  const filterOption = await db.queryOne(`
    INSERT INTO filter_options (filter_id, value) VALUES ($1, $2) RETURNING *
    `, [data.filter_id, data.value]);

  return filterOption;
}

export async function createFilterWithOptions(
  db: DatabaseClient,
  data: { category_id: string; name: string; options: string[] },
) {
  await db.query('BEGIN');
  try {
    const filter = await createFilter(db, { category_id: data.category_id, name: data.name });
    const createdOptions: { id: string; value: string }[] = [];
    for (const value of data.options ?? []) {
      const option = await createFilterOption(db, { filter_id: filter.id, value });
      createdOptions.push({ id: option.id, value: option.value });
    }
    await db.query('COMMIT');
    return { ...filter, options: createdOptions };
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
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
          'category_filter_id', f.id,
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


export async function listProductFilterOptionMappings(db: DatabaseClient, product_id: string) {
  const rows = await db.queryAll<{ filter_option_id: string; filter_id: string; filter_name: string; value: string }>(
    `SELECT
      pfom.filter_option_id,
      f.id as filter_id,
      f.name as filter_name,
      fo.value
    FROM product_filter_option_mappings pfom
    JOIN filter_options fo ON fo.id = pfom.filter_option_id
    JOIN filters f ON f.id = fo.filter_id
    WHERE pfom.product_id = $1
    ORDER BY f.name, fo.value`,
    [product_id],
  );
  return rows;
}

export async function getValidFilterOptionIdsForCategory(db: DatabaseClient, category_id: string) {
  const rows = await db.queryAll<{ id: string }>(
    `SELECT fo.id FROM filter_options fo
     JOIN filters f ON f.id = fo.filter_id
     WHERE f.category_id = $1`,
    [category_id],
  );
  return rows.map((r) => r.id);
}


export async function syncProductFilterOptionMappings(
  db: DatabaseClient,
  product_id: string,
  category_id: string,
  filter_option_ids: string[],
) {
  const validIds = await getValidFilterOptionIdsForCategory(db, category_id);
  const validSet = new Set(validIds);
  const invalid = filter_option_ids.filter((id) => !validSet.has(id));
  if (invalid.length > 0) {
    throw new Error(`Invalid filter_option_ids for this category: ${invalid.join(', ')}`);
  }

  await db.query('DELETE FROM product_filter_option_mappings WHERE product_id = $1', [product_id]);

  for (const filter_option_id of filter_option_ids) {
    await db.query(
      'INSERT INTO product_filter_option_mappings (product_id, filter_option_id) VALUES ($1, $2)',
      [product_id, filter_option_id],
    );
  }
}

export async function createProductFilterOptionMapping(db: DatabaseClient, data: { product_id: string, filter_option_id: string }) {
  const productFilterOptionMapping = await db.queryOne(`
    INSERT INTO product_filter_option_mappings (product_id, filter_option_id) VALUES ($1, $2) RETURNING *
    `, [data.product_id, data.filter_option_id]);

  return productFilterOptionMapping;
}

export async function deleteProductFilterOptionMapping(db: DatabaseClient, product_id: string, filter_option_id: string) {
  const productFilterOptionMapping = await db.queryOne(`
    DELETE FROM product_filter_option_mappings WHERE product_id = $1 AND filter_option_id = $2 RETURNING *
    `, [product_id, filter_option_id]);

  return productFilterOptionMapping;
}


export async function updateFilter(db: DatabaseClient, id: string, name: string) {
  const filter = await db.queryOne(`
    UPDATE filters SET name = $1 WHERE id = $2 RETURNING *
    `, [name, id]);

  return filter;
}

export async function updateFilterOption(db: DatabaseClient, id: string, value: string) {
  const filterOption = await db.queryOne(`
    UPDATE filter_options SET value = $1 WHERE id = $2 RETURNING *
    `, [value, id]);

  return filterOption;
}

export async function deleteFilter(db: DatabaseClient, id: string) {
  const filter = await db.queryOne(`
    DELETE FROM filters WHERE id = $1 RETURNING *
    `, [id]);

  return filter;
}

export async function deleteFilterOption(db: DatabaseClient, id: string) {
  const filterOption = await db.queryOne(`
    DELETE FROM filter_options WHERE id = $1 RETURNING *
    `, [id]);

  return filterOption;
}
