export default function customerVerifyEmail(otp: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="padding: 40px 30px; text-align: center;">
        <h1 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Verify Your Email</h1>
        <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0 0 30px 0;">
          Thank you for registering! Please use the verification code below to complete your registration.
        </p>
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 0 0 30px 0;">
          <p style="color: #333333; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 0;">
            ${otp}
          </p>
        </div>
        <p style="color: #999999; font-size: 14px; margin: 0;">
          This code will expire in 10 minutes.
        </p>
        <p style="color: #999999; font-size: 14px; margin: 20px 0 0 0;">
          If you didn't request this, please ignore this email.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
