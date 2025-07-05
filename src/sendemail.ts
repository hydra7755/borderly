import { Resend } from 'resend';

const resend = new Resend('re_KGPqeL2n_FCuMudHh4A4bZtEmHXiQb8h1');

export async function sendEmail(to: string, subject: string, html: string): Promise<any> {
  try {
    const data = await resend.emails.send({
      from: 'Borderly <contact@borderly.net>',  // updated to use the requested email
      to,
      subject,
      html,
    });

    return data;
  } catch (error) {
    console.error('Email error:', error);
    throw error;
  }
} 