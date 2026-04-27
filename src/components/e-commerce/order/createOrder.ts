import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { DatabaseClient } from '@/service/database/index.js';
import ValidationSchema from '@/config/validationSchema.js';
import ServerError from '@/utils/serverError.js';
import RazorpayInstance from '@/service/payment/razorpay/index.js';
import env from '@/config/env.js';

export const ValidationSchemaConfig = {
  body: z.object({
    payment_mode: z.enum(['full', 'token']).default('full'),
    promo_code: z.string().trim().optional(),
    full_name: z.string().trim().min(3).max(255),
    phone_number: ValidationSchema.phoneNumber(),
    organization_name: z.string().trim().max(255).optional().or(z.literal('')),
    gst_number: z.string().trim().toUpperCase().max(15).optional().or(z.literal('')),
    pan_number: z.string().trim().toUpperCase().max(10).optional().or(z.literal('')),

    shipping_address: ValidationSchema.address(),
    shipping_state_id: ValidationSchema.uuid(),
    shipping_city: z.string().trim().min(2).max(255),
    shipping_postal_code: z.string().trim().min(4).max(10),

    billing_address: ValidationSchema.address(),
    billing_state_id: ValidationSchema.uuid(),
    billing_city: z.string().trim().min(2).max(255),
    billing_postal_code: z.string().trim().min(4).max(10),
  }),
};

const TOKEN_PAYMENT_PERCENTAGE = 15;
const MIN_TOKEN_PAYMENT_IN_PAISA = 200000;

function splitName(fullName: string) {
  const trimmed = fullName.trim().replace(/\s+/g, ' ');
  const [firstName, ...rest] = trimmed.split(' ');

  return {
    first_name: firstName || '',
    last_name: rest.join(' ') || '-',
  };
}

function getPayableAmountInPaisa(totalAmountInPaisa: number, paymentMode: 'full' | 'token') {
  if (paymentMode === 'full') return totalAmountInPaisa;

  const tokenAmount = Math.round((totalAmountInPaisa * TOKEN_PAYMENT_PERCENTAGE) / 100);
  return Math.min(totalAmountInPaisa, Math.max(MIN_TOKEN_PAYMENT_IN_PAISA, tokenAmount));
}

