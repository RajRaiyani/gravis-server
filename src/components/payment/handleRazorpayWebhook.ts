import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import Logger from '@/service/logger/index.js';
import env from '@/config/env.js';
import { markPaymentFailed, markPaymentSuccess } from './paymentWebhook.service.js';

type RazorpayPaymentEntity = {
  id?: string;
  order_id?: string;
  amount?: number;
};

type RazorpayWebhookEvent = {
  event?: 'payment.captured' | 'payment.failed' | string;
  payload?: {
    payment?: {
      entity?: RazorpayPaymentEntity;
    };
  };
};

function verifySignature(body: Buffer, signature: string, secret: string) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  if (expectedSignature.length !== signature.length) return false;

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'utf8'),
    Buffer.from(signature, 'utf8')
  );
}

export async function Controller(
  req: Request,
  res: Response,
  _next: NextFunction,
  db: DatabaseClient
) {
  const signatureHeader = req.headers['x-razorpay-signature'];
  const signature = typeof signatureHeader === 'string' ? signatureHeader : '';

  if (!Buffer.isBuffer(req.body)) {
    Logger.error('Razorpay webhook body is not raw buffer');
    return res.status(400).send('Invalid webhook body');
  }

  if (!env.razorpay.webhookSecret) {
    Logger.error('RAZORPAY_WEBHOOK_SECRET is missing');
    return res.status(500).send('Webhook is not configured');
  }

  if (!signature || !verifySignature(req.body, signature, env.razorpay.webhookSecret)) {
    Logger.warn('Razorpay webhook signature verification failed');
    return res.status(400).send('Invalid signature');
  }

  let event: RazorpayWebhookEvent;
  try {
    event = JSON.parse(req.body.toString());
  } catch (error) {
    Logger.warn('Invalid Razorpay webhook payload', { error: (error as Error).message });
    return res.status(400).send('Invalid payload');
  }

  const payment = event.payload?.payment?.entity;
  try {
    if (event.event === 'payment.captured') {
      if (!payment?.id || !payment?.order_id || !Number.isFinite(payment?.amount)) {
        Logger.warn('Razorpay payment.captured payload missing required fields');
        return res.status(200).json({ status: 'ok' });
      }

      const result = await markPaymentSuccess(db, {
        orderId: payment.order_id,
        paymentId: payment.id,
        amount: payment.amount,
        signature,
      });

      Logger.info('Processed payment.captured webhook', {
        payment_id: payment.id,
        order_id: payment.order_id,
        duplicate: result.isDuplicate,
      });
      return res.status(200).json({ status: 'ok' });
    }

    if (event.event === 'payment.failed') {
      const result = await markPaymentFailed(db, {
        orderId: payment?.order_id,
        paymentId: payment?.id,
      });

      Logger.warn('Processed payment.failed webhook', {
        payment_id: payment?.id || null,
        order_id: payment?.order_id || null,
        order_updated: Boolean(result),
      });
      return res.status(200).json({ status: 'ok' });
    }

    Logger.info('Ignoring unsupported Razorpay webhook event', { event: event.event });
  } catch (error) {
    Logger.error('Razorpay webhook processing failed', {
      event: event.event,
      message: (error as Error).message,
      stack: (error as Error).stack,
    });
    return res.status(500).json({ message: 'Webhook processing failed' });
  }

  return res.status(200).json({ status: 'ok' });
}
