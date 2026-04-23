import express from 'express';
import { validate } from '@/utils/validationHelper.js';
import WithDatabase from '@/utils/withDatabase.js';
import CustomerPrivateRoute from '@/middleware/e-commerce/customerPrivateRoute.js';

import {
  ValidationSchemaConfig as createOrderValidationSchema,
  Controller as createOrderController,
} from '@/components/e-commerce/order/createOrder.js';
import {
  ValidationSchemaConfig as listOrdersValidationSchema,
  Controller as listOrdersController,
} from '@/components/e-commerce/order/listOrders.js';
import {
  ValidationSchemaConfig as verifyOrderValidationSchema,
  Controller as verifyOrderController,
} from '@/components/e-commerce/order/verifyOrder.js';
import {
  ValidationSchemaConfig as getOrderValidationSchema,
  Controller as getOrderController,
} from '@/components/e-commerce/order/getOrder.js';

const router = express.Router();

router
  .route('/')
  .post(
    CustomerPrivateRoute,
    validate(createOrderValidationSchema),
    WithDatabase(createOrderController)
  )
  .get(
    CustomerPrivateRoute,
    validate(listOrdersValidationSchema),
    WithDatabase(listOrdersController)
  );

router.route('/verify').post(
  CustomerPrivateRoute,
  validate(verifyOrderValidationSchema),
  WithDatabase(verifyOrderController)
);

router.route('/:order_id').get(
  CustomerPrivateRoute,
  validate(getOrderValidationSchema),
  WithDatabase(getOrderController)
);

export default router;
