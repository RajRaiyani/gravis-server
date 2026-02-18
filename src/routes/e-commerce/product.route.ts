import express from 'express';
import { validate } from '@/utils/validationHelper.js';
import WithDatabase from '@/utils/withDatabase.js';
import ParseToken from '@/middleware/e-commerce/parseToken.js';

import {
  ValidationSchema as listProductsValidationSchema,
  Controller as listProductsController,
} from '@/components/e-commerce/product/listProducts.js';

import {
  ValidationSchema as listFeaturedProductsValidationSchema,
  Controller as listFeaturedProductsController,
} from '@/components/e-commerce/product/listFeaturedProducts.js';

import {
  ValidationSchema as getProductValidationSchema,
  Controller as getProductController,
} from '@/components/e-commerce/product/getProduct.js';

const router = express.Router();

router
  .route('/')
  .get(
    ParseToken,
    validate(listProductsValidationSchema),
    WithDatabase(listProductsController)
  );

router
  .route('/featured')
  .get(
    ParseToken,
    validate(listFeaturedProductsValidationSchema),
    WithDatabase(listFeaturedProductsController),
  );

router
  .route('/:id')
  .get(
    ParseToken,
    validate(getProductValidationSchema),
    WithDatabase(getProductController)
  );

export default router;
