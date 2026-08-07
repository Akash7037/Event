require('dotenv').config();
const { sendEmail } = require('./utils/sendEmail');

// Accept target email from command line argument (e.g. node testEmail.js your_email@gmail.com)
// Defaults to FROM_EMAIL or for12345freelancing@gmail.com
const recipientEmail = process.argv[2] || process.env.FROM_EMAIL || 'for12345freelancing@gmail.com';

async function runTest() {
  console.log('==================================================');
  console.log('🧪 HYBRID EMAIL ENGINE MANUAL TEST');
  console.log('==================================================');
  console.log(`Target Email    : ${recipientEmail}`);
  console.log(`Active Service  : ${process.env.EMAIL_SERVICE || 'smtp'}`);
  console.log('Sending test email with QR Pass...\n');

  const result = await sendEmail({
    email: recipientEmail,
    subject: '🧪 Test Entry Pass: Startup Pitching Competition 2026',
    message: 'Hello!\n\nThis is a manual test email verifying your hybrid email system and Auditorium QR Pass delivery.',
    qrData: {
      competition: 'Startup Pitching 2026',
      teamName: 'Test Innovators',
      leaderName: 'John Doe',
      registerNumber: 'REG-2026-999',
      passType: 'AUDITORIUM ENTRY PASS'
    }
  });

  console.log('\n--------------------------------------------------');
  if (result.success) {
    console.log('✅ SUCCESS: Test email delivered!');
    console.log(`Provider Used : ${result.provider || 'smtp'}`);
    console.log('Details       :', result.info);
  } else {
    console.error('❌ FAILED: Could not send email.');
    console.error(`Error       : ${result.error}`);
  }
  console.log('==================================================\n');
}

runTest();
