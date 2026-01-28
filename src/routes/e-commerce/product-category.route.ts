import express from 'express';

import WithDatabase from '@/utils/withDatabase.js';

import { Controller as listProductCategoriesController } from '@/components/e-commerce/product-category/listProductCategories.js';



const router = express.Router();

router.route('/')
  .get( WithDatabase(listProductCategoriesController));

export default router;
