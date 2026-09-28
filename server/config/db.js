const mongoose = require('mongoose');

let isMongoConnected = false;

const connectDB = async () => {
  const connString = process.env.MONGO_URI;
  if (!connString || connString.includes('username:password')) {
    console.log('⚠️ MONGO_URI not provided or using default placeholder. Running in-memory database mode for zero-setup local testing.');
    isMongoConnected = false;
    return false;
  }

  try {
    const conn = await mongoose.connect(connString, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
    isMongoConnected = true;
    return true;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.log('⚠️ Falling back to resilient in-memory database store for continuous operation.');
    isMongoConnected = false;
    return false;
  }
};

const getIsConnected = () => isMongoConnected;

module.exports = { connectDB, getIsConnected };
