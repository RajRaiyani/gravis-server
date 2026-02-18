import { DatabaseClient } from '@/service/database/index.js';
import env from '@/config/env.js';

type ListProductsQuery = {
  category_id?: string;
  search?: string;
  offset?: number;
  limit?: number;
  customer_id?: string;
  only_featured?: boolean;
};

export async function ListProducts(db: DatabaseClient, query: ListProductsQuery) {
  const { category_id, search, offset, limit, customer_id, only_featured } = query;

  // Build WHERE conditions
  let whereClause = ' WHERE 1=1 ';

  if (category_id) whereClause += ' AND p.category_id = $category_id';

  if (search) whereClause += ' AND (p.name ILIKE LOWER($search)) ';

  if (only_featured) whereClause += ' AND p.is_featured = true';


  const listQuery = `
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
    LEFT JOIN files f ON pi.image_id = f.id
    LEFT JOIN files fp ON ppi.image_id = fp.id
    ${whereClause}
    GROUP BY p.id, pc.id, pc.name, pc.description, fp.id, fp.key
    ORDER BY p.created_at DESC
    LIMIT $limit OFFSET $offset
  `;


  const data = await db.namedQueryAll(listQuery, {
    limit,
    offset,
    category_id,
    search: search ? `%${search}%` : null,
  });

  if (customer_id && data.length > 0) {
    const product_ids = data.map((p: any) => p.id);

    const pendingInquiries = await db.queryAll<{
      product_id: string;
      inquiry_id: string;
    }>(
      `SELECT product_id, id as inquiry_id
       FROM inquiries
       WHERE customer_id = $1
       AND product_id = ANY($2)
       AND status = 'pending'`,
      [customer_id, product_ids]
    );

    const inquiryMap: Record<string, string> = {};
    pendingInquiries.forEach((inq) => {
      inquiryMap[inq.product_id] = inq.inquiry_id;
    });

    data.forEach((product: any) => {
      if (inquiryMap[product.id]) {
        product.has_pending_inquiry = true;
        product.pending_inquiry_id = inquiryMap[product.id];
      } else {
        product.has_pending_inquiry = false;
        product.pending_inquiry_id = null;
      }
    });
  }

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
      'description', pc.description
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
  WHERE p.id = $1
  GROUP BY p.id, pc.id, pc.name, pc.description, fp.id, fp.key
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

  return product;
}
