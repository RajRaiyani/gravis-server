import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { DatabaseClient } from '@/service/database/index.js';
import ServerError from '@/utils/serverError.js';
import env from '@/config/env.js';
import RazorpayInstance from '@/service/payment/razorpay/index.js';
import { markPaymentSuccess } from '@/components/payment/paymentWebhook.service.js';

export const ValidationSchemaConfig = {
  body: z.object({
    razorpay_order_id: z.string().trim().nonempty('Razorpay order id is required'),
    razorpay_payment_id: z.string().trim().nonempty('Razorpay payment id is required'),
    razorpay_signature: z.string().trim().optional(),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  _next: NextFunction,
  db: DatabaseClient
) {
  const customer_id = req.customer.id;
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body as z.infer<
    typeof ValidationSchemaConfig.body
  >;

  if (razorpay_signature) {
    if (!env.razorpay.keySecret) throw new ServerError('ERROR', 'Payment gateway not configured');

    const signData = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', env.razorpay.keySecret)
      .update(signData)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      throw new ServerError('ERROR', 'Invalid payment signature');
    }
  }

  const payment = await RazorpayInstance.payments.fetch(razorpay_payment_id);

  if (!payment?.order_id || payment.order_id !== razorpay_order_id) {
    throw new ServerError('ERROR', 'Payment does not belong to order');
  }

  if (payment.status !== 'captured') {
    throw new ServerError('ERROR', 'Payment is not captured yet');
  }

  const capturedAmountInPaisa = Number(payment.amount);
  if (!Number.isFinite(capturedAmountInPaisa)) {
    throw new ServerError('ERROR', 'Invalid captured payment amount');
  }

  const order = await db.queryOne(
    `SELECT id, customer_id
    FROM orders
    WHERE razorpay_order_id = $1`,
    [razorpay_order_id]
  );
  if (!order || order.customer_id !== customer_id) {
    throw new ServerError('NOT_FOUND', 'Order not found');
  }

  await markPaymentSuccess(db, {
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    amount: capturedAmountInPaisa,
    signature: razorpay_signature,
  });

  const updatedOrder = await db.queryOne(
    `SELECT
      id,
      serial,
      payment_status,
      status,
      total_amount_in_paisa,
      paid_amount_in_paisa,
      is_paid,
      razorpay_order_id,
      razorpay_payment_id
    FROM orders
    WHERE id = $1`,
    [order.id]
  );

  return res.status(200).json({
    order: updatedOrder,
  });
}
