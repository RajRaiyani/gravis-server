import { DatabaseClient } from '@/service/database/index.js';
import env from '@/config/env.js';
import {
  listProductFilterOptionMappings,
} from '@/components/filter/filter.service.js';

type ListProductsQuery = {
  category_id?: string;
  search?: string;
  offset?: number;
  limit?: number;
  customer_id?: string;
  only_featured?: boolean;
  filter_option_ids?: string[];
};

export async function ListProducts(db: DatabaseClient, query: ListProductsQuery) {
  const { category_id, search, offset, limit, customer_id, only_featured, filter_option_ids } = query;



  // Build WHERE conditions
  let whereClause = ' TRUE ';

  if (category_id) whereClause += ' AND p.category_id = $category_id';

  if (search) whereClause += ' AND (p.name ILIKE LOWER($search)) ';

  if (only_featured) whereClause += ' AND p.is_featured = true';

  let withQueryStmt = '';
  if (filter_option_ids && filter_option_ids.length > 0) {

    withQueryStmt += `
      used_filter_options AS (
        SELECT id, filter_id FROM filter_options WHERE id = ANY($filter_option_ids::uuid[])
      ),

      total_used_filters AS (
        SELECT COUNT(DISTINCT filter_id) AS count FROM used_filter_options
      ),

      products_with_matching_filter_counts AS (
        SELECT
          pfom.product_id,
          COUNT(DISTINCT o.filter_id) AS matched_filters
        FROM product_filter_option_mappings pfom
        JOIN used_filter_options o ON o.id = pfom.filter_option_id
        GROUP BY pfom.product_id
      ),

      filtered_product_with_options AS (
        SELECT
          pwmfc.product_id
        FROM products_with_matching_filter_counts pwmfc
        JOIN total_used_filters tuf ON tuf.count = pwmfc.matched_filters
      ),
    `;
    whereClause += ' AND p.id in (select product_id distinct from filtered_product_with_options) ';
  }



  const listQuery = `
    WITH
    ${withQueryStmt}
    filtered_products AS (
      SELECT p.*
      FROM products p
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      WHERE ${whereClause}
    )

    SELECT
      p.id,
      p.category_id,
      p.name,
      p.description,
      p.tags,
      p.metadata,
      p.sale_price_in_paisa,
      p.sale_price_in_rupee,
      p.created_at,
      p.updated_at,
      p.points,
      p.product_label,
      p.warranty_label,
      p.is_featured,
      json_build_object(
        'id', pc.id,
        'name', pc.name,
        'description', pc.description
      ) as category,
      json_build_object(
        'id', f.id,
        'key', f.key,
        'url', ('${env.fileStorageEndpoint}/' || f.key)
      ) as primary_image,
      CASE WHEN i.id IS NOT NULL THEN true ELSE false END as has_pending_inquiry,
      CASE WHEN i.id IS NOT NULL THEN i.id ELSE NULL END as pending_inquiry_id
    FROM filtered_products p
    LEFT JOIN product_categories pc ON p.category_id = pc.id
    LEFT JOIN inquiries i ON p.id = i.product_id AND i.customer_id = $customer_id AND i.status = 'pending'
    LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
    LEFT JOIN files f ON pi.image_id = f.id
    ORDER BY p.created_at DESC
    LIMIT $limit OFFSET $offset
  `;


  const params: Record<string, unknown> = {
    limit,
    offset,
    category_id,
    customer_id,
    search: search ? `%${search}%` : null,
    filter_option_ids,
  };

  const data = await db.namedQueryAll(listQuery, params);

  return data;
}


export async function GetProduct(db: DatabaseClient, id: string, customer_id?: string) {

  const productQuery = `
  SELECT
    p.id,
    p.category_id,
    p.name,
    p.description,
    p.tags,
    p.metadata,
    p.sale_price_in_paisa,
    p.sale_price_in_rupee,
    p.sale_price_in_rupee as sale_price,
    p.created_at,
    p.updated_at,
    p.points,
    p.technical_details,
    p.product_label,
    p.warranty_label,
    p.is_featured,
    json_build_object(
      'id', pc.id,
      'name', pc.name,
      'description', pc.description,
      'image', json_build_object(
        'id', fc.id,
        'key', fc.key,
        'url', ('${env.fileStorageEndpoint}/' || fc.key)
      ),
      'banner_image', json_build_object(
        'id', fcb.id,
        'key', fcb.key,
        'url', ('${env.fileStorageEndpoint}/' || fcb.key)
      )
    ) as category,
    json_build_object(
      'id', fp.id,
      'key', fp.key,
      'url', ('${env.fileStorageEndpoint}/' || fp.key)
    ) as primary_image,
    COALESCE(
      json_agg(
        DISTINCT jsonb_build_object(
          'image_id', pi.image_id,
          'is_primary', pi.is_primary,
          'image', json_build_object(
            'id', f.id,
            'key', f.key,
            'url', ('${env.fileStorageEndpoint}/' || f.key)
          )
        )
      ) FILTER (WHERE pi.image_id IS NOT NULL),
      '[]'::json
    ) as images
  FROM products p
  LEFT JOIN product_categories pc ON p.category_id = pc.id
  LEFT JOIN product_images pi ON p.id = pi.product_id
  LEFT JOIN product_images ppi ON p.id = ppi.product_id AND ppi.is_primary = true
  LEFT JOIN files fp ON ppi.image_id = fp.id
  LEFT JOIN files f ON pi.image_id = f.id
  LEFT JOIN files fc ON pc.image_id = fc.id
  LEFT JOIN files fcb ON pc.banner_image_id = fcb.id
  WHERE p.id = $1
  GROUP BY p.id, pc.id, pc.name, pc.description, fc.id, fc.key, fcb.id, fcb.key, fp.id, fp.key
`;

  const product = await db.queryOne(productQuery, [id]);

  if (!product) {
    return null;
  }

  if (customer_id) {
    const pendingInquiry = await db.queryOne<{ id: string }>(
      `SELECT id FROM inquiries
       WHERE customer_id = $1
       AND product_id = $2
       AND status = 'pending'`,
      [customer_id, id]
    );

    if (pendingInquiry) {
      product.has_pending_inquiry = true;
      product.pending_inquiry_id = pendingInquiry.id;
    } else {
      product.has_pending_inquiry = false;
      product.pending_inquiry_id = null;
    }
  }

  const filterOptions = await listProductFilterOptionMappings(db, id);
  product.filter_options = filterOptions;

  return product;
}
