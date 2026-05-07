import mongoose from 'mongoose';
import { VoucherModel } from './src/models/voucher.model';
import { env } from './src/config/env';

async function checkVouchers() {
    try {
        await mongoose.connect(env.mongoUri);
        console.log('Connected to DB');
        const vouchers = await VoucherModel.find({});
        console.log('Vouchers in DB:', vouchers.map(v => ({ id: v._id.toString(), code: v.code })));
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkVouchers();
