import express from 'express';
import { validate } from '@/utils/validationHelper.js';
import WithDatabase from '@/utils/withDatabase.js';

import { Controller as listProductCategoriesController } from '@/components/e-commerce/product-category/listProductCategories.js';
import { Controller as listCategoryBannersController } from '@/components/e-commerce/product-category/listCategoryBanners.js';
import {
  ValidationSchema as listCategoryFiltersValidationSchema,
  Controller as listCategoryFiltersController,
} from '@/components/e-commerce/product-category/listCategoryFilters.js';

const router = express.Router();

router
  .route('/')
  .get(WithDatabase(listProductCategoriesController));

router
  .route('/banners')
  .get(WithDatabase(listCategoryBannersController));

router
  .route('/:category_id/filters')
  .get(
    validate(listCategoryFiltersValidationSchema),
    WithDatabase(listCategoryFiltersController),
  );

export default router;
