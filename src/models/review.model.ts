import mongoose, { Schema, Document } from 'mongoose';

export interface ReviewDocument extends Document {
    user: mongoose.Types.ObjectId;
    product: mongoose.Types.ObjectId;
    rating: number;
    comment: string;
    images: string[];
    helpfulVotes: mongoose.Types.ObjectId[];
    isVerifiedPurchase: boolean;
    adminReply?: string;
}

const reviewSchema = new Schema<ReviewDocument>(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        rating: { type: Number, required: true, min: 0, max: 5, default: 0 },
        comment: { type: String, trim: true, default: '' },
        images: [{ type: String }],
        helpfulVotes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        isVerifiedPurchase: { type: Boolean, default: false },
        adminReply: { type: String, trim: true },
    },
    { timestamps: true }
);

export const ReviewModel = mongoose.model<ReviewDocument>('Review', reviewSchema);

