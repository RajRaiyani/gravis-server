import express from 'express';
import { validate } from '@/utils/validationHelper.js';
import WithDatabase from '@/utils/withDatabase.js';
import PrivateRoute from '@/middleware/admin/adminPrivateRoute.js';

import {
  ValidationSchema as listCustomersValidationSchema,
  Controller as listCustomersController,
} from '@/components/admin/customer/listCustomers.js';

import {
  ValidationSchema as getCustomerValidationSchema,
  Controller as getCustomerController,
} from '@/components/admin/customer/getCustomer.js';

import {
  ValidationSchema as updateCustomerStatusValidationSchema,
  Controller as updateCustomerStatusController,
} from '@/components/admin/customer/updateCustomerStatus.js';

import {
  ValidationSchema as deleteCustomerValidationSchema,
  Controller as deleteCustomerController,
} from '@/components/admin/customer/deleteCustomer.js';

const router = express.Router();

router
  .route('/')
  .get(
    PrivateRoute,
    validate(listCustomersValidationSchema),
    WithDatabase(listCustomersController)
  );

router
  .route('/:id')
  .get(
    PrivateRoute,
    validate(getCustomerValidationSchema),
    WithDatabase(getCustomerController)
  )
  .put(
    PrivateRoute,
    validate(updateCustomerStatusValidationSchema),
    WithDatabase(updateCustomerStatusController)
  )
  .delete(
    PrivateRoute,
    validate(deleteCustomerValidationSchema),
    WithDatabase(deleteCustomerController)
  );

export default router;
