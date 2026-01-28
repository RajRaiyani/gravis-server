import Razorpay from 'razorpay';
import z from 'zod';
import env from '@/config/env.js';

const razorpaySchema = z.object({
  keyId: z.string().min(3).max(255),
  keySecret: z.string().min(3).max(255),
});

const {data: razorpayOptions, error, success} = razorpaySchema.safeParse({
  keyId: env.razorpay.keyId,
  keySecret: env.razorpay.keySecret,
});

if (!success) throw new Error(`Invalid ENV options: ${error.message}`);


const razorpay = new Razorpay({
  key_id: razorpayOptions.keyId,
  key_secret: razorpayOptions.keySecret,
});

export default razorpay;
