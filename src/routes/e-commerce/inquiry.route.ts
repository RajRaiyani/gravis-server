import express from 'express';
import WithDatabase from '@/utils/withDatabase.js';
import { validate } from '@/utils/validationHelper.js';
import ParseToken from '@/middleware/e-commerce/parseToken.js';

import {
  ValidationSchema as createContactInquiryValidationSchema,
  Controller as createContactInquiryController,
} from '@/components/e-commerce/inquiry/createContactInquiry.js';

import {
  ValidationSchema as createProductInquiryValidationSchema,
  Controller as createProductInquiryController,
} from '@/components/e-commerce/inquiry/createProductInquiry.js';

import {
  ValidationSchema as createGuestProductInquiryValidationSchema,
  Controller as createGuestProductInquiryController,
} from '@/components/e-commerce/inquiry/createGuestProductInquiry.js';

const router = express.Router();

router
  .route('/contact')
  .post(
    validate(createContactInquiryValidationSchema),
    WithDatabase(createContactInquiryController)
  );

router
  .route('/product')
  .post(
    ParseToken,
    validate(createProductInquiryValidationSchema),
    WithDatabase(createProductInquiryController)
  );

/** Guest product inquiry – no auth required */
router
  .route('/guest-product')
  .post(
    validate(createGuestProductInquiryValidationSchema),
    WithDatabase(createGuestProductInquiryController)
  );

export default router;
