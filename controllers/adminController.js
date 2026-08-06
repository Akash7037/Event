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

    let admin;
    if (getIsConnected()) {
      admin = await Admin.findOne({
        $or: [
          { email: usernameOrEmail.toLowerCase().trim() },
          { username: usernameOrEmail.trim() }
        ]
      }).select('+password');
    } else {
      admin = inMemoryAdmins.find(a => 
        a.email === usernameOrEmail.toLowerCase().trim() || 
        a.username === usernameOrEmail.trim()
      );
    }

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
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

    // Send Approval Email Notification
    const emailResult = await sendEmail({
      email: team.leader.email,
      subject: 'Registration Approved',
      message: `Congratulations.\n\nYour team "${team.teamName}" has been approved for Startup Pitching Competition.`
    });

    res.status(200).json({
      success: true,
      message: `Team "${team.teamName}" has been approved successfully. Email notification dispatched.`,
      emailStatus: emailResult.success ? 'Sent' : 'Failed',
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

    // Send Rejection Email Notification
    const emailResult = await sendEmail({
      email: team.leader.email,
      subject: 'Registration Update - Startup Pitching Competition',
      message: `Hello ${team.leader.name},\n\nYour registration for team "${team.teamName}" in the Startup Pitching Competition has been rejected.\n\nReason:\n${reason.trim()}\n\nIf you have any questions, please contact the E-Cell team.`
    });

    res.status(200).json({
      success: true,
      message: `Team "${team.teamName}" has been rejected. Email notification dispatched with reason.`,
      emailStatus: emailResult.success ? 'Sent' : 'Failed',
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
