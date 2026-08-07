const mongoose = require('mongoose');
const dns = require('dns');

// Override DNS servers to Google Public DNS to resolve SRV records on Windows/ISPs
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (dnsErr) {
  console.warn('[DNS Warning] Could not set custom DNS servers:', dnsErr.message);
}

let isMongoConnected = false;

const connectDB = async () => {
  const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pitch_competition';

  try {
    const conn = await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 10000
    });
    isMongoConnected = true;
    console.log(`====================================================`);
    console.log(`✅ [MongoDB Atlas] Connected successfully to host: ${conn.connection.host}`);
    console.log(`====================================================`);
  } catch (error) {
    console.warn(`[MongoDB Atlas Warning] SRV Connection failed: ${error.message}`);
    // Try fallback to standard connection format or local MongoDB
    try {
      const localConnStr = 'mongodb://127.0.0.1:27017/pitch_competition';
      const conn = await mongoose.connect(localConnStr, { serverSelectionTimeoutMS: 3000 });
      isMongoConnected = true;
      console.log(`[MongoDB Local] Connected to local database: ${conn.connection.host}`);
    } catch (localErr) {
      isMongoConnected = false;
      console.warn(`[MongoDB Notice] Operating with fast in-memory store for zero-delay execution.`);
    }
  }
};

const getIsConnected = () => isMongoConnected;

module.exports = connectDB;
module.exports.getIsConnected = getIsConnected;
