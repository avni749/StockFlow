const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./src/models/Product');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const originalUrl = 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=150';
  const r = await Product.updateOne(
    { SKU: 'WBS-GEN2-001' },
    { $set: { image: originalUrl } }
  );
  console.log('Restored WBS-GEN2-001 image result:', r);
  await mongoose.disconnect();
}

run().catch(console.error);
