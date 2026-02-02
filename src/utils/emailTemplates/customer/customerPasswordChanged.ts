export default function customerPasswordChanged(firstName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Changed Successfully</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f4f8;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);">
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 40px 40px 30px 40px; text-align: center;">
              <h1 style="color: #38bdf8; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 1px;">Gravish</h1>
            </td>
          </tr>

          <!-- Success Icon -->
          <tr>
            <td style="padding: 0 40px 20px 40px; text-align: center;">
              <div style="width: 70px; height: 70px; background: linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%); border-radius: 50%; margin: 0 auto; line-height: 70px;">
                <span style="color: #ffffff; font-size: 36px;">✓</span>
              </div>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding: 0 40px 15px 40px; text-align: center;">
              <h2 style="color: #1e293b; margin: 0; font-size: 22px; font-weight: 600;">Password Changed Successfully</h2>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 0 40px 10px 40px; text-align: center;">
              <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0;">
                Hi ${firstName},
              </p>
            </td>
          </tr>

          <!-- Description -->
          <tr>
            <td style="padding: 0 40px 30px 40px; text-align: center;">
              <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0;">
                Your password has been changed successfully. You can now use your new password to log in to your account.
              </p>
            </td>
          </tr>

          <!-- Warning Box -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 12px; padding: 20px; text-align: center;">
                    <p style="color: #92400e; font-size: 14px; line-height: 1.6; margin: 0;">
                      <strong>Security Notice:</strong> If you did not make this change, please contact our support team immediately and secure your account.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px 20px 40px;">
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 0;" />
            </td>
          </tr>

          <!-- Footer Note -->
          <tr>
            <td style="padding: 0 40px 30px 40px; text-align: center;">
              <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 0;">
                Thank you for keeping your account secure.
              </p>
            </td>
          </tr>

          <!-- Bottom Banner -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background: linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%); border-radius: 0 0 16px 16px; padding: 20px; text-align: center;">
                    <p style="color: #ffffff; font-size: 13px; margin: 0;">
                      This is an automated message from Gravish. Please do not reply.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
