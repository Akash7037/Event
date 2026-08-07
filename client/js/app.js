/* ==========================================================================
   Student Portal Client JavaScript - Startup Pitching Competition 2026
   ========================================================================== */

// Theme Manager (Light / Dark Theme Switcher)
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeToggleUI(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeToggleUI(newTheme);
}

function updateThemeToggleUI(theme) {
  const toggleBtn = document.getElementById('theme-toggle-btn');
  const headerBtn = document.getElementById('theme-toggle-header-btn');

  if (theme === 'dark') {
    if (toggleBtn) toggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i> <span id="theme-toggle-text">Light Mode</span>';
    if (headerBtn) headerBtn.innerHTML = '<i class="fa-solid fa-sun" style="color: #f59e0b;"></i>';
  } else {
    if (toggleBtn) toggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i> <span id="theme-toggle-text">Dark Mode</span>';
    if (headerBtn) headerBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  checkRegistrationIsOpen();
});

async function checkRegistrationIsOpen() {
  try {
    const res = await fetch('/api/teams/registration-status');
    const data = await res.json();
    if (data.success && data.isOpen === false) {
      showRegistrationClosedBanner();
    }
  } catch (err) {
    console.warn('Could not check registration status:', err);
  }
}

function showRegistrationClosedBanner() {
  const form = document.getElementById('registration-form');
  const viewRegister = document.getElementById('view-register');
  if (!viewRegister || document.getElementById('reg-closed-notice')) return;

  const closedNotice = document.createElement('div');
  closedNotice.id = 'reg-closed-notice';
  closedNotice.style.cssText = `
    background: rgba(220, 38, 38, 0.12);
    border: 2px solid var(--accent-rose);
    padding: 24px;
    border-radius: var(--radius-lg);
    text-align: center;
    margin-bottom: 24px;
  `;
  closedNotice.innerHTML = `
    <i class="fa-solid fa-lock" style="font-size: 36px; color: var(--accent-rose); margin-bottom: 10px;"></i>
    <h2 style="font-size: 22px; font-weight: 800; color: var(--accent-rose); margin-bottom: 8px;">Registration is Currently Closed</h2>
    <p style="font-size: 14px; color: var(--text-primary);">The admin has closed team registration submissions for Startup Pitching Competition 2026. If you have already registered, you can still check your application status under the <strong>Check Status</strong> tab.</p>
  `;

  viewRegister.insertBefore(closedNotice, viewRegister.firstChild);
  if (form) {
    form.style.opacity = '0.4';
    form.style.pointerEvents = 'none';
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fa-solid fa-lock"></i> Registration Closed`;
    }
  }
}

