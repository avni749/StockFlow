const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri || uri.includes('<username>')) {
      console.warn('MongoDB URI is not configured correctly in .env.');
      return false;
    }
    
    await mongoose.connect(uri);
    console.log('MongoDB Connected successfully');
    return true;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    return false;
  }
};

module.exports = connectDB;
