import mongoose, { Schema } from 'mongoose';

export interface UserAddress {
    _id?: any;
    label: string; // e.g., 'Nhà riêng', 'Công ty'
    fullName: string;
    phone: string;
    province: string;
    district: string;
    ward: string;
    detail: string;
    isDefault: boolean;
}

export interface UserDocument extends mongoose.Document {
    email: string;
    password: string;
    isEmailVerified: boolean;
    otpCode?: string;
    otpExpiresAt?: Date;
    resetToken?: string;
    resetTokenExpiresAt?: Date;
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
    phone?: string;
    address?: string; // Legacy field
    city?: string;    // Legacy field
    addresses: UserAddress[];
    role: 'user' | 'admin';
    isBlocked: boolean;
}

const userSchema = new Schema<UserDocument>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },
        password: { type: String, required: true },
        isEmailVerified: { type: Boolean, default: false },
        otpCode: { type: String },
        otpExpiresAt: { type: Date },
        resetToken: { type: String },
        resetTokenExpiresAt: { type: Date },
        displayName: { type: String, trim: true },
        bio: { type: String, maxlength: 200 },
        avatarUrl: { type: String },
        phone: { type: String, trim: true },
        address: { type: String, trim: true },
        city: { type: String, trim: true },
        addresses: [
            {
                label: { type: String, default: 'Nhà riêng' },
                fullName: { type: String, required: true },
                phone: { type: String, required: true },
                province: { type: String, required: true },
                district: { type: String, required: false },
                ward: { type: String, required: true },
                detail: { type: String, required: true },
                isDefault: { type: Boolean, default: false }
            }
        ],
        role: { type: String, enum: ['user', 'admin'], default: 'user' },
        isBlocked: { type: Boolean, default: false }
    },
    { timestamps: true }
);

export const UserModel = mongoose.model<UserDocument>('User', userSchema);
