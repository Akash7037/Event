const Team = require('../models/Team');
const path = require('path');
const fs = require('fs');
const { getIsConnected } = require('../config/db');

// In-Memory Fallback Storage
const inMemoryTeams = [];

// @desc    Register new startup team
// @route   POST /api/teams/register
// @access  Public
exports.registerTeam = async (req, res, next) => {
  try {
    const {
      teamName,
      leaderName,
      leaderRegNo,
      leaderDept,
      leaderYear,
      leaderEmail,
      leaderPhone,
      member2Name,
      member2RegNo,
      member2Dept,
      member2Year,
      member3Name,
      member3RegNo,
      member3Dept,
      member3Year,
      problemStatement,
      abstract,
      innovationDomain,
      declarationConfirmed
    } = req.body;

    // Basic Validation
    if (!declarationConfirmed || (declarationConfirmed !== 'true' && declarationConfirmed !== true)) {
      return res.status(400).json({ success: false, message: 'You must confirm that the submitted idea is original.' });
    }

    if (!teamName || !leaderName || !leaderRegNo || !leaderDept || !leaderYear || !leaderEmail || !leaderPhone || !problemStatement || !abstract || !innovationDomain) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
    }

    // Eligibility check
    if (!['2nd Year', '3rd Year'].includes(leaderYear)) {
      return res.status(400).json({ success: false, message: 'Only 2nd Year and 3rd Year students are eligible.' });
    }

    // Abstract Word Count Validation
    const wordCount = abstract.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount > 300) {
      return res.status(400).json({ success: false, message: `Abstract exceeds 300 words limit (Current: ${wordCount} words).` });
    }

    // File Upload Verification
    if (!req.files || !req.files.pptFile || !req.files.eurekaScreenshot) {
      return res.status(400).json({ success: false, message: 'Both PPT file and Eureka Registration Screenshot are required uploads.' });
    }

    const pptFilePath = '/uploads/ppt/' + req.files.pptFile[0].filename;
    const screenshotPath = '/uploads/screenshots/' + req.files.eurekaScreenshot[0].filename;
    const formattedLeaderRegNo = leaderRegNo.trim().toUpperCase();

    // Check duplicate leader register number
    if (getIsConnected()) {
      const existingTeam = await Team.findOne({ 'leader.registerNumber': formattedLeaderRegNo });
      if (existingTeam) {
        return res.status(400).json({ success: false, message: `A team with Leader Register Number (${formattedLeaderRegNo}) has already registered!` });
      }
    } else {
      const existingTeam = inMemoryTeams.find(t => t.leader.registerNumber === formattedLeaderRegNo);
      if (existingTeam) {
        return res.status(400).json({ success: false, message: `A team with Leader Register Number (${formattedLeaderRegNo}) has already registered!` });
      }
    }

    // Build members array
    const members = [];
    if (member2Name && member2Name.trim() !== '') {
      members.push({
        name: member2Name.trim(),
        registerNumber: member2RegNo ? member2RegNo.trim().toUpperCase() : '',
        department: member2Dept ? member2Dept.trim() : '',
        year: member2Year || ''
      });
    }
    if (member3Name && member3Name.trim() !== '') {
      members.push({
        name: member3Name.trim(),
        registerNumber: member3RegNo ? member3RegNo.trim().toUpperCase() : '',
        department: member3Dept ? member3Dept.trim() : '',
        year: member3Year || ''
      });
    }

    const teamData = {
      teamName: teamName.trim(),
      leader: {
        name: leaderName.trim(),
        registerNumber: formattedLeaderRegNo,
        department: leaderDept.trim(),
        year: leaderYear,
        email: leaderEmail.trim().toLowerCase(),
        phone: leaderPhone.trim()
      },
      members,
      problemStatement: problemStatement.trim(),
      abstract: abstract.trim(),
      innovationDomain: innovationDomain,
      pptFile: pptFilePath,
      eurekaScreenshot: screenshotPath,
      status: 'Pending Verification',
      rejectionReason: '',
      submittedAt: new Date()
    };

    let newTeam;
    if (getIsConnected()) {
      newTeam = await Team.create(teamData);
    } else {
      newTeam = {
        _id: 'mem_' + Date.now() + '_' + Math.round(Math.random() * 1000),
        ...teamData
      };
      inMemoryTeams.unshift(newTeam);
    }

    res.status(201).json({
      success: true,
      message: 'Registration submitted successfully! Your application status is Pending Verification.',
      data: {
        teamId: newTeam._id,
        teamName: newTeam.teamName,
        leaderName: newTeam.leader.name,
        leaderRegNo: newTeam.leader.registerNumber,
        status: newTeam.status,
        submittedAt: newTeam.submittedAt
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Check team submission status by Leader Email or Register Number
// @route   GET /api/teams/status
// @access  Public
exports.getTeamStatus = async (req, res, next) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === '') {
      return res.status(400).json({ success: false, message: 'Please enter Leader Email or Register Number to check status.' });
    }

    const searchQuery = query.trim();
    let team;

    if (getIsConnected()) {
      team = await Team.findOne({
        $or: [
          { 'leader.email': searchQuery.toLowerCase() },
          { 'leader.registerNumber': searchQuery.toUpperCase() }
        ]
      });
    } else {
      team = inMemoryTeams.find(t => 
        t.leader.email === searchQuery.toLowerCase() || 
        t.leader.registerNumber === searchQuery.toUpperCase()
      );
    }

    if (!team) {
      return res.status(404).json({ success: false, message: 'No registration found for the provided Email or Register Number.' });
    }

    res.status(200).json({
      success: true,
      data: {
        teamName: team.teamName,
        leaderName: team.leader.name,
        registerNumber: team.leader.registerNumber,
        department: team.leader.department,
        year: team.leader.year,
        innovationDomain: team.innovationDomain,
        status: team.status,
        rejectionReason: team.rejectionReason,
        submittedAt: team.submittedAt
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Download PPT Template
// @route   GET /api/teams/template
// @access  Public
exports.downloadPptTemplate = (req, res) => {
  const rootTemplatePath = path.join(__dirname, '../Template.pptx');
  const assetTemplatePath = path.join(__dirname, '../client/assets/Startup_Pitch_Template.pptx');

  if (fs.existsSync(rootTemplatePath)) {
    return res.download(rootTemplatePath, 'Template.pptx');
  } else if (fs.existsSync(assetTemplatePath)) {
    return res.download(assetTemplatePath, 'Template.pptx');
  } else {
    res.status(404).json({ success: false, message: 'PPT Template file not found.' });
  }
};

module.exports.inMemoryTeams = inMemoryTeams;
