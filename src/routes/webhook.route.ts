import express from 'express';
import WithDatabase from '@/utils/withDatabase.js';
import { Controller as RazorpayWebhookController } from '@/components/payment/handleRazorpayWebhook.js';

const router = express.Router();

router.post(
  '/razorpay',
  express.raw({ type: '*/*' }),
  WithDatabase(RazorpayWebhookController)
);

export default router;
