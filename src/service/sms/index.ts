import axios from 'axios';
import env from '@/config/env.js';

export async function sendOTP(phoneNumber: string, otp: string) {
  const message = `${otp} is your OTP for verification at Gravis India. Do not share this with anyone.`;

  const response = await axios({
    method: 'POST',
    url: env.sms.url,
    params: {
      User: env.sms.user,
      passwd: env.sms.password,
      mobilenumber: phoneNumber,
      message,
      sid: env.sms.senderId,
      mtype: 'N'
    }
  });

  return response;
}
