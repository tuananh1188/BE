import { z } from 'zod';
export const createProductSchema = z.object({
    name: z.string().trim().min(3, 'Name is required!'),
    description: z.string().min(10, 'Description is required !'),
    originalPrice: z.number().min(0, 'Original price must be 0 or higher!'),
    discount: z.number().min(0).max(100).optional().default(0),
    category: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Category ID'),
    images: z
        .array(z.string().min(1, 'Image link cannot be empty'))
        .min(1, 'image is required !')
        .default([]),
    stock: z.number().int().min(0).default(0),
    rating: z.number().min(0).max(5).optional().default(0)
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
