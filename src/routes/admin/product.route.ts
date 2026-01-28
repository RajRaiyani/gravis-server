import express from 'express';
import { validate } from '@/utils/validationHelper.js';
import WithDatabase from '@/utils/withDatabase.js';
import PrivateRoute from '@/middleware/admin/adminPrivateRoute.js';
import uploadImage from '@/middleware/multer/imageUpload.js';

import { Controller as listProductsController } from '@/components/admin/product/listProducts.js';
import {
  ValidationSchema as createProductValidationSchema,
  Controller as createProductController,
} from '@/components/admin/product/createProduct.js';
import {
  ValidationSchema as getProductValidationSchema,
  Controller as getProductController,
} from '@/components/admin/product/getProduct.js';
import {
  ValidationSchema as updateProductValidationSchema,
  Controller as updateProductController,
} from '@/components/admin/product/updateProduct.js';
import {
  ValidationSchema as deleteProductValidationSchema,
  Controller as deleteProductController,
} from '@/components/admin/product/deleteProduct.js';
import {
  ValidationSchema as addProductImageValidationSchema,
  Controller as addProductImageController,
} from '@/components/admin/product/addProductImage.js';
import {
  ValidationSchema as deleteProductImageValidationSchema,
  Controller as deleteProductImageController,
} from '@/components/admin/product/deleteProductImage.js';

const router = express.Router();

router
  .route('/')
  .get(PrivateRoute, WithDatabase(listProductsController))
  .post(
    PrivateRoute,
    uploadImage.single('image'),
    validate(createProductValidationSchema),
    WithDatabase(createProductController),
  );

router
  .route('/images/:image_id')
  .delete(
    PrivateRoute,
    validate(deleteProductImageValidationSchema),
    WithDatabase(deleteProductImageController),
  );

router
  .route('/:id/images')
  .post(
    PrivateRoute,
    validate(addProductImageValidationSchema),
    WithDatabase(addProductImageController),
  );

router
  .route('/:id')
  .get(
    PrivateRoute,
    validate(getProductValidationSchema),
    WithDatabase(getProductController),
  )
  .put(
    PrivateRoute,
    validate(updateProductValidationSchema),
    WithDatabase(updateProductController),
  )
  .delete(
    PrivateRoute,
    validate(deleteProductValidationSchema),
    WithDatabase(deleteProductController),
  );

export default router;

