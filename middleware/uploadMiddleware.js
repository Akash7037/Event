const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

// Ensure upload directories exist
const pptDir = path.join(__dirname, '../uploads/ppt');
const screenshotDir = path.join(__dirname, '../uploads/screenshots');

if (!fs.existsSync(pptDir)) {
  fs.mkdirSync(pptDir, { recursive: true });
}
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

// Check and dynamically configure Cloudinary via environment variables
const ensureCloudinaryConfigured = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret
    });
    return true;
  }
  return false;
};

// Storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'pptFile') {
      cb(null, pptDir);
    } else if (file.fieldname === 'eurekaScreenshot') {
      cb(null, screenshotDir);
    } else {
      cb(new Error('Invalid field name for file upload'));
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (file.fieldname === 'pptFile') {
    const allowedExtensions = ['.ppt', '.pptx'];
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only .ppt and .pptx files are allowed for PPT upload!'), false);
    }
  } else if (file.fieldname === 'eurekaScreenshot') {
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.pdf'];
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only .png, .jpg, .jpeg, and .pdf files are allowed for Eureka Screenshot!'), false);
    }
  } else {
    cb(new Error('Unexpected file field'), false);
  }
};

// Multer upload instances
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit max for multer stream
  }
});

// Specific fields middleware
const uploadTeamFiles = upload.fields([
  { name: 'pptFile', maxCount: 1 },
  { name: 'eurekaScreenshot', maxCount: 1 }
]);

// Wrapper middleware to handle size limits per field cleanly + optional Cloudinary CDN upload
const uploadMiddleware = (req, res, next) => {
  uploadTeamFiles(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File size exceeds maximum limit (PPT: max 10MB, Screenshot: max 5MB).' });
      }
      return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    // Secondary file size verification per specific field
    if (req.files) {
      if (req.files.eurekaScreenshot && req.files.eurekaScreenshot[0].size > 5 * 1024 * 1024) {
        return res.status(400).json({ success: false, message: 'Eureka Screenshot exceeds 5MB size limit!' });
      }
      if (req.files.pptFile && req.files.pptFile[0].size > 10 * 1024 * 1024) {
        return res.status(400).json({ success: false, message: 'Presentation PPT file exceeds 10MB size limit!' });
      }

      // If Cloudinary credentials are set in environment variables, upload to Cloudinary CDN in parallel
      if (ensureCloudinaryConfigured()) {
        try {
          const uploadPromises = [];

          if (req.files.eurekaScreenshot && req.files.eurekaScreenshot[0]) {
            const file = req.files.eurekaScreenshot[0];
            uploadPromises.push(
              cloudinary.uploader.upload(file.path, {
                folder: 'pitch_competition/screenshots',
                resource_type: 'auto'
              }).then(result => {
                file.cloudinaryUrl = result.secure_url;
                fs.unlink(file.path, () => {});
              })
            );
          }

          if (req.files.pptFile && req.files.pptFile[0]) {
            const file = req.files.pptFile[0];
            uploadPromises.push(
              cloudinary.uploader.upload(file.path, {
                folder: 'pitch_competition/ppt',
                resource_type: 'raw' // 'raw' ensures .ppt/.pptx extension & binary structure are preserved
              }).then(result => {
                file.cloudinaryUrl = result.secure_url;
                fs.unlink(file.path, () => {});
              })
            );
          }

          await Promise.all(uploadPromises);
        } catch (cloudErr) {
          console.warn('[Cloudinary Warning] Cloud upload failed, using local disk copy:', cloudErr.message);
        }
      }
    }
    next();
  });
};

module.exports = uploadMiddleware;
