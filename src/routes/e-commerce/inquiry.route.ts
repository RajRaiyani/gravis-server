import express from 'express';
import WithDatabase from '@/utils/withDatabase.js';
import { validate } from '@/utils/validationHelper.js';
import {
  ValidationSchema as createInquiryValidationSchema,
  Controller as createInquiryController,
} from '@/components/e-commerce/inquiry/createInquiry.js';

const router = express.Router();

router
  .route('/')
  .post(validate(createInquiryValidationSchema), WithDatabase(createInquiryController));

export default router;

