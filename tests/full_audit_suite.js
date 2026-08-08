const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

const BASE_URL = 'http://localhost:5000';

async function runComprehensiveAudit() {
  console.log('====================================================');
  console.log('🧪 ANTIGRAVITY END-TO-END SYSTEM AUDIT SUITE');
  console.log('====================================================');

  let passed = 0;
  let failed = 0;
  const auditLog = [];

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      auditLog.push({ test: testName, status: 'PASS', details });
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} - ${details}`);
      auditLog.push({ test: testName, status: 'FAIL', details });
      failed++;
    }
  }

  // Create mock test files for multipart upload testing
  const dummyPptPath = path.join(__dirname, 'dummy_test.pptx');
  const dummyImgPath = path.join(__dirname, 'dummy_screenshot.png');
  fs.writeFileSync(dummyPptPath, 'dummy ppt content for testing');
  fs.writeFileSync(dummyImgPath, 'dummy png content for testing');

  try {
    // TEST 1: Health & Ping Check
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.status === 'healthy', '1. System Health Check (/api/health)');

    // TEST 2: Admin Login Security (Invalid Password)
    const invalidLoginRes = await fetch(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail: 'admin', password: 'wrong_password_999' })
    });
    assert(invalidLoginRes.status === 401, '2. Admin Login Rejection for Invalid Password');

    // TEST 3: Admin Login Success & JWT Token Issuance
    const validLoginRes = await fetch(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail: 'admin', password: 'admin123' })
    });
    const loginData = await validLoginRes.json();
    assert(validLoginRes.status === 200 && !!loginData.token, '3. Admin Login & JWT Issuance');
    const token = loginData.token;

    // TEST 4: Protected Admin Endpoint Authorization Check
    const unauthorizedRes = await fetch(`${BASE_URL}/api/admin/stats`);
    assert(unauthorizedRes.status === 401, '4. Endpoint Security Protection without JWT Header');

    // TEST 5: Fetch Admin Dashboard Stats with Valid JWT
    const statsRes = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const statsData = await statsRes.json();
    assert(statsRes.status === 200 && statsData.success && statsData.data.total !== undefined, '5. Admin Dashboard Stats Query');

    // TEST 6: PPT Template Download
    const templateRes = await fetch(`${BASE_URL}/api/teams/template`);
    assert(templateRes.status === 200, '6. Pitch Deck Template File Download');

    // TEST 7: Registration Submission (1-Member Team Submission)
    const testRegNo1 = 'TESTREG_' + Date.now();
    const formData1 = new FormData();
    formData1.append('teamName', 'Alpha Innovators');
    formData1.append('startupName', 'Alpha Solar System');
    formData1.append('leaderName', 'Alice Walker');
    formData1.append('leaderRegNo', testRegNo1);
    formData1.append('leaderDept', 'Computer Science & Engineering');
    formData1.append('leaderYear', '3rd Year');
    formData1.append('leaderEmail', 'alice.test@example.com');
    formData1.append('leaderPhone', '9876543210');
    formData1.append('problemStatement', 'Clean energy grid management in rural areas.');
    formData1.append('abstract', 'Innovative AI-powered solar microgrid distributor for villages.');
    formData1.append('innovationDomain', 'AI');
    formData1.append('declarationConfirmed', 'true');
    formData1.append('pptFile', new Blob([fs.readFileSync(dummyPptPath)]), 'presentation.pptx');
    formData1.append('eurekaScreenshot', new Blob([fs.readFileSync(dummyImgPath)]), 'proof.png');

    const regRes1 = await fetch(`${BASE_URL}/api/teams/register`, {
      method: 'POST',
      body: formData1
    });
    const regData1 = await regRes1.json();
    assert(regRes1.status === 201 && regData1.success && !!regData1.data.teamId, '7. Team Registration Submission (1-Member Team)', regData1.message);
    const createdTeamId1 = regData1.data ? regData1.data.teamId : null;

    // TEST 8: Duplicate Registration Prevention (Same Leader Reg No)
    const formDataDup = new FormData();
    formDataDup.append('teamName', 'Duplicate Team');
    formDataDup.append('leaderName', 'Alice Walker');
    formDataDup.append('leaderRegNo', testRegNo1); // Same Reg No!
    formDataDup.append('leaderDept', 'Computer Science & Engineering');
    formDataDup.append('leaderYear', '3rd Year');
    formDataDup.append('leaderEmail', 'alice.dup@example.com');
    formDataDup.append('leaderPhone', '9876543210');
    formDataDup.append('problemStatement', 'Duplicate testing statement');
    formDataDup.append('abstract', 'Duplicate testing abstract');
    formDataDup.append('innovationDomain', 'AI');
    formDataDup.append('declarationConfirmed', 'true');
    formDataDup.append('pptFile', new Blob([fs.readFileSync(dummyPptPath)]), 'presentation.pptx');
    formDataDup.append('eurekaScreenshot', new Blob([fs.readFileSync(dummyImgPath)]), 'proof.png');

    const dupRes = await fetch(`${BASE_URL}/api/teams/register`, {
      method: 'POST',
      body: formDataDup
    });
    assert(dupRes.status === 400, '8. Duplicate Leader Register Number Rejection');

    // TEST 9: Ineligible Academic Year Rejection (1st Year)
    const formDataIneligible = new FormData();
    formDataIneligible.append('teamName', 'Junior Team');
    formDataIneligible.append('leaderName', 'Bob Smith');
    formDataIneligible.append('leaderRegNo', 'INELIGIBLE_' + Date.now());
    formDataIneligible.append('leaderDept', 'Civil Engineering');
    formDataIneligible.append('leaderYear', '1st Year'); // Ineligible!
    formDataIneligible.append('leaderEmail', 'bob.test@example.com');
    formDataIneligible.append('leaderPhone', '9876543211');
    formDataIneligible.append('problemStatement', 'Test problem statement');
    formDataIneligible.append('abstract', 'Test abstract');
    formDataIneligible.append('innovationDomain', 'Agriculture');
    formDataIneligible.append('declarationConfirmed', 'true');
    formDataIneligible.append('pptFile', new Blob([fs.readFileSync(dummyPptPath)]), 'presentation.pptx');
    formDataIneligible.append('eurekaScreenshot', new Blob([fs.readFileSync(dummyImgPath)]), 'proof.png');

    const ineligRes = await fetch(`${BASE_URL}/api/teams/register`, {
      method: 'POST',
      body: formDataIneligible
    });
    assert(ineligRes.status === 400, '9. Academic Year Eligibility Rejection (Only 2nd & 3rd Year Allowed)');

    // TEST 10: Abstract Word Count Limit (> 300 words)
    const longAbstract = Array(305).fill('word').join(' ');
    const formDataLongAbstract = new FormData();
    formDataLongAbstract.append('teamName', 'Verbose Team');
    formDataLongAbstract.append('leaderName', 'Charlie Brown');
    formDataLongAbstract.append('leaderRegNo', 'VERBOSE_' + Date.now());
    formDataLongAbstract.append('leaderDept', 'Information Technology');
    formDataLongAbstract.append('leaderYear', '2nd Year');
    formDataLongAbstract.append('leaderEmail', 'charlie.test@example.com');
    formDataLongAbstract.append('leaderPhone', '9876543212');
    formDataLongAbstract.append('problemStatement', 'Test problem statement');
    formDataLongAbstract.append('abstract', longAbstract);
    formDataLongAbstract.append('innovationDomain', 'Cybersecurity');
    formDataLongAbstract.append('declarationConfirmed', 'true');
    formDataLongAbstract.append('pptFile', new Blob([fs.readFileSync(dummyPptPath)]), 'presentation.pptx');
    formDataLongAbstract.append('eurekaScreenshot', new Blob([fs.readFileSync(dummyImgPath)]), 'proof.png');

    const longAbsRes = await fetch(`${BASE_URL}/api/teams/register`, {
      method: 'POST',
      body: formDataLongAbstract
    });
    assert(longAbsRes.status === 400, '10. Abstract Word Count Constraint (> 300 Words Rejection)');

    // TEST 11: Public Status Lookup by Register Number
    const statusQueryRes = await fetch(`${BASE_URL}/api/teams/status?query=${encodeURIComponent(testRegNo1)}`);
    const statusQueryData = await statusQueryRes.json();
    assert(statusQueryRes.status === 200 && statusQueryData.data.status === 'Pending Verification', '11. Student Application Status Lookup');

    // TEST 12: Admin Team Approval Workflow
    if (createdTeamId1) {
      const approveRes = await fetch(`${BASE_URL}/api/admin/teams/${createdTeamId1}/approve`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const approveData = await approveRes.json();
      assert(approveRes.status === 200 && approveData.data.status === 'Approved', '12. Admin Team Approval & Status Update');
    }

    // TEST 13: QR Pass Entry Scanner Verification (First Scan - Approved Entry)
    if (createdTeamId1) {
      const scanRes = await fetch(`${BASE_URL}/api/admin/verify-ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ticketId: createdTeamId1 })
      });
      const scanData = await scanRes.json();
      assert(scanRes.status === 200 && scanData.success && scanData.data.teamName === 'Alpha Innovators', '13. Auditorium Entry QR Code Verification (First Scan)');
    }

    // TEST 14: Duplicate QR Scan Rejection
    if (createdTeamId1) {
      const dupScanRes = await fetch(`${BASE_URL}/api/admin/verify-ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ticketId: createdTeamId1 })
      });
      const dupScanData = await dupScanRes.json();
      assert(dupScanRes.status === 400 && dupScanData.isAlreadyCheckedIn === true, '14. Duplicate QR Scan Prevention (Rejects already checked-in tickets)');
    }

    // TEST 15: Admin Registration Toggle (Close & Open)
    const toggleCloseRes = await fetch(`${BASE_URL}/api/admin/toggle-registration`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ isOpen: false })
    });
    const toggleCloseData = await toggleCloseRes.json();
    assert(toggleCloseRes.status === 200 && toggleCloseData.isOpen === false, '15. Admin Dynamic Registration Toggle (CLOSE Registration)');

    // Attempt submission while closed
    const formDataClosed = new FormData();
    formDataClosed.append('teamName', 'Closed Attempt Team');
    formDataClosed.append('leaderName', 'David Smith');
    formDataClosed.append('leaderRegNo', 'CLOSED_' + Date.now());
    formDataClosed.append('leaderDept', 'Robotics');
    formDataClosed.append('leaderYear', '2nd Year');
    formDataClosed.append('leaderEmail', 'david.test@example.com');
    formDataClosed.append('leaderPhone', '9876543213');
    formDataClosed.append('problemStatement', 'Test statement');
    formDataClosed.append('abstract', 'Test abstract');
    formDataClosed.append('innovationDomain', 'Robotics');
    formDataClosed.append('declarationConfirmed', 'true');
    formDataClosed.append('pptFile', new Blob([fs.readFileSync(dummyPptPath)]), 'presentation.pptx');
    formDataClosed.append('eurekaScreenshot', new Blob([fs.readFileSync(dummyImgPath)]), 'proof.png');

    const closedSubRes = await fetch(`${BASE_URL}/api/teams/register`, {
      method: 'POST',
      body: formDataClosed
    });
    assert(closedSubRes.status === 400, '16. Backend Rejection when Registration is CLOSED');

    // Re-open Registration
    await fetch(`${BASE_URL}/api/admin/toggle-registration`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ isOpen: true })
    });

    // TEST 17: CSV Export Endpoint
    const csvRes = await fetch(`${BASE_URL}/api/admin/export-csv`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const csvText = await csvRes.text();
    assert(csvRes.status === 200 && csvText.includes('Team Name,Startup Name'), '17. Registration Records CSV Export Endpoint');

    // TEST 18: Clean up Created Test Team
    if (createdTeamId1) {
      const delRes = await fetch(`${BASE_URL}/api/admin/teams/${createdTeamId1}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      assert(delRes.status === 200, '18. Admin Team Record & Files Deletion');
    }

  } catch (err) {
    console.error('💥 Test Execution Exception:', err);
    failed++;
  } finally {
    // Cleanup test dummy files
    if (fs.existsSync(dummyPptPath)) fs.unlinkSync(dummyPptPath);
    if (fs.existsSync(dummyImgPath)) fs.unlinkSync(dummyImgPath);
  }

  console.log('====================================================');
  console.log(`📊 FINAL AUDIT SCORE: ${passed} Passed / ${passed + failed} Executed (${Math.round((passed/(passed+failed))*100)}%)`);
  console.log('====================================================');

  process.exit(failed > 0 ? 1 : 0);
}

runComprehensiveAudit();
