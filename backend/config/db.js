const mongoose = require('mongoose');
const dns = require('dns');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    if (uri?.startsWith('mongodb+srv://') && err.code === 'ECONNREFUSED') {
      console.warn('SRV DNS query refused, retrying with public DNS servers...');
      dns.setServers(['8.8.8.8', '1.1.1.1']);
      try {
        await mongoose.connect(uri);
        console.log('MongoDB connected after retry');
        return;
      } catch (retryErr) {
        console.error('MongoDB retry failed:', retryErr.message);
      }
    }
    process.exit(1);
  }
};

module.exports = connectDB;
