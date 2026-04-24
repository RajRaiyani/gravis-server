import { DatabaseClient } from '@/service/database/index.js';
import ServerError from '@/utils/serverError.js';

type MarkPaymentSuccessInput = {
  orderId: string;
  paymentId: string;
  amount: number;
  signature?: string;
};

type MarkPaymentFailedInput = {
  orderId?: string | null;
  paymentId?: string | null;
};

function getPaymentStatus(totalAmountInPaisa: number, paidAmountInPaisa: number) {
  if (paidAmountInPaisa >= totalAmountInPaisa) {
    return {
      isPaid: true,
      paymentStatus: 'paid',
    };
  }

  if (paidAmountInPaisa > 0) {
    return {
      isPaid: false,
      paymentStatus: 'partially_paid',
    };
  }

  return {
    isPaid: false,
    paymentStatus: 'pending',
  };
}

export async function markPaymentSuccess(
  db: DatabaseClient,
  {
    orderId,
    paymentId,
    amount,
    signature,
  }: MarkPaymentSuccessInput
) {
  const existingByPaymentId = await db.queryOne(
    `SELECT id, serial, payment_status, is_paid
    FROM orders
    WHERE razorpay_payment_id = $1`,
    [paymentId]
  );

  if (existingByPaymentId) {
    return {
      isDuplicate: true,
      order: existingByPaymentId,
    };
  }

  const order = await db.queryOne(
    `SELECT id, serial, customer_id, total_amount_in_paisa, paid_amount_in_paisa
    FROM orders
    WHERE razorpay_order_id = $1`,
    [orderId]
  );

  if (!order) throw new ServerError('NOT_FOUND', 'Order not found for webhook payment');

  const normalizedPaidAmount = Math.min(
    order.total_amount_in_paisa,
    Math.max(order.paid_amount_in_paisa, amount)
  );
  const { isPaid, paymentStatus } = getPaymentStatus(order.total_amount_in_paisa, normalizedPaidAmount);

  await db.query('BEGIN');

  try {
    const updatedOrder = await db.queryOne(
      `UPDATE orders
      SET
        is_paid = $1,
        payment_status = $2,
        paid_amount_in_paisa = $3,
        razorpay_payment_id = $4,
        razorpay_signature = COALESCE($5, razorpay_signature)
      WHERE id = $6
      RETURNING id, serial, payment_status, is_paid, total_amount_in_paisa, paid_amount_in_paisa`,
      [isPaid, paymentStatus, normalizedPaidAmount, paymentId, signature ?? null, order.id]
    );

    await db.query(
      `DELETE FROM cart_items
      WHERE cart_id IN (SELECT id FROM carts WHERE customer_id = $1)`,
      [order.customer_id]
    );

    await db.query('COMMIT');

    return {
      isDuplicate: false,
      order: updatedOrder,
    };
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
}

export async function markPaymentFailed(
  db: DatabaseClient,
  { orderId, paymentId }: MarkPaymentFailedInput
) {
  if (!orderId && !paymentId) return null;

  const order = await db.queryOne(
    `SELECT id, serial, is_paid
    FROM orders
    WHERE ($1::text IS NOT NULL AND razorpay_order_id = $1)
      OR ($2::text IS NOT NULL AND razorpay_payment_id = $2)
    LIMIT 1`,
    [orderId || null, paymentId || null]
  );

  if (!order) return null;
  if (order.is_paid) return order;

  const updatedOrder = await db.queryOne(
    `UPDATE orders
    SET
      payment_status = 'failed',
      razorpay_payment_id = COALESCE($1, razorpay_payment_id)
    WHERE id = $2
    RETURNING id, serial, payment_status, is_paid, total_amount_in_paisa, paid_amount_in_paisa`,
    [paymentId || null, order.id]
  );

  return updatedOrder;
}
