export default function customerPasswordChanged(firstName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Changed Successfully</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="padding: 40px 30px; text-align: center;">
        <div style="width: 60px; height: 60px; background-color: #28a745; border-radius: 50%; margin: 0 auto 20px auto; display: flex; align-items: center; justify-content: center;">
          <span style="color: #ffffff; font-size: 30px;">✓</span>
        </div>
        <h1 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Password Changed Successfully</h1>
        <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0 0 10px 0;">
          Hi ${firstName},
        </p>
        <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0 0 30px 0;">
          Your password has been changed successfully. You can now use your new password to log in to your account.
        </p>
        <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 15px; text-align: left;">
          <p style="color: #856404; font-size: 14px; margin: 0;">
            <strong>Security Notice:</strong> If you did not make this change, please contact our support team immediately and secure your account.
          </p>
        </div>
        <p style="color: #999999; font-size: 14px; margin: 30px 0 0 0;">
          Thank you for keeping your account secure.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
