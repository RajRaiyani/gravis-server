import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';

type CountRow = { count: string };
type InquiryStatusRow = { status: string; count: string };

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const [customersRow, productsRow, categoriesRow, inquiriesRow, inquiriesByStatusRows] =
    await Promise.all([
      db.queryOne<CountRow>('SELECT COUNT(*) as count FROM customers'),
      db.queryOne<CountRow>('SELECT COUNT(*) as count FROM products'),
      db.queryOne<CountRow>('SELECT COUNT(*) as count FROM product_categories'),
      db.queryOne<CountRow>('SELECT COUNT(*) as count FROM inquiries'),
      db.queryAll<InquiryStatusRow>(
        'SELECT status, COUNT(*)::text as count FROM inquiries GROUP BY status'
      ),
    ]);

  const inquiries_by_status: Record<string, number> = {
    pending: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
  };

  (inquiriesByStatusRows || []).forEach((row) => {
    if (row.status in inquiries_by_status) {
      inquiries_by_status[row.status] = parseInt(row.count, 10);
    }
  });

  const data = {
    customers: parseInt(customersRow?.count ?? '0', 10),
    products: parseInt(productsRow?.count ?? '0', 10),
    product_categories: parseInt(categoriesRow?.count ?? '0', 10),
    inquiries: parseInt(inquiriesRow?.count ?? '0', 10),
    inquiries_by_status,
  };

  return res.status(200).json(data);
}
