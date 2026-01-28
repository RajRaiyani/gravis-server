import express from 'express';

import WithDatabase from '@/utils/withDatabase.js';

import {validate} from '@/utils/validationHelper.js';
import { ValidationSchema as listProductsValidationSchema, Controller as listProductsController } from '@/components/e-commerce/product/listProducts.js';
import { ValidationSchema as getProductValidationSchema, Controller as getProductController } from '@/components/e-commerce/product/getProduct.js';



const router = express.Router();

router.route('/')
  .get( validate(listProductsValidationSchema), WithDatabase(listProductsController));

router.route('/:id')
  .get( validate(getProductValidationSchema), WithDatabase(getProductController));

export default router;
