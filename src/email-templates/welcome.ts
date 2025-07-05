export const welcomeEmailTemplate = (name: string = 'there') => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Welcome to Borderly</title>
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
  <h2>Welcome to Borderly!</h2>
  <p>Hello ${name},</p>
  <p>Thanks for joining the Borderly community — where borders meet opportunity. We're thrilled to have you on board!</p>
  <p>Whether you're exploring visa requirements, checking your eligibility, or tracking applications, Borderly is here to simplify the process for you.</p>
  <p>If you have any questions, our team is just a click away. Let's get started!</p>
  <p><strong>— The Borderly Team</strong></p>
  
  <div class="footer">
    <p>© ${new Date().getFullYear()} Borderly. All rights reserved.</p>
    <p>If you did not sign up for Borderly, please disregard this email.</p>
  </div>
</body>
</html>
`; 