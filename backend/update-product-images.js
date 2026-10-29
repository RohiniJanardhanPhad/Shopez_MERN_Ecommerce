require('dotenv').config();
const mongoose = require('mongoose');
const { Product } = require('./models');
const productImages = require('./product-images');

async function updateProductImages() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error('MONGO_URI is required. Set it in backend/.env.');

  await mongoose.connect(mongoUri);
  try {
    const result = await Product.bulkWrite(Object.entries(productImages).map(([name, image]) => ({
      updateOne: { filter: { name }, update: { $set: { image } } }
    })));
    console.log(`Updated images for ${result.modifiedCount} of ${Object.keys(productImages).length} catalog products.`);
  } finally {
    await mongoose.disconnect();
  }
}

updateProductImages().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
