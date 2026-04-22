import { z } from 'zod';

const CustomerSchema = {
  firstName: () =>
    z
      .string()
      .trim()
      .nonempty('First name is required')
      .min(2, 'First name must be at least 2 characters')
      .max(255, 'First name must be less than 255 characters'),

  lastName: () =>
    z
      .string()
      .trim()
      .nonempty('Last name is required')
      .min(2, 'Last name must be at least 2 characters')
      .max(255, 'Last name must be less than 255 characters'),

  email: () => z.email('Invalid email address').toLowerCase(),

  password: () =>
    z
      .string()
      .trim()
      .min(6, 'Password must be at least 6 characters')
      .max(100, 'Password must be less than 100 characters'),

  phoneNumber: () =>
    z
      .string()
      .trim()
      .min(10, 'Phone number must be at least 10 digits')
      .max(15, 'Phone number must be less than 15 digits')
      .optional(),

  gstNumber: () =>
    z
      .string()
      .trim()
      .min(15, 'GST number must be 15 characters')
      .max(15, 'GST number must be 15 characters')
      .optional(),

  panNumber: () =>
    z
      .string()
      .trim()
      .min(10, 'PAN number must be 10 characters')
      .max(10, 'PAN number must be 10 characters')
      .optional(),

  organizationName: () =>
    z
      .string()
      .trim()
      .max(255, 'Organization name must be less than 255 characters')
      .optional(),
};

export default CustomerSchema;
