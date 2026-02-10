import express from 'express';
import { validate } from '@/utils/validationHelper.js';
import WithDatabase from '@/utils/withDatabase.js';
import ParseToken from '@/middleware/e-commerce/parseToken.js';

import {
  Controller as getCartController,
} from '@/components/e-commerce/cart/getCart.js';


import {
  ValidationSchema as updateCartItemValidationSchema,
  Controller as updateCartItemController,
} from '@/components/e-commerce/cart/updateCart.js';

const router = express.Router();

router.route('/')
  .get(ParseToken, WithDatabase(getCartController));

router.route('/:product_id')
  .put(
    ParseToken,
    validate(updateCartItemValidationSchema),
    WithDatabase(updateCartItemController)
  );

export default router;