export async function Controller(
  req: Request,
  res: Response,
  _next: NextFunction,
  db: DatabaseClient
) {
  const customer_id = req.customer.id;
  const {
    payment_mode,
    promo_code,
    full_name,
    phone_number,
    organization_name,
    gst_number,
    pan_number,
    shipping_address,
    shipping_state_id,
    shipping_city,
    shipping_postal_code,
    billing_address,
    billing_state_id,
    billing_city,
    billing_postal_code,
  } = req.body as z.infer<typeof ValidationSchemaConfig.body>;

  const { first_name, last_name } = splitName(full_name);

  const cartItems = await db.queryAll(
    `SELECT
      ci.product_id,
      ci.quantity,
      p.name as product_name,
      p.sale_price_in_paisa
    FROM carts c
    LEFT JOIN cart_items ci ON c.id = ci.cart_id
    LEFT JOIN products p ON p.id = ci.product_id
    WHERE c.customer_id = $1`,
    [customer_id]
  );

  const validItems = cartItems.filter((item) => item.product_id);
  if (!validItems.length) throw new ServerError('ERROR', 'Cart is empty');

  const total_amount_in_paisa = validItems.reduce(
    (sum, item) => sum + item.sale_price_in_paisa * item.quantity,
    0
  );
  const payable_amount_in_paisa = getPayableAmountInPaisa(total_amount_in_paisa, payment_mode);

  const [billingState, shippingState] = await Promise.all([
    db.queryOne('SELECT id, name, gst_code FROM states WHERE id = $1', [billing_state_id]),
    db.queryOne('SELECT id, name, gst_code FROM states WHERE id = $1', [shipping_state_id]),
  ]);

  if (!billingState || !shippingState) throw new ServerError('NOT_FOUND', 'State not found');

  try {
    await db.query('BEGIN');

    await db.namedQueryOne(
      `UPDATE customers SET
        first_name = $first_name,
        last_name = $last_name,
        phone_number = $phone_number,
        organization_name = $organization_name,
        gst_number = $gst_number,
        pan_number = $pan_number,
        updated_at = NOW()
      WHERE id = $customer_id`,
      {
        first_name,
        last_name,
        phone_number,
        organization_name: organization_name || null,
        gst_number: gst_number || null,
        pan_number: pan_number || null,
        customer_id,
      }
    );

    const order = await db.namedQueryOne(
      `INSERT INTO orders (
        customer_id,
        payment_status,
        status,
        total_amount_in_paisa,
        paid_amount_in_paisa,
        is_paid,
        serial_number,
        billing_details,
        billing_address,
        shipping_address
      ) VALUES (
        $customer_id,
        'pending',
        'pending',
        $total_amount_in_paisa,
        0,
        false,
        (SELECT COALESCE(MAX(serial_number), 0) + 1 FROM orders),
        $billing_details,
        $billing_address,
        $shipping_address
      )
      RETURNING id, serial, total_amount_in_paisa, payment_status, status`,
      {
        customer_id,
        total_amount_in_paisa,
        billing_details: JSON.stringify({
          payment_mode,
          token_payment_percentage: TOKEN_PAYMENT_PERCENTAGE,
          payable_amount_in_paisa,
          full_name,
          phone_number,
          organization_name: organization_name || null,
          gst_number: gst_number || null,
          pan_number: pan_number || null,
          promo_code: promo_code || null,
        }),
        billing_address: JSON.stringify({
          address: billing_address,
          state_id: billing_state_id,
          state_name: billingState.name,
          state_gst_code: billingState.gst_code,
          city: billing_city,
          postal_code: billing_postal_code,
        }),
        shipping_address: JSON.stringify({
          address: shipping_address,
          state_id: shipping_state_id,
          state_name: shippingState.name,
          state_gst_code: shippingState.gst_code,
          city: shipping_city,
          postal_code: shipping_postal_code,
        }),
      }
    );

    await db.query(
      `INSERT INTO order_items (order_id, product_id, product_name, quantity, price_in_paisa)
      SELECT
        $1,
        ci.product_id,
        p.name,
        ci.quantity,
        p.sale_price_in_paisa
      FROM carts c
      LEFT JOIN cart_items ci ON c.id = ci.cart_id
      LEFT JOIN products p ON p.id = ci.product_id
      WHERE c.customer_id = $2`,
      [order.id, customer_id]
    );

    const existingBillingAddress = await db.queryOne(
      'SELECT id FROM addresses WHERE customer_id = $1 AND type = $2',
      [customer_id, 'billing']
    );
    if (existingBillingAddress) {
      await db.query(
        `UPDATE addresses
        SET address = $1, state_id = $2, city = $3, postal_code = $4, updated_at = NOW()
        WHERE id = $5`,
        [
          billing_address,
          billing_state_id,
          billing_city,
          billing_postal_code,
          existingBillingAddress.id,
        ]
      );
    } else {
      await db.query(
        `INSERT INTO addresses (type, customer_id, address, state_id, city, postal_code)
        VALUES ('billing', $1, $2, $3, $4, $5)`,
        [customer_id, billing_address, billing_state_id, billing_city, billing_postal_code]
      );
    }

    const existingShippingAddress = await db.queryOne(
      'SELECT id FROM addresses WHERE customer_id = $1 AND type = $2',
      [customer_id, 'shipping']
    );
    if (existingShippingAddress) {
      await db.query(
        `UPDATE addresses
        SET address = $1, state_id = $2, city = $3, postal_code = $4, updated_at = NOW()
        WHERE id = $5`,
        [
          shipping_address,
          shipping_state_id,
          shipping_city,
          shipping_postal_code,
          existingShippingAddress.id,
        ]
      );
    } else {
      await db.query(
        `INSERT INTO addresses (type, customer_id, address, state_id, city, postal_code)
        VALUES ('shipping', $1, $2, $3, $4, $5)`,
        [customer_id, shipping_address, shipping_state_id, shipping_city, shipping_postal_code]
      );
    }

    let razorpayOrder = null;
    if (env.razorpay.keyId && env.razorpay.keySecret) {
      razorpayOrder = await RazorpayInstance.orders.create({
        amount: payable_amount_in_paisa,
        currency: 'INR',
        receipt: order.id,
        notes: {
          customer_id,
          order_id: order.id,
          serial: order.serial,
          payment_mode,
          payable_amount_in_paisa,
        },
      });

      await db.query('UPDATE orders SET razorpay_order_id = $1 WHERE id = $2', [
        razorpayOrder.id,
        order.id,
      ]);
    }

    await db.query('COMMIT');

    return res.status(200).json({
      order: {
        ...order,
        billing_details: {
          payment_mode,
          token_payment_percentage: TOKEN_PAYMENT_PERCENTAGE,
          payable_amount_in_paisa,
          full_name,
          phone_number,
          organization_name: organization_name || null,
          gst_number: gst_number || null,
          pan_number: pan_number || null,
          promo_code: promo_code || null,
        },
      },
      payment: razorpayOrder,
      payment_summary: {
        payment_mode,
        total_amount_in_paisa,
        payable_amount_in_paisa,
        remaining_amount_in_paisa: total_amount_in_paisa - payable_amount_in_paisa,
      },
      razorpay_key_id: env.razorpay.keyId || null,
    });
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
}
