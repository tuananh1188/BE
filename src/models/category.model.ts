import mongoose, { Schema, Document } from 'mongoose';
import slugify from 'slugify';

export interface CategoryDocument extends Document {
    name: string;
    slug: string;
    image?: string;
    description?: string;
}

const categorySchema = new Schema<CategoryDocument>(
    {
        name: { type: String, required: true, trim: true, unique: true },
        slug: { type: String, lowercase: true, unique: true },
        image: { type: String },
        description: { type: String }
    },
    { timestamps: true }
);

categorySchema.pre('save', async function (this: CategoryDocument) {
    if (this.isModified('name')) {
        this.slug = slugify(this.name, {
            lower: true,
            strict: true,
            locale: 'vi',
            trim: true
        });
    }
});

// For update operations
categorySchema.pre('findOneAndUpdate', async function (this: mongoose.Query<any, any>) {
    const update = this.getUpdate() as any;
    if (update.name) {
        update.slug = slugify(update.name, {
            lower: true,
            strict: true,
            locale: 'vi',
            trim: true
        });
    }
});

export const CategoryModel = mongoose.model<CategoryDocument>('Category', categorySchema);
