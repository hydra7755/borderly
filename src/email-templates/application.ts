export const applicationEmailTemplate = (name: string = 'there', applicationType: string = 'visa') => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Application Received</title>
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
    .application-details {
      background-color: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <h2>Application Received 🎉</h2>
  <p>Hello ${name},</p>
  <p>Thanks for submitting your ${applicationType} application through Borderly.</p>
  <p>We've successfully received your details and our system is now processing your request. You'll receive an update shortly via email or in your account dashboard.</p>
  
  <div class="application-details">
    <p><strong>Application Type:</strong> ${applicationType}</p>
    <p><strong>Submission Date:</strong> ${new Date().toLocaleDateString()}</p>
    <p><strong>Status:</strong> Processing</p>
  </div>
  
  <p>Need help or want to check your application status? Just log in or contact our support team.</p>
  <p><strong>Best regards,</strong><br>Borderly Application Team</p>
  
  <div class="footer">
    <p>© ${new Date().getFullYear()} Borderly. All rights reserved.</p>
    <p>This is an automated confirmation of your application submission.</p>
  </div>
</body>
</html>
`; 