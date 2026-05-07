import mongoose, { Schema, Document } from 'mongoose';

export interface FavoriteDocument extends Document {
    userId: mongoose.Schema.Types.ObjectId;
    productId: mongoose.Schema.Types.ObjectId;
}

const favoriteSchema = new Schema<FavoriteDocument>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        productId: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        }
    },
    { timestamps: true }
);

// Prevent duplicate favorites
favoriteSchema.index({ userId: 1, productId: 1 }, { unique: true });

export const FavoriteModel = mongoose.model<FavoriteDocument>('Favorite', favoriteSchema);
