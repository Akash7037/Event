/* ==========================================================================
   Student Portal Client JavaScript - Startup Pitching Competition 2026
   ========================================================================== */

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

  if (tabName === 'register') {
    registerView.style.display = 'block';
    statusView.style.display = 'none';
    registerBtn.classList.add('active');
    statusBtn.classList.remove('active');
  } else if (tabName === 'status') {
    registerView.style.display = 'none';
    statusView.style.display = 'block';
    registerBtn.classList.remove('active');
    statusBtn.classList.add('active');
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
              <h3 style="font-size: 20px; font-weight: 700; color: #ffffff;">${data.teamName}</h3>
              <p style="font-size: 14px; color: var(--text-secondary);">Leader: ${data.leaderName} (${data.registerNumber})</p>
            </div>
            <span class="badge ${badgeClass}">
              <i class="fa-solid ${statusIcon}"></i> ${data.status}
            </span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; background: rgba(0,0,0,0.3); padding: 12px 16px; border-radius: var(--radius-md);">
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
              <p style="font-size: 14px; color: #ffffff;">${data.rejectionReason || 'No specific reason provided.'}</p>
            </div>
          ` : ''}

          <div style="margin-top: 16px; font-size: 12px; color: var(--text-muted); text-align: right;">
            Submitted on: ${submittedDate}
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
