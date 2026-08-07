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

    const qrImageHtml = options.qrUrl ? `
      <div style="text-align: center; margin: 20px 0;">
        <div style="display: inline-block; background: #ffffff; padding: 20px; border-radius: 12px; border: 2px dashed #d97757; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <img src="${options.qrUrl}" alt="Auditorium Entry QR Pass" style="width: 200px; height: 200px; display: block; margin: 0 auto 10px;" />
          <span style="font-size: 13px; font-weight: 700; color: #141413; text-transform: uppercase;">AUDITORIUM ENTRY QR PASS</span>
          <p style="font-size: 11px; color: #64748b; margin: 4px 0 0;">Show this QR Pass at the entrance scanner for instant check-in</p>
        </div>
      </div>
    ` : '';

    const mailOptions = {
      from: `${process.env.FROM_NAME || 'E-Cell Startup Pitching'} <${process.env.FROM_EMAIL || smtpUser}>`,
      to: options.email,
      subject: options.subject,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #faf9f5; color: #141413; padding: 24px; border-radius: 12px; border: 1px solid #e8e6dc;">
          <h2 style="color: #d97757; border-bottom: 2px solid #d97757; padding-bottom: 8px; margin-top: 0;">Startup Pitching Competition 2026</h2>
          <p style="font-size: 15px; line-height: 1.6; color: #141413;">${options.message.replace(/\n/g, '<br>')}</p>
          ${qrImageHtml}
          <hr style="border: 0; border-top: 1px solid #e8e6dc; margin: 20px 0;">
          <p style="font-size: 12px; color: #b0aea5;">Organized by Entrepreneurship Development Cell (E-Cell)</p>
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
