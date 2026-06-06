const nodemailer = require('nodemailer');
const logger = require('../config/logger');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    transporter = nodemailer.createTransport({
      host: 'localhost',
      port: 1025,
      ignoreTLS: true,
    });
    logger.info('Email: Using development mail server (Mailpit/MailHog expected on :1025)');
  }

  return transporter;
};

const generatePasswordResetTemplate = (name, resetLink, expiryMinutes) => {
  const minutes = expiryMinutes || 30;
  return {
    subject: 'CITT - Password Reset Request',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a56db; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #1a56db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
    .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 12px; border-radius: 6px; margin-top: 20px; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>CITT Password Reset</h1>
      <p>Centre for Innovation and Technology Transfer</p>
    </div>
    <div class="content">
      <p>Hello ${name},</p>
      <p>We received a request to reset the password for your CITT account. Click the button below to set a new password:</p>
      <p style="text-align: center;">
        <a href="${resetLink}" class="button">Reset Password</a>
      </p>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #1a56db;">${resetLink}</p>
      <div class="warning">
        <strong>Security Notice:</strong> This link will expire in ${minutes} minute${minutes > 1 ? 's' : ''}.
        If you did not request a password reset, please ignore this email or contact CITT administration.
      </div>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Mbeya University of Science and Technology - CITT</p>
      <p>This is an automated message. Please do not reply directly.</p>
    </div>
  </div>
</body>
</html>`,
  };
};

const sendPasswordResetEmail = async (email, name, resetToken, expiryMinutes) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    const template = generatePasswordResetTemplate(name, resetLink, expiryMinutes);

    const info = await getTransporter().sendMail({
      from: process.env.MAIL_FROM || 'noreply@citt.ac.tz',
      to: email,
      subject: template.subject,
      html: template.html,
    });

    logger.info('Password reset email sent', { to: email, messageId: info.messageId });
    return true;
  } catch (error) {
    logger.error('Failed to send password reset email', { error: error.message, to: email });
    return false;
  }
};

const sendWelcomeEmail = async (email, name) => {
  try {
    const info = await getTransporter().sendMail({
      from: process.env.MAIL_FROM || 'noreply@citt.ac.tz',
      to: email,
      subject: 'Welcome to CITT',
      html: `<h1>Welcome, ${name}!</h1><p>Your CITT account has been approved.</p>`,
    });
    logger.info('Welcome email sent', { to: email, messageId: info.messageId });
    return true;
  } catch (error) {
    logger.error('Failed to send welcome email', { error: error.message });
    return false;
  }
};

const sendVerificationEmail = async (email, name, verificationToken) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verifyLink = `${frontendUrl}/verify-email?token=${verificationToken}`;

    const info = await getTransporter().sendMail({
      from: process.env.MAIL_FROM || 'noreply@citt.ac.tz',
      to: email,
      subject: 'CITT - Verify Your Email Address',
      html: `
<h1>Welcome to CITT, ${name}!</h1>
<p>Thank you for registering. Please verify your email address by clicking the link below:</p>
<p><a href="${verifyLink}">Verify Email Address</a></p>
<p>Or copy this link: ${verifyLink}</p>
<p>This link will expire in 24 hours.</p>
<p>If you did not create this account, please ignore this email.</p>`,
    });

    logger.info('Verification email sent', { to: email, messageId: info.messageId });
    return true;
  } catch (error) {
    logger.error('Failed to send verification email', { error: error.message });
    return false;
  }
};

module.exports = {
  getTransporter,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendVerificationEmail,
};
