import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { DatabaseClient } from '@/service/database/index.js';
import ServerError from '@/utils/serverError.js';
import env from '@/config/env.js';

export const ValidationSchemaConfig = {
  body: z.object({
    razorpay_order_id: z.string().trim().nonempty('Razorpay order id is required'),
    razorpay_payment_id: z.string().trim().nonempty('Razorpay payment id is required'),
    razorpay_signature: z.string().trim().nonempty('Razorpay signature is required'),
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

  if (!env.razorpay.keySecret) throw new ServerError('ERROR', 'Payment gateway not configured');

  const signData = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac('sha256', env.razorpay.keySecret)
    .update(signData)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    throw new ServerError('ERROR', 'Invalid payment signature');
  }

  const order = await db.queryOne(
    `SELECT id, customer_id, is_paid, total_amount_in_paisa, billing_details, razorpay_payment_id
    FROM orders
    WHERE razorpay_order_id = $1`,
    [razorpay_order_id]
  );
  if (!order || order.customer_id !== customer_id) {
    throw new ServerError('NOT_FOUND', 'Order not found');
  }

  try {
    await db.query('BEGIN');

    if (!order.razorpay_payment_id) {
      const billingDetails = order.billing_details || {};
      const requestedPaymentMode = billingDetails.payment_mode === 'token' ? 'token' : 'full';
      const payableAmountInPaisa = Math.min(order.total_amount_in_paisa, Number(
        billingDetails.payable_amount_in_paisa || order.total_amount_in_paisa
      ));
      const isFullyPaid = payableAmountInPaisa >= order.total_amount_in_paisa;
      const paymentStatus = isFullyPaid
        ? 'paid'
        : requestedPaymentMode === 'token'
          ? 'partially_paid'
          : 'pending';

      await db.query(
        `UPDATE orders
        SET
          is_paid = $1,
          payment_status = $2,
          paid_amount_in_paisa = $3,
          razorpay_payment_id = $4,
          razorpay_signature = $5
        WHERE id = $6`,
        [
          isFullyPaid,
          paymentStatus,
          payableAmountInPaisa,
          razorpay_payment_id,
          razorpay_signature,
          order.id,
        ]
      );
    }

    await db.query(
      `DELETE FROM cart_items
      WHERE cart_id IN (SELECT id FROM carts WHERE customer_id = $1)`,
      [customer_id]
    );

    await db.query('COMMIT');
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }

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
