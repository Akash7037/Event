const express = require('express');
const router = express.Router();
const uploadMiddleware = require('../middleware/uploadMiddleware');
const {
  registerTeam,
  getTeamStatus,
  downloadPptTemplate
} = require('../controllers/teamController');

const adminController = require('../controllers/adminController');

// Registration submission
router.post('/register', uploadMiddleware, registerTeam);

// Status check query
router.get('/status', getTeamStatus);

// PPT template download
router.get('/template', downloadPptTemplate);

// Public Registration status check
router.get('/registration-status', adminController.getRegistrationStatus);

module.exports = router;
