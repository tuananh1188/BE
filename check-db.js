require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const db = mongoose.connection.db;
  const products = await db.collection('products').find().limit(5).toArray();
  console.log(JSON.stringify(products.map(p => p.name), null, 2));
  process.exit(0);
}).catch(console.error);
