import express from 'express';
import { validate } from '@/utils/validationHelper.js';
import WithDatabase from '@/utils/withDatabase.js';
import ParseCustomer from '@/middleware/e-commerce/parseCustomer.js';

import {
  ValidationSchema as getCartValidationSchema,
  Controller as getCartController,
} from '@/components/e-commerce/cart/getCart.js';


import {
  ValidationSchema as updateCartItemValidationSchema,
  Controller as updateCartItemController,
} from '@/components/e-commerce/cart/updateCart.js';

const router = express.Router();

router.route('/')
  .get(ParseCustomer, validate(getCartValidationSchema), WithDatabase(getCartController));

router.route('/:product_id')
  .put(
    ParseCustomer,
    validate(updateCartItemValidationSchema),
    WithDatabase(updateCartItemController)
  );

export default router;
