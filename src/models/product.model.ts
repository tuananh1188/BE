import mongoose, { Schema, Document } from 'mongoose';
export interface ProductDocument extends Document {
    name: string;
    description: string;
    price: number;
    category: string;
    images: string[];
    stock: number;
    rating: number;
}

const productSchema = new Schema<ProductDocument>(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
        category: { type: String, required: true },
        images: [{ type: String }],
        stock: { type: Number, required: true, default: 0 },
        rating: { type: Number, default: 0 }
    },
    { timestamps: true }
);

export const ProductModel = mongoose.model<ProductDocument>('Product',productSchema)
