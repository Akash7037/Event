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

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'client')));

// Serve uploads statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/teams', require('./routes/teamRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

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
});
