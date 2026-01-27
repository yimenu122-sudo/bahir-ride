import nodemailer from 'nodemailer';
import { logger } from './logger';

export const sendEmail = async (to: string, subject: string, text: string, html?: string) => {
  if (!process.env.EMAIL_HOST) {
    logger.warn('Email service not configured. Skipping email sending.');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: Number(process.env.EMAIL_PORT) === 465, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Bahir-Ride" <no-reply@bahir-ride.com>',
      to,
      subject,
      text,
      html,
    });

    logger.info(`Email sent: ${info.messageId} to ${to}`);
  } catch (error) {
    logger.error('Error sending email:', error);
  }
};
