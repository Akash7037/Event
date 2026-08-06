const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  // Fallback log if SMTP credentials are missing
  if (!smtpUser || !smtpPass) {
    console.log('====================================================');
    console.log(`[EMAIL MOCK NOTIFICATION - SMTP NOT CONFIGURED]`);
    console.log(`TO: ${options.email}`);
    console.log(`SUBJECT: ${options.subject}`);
    console.log(`MESSAGE:\n${options.message}`);
    console.log('====================================================');
    return { success: true, mocked: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    const mailOptions = {
      from: `${process.env.FROM_NAME || 'E-Cell Startup Pitching'} <${process.env.FROM_EMAIL || smtpUser}>`,
      to: options.email,
      subject: options.subject,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #ffffff; padding: 24px; border-radius: 8px;">
          <h2 style="color: #06b6d4; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">Startup Pitching Competition 2026</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #e2e8f0;">${options.message.replace(/\n/g, '<br>')}</p>
          <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 20px 0;">
          <p style="font-size: 12px; color: #94a3b8;">Organized by Entrepreneurship Development Cell (E-Cell)</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Sent] ID: ${info.messageId} to ${options.email}`);
    return { success: true, info };
  } catch (error) {
    console.error(`[Email Error] Failed to send to ${options.email}:`, error.message);
    // Return false without crashing team status update
    return { success: false, error: error.message };
  }
};

module.exports = sendEmail;
