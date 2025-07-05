import { 
  sendWelcomeEmail, 
  sendAcknowledgementEmail, 
  sendApplicationEmail 
} from './services/emailService';

// Configuration
const targetEmail = 'haidary555@yahoo.com';
const userName = 'Haidary';

/**
 * Main function to send test emails
 */
async function sendTestEmails() {
  try {
    console.log(`Preparing to send test emails to ${targetEmail}...`);

    // Send welcome email
    console.log('Sending welcome email...');
    await sendWelcomeEmail(targetEmail, userName);
    console.log('Welcome email sent successfully!');
    
    // Small delay between emails
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Send acknowledgement email
    console.log('Sending acknowledgement email...');
    await sendAcknowledgementEmail(targetEmail, userName);
    console.log('Acknowledgement email sent successfully!');
    
    // Small delay between emails
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Send application email
    console.log('Sending application confirmation email...');
    await sendApplicationEmail(targetEmail, userName, 'eVisa');
    console.log('Application email sent successfully!');

    console.log('All test emails have been sent successfully!');
  } catch (error) {
    console.error('Error sending test emails:', error);
  }
}

// Execute the function
sendTestEmails();

export default sendTestEmails; 