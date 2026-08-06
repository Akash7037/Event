const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { getIsConnected } = require('../config/db');

const protectAdmin = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ecell_pitch_comp_secret_key_2026_secure');
      
      if (getIsConnected()) {
        req.admin = await Admin.findById(decoded.id).select('-password');
      } else {
        if (decoded.id === 'admin_root') {
          req.admin = { id: 'admin_root', username: 'admin', email: 'admin@ecell.edu' };
        }
      }
      
      if (!req.admin) {
        return res.status(401).json({ success: false, message: 'Admin account not found' });
      }
      return next();
    } catch (error) {
      console.error('[Auth Error]', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token invalid or expired' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

module.exports = { protectAdmin };
