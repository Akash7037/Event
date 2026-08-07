const Admin = require('../models/Admin');
const Team = require('../models/Team');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/sendEmail');
const { getIsConnected } = require('../config/db');
const { inMemoryTeams } = require('./teamController');

// In-Memory Admin Fallback Account (admin@ecell.edu / admin123)
const defaultAdminPassHash = bcrypt.hashSync('admin123', 10);
const inMemoryAdmins = [
  {
    _id: 'admin_root',
    username: 'admin',
    email: 'admin@ecell.edu',
    password: defaultAdminPassHash
  },
  {
    _id: 'admin_suba',
    username: 'Suba',
    email: 'suba@ecell.edu',
    password: defaultAdminPassHash
  }
];

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'ecell_pitch_comp_secret_key_2026_secure', {
    expiresIn: process.env.JWT_EXPIRE || '24h'
  });
};

// @desc    Admin Login
// @route   POST /api/admin/login
// @access  Public
exports.loginAdmin = async (req, res, next) => {
  try {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
      return res.status(400).json({ success: false, message: 'Please provide username/email and password.' });
    }

    const cleanInput = usernameOrEmail.trim().toLowerCase();

    let admin;
    if (getIsConnected()) {
      admin = await Admin.findOne({
        $or: [
          { email: cleanInput },
          { username: new RegExp('^' + usernameOrEmail.trim() + '$', 'i') }
        ]
      }).select('+password');
    } else {
      admin = inMemoryAdmins.find(a =>
        a.email.toLowerCase() === cleanInput ||
        a.username.toLowerCase() === cleanInput
      );

      // Fallback: If not explicitly found in memory array but password is 'admin123'
      if (!admin && password === 'admin123') {
        admin = {
          _id: 'admin_' + Date.now(),
          username: usernameOrEmail.trim(),
          email: cleanInput.includes('@') ? cleanInput : `${cleanInput}@ecell.edu`,
          password: defaultAdminPassHash
        };
        inMemoryAdmins.push(admin);
      }
    }

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials. Default credentials: Username: admin or Suba | Password: admin123' });
    }

    let isMatch = false;
    if (getIsConnected() && admin.matchPassword) {
      isMatch = await admin.matchPassword(password);
    } else {
      isMatch = await bcrypt.compare(password, admin.password);
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
    }

    const token = generateToken(admin._id);

    res.status(200).json({
      success: true,
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get Dashboard Statistics
// @route   GET /api/admin/stats
// @access  Private (Admin)
exports.getStats = async (req, res, next) => {
  try {
    let total = 0, pending = 0, approved = 0, rejected = 0;

    if (getIsConnected()) {
      total = await Team.countDocuments({});
      pending = await Team.countDocuments({ status: 'Pending Verification' });
      approved = await Team.countDocuments({ status: 'Approved' });
      rejected = await Team.countDocuments({ status: 'Rejected' });
    } else {
      total = inMemoryTeams.length;
      pending = inMemoryTeams.filter(t => t.status === 'Pending Verification').length;
      approved = inMemoryTeams.filter(t => t.status === 'Approved').length;
      rejected = inMemoryTeams.filter(t => t.status === 'Rejected').length;
    }

    res.status(200).json({
      success: true,
      data: { total, pending, approved, rejected }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get All Teams with Search & Filter
// @route   GET /api/admin/teams
// @access  Private (Admin)
exports.getTeams = async (req, res, next) => {
  try {
    const { search, department, year, status } = req.query;
    let teams = [];

    if (getIsConnected()) {
      let filter = {};
      if (status && status !== 'All') filter.status = status;
      if (department && department !== 'All') filter['leader.department'] = department;
      if (year && year !== 'All') filter['leader.year'] = year;
      if (search && search.trim() !== '') {
        const regex = new RegExp(search.trim(), 'i');
        filter.$or = [
          { teamName: regex },
          { 'leader.name': regex },
          { 'leader.registerNumber': regex },
          { 'leader.email': regex }
        ];
      }
      teams = await Team.find(filter).sort({ submittedAt: -1 });
    } else {
      teams = [...inMemoryTeams];
      if (status && status !== 'All') {
        teams = teams.filter(t => t.status === status);
      }
      if (department && department !== 'All') {
        teams = teams.filter(t => t.leader.department === department);
      }
      if (year && year !== 'All') {
        teams = teams.filter(t => t.leader.year === year);
      }
      if (search && search.trim() !== '') {
        const q = search.trim().toLowerCase();
        teams = teams.filter(t =>
          t.teamName.toLowerCase().includes(q) ||
          t.leader.name.toLowerCase().includes(q) ||
          t.leader.registerNumber.toLowerCase().includes(q) ||
          t.leader.email.toLowerCase().includes(q)
        );
      }
    }

    res.status(200).json({
      success: true,
      count: teams.length,
      data: teams
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Single Team Details
// @route   GET /api/admin/teams/:id
// @access  Private (Admin)
exports.getTeamById = async (req, res, next) => {
  try {
    let team;
    if (getIsConnected()) {
      team = await Team.findById(req.params.id);
    } else {
      team = inMemoryTeams.find(t => t._id.toString() === req.params.id);
    }

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team registration not found.' });
    }

    res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve Team
// @route   PATCH /api/admin/teams/:id/approve
// @access  Private (Admin)
exports.approveTeam = async (req, res, next) => {
  try {
    let team;
    if (getIsConnected()) {
      team = await Team.findById(req.params.id);
    } else {
      team = inMemoryTeams.find(t => t._id.toString() === req.params.id);
    }

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team registration not found.' });
    }

    team.status = 'Approved';
    team.rejectionReason = '';

    if (getIsConnected()) {
      await team.save();
    }

    const qrPayload = {
      ticketId: team._id,
      registerNumber: team.leader ? team.leader.registerNumber : '',
      teamName: team.teamName
    };

    // Asynchronously send Approval Email Notification with Embedded High-Res Inline QR Pass (Non-blocking)
    if (team.leader && team.leader.email) {
      sendEmail({
        email: team.leader.email,
        subject: `🎉 Registration Approved! Auditorium Entry QR Pass - ${team.teamName}`,
        message: `Congratulations ${team.leader ? team.leader.name : 'Team Leader'}!\n\nYour team "${team.teamName}" (${team.startupName || team.teamName}) has been officially APPROVED for the Intra-College Startup Pitching Competition 2026.\n\nYour official Auditorium Entry QR Pass is attached below. Present this QR Code at the auditorium entrance scanner for instant check-in.`,
        qrData: qrPayload
      }).then(res => {
        console.log(`[Approval Email] Sent to ${team.leader.email}:`, res.success);
      }).catch(err => {
        console.error(`[Approval Email Error] ${team.leader.email}:`, err.message);
      });
    }

    // Instant HTTP response back to Admin UI
    res.status(200).json({
      success: true,
      message: `Team "${team.teamName}" approved! Entry QR Pass emailed to ${team.leader ? team.leader.email : 'leader'}.`,
      data: team
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Reject Team
// @route   PATCH /api/admin/teams/:id/reject
// @access  Private (Admin)
exports.rejectTeam = async (req, res, next) => {
  try {
    const { reason } = req.body;

    if (!reason || reason.trim() === '') {
      return res.status(400).json({ success: false, message: 'Rejection reason is required.' });
    }

    let team;
    if (getIsConnected()) {
      team = await Team.findById(req.params.id);
    } else {
      team = inMemoryTeams.find(t => t._id.toString() === req.params.id);
    }

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team registration not found.' });
    }

    team.status = 'Rejected';
    team.rejectionReason = reason.trim();

    if (getIsConnected()) {
      await team.save();
    }

    // Asynchronously send Rejection Email Notification (Non-blocking)
    if (team.leader && team.leader.email) {
      sendEmail({
        email: team.leader.email,
        subject: 'Registration Update - Startup Pitching Competition',
        message: `Hello ${team.leader.name},\n\nYour registration for team "${team.teamName}" in the Startup Pitching Competition has been rejected.\n\nReason:\n${reason.trim()}\n\nIf you have any questions, please contact the E-Cell team.`
      }).then(res => {
        console.log(`[Rejection Email] Sent to ${team.leader.email}:`, res.success);
      }).catch(err => {
        console.error(`[Rejection Email Error] ${team.leader.email}:`, err.message);
      });
    }

    // Instant HTTP response back to Admin UI
    res.status(200).json({
      success: true,
      message: `Team "${team.teamName}" rejected. Notification emailed to leader.`,
      data: team
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Export All Registrations to CSV
// @route   GET /api/admin/export-csv
// @access  Private (Admin)
exports.exportRegistrationsCsv = async (req, res, next) => {
  try {
    let teams = [];
    if (getIsConnected()) {
      teams = await Team.find({}).sort({ submittedAt: -1 });
    } else {
      teams = [...inMemoryTeams];
    }

    const headers = [
      'Team Name',
      'Startup Name (Project Name)',
      'Leader Name',
      'Leader Register No',
      'Leader Department',
      'Leader Year',
      'Leader Email',
      'Leader Phone',
      'Member 2 Name',
      'Member 2 Reg No',
      'Member 2 Department',
      'Member 2 Year',
      'Member 3 Name',
      'Member 3 Reg No',
      'Member 3 Department',
      'Member 3 Year',
      'Innovation Domain',
      'Problem Statement',
      'Abstract',
      'Status',
      'Rejection Reason',
      'Submission Date',
      'PPT File Path',
      'Eureka Screenshot Path'
    ];

    const escapeCsv = (str) => {
      if (!str) return '""';
      const cleanStr = String(str).replace(/"/g, '""');
      return `"${cleanStr}"`;
    };

    let csvContent = headers.join(',') + '\n';

    teams.forEach(t => {
      const m2 = t.members && t.members[0] ? t.members[0] : {};
      const m3 = t.members && t.members[1] ? t.members[1] : {};

      const row = [
        escapeCsv(t.teamName),
        escapeCsv(t.startupName || t.teamName),
        escapeCsv(t.leader ? t.leader.name : ''),
        escapeCsv(t.leader ? t.leader.registerNumber : ''),
        escapeCsv(t.leader ? t.leader.department : ''),
        escapeCsv(t.leader ? t.leader.year : ''),
        escapeCsv(t.leader ? t.leader.email : ''),
        escapeCsv(t.leader ? t.leader.phone : ''),
        escapeCsv(m2.name || ''),
        escapeCsv(m2.registerNumber || ''),
        escapeCsv(m2.department || ''),
        escapeCsv(m2.year || ''),
        escapeCsv(m3.name || ''),
        escapeCsv(m3.registerNumber || ''),
        escapeCsv(m3.department || ''),
        escapeCsv(m3.year || ''),
        escapeCsv(t.innovationDomain),
        escapeCsv(t.problemStatement),
        escapeCsv(t.abstract),
        escapeCsv(t.status),
        escapeCsv(t.rejectionReason || ''),
        escapeCsv(new Date(t.submittedAt).toISOString()),
        escapeCsv(t.pptFile),
        escapeCsv(t.eurekaScreenshot)
      ];
      csvContent += row.join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="E-Cell_Startup_Registrations_2026.csv"');
    res.status(200).send(csvContent);

  } catch (error) {
    next(error);
  }
};

// @desc    Change Admin Password
exports.changeAdminPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.admin ? req.admin._id : null;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current password and new password.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long.' });
    }

    if (getIsConnected()) {
      const admin = await Admin.findById(adminId).select('+password');
      if (!admin) {
        return res.status(404).json({ success: false, message: 'Admin account not found.' });
      }

      const isMatch = await admin.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
      }

      admin.password = newPassword;
      await admin.save();
    } else {
      const admin = inMemoryAdmins.find(a => a._id === adminId || a._id === 'admin_root');
      if (!admin) {
        return res.status(404).json({ success: false, message: 'Admin account not found.' });
      }

      const isMatch = await bcrypt.compare(currentPassword, admin.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
      }

      admin.password = await bcrypt.hash(newPassword, 10);
    }

    res.status(200).json({
      success: true,
      message: 'Admin password updated successfully!'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Admin Login Credentials (Username, Email, Password)
// @route   PUT /api/admin/update-credentials
// @access  Private (Admin)
exports.updateAdminCredentials = async (req, res, next) => {
  try {
    const { currentPassword, username, email, newPassword } = req.body;
    const adminId = req.admin ? (req.admin._id || req.admin.id) : null;

    if (!currentPassword || !username || !email) {
      return res.status(400).json({ success: false, message: 'Current password, username, and email are required.' });
    }

    if (newPassword && newPassword.trim() !== '' && newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long.' });
    }

    let updatedAdmin = null;

    if (getIsConnected()) {
      const admin = await Admin.findById(adminId).select('+password');
      if (!admin) {
        return res.status(404).json({ success: false, message: 'Admin account not found.' });
      }

      const isMatch = await admin.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
      }

      const existing = await Admin.findOne({
        _id: { $ne: adminId },
        $or: [
          { username: username.trim() },
          { email: email.toLowerCase().trim() }
        ]
      });

      if (existing) {
        return res.status(400).json({ success: false, message: 'Username or Email is already in use by another admin.' });
      }

      admin.username = username.trim();
      admin.email = email.toLowerCase().trim();
      if (newPassword && newPassword.trim() !== '') {
        admin.password = newPassword;
      }
      await admin.save();
      updatedAdmin = admin;
    } else {
      const admin = inMemoryAdmins.find(a => a._id === adminId) || inMemoryAdmins[0];
      if (!admin) {
        return res.status(404).json({ success: false, message: 'Admin account not found.' });
      }

      const isMatch = await bcrypt.compare(currentPassword, admin.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
      }

      admin.username = username.trim();
      admin.email = email.toLowerCase().trim();
      if (newPassword && newPassword.trim() !== '') {
        admin.password = await bcrypt.hash(newPassword, 10);
      }
      updatedAdmin = admin;
    }

    const token = generateToken(updatedAdmin._id);

    res.status(200).json({
      success: true,
      message: 'Admin login credentials updated successfully!',
      token,
      admin: {
        id: updatedAdmin._id,
        username: updatedAdmin.username,
        email: updatedAdmin.email
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Verify QR Code Ticket for Auditorium Entry
// @route   POST /api/admin/verify-ticket
// @access  Private (Admin)
exports.verifyAuditoriumTicket = async (req, res, next) => {
  try {
    const { ticketId, registerNumber } = req.body;

    if (!ticketId && !registerNumber) {
      return res.status(400).json({ success: false, message: 'Ticket ID or Leader Register Number is required' });
    }

    let team = null;

    if (getIsConnected()) {
      if (ticketId) {
        team = await Team.findById(ticketId);
      }
      if (!team && registerNumber) {
        team = await Team.findOne({ 'leader.registerNumber': registerNumber.trim().toUpperCase() });
      }
    } else {
      if (ticketId) {
        team = inMemoryTeams.find(t => t._id === ticketId || t.id === ticketId);
      }
      if (!team && registerNumber) {
        team = inMemoryTeams.find(t => t.leader && t.leader.registerNumber === registerNumber.trim().toUpperCase());
      }
    }

    if (!team) {
      return res.status(404).json({ success: false, message: 'Invalid QR Ticket. No team registration found.' });
    }

    if (team.status !== 'Approved') {
      return res.status(400).json({
        success: false,
        status: team.status,
        message: `Entry Denied: Registration status is '${team.status}'. Only Approved teams are allowed entry.`,
        data: {
          teamName: team.teamName,
          startupName: team.startupName || team.teamName,
          leaderName: team.leader.name,
          status: team.status
        }
      });
    }

    if (team.checkedIn) {
      return res.status(400).json({
        success: false,
        isAlreadyCheckedIn: true,
        checkedInAt: team.checkedInAt,
        message: `DUPLICATE TICKET WARNING! Pass was already scanned and checked in at ${new Date(team.checkedInAt).toLocaleTimeString()}`,
        data: {
          teamName: team.teamName,
          startupName: team.startupName || team.teamName,
          leaderName: team.leader.name,
          totalMembers: 1 + (team.members ? team.members.length : 0),
          checkedInAt: team.checkedInAt
        }
      });
    }

    team.checkedIn = true;
    team.checkedInAt = new Date();

    if (getIsConnected()) {
      await team.save();
    }

    return res.status(200).json({
      success: true,
      message: 'ENTRY APPROVED! Welcome to the Auditorium.',
      data: {
        id: team._id,
        teamName: team.teamName,
        startupName: team.startupName || team.teamName,
        leaderName: team.leader.name,
        registerNumber: team.leader.registerNumber,
        department: team.leader.department,
        totalMembers: 1 + (team.members ? team.members.length : 0),
        checkedInAt: team.checkedInAt
      }
    });

  } catch (error) {
    next(error);
  }
};

// Global Registration Status State
let isRegistrationOpen = true;

exports.getIsRegistrationOpen = () => isRegistrationOpen;

exports.getRegistrationStatus = (req, res) => {
  res.status(200).json({ success: true, isOpen: isRegistrationOpen });
};

exports.toggleRegistration = (req, res) => {
  const { isOpen } = req.body;
  if (typeof isOpen === 'boolean') {
    isRegistrationOpen = isOpen;
  } else {
    isRegistrationOpen = !isRegistrationOpen;
  }
  res.status(200).json({
    success: true,
    isOpen: isRegistrationOpen,
    message: isRegistrationOpen ? 'Registration is now OPEN.' : 'Registration is now CLOSED.'
  });
};

// @desc    Manually dispatch backup email for a team to for12345freelancing@gmail.com
// @route   POST /api/admin/teams/:id/send-backup
// @access  Private (Admin)
exports.sendBackupEmailForTeam = async (req, res, next) => {
  try {
    let team;
    if (getIsConnected()) {
      team = await Team.findById(req.params.id);
    } else {
      const { inMemoryTeams } = require('./teamController');
      team = inMemoryTeams ? inMemoryTeams.find(t => t._id === req.params.id) : null;
    }

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team registration not found.' });
    }

    const { sendBackupEmail } = require('../utils/sendEmail');
    const result = await sendBackupEmail(team);

    res.status(200).json({
      success: true,
      message: `Backup email containing PPT and Screenshot dispatched to for12345freelancing@gmail.com for team "${team.teamName}"!`,
      result
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Bulk dispatch backup emails (PPT + Screenshot) for ALL teams to for12345freelancing@gmail.com
// @route   POST /api/admin/send-all-backups
// @access  Private (Admin)
exports.sendAllBackupEmails = async (req, res, next) => {
  try {
    const { sendBackupEmail } = require('../utils/sendEmail');
    let teams = [];

    if (getIsConnected()) {
      teams = await Team.find({}).sort({ submittedAt: -1 });
    } else {
      const { inMemoryTeams } = require('./teamController');
      teams = inMemoryTeams ? [...inMemoryTeams] : [];
    }

    if (teams.length === 0) {
      return res.status(200).json({ success: true, message: 'No team registrations found to send backup emails for.' });
    }

    res.status(200).json({
      success: true,
      message: `Started dispatching backup emails for ${teams.length} team(s) to for12345freelancing@gmail.com. Check server logs for progress.`,
      count: teams.length
    });

    // Asynchronously dispatch backup email for each team
    for (const team of teams) {
      try {
        const result = await sendBackupEmail(team);
        console.log(`[Bulk Backup] Team "${team.teamName}": ${result.success ? 'SENT ✅' : 'FAILED ❌ ' + (result.error || 'unknown error')}`);
      } catch (emailErr) {
        console.warn(`[Bulk Backup] Team "${team.teamName}" error:`, emailErr.message);
      }
    }
    console.log(`[Bulk Backup] Completed dispatching backup emails for ${teams.length} team(s).`);

  } catch (error) {
    if (!res.headersSent) {
      next(error);
    }
  }
};


