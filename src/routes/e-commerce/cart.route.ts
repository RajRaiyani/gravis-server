import express from 'express';
import { validate } from '@/utils/validationHelper.js';
import WithDatabase from '@/utils/withDatabase.js';
import CustomerPrivateRoute from '@/middleware/e-commerce/customerPrivateRoute.js';

import { Controller as createGuestCartController } from '@/components/e-commerce/cart/createguestcart.js';

import {
  ValidationSchema as getCartValidationSchema,
  Controller as getCartController,
} from '@/components/e-commerce/cart/getCart.js';

import {
  ValidationSchema as addToCartValidationSchema,
  Controller as addToCartController,
} from '@/components/e-commerce/cart/addToCart.js';

import {
  ValidationSchema as updateCartItemValidationSchema,
  Controller as updateCartItemController,
} from '@/components/e-commerce/cart/updateCartItem.js';

import {
  ValidationSchema as removeCartItemValidationSchema,
  Controller as removeCartItemController,
} from '@/components/e-commerce/cart/removeCartItem.js';

import {
  ValidationSchema as clearCartValidationSchema,
  Controller as clearCartController,
} from '@/components/e-commerce/cart/clearCart.js';

const router = express.Router();

// ============================================
// GUEST CART ROUTES (No Auth / Optional Auth)
// ============================================

// Create a new guest cart
router.post('/guest', WithDatabase(createGuestCartController));

// Get guest cart by cart_id
router.get(
  '/guest/:cart_id',
  validate(getCartValidationSchema),
  WithDatabase(getCartController)
);

// Add item to guest cart
router.post(
  '/guest/:cart_id/items',
  validate(addToCartValidationSchema),
  WithDatabase(addToCartController)
);

// Update guest cart item
router.put(
  '/guest/:cart_id/items/:item_id',
  validate(updateCartItemValidationSchema),
  WithDatabase(updateCartItemController)
);

// Remove item from guest cart
router.delete(
  '/guest/:cart_id/items/:item_id',
  validate(removeCartItemValidationSchema),
  WithDatabase(removeCartItemController)
);

// Clear guest cart
router.delete(
  '/guest/:cart_id',
  validate(clearCartValidationSchema),
  WithDatabase(clearCartController)
);

// ============================================
// CUSTOMER CART ROUTES (Auth Required)
// ============================================

// Get customer's cart
router.get('/', CustomerPrivateRoute, WithDatabase(getCartController));

// Add item to customer's cart (auto-creates cart if needed)
router.post(
  '/items',
  CustomerPrivateRoute,
  validate(addToCartValidationSchema),
  WithDatabase(addToCartController)
);

// Update customer cart item
router.put(
  '/items/:item_id',
  CustomerPrivateRoute,
  validate(updateCartItemValidationSchema),
  WithDatabase(updateCartItemController)
);

// Remove item from customer cart
router.delete(
  '/items/:item_id',
  CustomerPrivateRoute,
  validate(removeCartItemValidationSchema),
  WithDatabase(removeCartItemController)
);

// Clear customer cart
router.delete('/', CustomerPrivateRoute, WithDatabase(clearCartController));

export default router;
