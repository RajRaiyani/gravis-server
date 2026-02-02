export default function customerWelcome(firstName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome!</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="padding: 40px 30px; text-align: center;">
        <h1 style="color: #333333; margin: 0 0 20px 0; font-size: 28px;">Welcome, ${firstName}! 🎉</h1>
        <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0 0 30px 0;">
          Thank you for joining us! Your account has been created successfully and you're all set to start shopping.
        </p>
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 0 0 30px 0; text-align: left;">
          <h3 style="color: #333333; margin: 0 0 15px 0; font-size: 16px;">What you can do now:</h3>
          <ul style="color: #666666; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li>Browse our latest products</li>
            <li>Add items to your cart</li>
            <li>Save your favorite items</li>
            <li>Track your orders</li>
          </ul>
        </div>
        <p style="color: #999999; font-size: 14px; margin: 0;">
          If you have any questions, feel free to reach out to our support team.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
