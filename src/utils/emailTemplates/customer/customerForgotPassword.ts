export default function customerForgotPassword(
  resetLink: string,
  firstName: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="padding: 40px 30px; text-align: center;">
        <h1 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Reset Your Password</h1>
        <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0 0 10px 0;">
          Hi ${firstName},
        </p>
        <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0 0 30px 0;">
          We received a request to reset your password. Click the button below to create a new password.
        </p>
        <a href="${resetLink}" style="display: inline-block; background-color: #007bff; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-size: 16px; font-weight: bold;">
          Reset Password
        </a>
        <p style="color: #999999; font-size: 14px; margin: 30px 0 0 0;">
          This link will expire in 15 minutes.
        </p>
        <p style="color: #999999; font-size: 14px; margin: 20px 0 0 0;">
          If you didn't request a password reset, please ignore this email or contact support if you have concerns.
        </p>
        <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;" />
        <p style="color: #999999; font-size: 12px; margin: 0;">
          If the button doesn't work, copy and paste this link into your browser:<br />
          <a href="${resetLink}" style="color: #007bff; word-break: break-all;">${resetLink}</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
