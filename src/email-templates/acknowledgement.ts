export const acknowledgementEmailTemplate = (name: string = 'there') => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Thanks for contacting Borderly</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    h2 {
      color: #1a73e8;
      margin-bottom: 20px;
    }
    p {
      margin-bottom: 16px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #eeeeee;
      color: #666666;
      font-size: 12px;
    }
    .logo {
      max-width: 150px;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <h2>Thanks for reaching out to Borderly!</h2>
  <p>Hello ${name},</p>
  <p>Your message has been received, and our team is already reviewing it.</p>
  <p>You can expect a response within <strong>24–48 hours</strong>. If your inquiry is urgent, feel free to mention that in a follow-up.</p>
  <p>In the meantime, explore our resources or track your visa status directly from your dashboard.</p>
  <p><strong>We're here to help,</strong><br>The Borderly Support Team</p>
  
  <div class="footer">
    <p>© ${new Date().getFullYear()} Borderly. All rights reserved.</p>
    <p>This is an automated response to your inquiry. Please do not reply to this email.</p>
  </div>
</body>
</html>
`; 