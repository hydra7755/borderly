import { Resend } from 'resend';
import { welcomeEmailTemplate } from '../email-templates/welcome';
import { acknowledgementEmailTemplate } from '../email-templates/acknowledgement';
import { applicationEmailTemplate } from '../email-templates/application';

// Initialize Resend with API key from environment variables
const resendApiKey = 
  (window as any)._env_?.VITE_RESEND_API_KEY || 
  (window as any)._env_?.REACT_APP_RESEND_API_KEY || 
  're_KGPqeL2n_FCuMudHh4A4bZtEmHXiQb8h1';

const resend = new Resend(resendApiKey);

// Get the from email from environment variables
const fromEmail = 
  (window as any)._env_?.VITE_EMAIL_FROM_EMAIL || 
  (window as any)._env_?.REACT_APP_EMAIL_FROM_EMAIL || 
  'contact@borderly.net';

/**
 * Send a basic email
 */
export async function sendEmail(to: string, subject: string, html: string) {
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
 * Send a welcome email to a new user
 */
export async function sendWelcomeEmail(to: string, name: string = '') {
  const subject = 'Welcome to Borderly!';
  const html = welcomeEmailTemplate(name);
  
  return sendEmail(to, subject, html);
}

/**
 * Send an acknowledgement email when a user contacts us
 */
export async function sendAcknowledgementEmail(to: string, name: string = '') {
  const subject = 'We\'ve received your message';
  const html = acknowledgementEmailTemplate(name);
  
  return sendEmail(to, subject, html);
}

/**
 * Send an application confirmation email
 */
export async function sendApplicationEmail(to: string, name: string = '', applicationType: string = 'visa') {
  const subject = 'Your Application Has Been Received';
  const html = applicationEmailTemplate(name, applicationType);
  
  return sendEmail(to, subject, html);
}

/**
 * Send a test email to verify the email system is working
 */
export async function sendTestEmail(to: string) {
  const subject = 'Test Email from Borderly';
  const html = `
    <h2>Test Email</h2>
    <p>This is a test email from Borderly to verify the email system is working correctly.</p>
    <p>If you received this email, it means the email service is configured correctly.</p>
    <p><strong>Time sent:</strong> ${new Date().toLocaleString()}</p>
  `;
  
  return sendEmail(to, subject, html);
} 