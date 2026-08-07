const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorMiddleware');
const Admin = require('./models/Admin');

dotenv.config();

// Initialize Express app
const app = express();

// Connect MongoDB
connectDB();

// Auto seed default admin if none exists
const autoSeedAdmin = async () => {
  try {
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      await Admin.create({
        username: 'admin',
        email: 'admin@ecell.edu',
        password: 'admin123'
      });
      console.log('[AutoSeed] Default Admin account created (Username: admin | Email: admin@ecell.edu | Pass: admin123)');
    }
  } catch (err) {
    console.warn('[AutoSeed Warning] Could not auto-seed admin:', err.message);
  }
};
autoSeedAdmin();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files (with no-cache headers for instant updates)
app.use(express.static(path.join(__dirname, 'client'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html') || filePath.endsWith('.js') || filePath.endsWith('.css')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

// Serve uploads statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health Check & Render Keep-Alive Endpoints (Zero-delay startup)
app.get(['/api/health', '/api/ping'], (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime())
  });
});

// Routes
app.use('/api/teams', require('./routes/teamRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// API 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: `API endpoint ${req.originalUrl} not found.` });
});

// Serve HTML views
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'admin.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Startup Pitching Competition Server running on port ${PORT}`);
  console.log(`🌐 Student Portal: http://localhost:${PORT}`);
  console.log(`🔐 Admin Portal:   http://localhost:${PORT}/admin`);
  console.log(`====================================================`);

  // Render / Cloud Hosting Self-Ping Keep-Alive (runs every 10 mins to eliminate cold starts)
  const serverUrl = process.env.RENDER_EXTERNAL_URL || process.env.SERVER_URL;
  if (serverUrl) {
    setInterval(() => {
      try {
        const http = serverUrl.startsWith('https') ? require('https') : require('http');
        http.get(`${serverUrl}/api/ping`, (res) => {
          console.log(`[KeepAlive] Pinged ${serverUrl}/api/ping - Status: ${res.statusCode}`);
        }).on('error', (err) => console.warn('[KeepAlive Warning]', err.message));
      } catch (e) {
        // ignore
      }
    }, 10 * 60 * 1000);
  }
});
