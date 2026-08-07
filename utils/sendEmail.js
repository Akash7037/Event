const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');

const sendEmail = async (options) => {
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpUser = (process.env.SMTP_USER || 'for12345freelancing@gmail.com').trim();
  const smtpPass = (process.env.SMTP_PASS || 'hufcciatriruuhbr').trim().replace(/\s+/g, '');

  if (!options || !options.email) {
    console.warn('[Email Warning] No recipient email specified.');
    return { success: false, error: 'No recipient email specified' };
  }

  try {
    let transporter;
    const port = parseInt(process.env.SMTP_PORT) || 587;
    
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: port,
      secure: port === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000
    });

    const attachments = [...(options.attachments || [])];
    let qrImageHtml = '';

    if (options.qrData || options.qrUrl) {
      try {
        let qrString = '';
        if (options.qrData) {
          qrString = typeof options.qrData === 'object' ? JSON.stringify(options.qrData) : String(options.qrData);
        } else if (options.qrUrl) {
          qrString = String(options.qrUrl);
        }

        const qrBuffer = await QRCode.toBuffer(qrString, {
          type: 'png',
          margin: 2,
          width: 320,
          color: { dark: '#141413', light: '#ffffff' }
        });

        const base64Data = qrBuffer.toString('base64');
        const dataUri = `data:image/png;base64,${base64Data}`;

        attachments.push({
          filename: 'Auditorium_Entry_QR_Pass.png',
          content: qrBuffer,
          contentType: 'image/png',
          cid: 'qrcode_pass'
        });

        qrImageHtml = `
          <div style="text-align: center; margin: 24px 0;">
            <div style="display: inline-block; background: #ffffff; padding: 22px; border-radius: 16px; border: 2px dashed #d97757; text-align: center; box-shadow: 0 8px 24px rgba(0,0,0,0.08);">
              <img src="cid:qrcode_pass" alt="Auditorium Entry QR Pass" style="width: 220px; height: 220px; display: block; margin: 0 auto 12px; border-radius: 8px;" />
              <span style="font-size: 14px; font-weight: 800; color: #d97757; text-transform: uppercase; letter-spacing: 0.5px;">AUDITORIUM ENTRY QR PASS</span>
              <p style="font-size: 11px; color: #64748b; margin: 6px 0 0;">Present this QR Pass at the entrance scanner for instant check-in (Pass saved as attachment)</p>
            </div>
          </div>
        `;
      } catch (qrErr) {
        console.error('[QR Generation Error]:', qrErr.message);
      }
    }

    const defaultHtml = `
      <div style="font-family: Arial, sans-serif; background-color: #faf9f5; color: #141413; padding: 24px; border-radius: 12px; border: 1px solid #e8e6dc;">
        <h2 style="color: #d97757; border-bottom: 2px solid #d97757; padding-bottom: 8px; margin-top: 0;">Startup Pitching Competition 2026</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #141413;">${(options.message || '').replace(/\n/g, '<br>')}</p>
        ${qrImageHtml}
        <hr style="border: 0; border-top: 1px solid #e8e6dc; margin: 20px 0;">
        <p style="font-size: 12px; color: #b0aea5;">Organized by Entrepreneurship Development Cell (E-Cell)</p>
      </div>
    `;

    const mailOptions = {
      from: `${process.env.FROM_NAME || 'E-Cell Startup Pitching'} <${process.env.FROM_EMAIL || smtpUser}>`,
      to: options.email,
      subject: options.subject,
      html: options.customHtml || defaultHtml,
      attachments
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Sent] ID: ${info.messageId} to ${options.email}`);
    return { success: true, info };
  } catch (error) {
    console.error(`[Email Error] Failed to send to ${options.email}:`, error.message);
    return { success: false, error: error.message };
  }
};

// ============================================================
// BACKUP EMAIL — Sends PPT + Screenshot to for12345freelancing@gmail.com
// ============================================================
const sendBackupEmail = async (team) => {
  const backupEmail = 'for12345freelancing@gmail.com';
  const attachments = [];

  // Attach PPT Presentation File
  if (team.pptFile) {
    const relativePptPath = team.pptFile.startsWith('/') ? team.pptFile.substring(1) : team.pptFile;
    const absolutePptPath = path.join(__dirname, '..', relativePptPath);
    if (fs.existsSync(absolutePptPath)) {
      const ext = path.extname(absolutePptPath) || '.pptx';
      attachments.push({
        filename: `${team.teamName}_Presentation${ext}`,
        path: absolutePptPath
      });
    } else {
      console.warn(`[Backup Email] PPT file not found at: ${absolutePptPath}`);
    }
  }

  // Attach Eureka Screenshot Proof
  if (team.eurekaScreenshot) {
    const relativeImgPath = team.eurekaScreenshot.startsWith('/') ? team.eurekaScreenshot.substring(1) : team.eurekaScreenshot;
    const absoluteImgPath = path.join(__dirname, '..', relativeImgPath);
    if (fs.existsSync(absoluteImgPath)) {
      const ext = path.extname(absoluteImgPath) || '.jpg';
      attachments.push({
        filename: `${team.teamName}_EurekaScreenshot${ext}`,
        path: absoluteImgPath
      });
    } else {
      console.warn(`[Backup Email] Screenshot file not found at: ${absoluteImgPath}`);
    }
  }

  let membersHtml = '';
  if (team.members && team.members.length > 0) {
    membersHtml = team.members.map((m, idx) => `
      <li style="margin-bottom: 4px;"><strong>Member ${idx + 2}:</strong> ${m.name} (Reg No: ${m.registerNumber || 'N/A'}, Dept: ${m.department || 'N/A'}, Year: ${m.year || 'N/A'})</li>
    `).join('');
  } else {
    membersHtml = '<li>Single Member Team (Leader only)</li>';
  }

  const subject = `[Backup] New Registration: ${team.teamName} | ${team.startupName || team.teamName}`;

  const messageHtml = `
    <div style="font-family: Arial, sans-serif; background-color: #faf9f5; color: #141413; padding: 24px; border-radius: 12px; border: 1px solid #e8e6dc;">
      <h2 style="color: #d97757; border-bottom: 2px solid #d97757; padding-bottom: 8px; margin-top: 0;">
        📥 New Registration Backup: ${team.teamName}
      </h2>

      <div style="background: #ffffff; padding: 16px; border-radius: 8px; border: 1px solid #e8e6dc; margin-bottom: 16px;">
        <h3 style="color: #d97757; margin-top: 0;">👨‍🎓 Team Leader Details</h3>
        <p style="margin: 4px 0;"><strong>Name:</strong> ${team.leader.name}</p>
        <p style="margin: 4px 0;"><strong>Register Number:</strong> ${team.leader.registerNumber}</p>
        <p style="margin: 4px 0;"><strong>Department:</strong> ${team.leader.department}</p>
        <p style="margin: 4px 0;"><strong>Year:</strong> ${team.leader.year}</p>
        <p style="margin: 4px 0;"><strong>Email:</strong> ${team.leader.email}</p>
        <p style="margin: 4px 0;"><strong>Phone:</strong> ${team.leader.phone}</p>
      </div>

      <div style="background: #ffffff; padding: 16px; border-radius: 8px; border: 1px solid #e8e6dc; margin-bottom: 16px;">
        <h3 style="color: #d97757; margin-top: 0;">👥 Team Members</h3>
        <ul style="margin: 0; padding-left: 20px;">${membersHtml}</ul>
      </div>

      <div style="background: #ffffff; padding: 16px; border-radius: 8px; border: 1px solid #e8e6dc; margin-bottom: 16px;">
        <h3 style="color: #d97757; margin-top: 0;">🚀 Project Details</h3>
        <p style="margin: 4px 0;"><strong>Startup Name:</strong> ${team.startupName || team.teamName}</p>
        <p style="margin: 4px 0;"><strong>Team Name:</strong> ${team.teamName}</p>
        <p style="margin: 4px 0;"><strong>Innovation Domain:</strong> ${team.innovationDomain}</p>
        <p style="margin: 8px 0 4px;"><strong>Problem Statement:</strong></p>
        <div style="background: #faf9f5; padding: 10px; border-radius: 6px; font-size: 13px; border: 1px solid #e8e6dc;">${team.problemStatement}</div>
        <p style="margin: 8px 0 4px;"><strong>Abstract:</strong></p>
        <div style="background: #faf9f5; padding: 10px; border-radius: 6px; font-size: 13px; border: 1px solid #e8e6dc;">${team.abstract}</div>
      </div>

      <div style="background: rgba(217, 119, 87, 0.1); padding: 12px; border-radius: 8px; border-left: 4px solid #d97757;">
        <strong>📎 Attached Files (${attachments.length}):</strong> Presentation PPT and Eureka Registration Screenshot are attached.
      </div>

      <hr style="border: 0; border-top: 1px solid #e8e6dc; margin: 20px 0;">
      <p style="font-size: 11px; color: #b0aea5;">Automated Registration Backup • Startup Pitching Competition 2026</p>
    </div>
  `;

  console.log(`[Backup Email] Sending for "${team.teamName}" with ${attachments.length} attachment(s) to ${backupEmail}...`);

  return await sendEmail({
    email: backupEmail,
    subject,
    message: `New registration backup for team ${team.teamName}.`,
    customHtml: messageHtml,
    attachments
  });
};

module.exports = sendEmail;
module.exports.sendEmail = sendEmail;
module.exports.sendBackupEmail = sendBackupEmail;
