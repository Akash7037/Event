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
  toggleRegistration,
  sendBackupEmailForTeam,
  sendAllBackupEmails,
  deleteTeam,
  clearAllTeams
} = require('../controllers/adminController');

const { handleSseConnection } = require('../utils/sseHub');
const { adminLoginLimiter } = require('../middleware/rateLimiter');

// Public route: Admin Login & Public Status
router.post('/login', adminLoginLimiter, loginAdmin);
router.get('/registration-status', getRegistrationStatus);

// Real-Time Server-Sent Events (SSE) Stream
router.get('/events', handleSseConnection);

// Private routes (JWT Required)
router.post('/toggle-registration', protectAdmin, toggleRegistration);
router.post('/verify-ticket', protectAdmin, verifyAuditoriumTicket);
router.post('/teams/:id/send-backup', protectAdmin, sendBackupEmailForTeam);
router.post('/send-all-backups', protectAdmin, sendAllBackupEmails);
router.delete('/clear-all-teams', protectAdmin, clearAllTeams);
router.delete('/teams/:id', protectAdmin, deleteTeam);
router.put('/update-credentials', protectAdmin, updateAdminCredentials);
router.put('/change-password', protectAdmin, changeAdminPassword);
router.get('/stats', protectAdmin, getStats);
router.get('/teams', protectAdmin, getTeams);
router.get('/export-csv', protectAdmin, exportRegistrationsCsv);
router.get('/teams/:id', protectAdmin, getTeamById);
router.patch('/teams/:id/approve', protectAdmin, approveTeam);
router.patch('/teams/:id/reject', protectAdmin, rejectTeam);

module.exports = router;
