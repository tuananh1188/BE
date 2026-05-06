import mongoose, { Schema, Document } from 'mongoose';
import slugify from 'slugify';
export interface ProductDocument extends Document {
    name: string;
    slug: string;
    description: string;
    price: number;
    originalPrice: number;
    category: mongoose.Types.ObjectId;
    images: string[];
    sizes: string[];
    colors: string[];
    stock: number;
    rating: number;
    discount: number;
    soldPercentage: number;
    totalSold: number;
    reviewCount: number;
}

const productSchema = new Schema<ProductDocument>(
    {
        name: { type: String, required: true, trim: true },
        slug: { type: String, lowercase: true, unique: true },
        description: { type: String, required: true },
        price: { type: Number, default: 0 },
        originalPrice: { type: Number, required: true, min: 0 },
        discount: { type: Number, default: 0, min: 0, max: 100 },
        category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
        images: [{ type: String }],
        sizes: [{ type: String }],
        colors: [{ type: String }],
        stock: { type: Number, required: true, default: 0, min: 0 },
        rating: { type: Number, default: 0, min: 0, max: 5 },
        soldPercentage: { type: Number, default: 0, min: 0, max: 100 },
        totalSold: { type: Number, default: 0, min: 0 },
        reviewCount: { type: Number, default: 0, min: 0 }
    },
    { timestamps: true }
);
productSchema.index({ name: 'text' });
productSchema.pre('save', async function (this: ProductDocument) {
    if (this.isModified('name')) {
        this.slug = slugify(this.name, {
            lower: true,
            strict: true,
            locale: 'vi',
            trim: true
        })
    }
    if (this.isModified('originalPrice') || this.isModified('discount')) {
        const discountValue = this.discount || 0;
        const calculated = this.originalPrice * (1 - discountValue / 100);
        this.price = Math.round(calculated * 100) / 100;
    }

    // Tự động tính phần trăm đã bán
    if (this.isModified('totalSold') || this.isModified('stock')) {
        const total = (this.totalSold || 0) + (this.stock || 0);
        this.soldPercentage = total > 0 ? Math.round(((this.totalSold || 0) / total) * 100) : 0;
    }
});

productSchema.pre('findOneAndUpdate', async function (this: mongoose.Query<any, any>) {
    const update = this.getUpdate() as any;

    if (update.name) {
        update.slug = slugify(update.name, {
            lower: true,
            strict: true,
            locale: 'vi',
            trim: true
        })
    }

    if (update.originalPrice !== undefined || update.discount !== undefined) {
        // Lấy dữ liệu hiện tại trong DB để đảm bảo tính toán đúng ngay cả khi chỉ update 1 trường
        const docToUpdate = await this.model.findOne(this.getQuery());

        if (docToUpdate) {
            const originalPrice = update.originalPrice ?? docToUpdate.originalPrice;
            const discount = update.discount ?? docToUpdate.discount ?? 0;

            const calculated = originalPrice * (1 - discount / 100);
            update.price = Math.round(calculated * 100) / 100;
        }
    }

    // Tính toán lại soldPercentage nếu có thay đổi stock hoặc totalSold
    if (update.stock !== undefined || update.totalSold !== undefined) {
        const docToUpdate = await this.model.findOne(this.getQuery());
        if (docToUpdate) {
            const stock = update.stock ?? docToUpdate.stock ?? 0;
            const totalSold = update.totalSold ?? docToUpdate.totalSold ?? 0;
            const total = stock + totalSold;
            update.soldPercentage = total > 0 ? Math.round((totalSold / total) * 100) : 0;
        }
    }
})

export const ProductModel = mongoose.model<ProductDocument>('Product', productSchema)
