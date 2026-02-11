import { DatabaseClient } from '@/service/database/index.js';
import env from '@/config/env.js';

export type ListInquiriesQuery = {
  type?: 'general' | 'contact' | 'product';
  status?: 'pending' | 'in_progress' | 'resolved' | 'closed';
  search?: string;
  offset?: number;
  limit?: number;
};

export async function ListInquiries(
  db: DatabaseClient,
  query: ListInquiriesQuery
) {
  const { type, status, search, offset, limit } = query;

  let whereClause = ' WHERE 1=1 ';

  if (type) whereClause += ' AND i.type = $type';
  if (status) whereClause += ' AND i.status = $status';
  if (search) {
    whereClause += ` AND (
      i.message ILIKE $search OR
      c.full_name ILIKE $search OR
      c.email ILIKE $search OR
      i.meta_data->>'name' ILIKE $search OR
      i.meta_data->>'email' ILIKE $search OR
      i.meta_data->>'phone_number' ILIKE $search
    )`;
  }

  const countQuery = `
    SELECT COUNT(*) as total
    FROM inquiries i
    LEFT JOIN customers c ON i.customer_id = c.id
    ${whereClause}
  `;

  const countResult = await db.namedQueryOne<{ total: string }>(countQuery, {
    type,
    status,
    search: search ? `%${search}%` : null,
  });

  const total = parseInt(countResult?.total || '0', 10);

  const listQuery = `
    SELECT
      i.id,
      i.type,
      i.message,
      i.product_id,
      i.status,
      i.meta_data,
      i.created_at,
      i.updated_at,
      CASE
        WHEN i.customer_id IS NOT NULL THEN
          json_build_object(
            'id', c.id,
            'full_name', c.full_name,
            'email', c.email,
            'phone_number', c.phone_number
          )
        ELSE NULL
      END as customer,
      CASE
        WHEN i.product_id IS NOT NULL THEN
          json_build_object(
            'id', p.id,
            'name', p.name,
            'sale_price_in_rupee', p.sale_price_in_rupee
          )
        ELSE NULL
      END as product
    FROM inquiries i
    LEFT JOIN customers c ON i.customer_id = c.id
    LEFT JOIN products p ON i.product_id = p.id
    ${whereClause}
    ORDER BY i.created_at DESC
    LIMIT $limit OFFSET $offset
  `;

  const data = await db.namedQueryAll(listQuery, {
    type,
    status,
    search: search ? `%${search}%` : null,
    limit,
    offset,
  });

  return {
    data,
    meta: {
      total,
      offset,
      limit,
      hasMore: offset + limit < total,
    },
  };
}

export async function GetInquiry(db: DatabaseClient, id: string) {
  const inquiryQuery = `
    SELECT
      i.id,
      i.type,
      i.message,
      i.product_id,
      i.status,
      i.meta_data,
      i.created_at,
      i.updated_at,
      CASE
        WHEN i.customer_id IS NOT NULL THEN
          json_build_object(
            'id', c.id,
            'first_name', c.first_name,
            'last_name', c.last_name,
            'full_name', c.full_name,
            'email', c.email,
            'phone_number', c.phone_number,
            'is_email_verified', c.is_email_verified
          )
        ELSE NULL
      END as customer,
      CASE
        WHEN i.product_id IS NOT NULL THEN
          json_build_object(
            'id', p.id,
            'name', p.name,
            'description', p.description,
            'sale_price_in_rupee', p.sale_price_in_rupee,
            'primary_image', json_build_object(
              'id', f.id,
              'key', f.key,
              'url', ('${env.fileStorageEndpoint}/' || f.key)
            ),
            'category', json_build_object(
              'id', pc.id,
              'name', pc.name
            )
          )
        ELSE NULL
      END as product
    FROM inquiries i
    LEFT JOIN customers c ON i.customer_id = c.id
    LEFT JOIN products p ON i.product_id = p.id
    LEFT JOIN product_categories pc ON p.category_id = pc.id
    LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
    LEFT JOIN files f ON pi.image_id = f.id
    WHERE i.id = $1
  `;

  const inquiry = await db.queryOne(inquiryQuery, [id]);
  return inquiry;
}

export async function CreateContactInquiry(
  db: DatabaseClient,
  data: {
    name: string;
    email: string;
    phone_number: string;
    message: string;
  }
) {
  const inquiry = await db.queryOne(
    `INSERT INTO inquiries (type, message, meta_data, status)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [
      'contact',
      data.message,
      {
        name: data.name,
        email: data.email,
        phone_number: data.phone_number,
      },
      'pending',
    ]
  );

  return inquiry;
}

export async function CreateProductInquiry(
  db: DatabaseClient,
  data: {
    customer_id: string;
    product_id: string;
    message: string;
    quantity?: number;
  }
) {
  // Check if product exists
  const product = await db.queryOne(
    'SELECT id, name FROM products WHERE id = $1',
    [data.product_id]
  );

  if (!product) {
    throw new Error('Product not found');
  }

  // Check for pending inquiry
  const existingInquiry = await db.queryOne(
    `SELECT id FROM inquiries
     WHERE customer_id = $1
     AND product_id = $2
     AND status = 'pending'`,
    [data.customer_id, data.product_id]
  );

  if (existingInquiry) {
    throw new Error('You already have a pending inquiry for this product');
  }

  const meta_data: Record<string, any> = {};
  if (data.quantity) {
    meta_data.quantity = data.quantity;
  }

  const inquiry = await db.queryOne(
    `INSERT INTO inquiries (type, customer_id, product_id, message, meta_data, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    ['product', data.customer_id, data.product_id, data.message, meta_data, 'pending']
  );

  return inquiry;
}

export async function UpdateInquiryStatus(
  db: DatabaseClient,
  id: string,
  status: 'pending' | 'in_progress' | 'resolved' | 'closed'
) {
  const inquiry = await db.queryOne(
    `UPDATE inquiries
     SET status = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [status, id]
  );

  return inquiry;
}

export async function DeleteInquiry(db: DatabaseClient, id: string) {
  const inquiry = await db.queryOne(
    'DELETE FROM inquiries WHERE id = $1 RETURNING *',
    [id]
  );

  return inquiry;
}

export async function CheckPendingProductInquiry(
  db: DatabaseClient,
  customer_id: string,
  product_id: string
): Promise<boolean> {
  const inquiry = await db.queryOne(
    `SELECT id FROM inquiries
     WHERE customer_id = $1
     AND product_id = $2
     AND status = 'pending'`,
    [customer_id, product_id]
  );

  return !!inquiry;
}

export async function CheckPendingProductInquiries(
  db: DatabaseClient,
  customer_id: string,
  product_ids: string[]
): Promise<Record<string, boolean>> {
  if (product_ids.length === 0) {
    return {};
  }

  const inquiries = await db.queryAll<{ product_id: string }>(
    `SELECT DISTINCT product_id
     FROM inquiries
     WHERE customer_id = $1
     AND product_id = ANY($2)
     AND status = 'pending'`,
    [customer_id, product_ids]
  );

  const result: Record<string, boolean> = {};
  product_ids.forEach((id) => {
    result[id] = false;
  });

  inquiries.forEach((inq) => {
    result[inq.product_id] = true;
  });

  return result;
}
