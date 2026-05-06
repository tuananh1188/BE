import { z } from 'zod';
export const createProductSchema = z.object({
    name: z.string().trim().min(3, 'Name is required!'),
    description: z.string().min(10, 'Description is required !'),
    originalPrice: z.coerce.number().min(0, 'Original price must be 0 or higher!'),
    discount: z.coerce.number().min(0).max(100).optional().default(0),
    category: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Category ID'),
    images: z.union([z.string(), z.array(z.string())]).optional().transform(val => {
        if (typeof val === 'string') return [val];
        return val || [];
    }),
    sizes: z.union([z.string(), z.array(z.string())]).optional().transform(val => {
        if (typeof val === 'string') return [val];
        return val || [];
    }),
    colors: z.union([z.string(), z.array(z.string())]).optional().transform(val => {
        if (typeof val === 'string') return [val];
        return val || [];
    }),
    stock: z.coerce.number().int().min(0).default(0),
    rating: z.coerce.number().min(0).max(5).optional().default(0)
});

export const updateProductSchema = createProductSchema.partial();

export const productIdSchema = z.object({
    id: z
        .string()
        .regex(
            /^[0-9a-fA-F]{24}$/,
            'The ID is not in the correct MongoDB format !'
        )
});
