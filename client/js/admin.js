/* ==========================================================================
   Admin Portal Client JavaScript - Startup Pitching Competition 2026
   ========================================================================== */

let currentAdminToken = localStorage.getItem('adminToken') || '';
let selectedTeamForAction = null;

// Helper: Toast Notifications
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

// Check Authentication Status on Page Load
document.addEventListener('DOMContentLoaded', () => {
  if (currentAdminToken) {
    showDashboardView();
  } else {
    showLoginView();
  }
});

function showLoginView() {
  document.getElementById('admin-login-view').style.display = 'block';
  document.getElementById('admin-dashboard-view').style.display = 'none';
  document.getElementById('admin-nav-actions').style.display = 'none';
}

function showDashboardView() {
  document.getElementById('admin-login-view').style.display = 'none';
  document.getElementById('admin-dashboard-view').style.display = 'block';
  document.getElementById('admin-nav-actions').style.display = 'flex';
  
  const savedAdminUser = localStorage.getItem('adminUser') || 'Admin';
  document.getElementById('admin-user-display').innerHTML = `<i class="fa-solid fa-user-shield"></i> ${savedAdminUser}`;

  loadAdminStats();
  loadTeamsData();
}

// Handle Admin Login
async function handleAdminLogin(event) {
  event.preventDefault();

  const usernameOrEmail = document.getElementById('adminUsername').value.trim();
  const password = document.getElementById('adminPassword').value;
  const submitBtn = document.getElementById('login-submit-btn');

  if (!usernameOrEmail || !password) {
    showToast('Please enter username/email and password', 'warning');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...`;

  try {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail, password })
    });

    const result = await response.json();

    if (result.success) {
      currentAdminToken = result.token;
      localStorage.setItem('adminToken', result.token);
      localStorage.setItem('adminUser', result.admin.username);
      showToast('Admin authenticated successfully!', 'success');
      showDashboardView();
    } else {
      showToast(result.message || 'Invalid admin credentials', 'error');
    }
  } catch (error) {
    console.error('Login error:', error);
    showToast('Network error during login authentication', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<i class="fa-solid fa-arrow-right-to-bracket"></i> Login to Dashboard`;
  }
}

// Handle Admin Logout
function handleAdminLogout() {
  currentAdminToken = '';
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
  showToast('Logged out of Admin Portal', 'info');
  showLoginView();
}

