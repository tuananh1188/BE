import mongoose, { Schema, Document } from 'mongoose';

export interface CartItemDocument extends Document {
    product: mongoose.Schema.Types.ObjectId;
    quantity: number;
    size?: string;
    color?: string;
}

export interface CartDocument extends Document {
    userId: mongoose.Schema.Types.ObjectId;
    items: CartItemDocument[];
    totalAmount: number;
}

const cartItemSchema = new Schema<CartItemDocument>({
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },
    size: { type: String },
    color: { type: String }
});

const cartSchema = new Schema<CartDocument>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true, // One cart per user
            index: true
        },
        items: [cartItemSchema],
        totalAmount: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

export const CartModel = mongoose.model<CartDocument>('Cart', cartSchema);
