require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { startScheduler } = require('./src/services/schedulerService');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    const isConnected = await connectDB();
    if (!isConnected) {
      console.error('MongoDB connection failed. Server exiting.');
      process.exit(1);
    }

    startScheduler();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Fatal startup error: ${error.message}`);
    process.exit(1);
  }
};

startServer();
