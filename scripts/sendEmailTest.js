// Import Resend
import { Resend } from 'resend';

// Create Resend instance
const resend = new Resend('re_KGPqeL2n_FCuMudHh4A4bZtEmHXiQb8h1');

// Configuration
const targetEmail = 'haidary555@yahoo.com';
const userName = 'Haidary';
const fromEmail = 'contact@borderly.net';

// Email templates
const welcomeTemplate = (name) => `
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

const acknowledgementTemplate = (name) => `
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

const applicationTemplate = (name, applicationType = 'visa') => `
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

/**
 * Send email using Resend
 */
async function sendEmail(to, subject, html) {
  try {
    const data = await resend.emails.send({
      from: `Borderly <${fromEmail}>`,
      to,
      subject,
      html,
    });
    console.log('Email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Email error:', error);
    throw error;
  }
}

/**
 * Main function to send test emails
 */
async function sendTestEmails() {
  try {
    console.log(`Preparing to send test emails to ${targetEmail}...`);

    // Send welcome email
    console.log('Sending welcome email...');
    await sendEmail(
      targetEmail,
      'Welcome to Borderly!',
      welcomeTemplate(userName)
    );
    console.log('Welcome email sent successfully!');
    
    // Small delay between emails
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Send acknowledgement email
    console.log('Sending acknowledgement email...');
    await sendEmail(
      targetEmail,
      'We\'ve received your message',
      acknowledgementTemplate(userName)
    );
    console.log('Acknowledgement email sent successfully!');
    
    // Small delay between emails
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Send application email
    console.log('Sending application confirmation email...');
    await sendEmail(
      targetEmail,
      'Your Application Has Been Received',
      applicationTemplate(userName, 'eVisa')
    );
    console.log('Application email sent successfully!');

    console.log('All test emails have been sent successfully!');
  } catch (error) {
    console.error('Error sending test emails:', error);
  }
}

// Execute the function
sendTestEmails(); 