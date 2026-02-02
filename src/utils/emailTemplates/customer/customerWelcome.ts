export default function customerWelcome(firstName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Gravish!</title>
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

          <!-- Welcome Icon -->
          <tr>
            <td style="padding: 0 40px 20px 40px; text-align: center;">
              <span style="font-size: 50px;">🎉</span>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding: 0 40px 15px 40px; text-align: center;">
              <h2 style="color: #1e293b; margin: 0; font-size: 22px; font-weight: 600;">Welcome, ${firstName}!</h2>
            </td>
          </tr>

          <!-- Description -->
          <tr>
            <td style="padding: 0 40px 30px 40px; text-align: center;">
              <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0;">
                Thank you for joining us! Your account has been created successfully and you're all set to start shopping.
              </p>
            </td>
          </tr>

          <!-- Features Box -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background-color: #f0f9ff; border-radius: 12px; padding: 25px;">
                    <p style="color: #0369a1; font-size: 15px; font-weight: 600; margin: 0 0 15px 0;">What you can do now:</p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">
                          ✓ &nbsp; Browse our latest products
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">
                          ✓ &nbsp; Add items to your cart
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">
                          ✓ &nbsp; Save your favorite items
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">
                          ✓ &nbsp; Track your orders
                        </td>
                      </tr>
                    </table>
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
                If you have any questions, feel free to reach out to our support team.
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
