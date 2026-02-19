import express from 'express';

import WithDatabase from '@/utils/withDatabase.js';

import { Controller as listProductCategoriesController } from '@/components/e-commerce/product-category/listProductCategories.js';
import { Controller as listCategoryBannersController } from '@/components/e-commerce/product-category/listCategoryBanners.js';

const router = express.Router();

router
  .route('/')
  .get(WithDatabase(listProductCategoriesController));

router
  .route('/banners')
  .get(WithDatabase(listCategoryBannersController));

export default router;