// Helper: Show Toast Notification
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let iconClass = 'fa-circle-info';
  if (type === 'success') iconClass = 'fa-circle-check';
  if (type === 'error') iconClass = 'fa-circle-xmark';
  if (type === 'warning') iconClass = 'fa-triangle-exclamation';

  toast.innerHTML = `
    <i class="fa-solid ${iconClass}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Copy NEC ID Helper
function copyNecId() {
  const necCode = 'NEC2621509';
  navigator.clipboard.writeText(necCode).then(() => {
    showToast('NEC ID (NEC2621509) copied to clipboard!', 'success');
  }).catch(() => {
    showToast('Failed to copy. Please manually select NEC2621509', 'warning');
  });
}

// Tab Switching
function switchTab(tabName) {
  const registerView = document.getElementById('view-register');
  const statusView = document.getElementById('view-status');
  const registerBtn = document.getElementById('tab-register-btn');
  const statusBtn = document.getElementById('tab-status-btn');
  const mobileRegisterBtn = document.getElementById('mobile-tab-register');
  const mobileStatusBtn = document.getElementById('mobile-tab-status');

  if (tabName === 'register') {
    registerView.style.display = 'block';
    statusView.style.display = 'none';
    if (registerBtn) registerBtn.classList.add('active');
    if (statusBtn) statusBtn.classList.remove('active');
    if (mobileRegisterBtn) mobileRegisterBtn.classList.add('active');
    if (mobileStatusBtn) mobileStatusBtn.classList.remove('active');
  } else if (tabName === 'status') {
    registerView.style.display = 'none';
    statusView.style.display = 'block';
    if (registerBtn) registerBtn.classList.remove('active');
    if (statusBtn) statusBtn.classList.add('active');
    if (mobileRegisterBtn) mobileRegisterBtn.classList.remove('active');
    if (mobileStatusBtn) mobileStatusBtn.classList.add('active');
  }
}

// Dynamic Team Member Toggles
function toggleMember(memberNum, show) {
  const sec = document.getElementById(`member${memberNum}-section`);
  const addBtn2 = document.getElementById('add-member2-btn');
  const addBtn3 = document.getElementById('add-member3-btn');

  if (show) {
    sec.style.display = 'block';
    if (memberNum === 2) {
      addBtn2.style.display = 'none';
      addBtn3.style.display = 'inline-flex';
    } else if (memberNum === 3) {
      addBtn3.style.display = 'none';
    }
  } else {
    sec.style.display = 'none';
    // Clear fields
    document.getElementById(`member${memberNum}Name`).value = '';
    document.getElementById(`member${memberNum}RegNo`).value = '';
    document.getElementById(`member${memberNum}Dept`).value = '';
    document.getElementById(`member${memberNum}Year`).value = '';

    if (memberNum === 2) {
      addBtn2.style.display = 'inline-flex';
      // If member 2 removed, also hide member 3
      toggleMember(3, false);
    } else if (memberNum === 3) {
      addBtn3.style.display = 'inline-flex';
    }
  }
}

// Abstract Live Word Count Calculator
function handleAbstractWordCount() {
  const textarea = document.getElementById('abstract');
  const countLabel = document.getElementById('abstract-word-count');
  const text = textarea.value.trim();
  const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;

  countLabel.textContent = `${wordCount} / 300 words`;

  if (wordCount > 300) {
    countLabel.classList.add('exceeded');
  } else {
    countLabel.classList.remove('exceeded');
  }
}

// File Select & Drag-and-Drop Handler
function handleFileSelect(input, previewId, maxMb) {
  const previewDiv = document.getElementById(previewId);
  previewDiv.innerHTML = '';

  if (!input.files || input.files.length === 0) return;

  const file = input.files[0];
  const fileSizeMb = (file.size / (1024 * 1024)).toFixed(2);

  if (file.size > maxMb * 1024 * 1024) {
    showToast(`File size exceeds maximum allowed limit of ${maxMb}MB!`, 'error');
    input.value = '';
    return;
  }

  const iconClass = file.type.includes('image') ? 'fa-file-image' : (file.type.includes('pdf') ? 'fa-file-pdf' : 'fa-file-powerpoint');

  previewDiv.innerHTML = `
    <div class="file-preview-card">
      <div class="file-info">
        <i class="fa-solid ${iconClass}"></i>
        <div class="file-details">
          <div class="file-name">${file.name}</div>
          <div class="file-size">${fileSizeMb} MB</div>
        </div>
      </div>
      <button type="button" class="file-remove" onclick="removeSelectedFile('${input.id}', '${previewId}')">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
  `;
}

function removeSelectedFile(inputId, previewId) {
  document.getElementById(inputId).value = '';
  document.getElementById(previewId).innerHTML = '';
}

// Drag and drop setup for dropzones
document.addEventListener('DOMContentLoaded', () => {
  const dropzones = [
    { zone: document.getElementById('ppt-dropzone'), input: document.getElementById('pptFile') },
    { zone: document.getElementById('screenshot-dropzone'), input: document.getElementById('eurekaScreenshot') }
  ];

  dropzones.forEach(item => {
    if (!item.zone) return;

    ['dragenter', 'dragover'].forEach(eventName => {
      item.zone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        item.zone.classList.add('dragover');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      item.zone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        item.zone.classList.remove('dragover');
      }, false);
    });

    item.zone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files.length > 0) {
        item.input.files = files;
        item.input.dispatchEvent(new Event('change'));
      }
    });
  });
});

// Form Submission Handler
async function handleRegistrationSubmit(event) {
  event.preventDefault();

  const submitBtn = document.getElementById('submit-btn');
  const abstractText = document.getElementById('abstract').value.trim();
  const wordCount = abstractText ? abstractText.split(/\s+/).filter(Boolean).length : 0;

  if (wordCount > 300) {
    showToast(`Abstract cannot exceed 300 words (Current: ${wordCount} words).`, 'error');
    return;
  }

  const pptInput = document.getElementById('pptFile');
  const screenshotInput = document.getElementById('eurekaScreenshot');

  if (!pptInput.files || pptInput.files.length === 0) {
    showToast('Please upload your presentation PPT file!', 'error');
    return;
  }

  if (!screenshotInput.files || screenshotInput.files.length === 0) {
    showToast('Please upload your Eureka Registration Screenshot proof!', 'error');
    return;
  }

  const form = document.getElementById('registration-form');
  const formData = new FormData(form);

  submitBtn.disabled = true;
  submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Submitting Team Registration...`;

  try {
    const response = await fetch('/api/teams/register', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (result.success) {
      document.getElementById('success-modal-message').textContent =
        `Team "${result.data.teamName}" (Leader: ${result.data.leaderName}) registration has been recorded successfully. Status is Pending Verification.`;
      document.getElementById('success-modal').classList.add('active');
      form.reset();
      document.getElementById('ppt-preview').innerHTML = '';
      document.getElementById('screenshot-preview').innerHTML = '';
      toggleMember(2, false);
      handleAbstractWordCount();
      showToast('Registration submitted successfully!', 'success');
    } else {
      showToast(result.message || 'Submission failed. Please check form fields.', 'error');
    }
  } catch (error) {
    console.error('Submission error:', error);
    showToast('Network error while submitting registration. Please try again.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Submit Registration`;
  }
}

function closeSuccessModal() {
  document.getElementById('success-modal').classList.remove('active');
}

// Student Application Status Check Handler
async function checkApplicationStatus() {
  const queryInput = document.getElementById('status-search-input');
  const container = document.getElementById('status-result-container');
  const query = queryInput.value.trim();

  if (!query) {
    showToast('Please enter Leader Email or Register Number!', 'warning');
    return;
  }

  container.innerHTML = `
    <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
      <i class="fa-solid fa-spinner fa-spin" style="font-size: 24px;"></i>
      <p style="margin-top: 8px;">Searching application status...</p>
    </div>
  `;

  try {
    const response = await fetch(`/api/teams/status?query=${encodeURIComponent(query)}`);
    const result = await response.json();

    if (result.success) {
      const data = result.data;
      let badgeClass = 'badge-pending';
      let statusIcon = 'fa-clock';

      if (data.status === 'Approved') {
        badgeClass = 'badge-approved';
        statusIcon = 'fa-circle-check';
      } else if (data.status === 'Rejected') {
        badgeClass = 'badge-rejected';
        statusIcon = 'fa-circle-xmark';
      }

      const submittedDate = new Date(data.submittedAt).toLocaleString();

      container.innerHTML = `
        <div class="glass-card" style="background: rgba(255, 255, 255, 0.02); margin-bottom: 0; padding: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
            <div>
              <h3 style="font-size: 20px; font-weight: 800; color: var(--accent-cyan); margin-bottom: 2px;">${data.startupName || data.teamName}</h3>
              <p style="font-size: 13px; color: var(--text-primary); font-weight: 600;">Team: ${data.teamName} | Leader: ${data.leaderName} (${data.registerNumber})</p>
            </div>
            <span class="badge ${badgeClass}">
              <i class="fa-solid ${statusIcon}"></i> ${data.status}
            </span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; background: var(--bg-secondary); padding: 12px 16px; border-radius: var(--radius-md);">
            <div>
              <span style="font-size: 12px; color: var(--text-muted);">Department</span>
              <div style="font-size: 14px; font-weight: 600;">${data.department}</div>
            </div>
            <div>
              <span style="font-size: 12px; color: var(--text-muted);">Year</span>
              <div style="font-size: 14px; font-weight: 600;">${data.year}</div>
            </div>
            <div>
              <span style="font-size: 12px; color: var(--text-muted);">Domain</span>
              <div style="font-size: 14px; font-weight: 600; color: var(--accent-cyan);">${data.innovationDomain}</div>
            </div>
          </div>

          ${data.status === 'Rejected' ? `
            <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 16px; border-radius: var(--radius-md); margin-top: 16px;">
              <div style="font-weight: 700; color: var(--accent-rose); font-size: 14px; margin-bottom: 4px;">
                <i class="fa-solid fa-triangle-exclamation"></i> Rejection Reason:
              </div>
              <p style="font-size: 14px; color: var(--text-primary);">${data.rejectionReason || 'No specific reason provided.'}</p>
            </div>
          ` : ''}

          <div style="margin-top: 16px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 14px;">
            <span style="font-size: 12px; color: var(--text-muted);">Submitted on: ${submittedDate}</span>
            <button type="button" class="btn-secondary" style="padding: 6px 14px; font-size: 12px; display: inline-flex; align-items: center; gap: 6px;" onclick="printRegistrationPass('${encodeURIComponent(JSON.stringify(data))}')">
              <i class="fa-solid fa-print"></i> Print Official Registration Slip
            </button>
          </div>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 20px; border-radius: var(--radius-md); text-align: center;">
          <i class="fa-solid fa-circle-exclamation" style="font-size: 24px; color: var(--accent-rose); margin-bottom: 8px;"></i>
          <p style="color: #ffffff; font-weight: 600;">${result.message || 'No registration record found.'}</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Status check error:', error);
    container.innerHTML = `
      <div style="color: var(--accent-rose); text-align: center; padding: 20px;">
        Failed to fetch application status. Please check your connection.
      </div>
    `;
  }
}

// Toggle FAQ Accordion
function toggleFaq(btnElement) {
  const faqItem = btnElement.closest('.faq-item');
  if (!faqItem) return;

  const isOpen = faqItem.classList.contains('open');

  // Close all open FAQs first
  document.querySelectorAll('.faq-item').forEach(item => {
    item.classList.remove('open');
  });

  if (!isOpen) {
    faqItem.classList.add('open');
  }
}

// Print Official Registration Slip
function printRegistrationPass(encodedData) {
  try {
    const data = JSON.parse(decodeURIComponent(encodedData));
    const printWin = window.open('', '_blank', 'width=800,height=900');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Registration Slip - ${data.teamName}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #1e293b; background: #ffffff; }
          .header { text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 16px; margin-bottom: 24px; }
          .header h1 { margin: 0; font-size: 24px; color: #0f172a; text-transform: uppercase; }
          .header p { margin: 4px 0 0; color: #64748b; font-size: 14px; }
          .badge { display: inline-block; padding: 6px 14px; border-radius: 20px; font-weight: 700; font-size: 13px; margin-bottom: 20px; text-transform: uppercase; }
          .badge-approved { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
          .badge-pending { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
          .badge-rejected { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; }
          .field label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block; margin-bottom: 4px; }
          .field span { font-size: 15px; font-weight: 600; color: #0f172a; }
          .footer { margin-top: 40px; border-top: 1px dashed #cbd5e1; padding-top: 16px; display: flex; justify-content: space-between; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Intra-College Startup Pitching Competition 2026</h1>
          <p>Organized by Entrepreneurship Development Cell (E-Cell)</p>
        </div>
        <div style="text-align: center;">
          <span class="badge badge-${data.status === 'Approved' ? 'approved' : (data.status === 'Rejected' ? 'rejected' : 'pending')}">
            STATUS: ${data.status}
          </span>
        </div>
        <div class="grid">
          <div class="field"><label>Startup / Project Name</label><span>${data.teamName}</span></div>
          <div class="field"><label>Leader Name</label><span>${data.leaderName}</span></div>
          <div class="field"><label>Leader Register No</label><span>${data.registerNumber}</span></div>
          <div class="field"><label>Department / Year</label><span>${data.department} (${data.year})</span></div>
          <div class="field"><label>Innovation Domain</label><span>${data.innovationDomain}</span></div>
          <div class="field"><label>Submission Date</label><span>${new Date(data.submittedAt).toLocaleDateString()}</span></div>
        </div>
        <div class="footer">
          <span>Official E-Cell Verification Slip</span>
          <span>Generated on: ${new Date().toLocaleString()}</span>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `);
    printWin.document.close();
  } catch (err) {
    console.error('Print slip error:', err);
    showToast('Failed to generate print slip', 'error');
  }
}

// Attach real-time input formatting & stepper event listeners
document.addEventListener('DOMContentLoaded', () => {
  const leaderReg = document.getElementById('leaderRegNo');
  if (leaderReg) {
    leaderReg.addEventListener('input', (e) => {
      e.target.value = e.target.value.toUpperCase();
    });
  }

  const phoneInput = document.getElementById('leaderPhone');
  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
    });
  }
});

