const mongoose = require('mongoose');

let isMongoConnected = false;

const connectDB = async () => {
  const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pitch_competition';

  try {
    const conn = await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 2000
    });
    isMongoConnected = true;
    console.log(`[MongoDB] Connected to database: ${conn.connection.host}`);
  } catch (error) {
    isMongoConnected = false;
    console.warn(`[MongoDB Notice] Local MongoDB server on port 27017 is not running (${error.message}).`);
    console.log('[MongoDB Notice] Operating with fast in-memory store for zero-delay execution.');
  }
};

const getIsConnected = () => isMongoConnected;

module.exports = connectDB;
module.exports.getIsConnected = getIsConnected;
