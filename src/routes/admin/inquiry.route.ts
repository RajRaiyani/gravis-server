import express from 'express';
import { validate } from '@/utils/validationHelper.js';
import WithDatabase from '@/utils/withDatabase.js';
import PrivateRoute from '@/middleware/admin/adminPrivateRoute.js';

import {
  ValidationSchema as listInquiriesValidationSchema,
  Controller as listInquiriesController,
} from '@/components/admin/inquiry/listInquiries.js';
import {
  ValidationSchema as getInquiryValidationSchema,
  Controller as getInquiryController,
} from '@/components/admin/inquiry/getInquiry.js';
import {
  ValidationSchema as updateInquiryStatusValidationSchema,
  Controller as updateInquiryStatusController,
} from '@/components/admin/inquiry/updateInquiryStatus.js';
import {
  ValidationSchema as deleteInquiryValidationSchema,
  Controller as deleteInquiryController,
} from '@/components/admin/inquiry/deleteInquiry.js';

const router = express.Router();

router
  .route('/')
  .get(PrivateRoute, validate(listInquiriesValidationSchema), WithDatabase(listInquiriesController));

router
  .route('/:id')
  .get(
    PrivateRoute,
    validate(getInquiryValidationSchema),
    WithDatabase(getInquiryController),
  )
  .put(
    PrivateRoute,
    validate(updateInquiryStatusValidationSchema),
    WithDatabase(updateInquiryStatusController),
  )
  .delete(
    PrivateRoute,
    validate(deleteInquiryValidationSchema),
    WithDatabase(deleteInquiryController),
  );

export default router;

