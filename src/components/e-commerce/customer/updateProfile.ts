import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import CustomerSchema from './customer.validation.js';

export const ValidationSchema = {
  body: z.object({
    first_name: CustomerSchema.firstName().optional(),
    last_name: CustomerSchema.lastName().optional(),
    phone_number: CustomerSchema.phoneNumber(),
    gst_number: CustomerSchema.gstNumber(),
    pan_number: CustomerSchema.panNumber(),
    organization_name: CustomerSchema.organizationName(),
  }),
};

export async function Controller(
  req: Request,
  res: Response,
  next: NextFunction,
  db: DatabaseClient
) {
  const { first_name, last_name, phone_number, gst_number, pan_number, organization_name } = req.body as z.infer<
    typeof ValidationSchema.body
  >;

  const customerId = req.customer.id;
  const normalizedGstNumber = gst_number?.trim().toUpperCase() || null;
  const normalizedPanNumber = pan_number?.trim().toUpperCase() || null;
  const normalizedOrganizationName = organization_name?.trim() || null;

  const updates: string[] = [];
  const params: Record<string, unknown> = {
    customer_id: customerId,
  };

  if (first_name !== undefined) {
    updates.push('first_name = $first_name');
    params.first_name = first_name;
  }

  if (last_name !== undefined) {
    updates.push('last_name = $last_name');
    params.last_name = last_name;
  }

  if (phone_number !== undefined) {
    updates.push('phone_number = $phone_number');
    params.phone_number = phone_number;
  }

  if (gst_number !== undefined) {
    updates.push('gst_number = $gst_number');
    params.gst_number = normalizedGstNumber;
  }

  if (pan_number !== undefined) {
    updates.push('pan_number = $pan_number');
    params.pan_number = normalizedPanNumber;
  }

  if (organization_name !== undefined) {
    updates.push('organization_name = $organization_name');
    params.organization_name = normalizedOrganizationName;
  }

  if (updates.length === 0) {
    return res.status(400).json({ message: 'No fields to update' });
  }

  updates.push('updated_at = NOW()');
  const customer = await db.namedQueryOne(
    `UPDATE customers
     SET ${updates.join(', ')}
     WHERE id = $customer_id
     RETURNING id, first_name, last_name, full_name, email, phone_number,
              gst_number, pan_number, organization_name,
              is_email_verified, is_phone_number_verified, created_at, updated_at`,
    params
  );

  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  return res.status(200).json({
    customer: {
      id: customer.id,
      first_name: customer.first_name,
      last_name: customer.last_name,
      full_name: customer.full_name,
      email: customer.email,
      phone_number: customer.phone_number,
      gst_number: customer.gst_number,
      pan_number: customer.pan_number,
      organization_name: customer.organization_name,
      is_email_verified: customer.is_email_verified,
      is_phone_number_verified: customer.is_phone_number_verified,
      created_at: customer.created_at,
      updated_at: customer.updated_at,
    },
  });
}
