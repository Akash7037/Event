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
  exportRegistrationsCsv,
  changeAdminPassword,
  updateAdminCredentials,
  verifyAuditoriumTicket,
  getRegistrationStatus,
  toggleRegistration
} = require('../controllers/adminController');

// Public route: Admin Login
router.post('/login', loginAdmin);
router.get('/registration-status', getRegistrationStatus);

// Private routes (JWT Required)
router.post('/toggle-registration', protectAdmin, toggleRegistration);
router.post('/verify-ticket', protectAdmin, verifyAuditoriumTicket);
router.put('/update-credentials', protectAdmin, updateAdminCredentials);
router.put('/change-password', protectAdmin, changeAdminPassword);
router.get('/stats', protectAdmin, getStats);
router.get('/teams', protectAdmin, getTeams);
router.get('/export-csv', protectAdmin, exportRegistrationsCsv);
router.get('/teams/:id', protectAdmin, getTeamById);
router.patch('/teams/:id/approve', protectAdmin, approveTeam);
router.patch('/teams/:id/reject', protectAdmin, rejectTeam);

module.exports = router;