// Fetch Admin Dashboard Statistics
async function loadAdminStats() {
  try {
    const response = await fetch('/api/admin/stats', {
      headers: { 'Authorization': `Bearer ${currentAdminToken}` }
    });

    if (response.status === 401) {
      handleAdminLogout();
      return;
    }

    const result = await response.json();
    if (result.success) {
      document.getElementById('stat-total').textContent = result.data.total;
      document.getElementById('stat-pending').textContent = result.data.pending;
      document.getElementById('stat-approved').textContent = result.data.approved;
      document.getElementById('stat-rejected').textContent = result.data.rejected;
    }
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
}

// Fetch Teams Data with Search and Filters
async function loadTeamsData() {
  const search = document.getElementById('filter-search').value.trim();
  const status = document.getElementById('filter-status').value;
  const department = document.getElementById('filter-dept').value;
  const year = document.getElementById('filter-year').value;
  const tbody = document.getElementById('teams-table-body');
  const countLabel = document.getElementById('teams-count-label');

  const queryParams = new URLSearchParams({
    search,
    status,
    department,
    year
  });

  try {
    const response = await fetch(`/api/admin/teams?${queryParams.toString()}`, {
      headers: { 'Authorization': `Bearer ${currentAdminToken}` }
    });

    if (response.status === 401) {
      handleAdminLogout();
      return;
    }

    const result = await response.json();

    if (result.success) {
      countLabel.textContent = `Showing ${result.count} team registrations`;
      if (result.data.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 40px;">
              No team registrations found matching current filters.
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = result.data.map(team => {
        let badgeClass = 'badge-pending';
        let statusIcon = 'fa-clock';
        if (team.status === 'Approved') {
          badgeClass = 'badge-approved';
          statusIcon = 'fa-circle-check';
        } else if (team.status === 'Rejected') {
          badgeClass = 'badge-rejected';
          statusIcon = 'fa-circle-xmark';
        }

        const dateStr = new Date(team.submittedAt).toLocaleDateString(undefined, {
          month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        return `
          <tr>
            <td style="font-weight: 700; color: #ffffff;">${team.teamName}</td>
            <td>
              <div style="font-weight: 600;">${team.leader.name}</div>
              <div style="font-size: 12px; color: var(--text-muted);">${team.leader.registerNumber} • ${team.leader.phone}</div>
            </td>
            <td>${team.leader.department}<br><span style="font-size: 12px; color: var(--accent-cyan);">${team.leader.year}</span></td>
            <td><span style="color: var(--accent-cyan); font-weight: 600;">${team.innovationDomain}</span></td>
            <td style="font-size: 13px; color: var(--text-secondary);">${dateStr}</td>
            <td>
              <span class="badge ${badgeClass}">
                <i class="fa-solid ${statusIcon}"></i> ${team.status}
              </span>
            </td>
            <td>
              <button class="btn-secondary" style="padding: 6px 14px; font-size: 13px;" onclick="openTeamDetailsModal('${team._id}')">
                <i class="fa-solid fa-eye"></i> View Details
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }
  } catch (error) {
    console.error('Failed to load teams:', error);
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--accent-rose); padding: 20px;">
          Error loading teams dataset.
        </td>
      </tr>
    `;
  }
}

// Open Team Details Modal
async function openTeamDetailsModal(teamId) {
  try {
    const response = await fetch(`/api/admin/teams/${teamId}`, {
      headers: { 'Authorization': `Bearer ${currentAdminToken}` }
    });

    const result = await response.json();
    if (!result.success) {
      showToast('Could not fetch team details', 'error');
      return;
    }

    const team = result.data;
    selectedTeamForAction = team;

    document.getElementById('modal-team-title').textContent = `Verification: ${team.teamName}`;

    let membersHtml = '';
    if (team.members && team.members.length > 0) {
      membersHtml = team.members.map((m, idx) => `
        <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: var(--radius-md); margin-top: 8px;">
          <div style="font-weight: 600; color: var(--accent-cyan);">Member ${idx + 2}: ${m.name}</div>
          <div style="font-size: 13px; color: var(--text-secondary);">
            Reg No: ${m.registerNumber || 'N/A'} | Dept: ${m.department || 'N/A'} | Year: ${m.year || 'N/A'}
          </div>
        </div>
      `).join('');
    } else {
      membersHtml = `<div style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">Single member team (Leader only).</div>`;
    }

    const modalContent = document.getElementById('modal-team-content');
    modalContent.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 20px;">
        
        <!-- Leader Info -->
        <div style="background: rgba(0,0,0,0.3); padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
          <h4 style="color: var(--accent-cyan); margin-bottom: 10px;"><i class="fa-solid fa-user-astronaut"></i> Leader Details</h4>
          <div style="font-size: 14px; margin-bottom: 4px;"><strong>Name:</strong> ${team.leader.name}</div>
          <div style="font-size: 14px; margin-bottom: 4px;"><strong>Register No:</strong> ${team.leader.registerNumber}</div>
          <div style="font-size: 14px; margin-bottom: 4px;"><strong>Department:</strong> ${team.leader.department}</div>
          <div style="font-size: 14px; margin-bottom: 4px;"><strong>Year:</strong> ${team.leader.year}</div>
          <div style="font-size: 14px; margin-bottom: 4px;"><strong>Email:</strong> ${team.leader.email}</div>
          <div style="font-size: 14px;"><strong>Phone:</strong> ${team.leader.phone}</div>
        </div>

        <!-- Team Members -->
        <div style="background: rgba(0,0,0,0.3); padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
          <h4 style="color: var(--accent-cyan); margin-bottom: 10px;"><i class="fa-solid fa-users"></i> Team Members</h4>
          ${membersHtml}
        </div>

      </div>

      <!-- Domain & Pitch Details -->
      <div style="margin-bottom: 20px;">
        <h4 style="color: var(--text-primary); margin-bottom: 6px;">Innovation Domain: <span style="color: var(--accent-cyan);">${team.innovationDomain}</span></h4>
        <div style="margin-bottom: 14px;">
          <h5 style="color: var(--text-secondary); margin-bottom: 4px;">Problem Statement:</h5>
          <p style="font-size: 14px; background: rgba(255,255,255,0.02); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">${team.problemStatement}</p>
        </div>
        <div style="margin-bottom: 14px;">
          <h5 style="color: var(--text-secondary); margin-bottom: 4px;">Abstract (Max 300 words):</h5>
          <p style="font-size: 14px; background: rgba(255,255,255,0.02); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-color); line-height: 1.6;">${team.abstract}</p>
        </div>
      </div>

      <!-- Files Inspection & Verification Area -->
      <div style="background: rgba(6, 182, 212, 0.05); border: 1px solid rgba(6, 182, 212, 0.3); padding: 20px; border-radius: var(--radius-md); margin-bottom: 16px;">
        <h4 style="color: var(--accent-cyan); margin-bottom: 12px;"><i class="fa-solid fa-folder-open"></i> Submissions & Eureka Verification</h4>
        <div style="display: flex; gap: 16px; flex-wrap: wrap;">
          <a href="${team.pptFile}" target="_blank" download class="btn-secondary" style="text-decoration: none;">
            <i class="fa-solid fa-file-powerpoint" style="color: var(--accent-amber);"></i> Download Presentation PPT
          </a>
          <a href="${team.eurekaScreenshot}" target="_blank" class="btn-secondary" style="text-decoration: none; border-color: var(--accent-cyan);">
            <i class="fa-solid fa-image" style="color: var(--accent-cyan);"></i> View Eureka Screenshot Proof
          </a>
        </div>
        <p style="font-size: 12px; color: var(--text-muted); margin-top: 10px;">
          <i class="fa-solid fa-circle-info"></i> Verify that the Eureka registration screenshot clearly contains NEC ID <strong>NEC2621509</strong> before approving.
        </p>
      </div>

      ${team.status === 'Rejected' && team.rejectionReason ? `
        <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 14px; border-radius: var(--radius-md);">
          <div style="font-weight: 700; color: var(--accent-rose); font-size: 13px;">Current Rejection Reason:</div>
          <p style="font-size: 14px;">${team.rejectionReason}</p>
        </div>
      ` : ''}
    `;

    document.getElementById('team-details-modal').classList.add('active');

  } catch (error) {
    console.error('Modal error:', error);
    showToast('Failed to open team details', 'error');
  }
}

function closeTeamDetailsModal() {
  document.getElementById('team-details-modal').classList.remove('active');
  selectedTeamForAction = null;
}

// Approve Team Handler
async function handleApproveTeam() {
  if (!selectedTeamForAction) return;

  const teamId = selectedTeamForAction._id;
  const approveBtn = document.getElementById('modal-approve-btn');

  approveBtn.disabled = true;
  approveBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Approving...`;

  try {
    const response = await fetch(`/api/admin/teams/${teamId}/approve`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${currentAdminToken}` }
    });

    const result = await response.json();

    if (result.success) {
      showToast(`Team "${selectedTeamForAction.teamName}" Approved! Approval email dispatched.`, 'success');
      closeTeamDetailsModal();
      loadAdminStats();
      loadTeamsData();
    } else {
      showToast(result.message || 'Failed to approve team', 'error');
    }
  } catch (error) {
    console.error('Approve error:', error);
    showToast('Network error while approving team', 'error');
  } finally {
    approveBtn.disabled = false;
    approveBtn.innerHTML = `<i class="fa-solid fa-check"></i> Approve Team`;
  }
}

// Rejection Modal Handlers
function openRejectReasonModal() {
  document.getElementById('reject-reason-modal').classList.add('active');
}

function closeRejectReasonModal() {
  document.getElementById('reject-reason-modal').classList.remove('active');
  document.getElementById('rejection-reason-text').value = '';
}

async function confirmRejectTeam() {
  if (!selectedTeamForAction) return;

  const reason = document.getElementById('rejection-reason-text').value.trim();
  if (!reason) {
    showToast('Please provide a reason for rejecting the application.', 'warning');
    return;
  }

  const teamId = selectedTeamForAction._id;

  try {
    const response = await fetch(`/api/admin/teams/${teamId}/reject`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${currentAdminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason })
    });

    const result = await response.json();

    if (result.success) {
      showToast(`Team "${selectedTeamForAction.teamName}" Rejected. Rejection email sent.`, 'info');
      closeRejectReasonModal();
      closeTeamDetailsModal();
      loadAdminStats();
      loadTeamsData();
    } else {
      showToast(result.message || 'Failed to reject team', 'error');
    }
  } catch (error) {
    console.error('Reject error:', error);
    showToast('Network error while rejecting team', 'error');
  }
}

// Export CSV Data Handler
async function exportRegistrationsCsv() {
  if (!currentAdminToken) {
    showToast('Admin authorization required', 'error');
    return;
  }

  showToast('Preparing CSV export...', 'info');

  try {
    const response = await fetch('/api/admin/export-csv', {
      headers: { 'Authorization': `Bearer ${currentAdminToken}` }
    });

    if (!response.ok) {
      showToast('Failed to download CSV data', 'error');
      return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'E-Cell_Startup_Registrations_2026.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    showToast('Registrations exported to CSV successfully!', 'success');
  } catch (error) {
    console.error('Export error:', error);
    showToast('Network error during CSV export', 'error');
  }
}
