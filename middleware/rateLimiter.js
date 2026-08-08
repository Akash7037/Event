const rateLimit = require('express-rate-limit');

const isLocalhost = (req) => {
  const ip = req.ip || req.connection.remoteAddress || '';
  return process.env.NODE_ENV === 'test' || ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
};

// Dedicated Rate Limiter for Admin Login (Brute-force protection: 5 attempts / 15 min)
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isLocalhost(req),
  message: {
    success: false,
    message: 'Security Alert: Too many failed login attempts from this IP address. Please wait 15 minutes before trying again.'
  }
});

// Dedicated Rate Limiter for Student Registration (Spam bot protection: 5 submissions / hour)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 registration submissions per hour
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isLocalhost(req),
  message: {
    success: false,
    message: 'Security Alert: Registration limit reached for this IP address (max 5 per hour). Please try again later.'
  }
});

// Dedicated Rate Limiter for Status Lookup (Scraping protection: 30 requests / 15 min)
const statusCheckLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 status checks per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isLocalhost(req),
  message: {
    success: false,
    message: 'Too many status check requests from this IP address. Please wait a few minutes.'
  }
});

module.exports = {
  adminLoginLimiter,
  registerLimiter,
  statusCheckLimiter
};
