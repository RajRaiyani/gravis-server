import express from 'express';
import { validate } from '@/utils/validationHelper.js';
import WithDatabase from '@/utils/withDatabase.js';
import PrivateRoute from '@/middleware/admin/adminPrivateRoute.js';
import uploadImage from '@/middleware/multer/imageUpload.js';

import { Controller as listProductCategoriesController } from '@/components/admin/product-category/listProductCategories.js';
import { ValidationSchema as createProductCategoryValidationSchema, Controller as createProductCategoryController } from '@/components/admin/product-category/createProductCategory.js';
import { ValidationSchema as getProductCategoryValidationSchema, Controller as getProductCategoryController } from '@/components/admin/product-category/getProductCategory.js';
import { ValidationSchema as updateProductCategoryValidationSchema, Controller as updateProductCategoryController } from '@/components/admin/product-category/updateProductCategory.js';
import { ValidationSchema as deleteProductCategoryValidationSchema, Controller as deleteProductCategoryController } from '@/components/admin/product-category/deleteProductCategory.js';


const router = express.Router();

router.route('/')
  .get(PrivateRoute, WithDatabase(listProductCategoriesController))
  .post(PrivateRoute, uploadImage.single('image'), validate(createProductCategoryValidationSchema), WithDatabase(createProductCategoryController));


router.route('/:id')
  .get(PrivateRoute, validate(getProductCategoryValidationSchema), WithDatabase(getProductCategoryController))
  .put(PrivateRoute, validate(updateProductCategoryValidationSchema), WithDatabase(updateProductCategoryController))
  .delete(PrivateRoute, validate(deleteProductCategoryValidationSchema), WithDatabase(deleteProductCategoryController));

export default router;
