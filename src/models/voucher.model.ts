import mongoose, { Schema, Document } from 'mongoose';

export enum VoucherType {
    FIXED = 'fixed',
    PERCENTAGE = 'percentage'
}

export interface VoucherDocument extends Document {
    code: string;
    type: VoucherType;
    value: number; // Discount amount or percentage
    minOrderAmount: number;
    maxDiscountAmount?: number; // For percentage vouchers
    expiryDate: Date;
    usageLimit: number;
    usedCount: number;
    isActive: boolean;
}

const voucherSchema = new Schema<VoucherDocument>(
    {
        code: { type: String, required: true, unique: true, uppercase: true, trim: true },
        type: { type: String, enum: Object.values(VoucherType), default: VoucherType.FIXED },
        value: { type: Number, required: true, min: 0 },
        minOrderAmount: { type: Number, default: 0, min: 0 },
        maxDiscountAmount: { type: Number, min: 0 },
        expiryDate: { type: Date, required: true },
        usageLimit: { type: Number, default: 100 },
        usedCount: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true }
    },
    { timestamps: true }
);

// Index for quick lookups
voucherSchema.index({ code: 1, isActive: 1 });

export const VoucherModel = mongoose.model<VoucherDocument>('Voucher', voucherSchema);
