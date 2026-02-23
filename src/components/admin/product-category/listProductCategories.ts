import { NextFunction, Request, Response } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { listProductCategories } from '@/components/admin/product-category/productCategory.service.js';

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient,
) {
  try {
    const data = await listProductCategories(db);
    return res.status(200).json(data);
  } catch (error) {
    return next(error);
  }
}
