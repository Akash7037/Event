require('dotenv').config();
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '8.8.4.4']); } catch (e) {}
const mongoose = require('mongoose');

async function clearAllRegistrations() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 12000 });
  console.log('✅ Connected to MongoDB Atlas');

  const Team = require('./models/Team');
  const count = await Team.countDocuments();
  console.log(`Current registered teams count: ${count}`);

  if (count === 0) {
    console.log('No registered teams to delete. Database is already empty!');
    process.exit(0);
  }

  const fs = require('fs');
  const path = require('path');

  const result = await Team.deleteMany({});
  console.log(`🗑️ Successfully deleted ALL ${result.deletedCount} team registration(s) from MongoDB Atlas!`);

  // Clean up physical uploaded files in uploads/ppt and uploads/screenshots
  ['ppt', 'screenshots'].forEach(folder => {
    const dirPath = path.join(__dirname, 'uploads', folder);
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      files.forEach(file => {
        if (!file.startsWith('.gitkeep')) {
          try {
            fs.unlinkSync(path.join(dirPath, file));
            console.log(`🗑️ Deleted file: uploads/${folder}/${file}`);
          } catch (e) {
            console.warn(`Could not delete file ${file}:`, e.message);
          }
        }
      });
    }
  });

  console.log('✅ Database and uploaded files are now clean and ready for real competition registrations.');
  process.exit(0);
}

clearAllRegistrations().catch(err => {
  console.error('Error clearing data:', err.message);
  process.exit(1);
});
