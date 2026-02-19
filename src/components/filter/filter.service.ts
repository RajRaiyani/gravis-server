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
      json_agg(json_build_object(
        'id', fo.id,
        'value', fo.value
      )) as options
    FROM filters f
    LEFT JOIN filter_options fo ON f.id = fo.filter_id
    WHERE f.category_id = $1
    GROUP BY f.id, f.name
    ORDER BY f.name ASC
    `, [category_id]);

  return filters;
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
