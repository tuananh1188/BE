import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const dropIndex = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI!);
        console.log('Connected to MongoDB');
        
        const db = mongoose.connection.db;
        const result = await db?.collection('reviews').dropIndex('user_1_product_1');
        console.log('Index dropped:', result);
        
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error dropping index:', error);
        process.exit(1);
    }
};

dropIndex();
