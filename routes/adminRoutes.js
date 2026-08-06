const express = require('express');
const router = express.Router();
const { protectAdmin } = require('../middleware/authMiddleware');
const {
  loginAdmin,
  getStats,
  getTeams,
  getTeamById,
  approveTeam,
  rejectTeam,
  exportRegistrationsCsv
} = require('../controllers/adminController');

// Public route: Admin Login
router.post('/login', loginAdmin);

// Private routes (JWT Required)
router.get('/stats', protectAdmin, getStats);
router.get('/teams', protectAdmin, getTeams);
router.get('/export-csv', protectAdmin, exportRegistrationsCsv);
router.get('/teams/:id', protectAdmin, getTeamById);
router.patch('/teams/:id/approve', protectAdmin, approveTeam);
router.patch('/teams/:id/reject', protectAdmin, rejectTeam);

module.exports = router;
