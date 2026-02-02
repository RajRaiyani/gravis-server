import express from 'express';
import { validate } from '@/utils/validationHelper.js';
import WithDatabase from '@/utils/withDatabase.js';
import CustomerPrivateRoute from '@/middleware/e-commerce/customerPrivateRoute.js';

import {
  ValidationSchema as registerCustomerValidationSchema,
  Controller as registerCustomerController,
} from '@/components/e-commerce/customer/registerCustomer.js';

import {
  ValidationSchema as verifyEmailValidationSchema,
  Controller as verifyEmailController,
} from '@/components/e-commerce/customer/verifyEmail.js';

import {
  ValidationSchema as resendVerificationEmailValidationSchema,
  Controller as resendVerificationEmailController,
} from '@/components/e-commerce/customer/resendVerificationEmail.js';

import {
  ValidationSchema as loginCustomerValidationSchema,
  Controller as loginCustomerController,
} from '@/components/e-commerce/customer/loginCustomer.js';

import { Controller as logoutCustomerController } from '@/components/e-commerce/customer/logoutCustomer.js';

import {
  ValidationSchema as forgotPasswordValidationSchema,
  Controller as forgotPasswordController,
} from '@/components/e-commerce/customer/forgotPassword.js';

import {
  ValidationSchema as resetPasswordValidationSchema,
  Controller as resetPasswordController,
} from '@/components/e-commerce/customer/resetPassword.js';

import {
  ValidationSchema as changePasswordValidationSchema,
  Controller as changePasswordController,
} from '@/components/e-commerce/customer/changePassword.js';

import { Controller as getProfileController } from '@/components/e-commerce/customer/getProfile.js';

import {
  ValidationSchema as updateProfileValidationSchema,
  Controller as updateProfileController,
} from '@/components/e-commerce/customer/updateProfile.js';

const router = express.Router();

// Public routes (no auth required)
router.post(
  '/register',
  validate(registerCustomerValidationSchema),
  WithDatabase(registerCustomerController)
);

router.post(
  '/verify-email',
  validate(verifyEmailValidationSchema),
  WithDatabase(verifyEmailController)
);

router.post(
  '/resend-verification',
  validate(resendVerificationEmailValidationSchema),
  WithDatabase(resendVerificationEmailController)
);

router.post(
  '/login',
  validate(loginCustomerValidationSchema),
  WithDatabase(loginCustomerController)
);

router.post(
  '/forgot-password',
  validate(forgotPasswordValidationSchema),
  WithDatabase(forgotPasswordController)
);

router.post(
  '/reset-password',
  validate(resetPasswordValidationSchema),
  WithDatabase(resetPasswordController)
);

// Protected routes (auth required)
router.post('/logout', CustomerPrivateRoute, WithDatabase(logoutCustomerController));

router.put(
  '/change-password',
  CustomerPrivateRoute,
  validate(changePasswordValidationSchema),
  WithDatabase(changePasswordController)
);

router
  .route('/profile')
  .get(CustomerPrivateRoute, WithDatabase(getProfileController))
  .put(
    CustomerPrivateRoute,
    validate(updateProfileValidationSchema),
    WithDatabase(updateProfileController)
  );

export default router;
