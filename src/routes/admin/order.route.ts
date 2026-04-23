import express from 'express';
import { validate } from '@/utils/validationHelper.js';
import WithDatabase from '@/utils/withDatabase.js';
import PrivateRoute from '@/middleware/admin/adminPrivateRoute.js';

import {
  ValidationSchema as listOrdersValidationSchema,
  Controller as listOrdersController,
} from '@/components/admin/order/listOrders.js';

import {
  ValidationSchemaConfig as getOrderValidationSchema,
  Controller as getOrderController,
} from '@/components/admin/order/getOrder.js';

import {
  ValidationSchemaConfig as updateOrderStatusValidationSchema,
  Controller as updateOrderStatusController,
} from '@/components/admin/order/updateOrderStatus.js';
import {
  ValidationSchemaConfig as markOrderAsPaidValidationSchema,
  Controller as markOrderAsPaidController,
} from '@/components/admin/order/markOrderAsPaid.js';

const router = express.Router();

router.route('/').get(
  PrivateRoute,
  validate(listOrdersValidationSchema),
  WithDatabase(listOrdersController)
);

router
  .route('/:id')
  .get(PrivateRoute, validate(getOrderValidationSchema), WithDatabase(getOrderController));

router.route('/:id/status').put(
  PrivateRoute,
  validate(updateOrderStatusValidationSchema),
  WithDatabase(updateOrderStatusController)
);

router.route('/:id/mark-paid').put(
  PrivateRoute,
  validate(markOrderAsPaidValidationSchema),
  WithDatabase(markOrderAsPaidController)
);

export default router;
