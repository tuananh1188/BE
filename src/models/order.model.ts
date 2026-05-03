import mongoose, { Schema, Document } from 'mongoose';

export interface OrderItemDocument extends Document {
    product: mongoose.Schema.Types.ObjectId;
    name: string;
    image: string;
    price: number;
    quantity: number;
}

export interface OrderDocument extends Document {
    userId: mongoose.Schema.Types.ObjectId;
    items: OrderItemDocument[];
    shippingAddress: {
        fullName: string;
        phone: string;
        address: string;
        city?: string;
        notes?: string;
    };
    paymentMethod: 'COD' | 'CREDIT_CARD';
    paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
    orderStatus: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
    subtotal: number;
    shippingFee: number;
    tax: number;
    totalAmount: number;
    promoCode?: string;
}

const orderItemSchema = new Schema<OrderItemDocument>({
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    // Snapshot of product details at the time of purchase
    name: { type: String, required: true },
    image: { type: String },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 }
});

const orderSchema = new Schema<OrderDocument>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        items: [orderItemSchema],
        shippingAddress: {
            fullName: { type: String, required: true },
            phone: { type: String, required: true },
            address: { type: String, required: true },
            city: { type: String },
            notes: { type: String }
        },
        paymentMethod: {
            type: String,
            enum: ['COD', 'CREDIT_CARD'],
            default: 'COD'
        },
        paymentStatus: {
            type: String,
            enum: ['PENDING', 'PAID', 'FAILED'],
            default: 'PENDING'
        },
        orderStatus: {
            type: String,
            enum: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
            default: 'PENDING'
        },
        subtotal: { type: Number, required: true },
        shippingFee: { type: Number, default: 0 },
        tax: { type: Number, default: 0 },
        totalAmount: { type: Number, required: true },
        promoCode: { type: String }
    },
    { timestamps: true }
);

export const OrderModel = mongoose.model<OrderDocument>('Order', orderSchema);
