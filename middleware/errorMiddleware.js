const fs = require('fs');

const errorHandler = (err, req, res, next) => {
  // If files were uploaded before error occurred, clean them up
  if (req.files) {
    Object.keys(req.files).forEach(key => {
      req.files[key].forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlink(file.path, (unlinkErr) => {
            if (unlinkErr) console.error('Failed to cleanup file:', file.path);
          });
        }
      });
    });
  }

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  console.error('[Global Error]', err.stack || err.message);

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

module.exports = errorHandler;
