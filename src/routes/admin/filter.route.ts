import express from 'express';
import { validate } from '@/utils/validationHelper.js';
import WithDatabase from '@/utils/withDatabase.js';
import PrivateRoute from '@/middleware/admin/adminPrivateRoute.js';

import { ValidationSchema as listCategoryFiltersValidationSchema, Controller as listCategoryFiltersController } from '@/components/admin/filter/listCategoryFilters.js';
import { ValidationSchema as createFilterValidationSchema, Controller as createFilterController } from '@/components/admin/filter/createFilter.js';
import { ValidationSchema as createFilterOptionValidationSchema, Controller as createFilterOptionController } from '@/components/admin/filter/createFilterOption.js';
import { ValidationSchema as updateFilterValidationSchema, Controller as updateFilterController } from '@/components/admin/filter/updateFilter.js';
import { ValidationSchema as updateFilterOptionValidationSchema, Controller as updateFilterOptionController } from '@/components/admin/filter/updateFilterOption.js';
import { ValidationSchema as deleteFilterValidationSchema, Controller as deleteFilterController } from '@/components/admin/filter/deleteFilter.js';
import { ValidationSchema as deleteFilterOptionValidationSchema, Controller as deleteFilterOptionController } from '@/components/admin/filter/deleteFilterOption.js';

const router = express.Router();

router
  .route('/')
  .get(
    PrivateRoute,
    validate(listCategoryFiltersValidationSchema),
    WithDatabase(listCategoryFiltersController),
  )
  .post(
    PrivateRoute,
    validate(createFilterValidationSchema),
    WithDatabase(createFilterController),
  );

router
  .route('/options')
  .post(
    PrivateRoute,
    validate(createFilterOptionValidationSchema),
    WithDatabase(createFilterOptionController),
  );

router
  .route('/options/:id')
  .put(
    PrivateRoute,
    validate(updateFilterOptionValidationSchema),
    WithDatabase(updateFilterOptionController),
  )
  .delete(
    PrivateRoute,
    validate(deleteFilterOptionValidationSchema),
    WithDatabase(deleteFilterOptionController),
  );

router
  .route('/:id')
  .put(
    PrivateRoute,
    validate(updateFilterValidationSchema),
    WithDatabase(updateFilterController),
  )
  .delete(
    PrivateRoute,
    validate(deleteFilterValidationSchema),
    WithDatabase(deleteFilterController),
  );

export default router;
