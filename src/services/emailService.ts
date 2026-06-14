import { Resend } from 'resend';
import { welcomeEmailTemplate } from '../email-templates/welcome';
import { acknowledgementEmailTemplate } from '../email-templates/acknowledgement';
import { applicationEmailTemplate } from '../email-templates/application';
import { getCompanyEmail } from '../config/companyContact';

const resendApiKey =
  (window as { _env_?: Record<string, string> })._env_?.VITE_RESEND_API_KEY ||
  (window as { _env_?: Record<string, string> })._env_?.REACT_APP_RESEND_API_KEY ||
  're_KGPqeL2n_FCuMudHh4A4bZtEmHXiQb8h1';

const resend = new Resend(resendApiKey);

const fromEmail =
  (window as { _env_?: Record<string, string> })._env_?.VITE_EMAIL_FROM_EMAIL ||
  (window as { _env_?: Record<string, string> })._env_?.REACT_APP_EMAIL_FROM_EMAIL ||
  getCompanyEmail();

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

export async function sendWelcomeEmail(to: string, name: string = '') {
  const subject = 'Welcome to Borderly!';
  const html = welcomeEmailTemplate(name);

  return sendEmail(to, subject, html);
}

export async function sendAcknowledgementEmail(to: string, name: string = '') {
  const subject = "We've received your message";
  const html = acknowledgementEmailTemplate(name);

  return sendEmail(to, subject, html);
}

export async function sendApplicationEmail(to: string, name: string = '', applicationType: string = 'visa') {
  const subject = 'Your Application Has Been Received';
  const html = applicationEmailTemplate(name, applicationType);

  return sendEmail(to, subject, html);
}

export interface ContactFormPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/** Deliver a website contact form submission to the company inbox. */
export async function sendContactFormToCompany(payload: ContactFormPayload) {
  const html = `
    <h2>New Contact Form Submission</h2>
    <p><strong>Name:</strong> ${payload.name}</p>
    <p><strong>Email:</strong> ${payload.email}</p>
    <p><strong>Subject:</strong> ${payload.subject}</p>
    <p><strong>Message:</strong></p>
    <p>${payload.message.replace(/\n/g, '<br>')}</p>
  `;

  return sendEmail(getCompanyEmail(), `New Contact Form: ${payload.subject}`, html);
}

export interface VisaApplicationNotificationPayload {
  applicationId: string;
  nationalityCode: string;
  destinationCode: string;
  userEmail?: string | null;
  userName?: string | null;
  entryDate?: string;
  exitDate?: string;
  paymentStatus?: string;
}

/** Notify the company inbox when a visa application is submitted or updated. */
export async function sendVisaApplicationToCompany(payload: VisaApplicationNotificationPayload) {
  const html = `
    <h2>New Visa Application</h2>
    <p><strong>Application ID:</strong> ${payload.applicationId}</p>
    <p><strong>Nationality:</strong> ${payload.nationalityCode.toUpperCase()}</p>
    <p><strong>Destination:</strong> ${payload.destinationCode.toUpperCase()}</p>
    <p><strong>Applicant email:</strong> ${payload.userEmail || 'Not provided'}</p>
    <p><strong>Applicant name:</strong> ${payload.userName || 'Not provided'}</p>
    <p><strong>Entry date:</strong> ${payload.entryDate || 'Not provided'}</p>
    <p><strong>Exit date:</strong> ${payload.exitDate || 'Not provided'}</p>
    <p><strong>Payment status:</strong> ${payload.paymentStatus || 'pending'}</p>
  `;

  return sendEmail(
    getCompanyEmail(),
    `Visa Application: ${payload.nationalityCode.toUpperCase()} → ${payload.destinationCode.toUpperCase()} (${payload.applicationId})`,
    html
  );
}

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

export { getCompanyEmail };
