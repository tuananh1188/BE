import mongoose, { Schema, Document } from 'mongoose';

export interface ReviewDocument extends Document {
    user: mongoose.Types.ObjectId;
    product: mongoose.Types.ObjectId;
    rating: number;
    comment: string;
}

const reviewSchema = new Schema<ReviewDocument>(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, trim: true, default: '' },
    },
    { timestamps: true }
);

// Ensure a user can only review a product once
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

export const ReviewModel = mongoose.model<ReviewDocument>('Review', reviewSchema);
