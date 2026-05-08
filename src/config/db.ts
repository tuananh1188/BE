import mongoose from 'mongoose';
import { env } from './env';

export const connectDb = async () => {
  await mongoose.connect(env.mongoUri);
  console.log('Connected to MongoDB');
  try {
      const db = mongoose.connection.db;
      if (db) {
          await db.collection('reviews').dropIndex('user_1_product_1').catch(() => {
              // Ignore error if index doesn't exist
          });
      }
  } catch (err) {
      // Ignore
  }
};

