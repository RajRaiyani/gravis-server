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

export default router;
