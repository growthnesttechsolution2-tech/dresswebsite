require('dotenv').config();
const mongoose = require('mongoose');
(async ()=>{
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    console.log('Connected OK');
    process.exit(0);
  } catch (err) {
    console.error('Connect error:', err);
    process.exit(1);
  }
})();